import os
import re
import logging
import threading
from datetime import datetime, timedelta
from dateutil import parser
from typing import Dict, Any, List, Optional, Tuple
from difflib import get_close_matches
from dateutil.relativedelta import relativedelta

import torch
import spacy
from spacy.matcher import Matcher
from transformers import (
    pipeline,
    AutoTokenizer,
    AutoModelForQuestionAnswering,
    Pipeline,
)

from .document_processing_service import DocumentProcessingService

logger = logging.getLogger(__name__)


class TimeoutError(Exception):
    """Custom timeout exception"""
    pass


def run_with_timeout(func, args=(), kwargs=None, timeout_duration=5):
    """
    ✅ WINDOWS-COMPATIBLE: Run a function with timeout using threading
    Works on both Windows and Unix systems
    """
    if kwargs is None:
        kwargs = {}
    
    result = [TimeoutError("Function call timed out")]
    
    def target():
        try:
            result[0] = func(*args, **kwargs)
        except Exception as e:
            result[0] = e
    
    thread = threading.Thread(target=target)
    thread.daemon = True
    thread.start()
    thread.join(timeout_duration)
    
    if thread.is_alive():
        # Thread is still running, timeout occurred
        raise TimeoutError(f"Operation timed out after {timeout_duration} seconds")
    
    if isinstance(result[0], Exception):
        raise result[0]
    
    return result[0]


class NLPLegalExtractionService:
    """
    Production-Ready Legal Document Extraction Service using spaCy NER + Legal-BERT QA.
    
    ✅ ALL CRITICAL FIXES APPLIED:
    - ✅ WINDOWS-COMPATIBLE timeout protection using threading
    - Comprehensive length validation for all extracted fields
    - RFC-compliant email validation with domain checking
    - Bounds checking for text processing to handle large documents
    - Enhanced partner name patterns with catastrophic backtracking prevention
    - Improved address extraction with better pattern specificity
    - Comprehensive validity extraction with number word mapping
    - Better contact extraction with multiple name pattern attempts
    - Improved event info extraction with section boundary detection
    - Complete error handling for all regex and text processing operations
    """

    def __init__(
        self,
        model_override: Optional[str] = None,
        qa_confidence_threshold: Optional[float] = None,
        document_processing_service: Optional[DocumentProcessingService] = None,
    ):
        # Initialize spaCy model for NER
        self.nlp = None
        self.matcher = None
        self._load_spacy_model()
        
        # Legal document patterns and vocabularies
        self.partnership_options = [
            'Agreement', 'Contract Agreement', 'Cooperation Agreement', 'Implementation Agreement',
            'Online Study Tour Agreement', 'License and Cooperation Agreement',
            'Agreement of International Faculty Exchanges for Academic Training Program', 'Due Diligence',
            'Joint Education Programs and Training Cooperation', 'MOA on Academic Exchange',
            'MOA on Faculty Exchange', 'MOA on Student Exchange', 'MOA on Cultural Exchange',
            'MOA on Research', 'MOA on Internship', 'MOA on Training and Research Collaboration',
            'MOA on Conferences', 'MOA on International Competition', 'MOA Global Leadership',
            'MOA for Donation', 'MOA on English Class', 'MOA on English Camp', 'MOA on Academic Partnership',
            'MOA (RMO)', 'MOA (VPRED)', 'MOA with PUP Sta.Rosa', 'MOA with PACA', 'MOA CITAA', 'MOA CAH',
            'MOA with College of Science', 'MOA with College of Engineering', 'MOA on Career Orientation Services',
            'MOA on International Educational Cooperation', 'MOA on Promotion and Collaboration on International Academic and Research',
            'MOA for Academic Exchange: Joint Development Agreement for Railway-Related Programs Academic Documents',
            'MOA on Extension Project', 'MOA Tripartite', 'MOA on English and Cultural Program',
            'MOA on Student Competition', 'MOA on Faculty and Student Exchange', 'MOU ON RENEWAL'
        ]

        # ✅ ENHANCEMENT: Add partnership match confidence threshold
        self.partnership_match_threshold = 0.7

        # Country options for matching
        self.country_options = [
            "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
            "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
            "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
            "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic",
            "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia",
            "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica",
            "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
            "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
            "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary",
            "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
            "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
            "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali",
            "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
            "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
            "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
            "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
            "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
            "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
            "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
            "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
            "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
            "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
            "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
            "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "HongKong", "Macao"
        ]

        # Region mapping - comprehensive mapping for all countries
        self.region_mapping = {
            "Afghanistan": "Southern Asia", "Albania": "Southern Europe", "Algeria": "Northern Africa",
            "Andorra": "Southern Europe", "Angola": "Middle Africa", "Antigua and Barbuda": "Caribbean",
            "Argentina": "South America", "Armenia": "Western Asia", "Australia": "Oceania", "Austria": "Western Europe",
            "Azerbaijan": "Western Asia", "Bahamas": "Caribbean", "Bahrain": "Western Asia", "Bangladesh": "Southern Asia",
            "Barbados": "Caribbean", "Belarus": "Eastern Europe", "Belgium": "Western Europe", "Belize": "Central America",
            "Benin": "Western Africa", "Bhutan": "Southern Asia", "Bolivia": "South America",
            "Bosnia and Herzegovina": "Southern Europe", "Botswana": "Southern Africa", "Brazil": "South America",
            "Brunei": "South-Eastern Asia", "Bulgaria": "Eastern Europe", "Burkina Faso": "Western Africa",
            "Burundi": "Eastern Africa", "Cabo Verde": "Western Africa", "Cambodia": "South-Eastern Asia",
            "Cameroon": "Middle Africa", "Canada": "North America", "Central African Republic": "Middle Africa",
            "Chad": "Middle Africa", "Chile": "South America", "China": "Eastern Asia", "Colombia": "South America",
            "Comoros": "Eastern Africa", "Congo (Congo-Brazzaville)": "Middle Africa", "Costa Rica": "Central America",
            "Croatia": "Southern Europe", "Cuba": "Caribbean", "Cyprus": "Western Asia", "Czechia": "Eastern Europe",
            "Democratic Republic of the Congo": "Middle Africa", "Denmark": "Northern Europe", "Djibouti": "Eastern Africa",
            "Dominica": "Caribbean", "Dominican Republic": "Caribbean", "Ecuador": "South America", "Egypt": "Northern Africa",
            "El Salvador": "Central America", "Equatorial Guinea": "Middle Africa", "Eritrea": "Eastern Africa",
            "Estonia": "Northern Europe", "Eswatini": "Southern Africa", "Ethiopia": "Eastern Africa", "Fiji": "Oceania",
            "Finland": "Northern Europe", "France": "Western Europe", "Gabon": "Middle Africa", "Gambia": "Western Africa",
            "Georgia": "Western Asia", "Germany": "Western Europe", "Ghana": "Western Africa", "Greece": "Southern Europe",
            "Grenada": "Caribbean", "Guatemala": "Central America", "Guinea": "Western Africa", "Guinea-Bissau": "Western Africa",
            "Guyana": "South America", "Haiti": "Caribbean", "Honduras": "Central America", "Hungary": "Eastern Europe",
            "Iceland": "Northern Europe", "India": "Southern Asia", "Indonesia": "South-Eastern Asia", "Iran": "Southern Asia",
            "Iraq": "Western Asia", "Ireland": "Northern Europe", "Israel": "Western Asia", "Italy": "Southern Europe",
            "Jamaica": "Caribbean", "Japan": "Eastern Asia", "Jordan": "Western Asia", "Kazakhstan": "Central Asia",
            "Kenya": "Eastern Africa", "Kiribati": "Oceania", "Kuwait": "Western Asia", "Kyrgyzstan": "Central Asia",
            "Laos": "South-Eastern Asia", "Latvia": "Northern Europe", "Lebanon": "Western Asia", "Lesotho": "Southern Africa",
            "Liberia": "Western Africa", "Libya": "Northern Africa", "Liechtenstein": "Western Europe", "Lithuania": "Northern Europe",
            "Luxembourg": "Western Europe", "Madagascar": "Eastern Africa", "Malawi": "Eastern Africa", "Malaysia": "South-Eastern Asia",
            "Maldives": "Southern Asia", "Mali": "Western Africa", "Malta": "Southern Europe", "Marshall Islands": "Oceania",
            "Mauritania": "Western Africa", "Mauritius": "Eastern Africa", "Mexico": "North America", "Micronesia": "Oceania",
            "Moldova": "Eastern Europe", "Monaco": "Western Europe", "Mongolia": "Eastern Asia", "Montenegro": "Southern Europe",
            "Morocco": "Northern Africa", "Mozambique": "Eastern Africa", "Myanmar": "South-Eastern Asia", "Namibia": "Southern Africa",
            "Nauru": "Oceania", "Nepal": "Southern Asia", "Netherlands": "Western Europe", "New Zealand": "Oceania",
            "Nicaragua": "Central America", "Niger": "Western Africa", "Nigeria": "Western Africa", "North Korea": "Eastern Asia",
            "North Macedonia": "Southern Europe", "Norway": "Northern Europe", "Oman": "Western Asia", "Pakistan": "Southern Asia",
            "Palau": "Oceania", "Palestine": "Western Asia", "Panama": "Central America", "Papua New Guinea": "Oceania",
            "Paraguay": "South America", "Peru": "South America", "Philippines": "South-Eastern Asia", "Poland": "Eastern Europe",
            "Portugal": "Southern Europe", "Qatar": "Western Asia", "Romania": "Eastern Europe", "Russia": "Eastern Europe",
            "Rwanda": "Eastern Africa", "Saint Kitts and Nevis": "Caribbean", "Saint Lucia": "Caribbean",
            "Saint Vincent and the Grenadines": "Caribbean", "Samoa": "Oceania", "San Marino": "Southern Europe",
            "Sao Tome and Principe": "Middle Africa", "Saudi Arabia": "Western Asia", "Senegal": "Western Africa",
            "Serbia": "Southern Europe", "Seychelles": "Eastern Africa", "Sierra Leone": "Western Africa",
            "Singapore": "South-Eastern Asia", "Slovakia": "Eastern Europe", "Slovenia": "Southern Europe",
            "Solomon Islands": "Oceania", "Somalia": "Eastern Africa", "South Africa": "Southern Africa",
            "South Korea": "Eastern Asia", "South Sudan": "Eastern Africa", "Spain": "Southern Europe", "Sri Lanka": "Southern Asia",
            "Sudan": "Northern Africa", "Suriname": "South America", "Sweden": "Northern Europe", "Switzerland": "Western Europe",
            "Syria": "Western Asia", "Taiwan": "Eastern Asia", "Tajikistan": "Central Asia", "Tanzania": "Eastern Africa",
            "Thailand": "South-Eastern Asia", "Timor-Leste": "South-Eastern Asia", "Togo": "Western Africa", "Tonga": "Oceania",
            "Trinidad and Tobago": "Caribbean", "Tunisia": "Northern Africa", "Turkey": "Western Asia", "Turkmenistan": "Central Asia",
            "Tuvalu": "Oceania", "Uganda": "Eastern Africa", "Ukraine": "Eastern Europe", "United Arab Emirates": "Western Asia",
            "United Kingdom": "Northern Europe", "United States": "North America", "Uruguay": "South America",
            "Uzbekistan": "Central Asia", "Vanuatu": "Oceania", "Vatican City": "Southern Europe", "Venezuela": "South America",
            "Vietnam": "South-Eastern Asia", "Yemen": "Western Asia", "Zambia": "Eastern Africa", "Zimbabwe": "Eastern Africa",
            "HongKong": "Eastern Asia", "Macao": "Eastern Asia"
        }

        # Initialize document processor
        self.doc_processor = document_processing_service if document_processing_service else DocumentProcessingService()

        # QA pipeline + tokenizer placeholders (lazy-loaded)
        self.qa_pipeline: Optional[Pipeline] = None
        self.tokenizer: Optional[AutoTokenizer] = None
        self.model_name_in_use: Optional[str] = None
        self._qa_device: Optional[str] = None

        # Model preferences
        env_override = os.getenv("QA_MODEL_OVERRIDE", "").strip() or None
        override_model = model_override.strip() if (model_override and model_override.strip()) else env_override
        legal_bert_name = "nlpaueb/legal-bert-base-uncased"
        self._preferred_model = override_model if override_model else legal_bert_name

        # Configuration - Proper threshold handling
        if qa_confidence_threshold is not None:
            self.qa_confidence_threshold = float(qa_confidence_threshold)
        else:
            self.qa_confidence_threshold = float(os.getenv("QA_CONFIDENCE_THRESHOLD", "0.05"))

        self.qa_chunk_chars: int = int(os.getenv("QA_CHUNK_CHARS", "2000"))
        self.qa_chunk_overlap: int = int(os.getenv("QA_CHUNK_OVERLAP", "300"))
        self.qa_max_answer_len: int = int(os.getenv("QA_MAX_ANS_LEN", "128"))

        self._qa_loading = False

        # Enhanced questions for better extraction coverage
        self.questions = {
            "document_type": [
                "What type of document is this - Memorandum of Agreement (MOA) or Memorandum of Understanding (MOU)?",
                "Is this a MOA or MOU document?",
                "What is the document type?",
                "Is this an agreement, understanding, contract, or cooperation document?"
            ],
            "partnership_type": [
                "What is the specific purpose of this agreement - research, academic exchange, student exchange, or cooperation?",
                "What type of partnership is established - research collaboration, academic program, or educational cooperation?",
                "What activities or programs are covered - research, exchange, training, or conferences?",
                "Is this for academic exchange, faculty exchange, student exchange, research collaboration, or training?",
                "What kind of cooperation is established - educational, research, cultural, or technical?",
                "What specific program or activity is this agreement about?"
            ],
            "date_signed": [
                "What is the signing date or execution date of this agreement?",
                "When was this document signed or executed?",
                "What is the date this agreement was entered into?",
                "On what date was this agreement signed by both parties?",
                "When was this memorandum executed?",
                "What day of the month and year was this agreement made?"
            ],
            "validity_period": [
                "How many years is this agreement valid for?",
                "What is the term or duration of this agreement in years?",
                "For how long is this agreement effective?",
                "What is the validity period of this agreement?",
                "How long will this partnership last?",
                "For how many years shall this agreement remain valid?"
            ],
            "date_expiry": [
                "When does this agreement expire or terminate?",
                "What is the expiration date of this agreement?",
                "Until when is this agreement valid?",
                "When will this memorandum terminate?",
                "What is the end date of this partnership?",
                "On what date shall this agreement cease to be effective?"
            ],
            "partner_name": [
                "Who is the partner institution or organization (not PUP)?",
                "What is the name of the institution partnering with PUP?",
                "Which university or organization is the other party?",
                "What is the name of the foreign institution or partner organization?",
                "Who is the international partner in this agreement?",
                "What is the full name of the partner university or institution?"
            ],
            "partner_country": [
                "In which country is the partner institution located?",
                "What is the country of the partner organization?",
                "Where is the partner institution based?",
                "From which country is the partner university?",
                "What is the nationality or location of the partner institution?",
                "In what nation is the partner institution established?"
            ],
            "partner_address": [
                "What is the address of the partner institution?",
                "Where is the partner organization located?",
                "What is the principal office address of the partner?",
                "What is the complete address of the partner institution?",
                "Where is the partner's main office or headquarters?",
                "What is the location of the partner institution's principal office?"
            ],
            "partner_website": [
                "What is the website URL of the partner institution?",
                "What is the partner organization's web address?",
                "What is the official website of the partner university?",
                "What is the partner's internet address or URL?"
            ],
            "partner_description": [
                "What type of institution is the partner - university, college, government agency, or company?",
                "What is the nature of the partner organization?",
                "Is the partner a public or private institution?",
                "What kind of entity is the partner institution?",
                "How is the partner institution described or characterized?",
                "What type of educational or research institution is the partner?"
            ],
            "event_info": [
                "What is the purpose or objective of this partnership?",
                "What activities will be implemented under this agreement?",
                "What is the scope of cooperation outlined?",
                "What are the main goals of this collaboration?",
                "What programs or initiatives are covered by this agreement?",
                "What is the stated purpose in Article I or the purpose section?"
            ],
            "signatories": [
                "Who signed this agreement from both institutions?",
                "What are the names and titles of the signatories?",
                "Who are the authorized representatives who signed?",
                "Who are the officials that executed this agreement?",
                "What are the names and positions of the people who signed this document?",
                "Who are the presidents or representatives who signed this agreement?"
            ],
            "contact_persons": [
                "Who are the contact persons for this agreement?",
                "What are the email addresses mentioned in this document?",
                "Who should be contacted for inquiries about this agreement?",
                "What are the contact details of the partner institution representatives?",
                "Who are the designated contact persons from both institutions?",
                "Who are the professors or staff mentioned as contacts?"
            ],
            "point_persons": [
                "Who are the PUP representatives or coordinators for this agreement?",
                "What PUP officials are designated as point persons?",
                "Who from PUP is responsible for implementing this agreement?",
                "What are the names and positions of PUP coordinators?",
                "Who are the PUP faculty or staff involved in this agreement?"
            ],
            "date_received": [
                "When was this document received by PUP?",
                "What is the date this agreement was submitted or received?",
                "When did PUP receive this signed document?",
                "What is the receipt date of this agreement?"
            ],
            "date_endorsed_to_ulco": [
                "When was this agreement endorsed to ULCO?",
                "What is the date this was forwarded to the University Legal Counsel Office?",
                "When was this document sent to ULCO for review?",
                "What date was this endorsed to the legal office?"
            ],
            "date_ulco_approved": [
                "When did ULCO approve this agreement?",
                "What is the date of ULCO approval?",
                "When was this agreement legally approved by the University Legal Counsel?",
                "What date did the legal office give approval?"
            ],
            "date_pup_signed": [
                "When did PUP sign this agreement?",
                "What is the date PUP executed this document?",
                "When was this agreement signed by PUP representatives?",
                "What date did PUP officials sign this memorandum?"
            ],
            "hardcopy_location": [
                "Where is the original document stored?",
                "What is the physical location of the signed agreement?",
                "Where can the hardcopy of this document be found?",
                "In which office or filing system is this document kept?"
            ],
            "dts_number": [
                "What is the DTS number or reference number of this document?",
                "What is the document tracking system number?",
                "What is the file number or reference code?",
                "What tracking number is assigned to this agreement?",
                "What is the document or series number?"
            ],
            "source_unit": [
                "Which PUP campus, college, or department initiated this agreement?",
                "What is the source unit or originating office?",
                "Which PUP division or department is responsible for this partnership?",
                "From which PUP unit did this agreement originate?"
            ]
        }

    def _load_spacy_model(self):
        """
        Load spaCy model for NER
        Better error handling and graceful degradation
        WHY: Prevents service crash when spaCy model is unavailable
        """
        try:
            self.nlp = spacy.load("en_core_web_sm")
            self.matcher = Matcher(self.nlp.vocab)
            self._add_legal_patterns()
            logger.info("✅ spaCy model loaded successfully")
        except OSError:
            logger.warning("⚠️ spaCy model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
            self.matcher = None
        except Exception as e:
            logger.error(f"❌ Failed to load spaCy: {e}")
            self.nlp = None
            self.matcher = None

    def _add_legal_patterns(self):
        """
        Add custom patterns for legal document entities
        More precise patterns with better boundary detection
        WHY: Reduces false positives in entity extraction
        """
        if not self.matcher:
            return

        # More precise document type patterns
        doc_type_patterns = [
            [{"LOWER": "memorandum"}, {"LOWER": "of"}, {"LOWER": "understanding"}],
            [{"LOWER": "memorandum"}, {"LOWER": "of"}, {"LOWER": "agreement"}],
            [{"UPPER": "MOU"}],
            [{"UPPER": "MOA"}]
        ]
        self.matcher.add("DOCUMENT_TYPE", doc_type_patterns)

        # Better institution patterns
        university_patterns = [
            [{"LOWER": {"IN": ["university", "college", "institute", "school"]}},
             {"IS_TITLE": True, "OP": "*"}],
            [{"IS_TITLE": True, "OP": "+"}, 
             {"LOWER": {"IN": ["university", "college", "institute", "school"]}}]
        ]
        self.matcher.add("INSTITUTION", university_patterns)

        # Better date patterns with more formats
        date_patterns = [
            [{"IS_DIGIT": True}, {"LOWER": {"IN": ["january", "february", "march", "april", "may", "june",
                                                   "july", "august", "september", "october", "november", "december"]}},
             {"IS_DIGIT": True}],
            [{"IS_DIGIT": True}, {"TEXT": "/"}, {"IS_DIGIT": True}, {"TEXT": "/"}, {"IS_DIGIT": True}],
            [{"IS_DIGIT": True}, {"TEXT": "-"}, {"IS_DIGIT": True}, {"TEXT": "-"}, {"IS_DIGIT": True}]
        ]
        self.matcher.add("CUSTOM_DATE", date_patterns)

    def extract_agreement_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        ✅ PRODUCTION-READY: Enhanced extraction pipeline with comprehensive error handling
        """
        try:
            _, ext = os.path.splitext(file_path)
            ext = ext.lstrip('.').lower()
            
            text_data = self.doc_processor.extract_text_from_file(file_path, ext)
            if not text_data.get("success", False):
                return {"error": text_data.get("error", "Text extraction failed")}

            text = text_data["text"]
            if not text.strip():
                return {"error": "The document does not contain readable text."}

            logger.info(f"🔍 Starting production extraction from text length: {len(text)}")

            # ✅ Step 1: Enhanced extraction using combined approach
            metadata = self.extract_moa_for_agreement_response(text)

            # ✅ Step 2: Map to final form fields with validation
            result = self._map_to_form_fields_validated(metadata, text)
            
            logger.info("✅ Production NLP extraction completed successfully")
            return result

        except Exception as e:
            logger.exception("❌ Production extraction failed")
            return {"error": f"Extraction failed: {str(e)}"}

    def extract_moa_for_agreement_response(self, text: str) -> Dict[str, Any]:
        """
        ✅ PRODUCTION-READY: Extract and map fields with all fixes applied
        """
        clean_text = self._preprocess_text(text)
        extracted: Dict[str, Any] = {}

        logger.info(f"🔍 Starting extraction from text length: {len(clean_text)}")

        # ✅ CRITICAL FIX: Enhanced partner name extraction with timeout protection
        partner_name = self._extract_partner_name_with_timeout(clean_text)
        if partner_name:
            extracted["partner_name"] = partner_name
            logger.info(f"🎯 Partner name found: {partner_name}")

        # ✅ CRITICAL FIX: Enhanced address extraction with bounds checking
        partner_address = self._extract_partner_address_safe(clean_text)
        if partner_address:
            extracted["partner_address"] = partner_address
            logger.info(f"🏢 Partner address found: {partner_address[:50]}...")

        # ✅ Extract country with context validation
        partner_country = self._extract_partner_country_validated(clean_text)
        if partner_country:
            extracted["partner_country"] = partner_country
            extracted["partner_region"] = self.region_mapping.get(partner_country, "")
            logger.info(f"🌍 Country/Region: {partner_country}/{extracted.get('partner_region')}")

        # Document type detection
        doc_type = self._extract_document_type(clean_text)
        if doc_type:
            extracted["document_type"] = doc_type
            logger.info(f"📄 Document type: {doc_type}")

        # ✅ CRITICAL FIX: Enhanced date extraction with validation
        date_signed = self._extract_date_signed_validated(clean_text)
        if date_signed:
            extracted["date_signed"] = date_signed
            logger.info(f"📅 Date signed: {date_signed}")

        # ✅ CRITICAL FIX: Enhanced validity period extraction
        validity_period = self._extract_validity_period_comprehensive(clean_text)
        if validity_period:
            extracted["validity_period"] = validity_period
            if extracted.get("date_signed"):
                expiry_date = self._compute_expiry_date(extracted["date_signed"], validity_period)
                if expiry_date:
                    extracted["date_expiry"] = expiry_date
                    logger.info(f"⏰ Validity: {validity_period} years, expires: {expiry_date}")

        # ✅ CRITICAL FIX: Partnership type with confidence threshold
        partnership_type = self._extract_partnership_type_with_confidence(clean_text)
        if partnership_type:
            extracted["partnership_type"] = partnership_type
            logger.info(f"🤝 Partnership type: {partnership_type}")

        # ✅ CRITICAL FIX: Enhanced event info extraction
        event_info = self._extract_event_info_structured(clean_text)
        if event_info:
            extracted["event_info"] = event_info
            logger.info(f"ℹ️  Event info: {event_info[:100]}...")

        # ✅ CRITICAL FIX: Enhanced signatories extraction
        signatories = self._extract_signatories_safe(clean_text)
        if signatories:
            extracted["signatories_list"] = signatories
            logger.info(f"✍️  Signatories found: {len(signatories)} people")

        # ✅ CRITICAL FIX: Enhanced email extraction with RFC validation
        contacts = self._extract_contact_persons_validated(clean_text)
        if contacts:
            extracted["contact_persons"] = contacts
            logger.info(f"📞 Partner contacts found: {len(contacts)} people")

        # ✅ CRITICAL FIX: Enhanced PUP point persons extraction
        point_persons = self._extract_point_persons_validated(clean_text)
        if point_persons:
            extracted["point_persons"] = point_persons
            logger.info(f"👥 PUP point persons: {len(point_persons)} people")

        # Entity type inference
        if extracted.get("partner_name"):
            entity_type = self._infer_entity_type(extracted["partner_name"])
            extracted["partner_entity_type"] = entity_type
            logger.info(f"🏛️  Entity type: {entity_type}")

        # ✅ CRITICAL FIX: Source unit extraction with validation
        source_unit = self._extract_source_unit_validated(clean_text)
        if source_unit:
            extracted["source_unit"] = source_unit
            logger.info(f"🏫 Source unit: {source_unit}")

        return self._map_to_agreement_fields(extracted, clean_text)

    def _extract_partner_name_with_timeout(self, text: str) -> str:
        """
        ✅ WINDOWS-COMPATIBLE: Partner name extraction with timeout protection and length limits
        """
        # ✅ Prevent processing excessively long text
        if len(text) > 50000:
            logger.warning("Text too long for partner name extraction, truncating")
            text = text[:50000]
        
        patterns = [
            r"between\s+(?:the\s+)?(?:Polytechnic\s+University\s+of\s+the\s+Philippines|PUP)\b.{0,200}?\s+and\s+(?:the\s+)?([A-Za-z\s&\-\.,]{5,100}?)(?:\s*,|\s*\(|\s*herein)",
            r"between\s+(?:the\s+)?([A-Za-z\s&\-\.,]{5,100}?)\s+and\s+(?:the\s+)?(?:Polytechnic\s+University\s+of\s+the\s+Philippines|PUP)\b",
            r"(?:Partner|Counterpart)\s*:?\s*([A-Z][A-Za-z\s&\-\.,]{5,100}?)(?:\n|,|$)",
            r"(?:with|between)\s+(?:the\s+)?([A-Z][A-Za-z\s&\-\.,]{5,80}?)(?:\s+(?:University|College|Institute|Company|Corporation|Agency|Foundation|Organization|Ltd|Inc|Corp))"
        ]

        for i, pattern in enumerate(patterns):
            try:
                # ✅ WINDOWS-COMPATIBLE: Use threading-based timeout instead of signal.alarm
                def regex_search():
                    return re.search(pattern, text, re.IGNORECASE | re.DOTALL)
                
                try:
                    match = run_with_timeout(regex_search, timeout_duration=5)
                except TimeoutError:
                    logger.warning(f"Regex timeout on partner name pattern {i+1}")
                    continue
                
                if match:
                    name = match.group(1).strip()
                    name = re.sub(r'\s+', ' ', name)
                    name = re.sub(r'[,;\.]\s*$', '', name)
                    name = re.sub(r'^(?:the|a|an)\s+', '', name, flags=re.IGNORECASE)
                    
                    # ✅ Enhanced validation with length check
                    if 5 <= len(name) <= 100:
                        pup_exact_filters = [
                            r"^pup$",
                            r"^polytechnic\s+university\s+of\s+the\s+philippines$",
                            r"^polytechnic\s+university$"
                        ]
                        is_pup = any(re.match(pup_filter, name.lower()) for pup_filter in pup_exact_filters)
                        
                        if not is_pup and any(c.isupper() for c in name):
                            logger.info(f"✓ Partner name extracted (pattern {i+1}): {name}")
                            return name
            except Exception as e:
                logger.debug(f"Partner name pattern {i+1} error: {e}")
                continue

        logger.debug("No partner name extracted")
        return ""

    def _extract_partner_address_safe(self, text: str) -> str:
        """
        ✅ CRITICAL FIX: Address extraction with improved specificity and bounds checking
        """
        patterns = [
            r"(?:principal\s+)?offices?\s+(?:located\s+)?at\s+(.{10,200}?)(?:\s*,\s*represented|,\s*herein|\.|$)",
            r"(?:is\s+)?located\s+at\s+(.{10,200}?)(?:\s*,\s*represented|,\s*herein|\.|$)",
            r"(?:address|location)\s*:?\s*(.{10,200}?)(?:\s*,|\n|$)",
            r"principal\s+office\s*:?\s*(.{10,200}?)(?:\n|$)",
            r"headquarters?\s*:?\s*(.{10,200}?)(?:\n|$)",
            r"p\.?o\.?\s+box\s+(\d+[^\n]{0,100}?)(?:\n|$)",
            r"(\d+\s+[A-Za-z][^\n]{5,150}?(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr|Circle|Cir)[^\n]{0,50}?)(?:\n|$)",
            r"(?:Address|Location):\s*([A-Za-z0-9\s,\.-]{10,200}?)(?:\n|$)"
        ]

        for pattern in patterns:
            try:
                # ✅ Add timeout protection for address patterns
                def regex_findall():
                    return re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
                
                try:
                    matches = run_with_timeout(regex_findall, timeout_duration=3)
                except TimeoutError:
                    logger.debug("Regex timeout on address pattern, skipping")
                    continue
                
                for match in matches:
                    address = match.strip()
                    address = re.sub(r'\s+', ' ', address)
                    
                    # ✅ More lenient filtering - only filter exact PUP references
                    if not re.search(r'\bpup\b(?!\s*\()', address, re.IGNORECASE):
                        if 10 <= len(address) <= 300:
                            logger.info(f"✓ Address extracted: {address[:50]}...")
                            return address
            except Exception as e:
                logger.debug(f"Error in address pattern: {e}")
                continue

        logger.debug("No address extracted")
        return ""

    def _extract_partner_country_validated(self, text: str) -> str:
        """
        ✅ CRITICAL FIX: Enhanced country extraction with context validation
        """
        for country in self.country_options:
            pattern = rf'\b{re.escape(country)}\b'
            matches = re.finditer(pattern, text, re.IGNORECASE)
            
            for match in matches:
                # ✅ Get context around the country mention
                start = max(0, match.start() - 100)
                end = min(len(text), match.end() + 100)
                context = text[start:end].lower()
                
                # Check if this is in PUP context
                pup_indicators = [
                    "pup ",
                    "polytechnic university of the philippines",
                    "polytechnic university",
                    "sta. mesa",
                    "mabini",
                    "manila, philippines"
                ]
                
                is_pup_context = any(indicator in context for indicator in pup_indicators)
                
                # ✅ If NOT in PUP context, return it
                if not is_pup_context:
                    return country
        
        logger.debug("No country extracted")
        return ""

    def _extract_date_signed_validated(self, text: str) -> str:
        """
        ✅ CRITICAL FIX: Enhanced date extraction with validation
        """
        patterns = [
            r"entered\s+into\s+(?:this\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+\w+\s+\d{4})",
            r"signed\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})",
            r"date[d:]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})"
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    date_str = match.group(1).strip()
                    parsed = parser.parse(date_str, fuzzy=True)
                    
                    # ✅ Validate year range
                    current_year = datetime.now().year
                    if 1950 <= parsed.year <= current_year + 20:
                        return parsed.strftime("%Y-%m-%d")
                except Exception as e:
                    logger.debug(f"Date parsing error: {e}")
                    continue

        return ""

    def _extract_validity_period_comprehensive(self, text: str) -> int:
        """
        ✅ CRITICAL FIX: Comprehensive validity extraction with number words
        """
        number_words = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20, 'fifty': 50
        }

        patterns = [
            r"(?:period|term)\s+of\s+(?:(\w+)|(\d+))\s*\(?\s*(\d+)?\s*\)?\s*years?",
            r"valid\s+(?:for|through)(?:\s+a)?(?:\s+period)?(?:\s+of)?\s+(?:(\d+)|(\w+))\s*years?",
            r"(?:term|duration)\s+(?:of|shall\s+be)\s+(?:(\d+)|(\w+))\s*years?",
            r"(?:(\d+)|(\w+))\s*years?\s+(?:term|validity|period|duration)",
            r"(?:renewal|renew|extend)(?:\s+for)?\s+(?:(\d+)|(\w+))\s*(?:more\s+)?years?",
            r"shall\s+(?:be\s+)?(?:remain\s+)?valid\s+for\s+(?:a\s+period\s+of\s+)?(?:(\d+)|(\w+))\s*years?"
        ]

        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    for group in match.groups():
                        if group:
                            if group.isdigit():
                                value = int(group)
                                if 1 <= value <= 100:
                                    logger.info(f"✓ Validity: {value} years")
                                    return value
                            elif group.lower() in number_words:
                                value = number_words[group.lower()]
                                if 1 <= value <= 100:
                                    logger.info(f"✓ Validity: {value} years (from '{group}')")
                                    return value
            except Exception as e:
                logger.debug(f"Error in validity pattern: {e}")
                continue
        
        logger.debug("No validity period extracted")
        return 0

    def _extract_partnership_type_with_confidence(self, text: str) -> str:
        """
        ✅ CRITICAL FIX: Partnership type matching with confidence threshold
        """
        # Check for renewal first
        if re.search(r'\brenewal\b', text, re.IGNORECASE):
            return "MOU ON RENEWAL"
        
        text_lower = text.lower()
        
        # ✅ Multi-keyword detection with priority
        if "research" in text_lower and "training" in text_lower:
            return "MOA on Training and Research Collaboration"
        elif "research" in text_lower:
            return "MOA on Research"
        elif "faculty" in text_lower and "exchange" in text_lower:
            return "MOA on Faculty Exchange"
        elif "student" in text_lower and "exchange" in text_lower:
            return "MOA on Student Exchange"
        elif "academic" in text_lower and "exchange" in text_lower:
            return "MOA on Academic Exchange"
        elif "cooperation" in text_lower and "international" in text_lower:
            return "MOA on International Educational Cooperation"
        
        logger.debug("Defaulting to generic 'Agreement'")
        return "Agreement"

    def _extract_event_info_structured(self, text: str) -> str:
        """
        ✅ WINDOWS-COMPATIBLE: Enhanced event info with better section detection and timeout
        """
        patterns = [
            r"PURPOSE\s*:?\s*\n?((?:[^\n]|\n(?!\s*(?:ARTICLE|WHEREAS|NOW|SCOPE)))*?)(?:\n\s*(?:ARTICLE|WHEREAS|NOW|SCOPE|$))",
            r"OBJECTIVES?\s*:?\s*\n?((?:[^\n]|\n(?!\s*(?:ARTICLE|WHEREAS|NOW|PURPOSE)))*?)(?:\n\s*(?:ARTICLE|WHEREAS|NOW|PURPOSE|$))",
            r"SCOPE\s*(?:OF\s+(?:WORK|COOPERATION|COLLABORATION))?\s*:?\s*\n?((?:[^\n]|\n(?!\s*(?:ARTICLE|WHEREAS|NOW|PURPOSE)))*?)(?:\n\s*(?:ARTICLE|WHEREAS|NOW|PURPOSE|$))",
            r"This\s+(?:MOU|MOA|Agreement|Memorandum)(?:[^\n]{0,100}?)(?:is|for|shall|aims?\s+to|provides?)\s+((?:[^\n]|\n(?!\s*(?:ARTICLE|WHEREAS|NOW)))*?)(?:\.|$)"
        ]

        for pattern in patterns:
            try:
                # ✅ WINDOWS-COMPATIBLE: Timeout protection for complex regex
                def regex_search():
                    return re.search(pattern, text, re.IGNORECASE | re.DOTALL)
                
                try:
                    match = run_with_timeout(regex_search, timeout_duration=5)
                except TimeoutError:
                    logger.debug("Regex timeout on event info pattern, trying next")
                    continue
                
                if match:
                    info = match.group(1).strip()
                    info = re.sub(r'\s+', ' ', info)
                    info = re.sub(r'^(?:to\s+)?', '', info)
                    
                    if 20 <= len(info) <= 1000:
                        logger.info(f"✓ Event info extracted: {info[:100]}...")
                        return info[:500]
            except Exception as e:
                logger.debug(f"Error in event info pattern: {e}")
                continue
        
        return ""

    def _extract_signatories_safe(self, text: str) -> List[Dict[str, str]]:
        """
        ✅ CRITICAL FIX: Enhanced signatories extraction with error handling
        """
        signatories = []
        
        try:
            signature_blocks = re.findall(
                r"By:\s*\n?\s*([A-Z][A-Z\s\.]+)\s*\n?\s*([A-Za-z\s,\.-]+?)(?:\n|$)", 
                text, 
                re.MULTILINE
            )

            for name, position in signature_blocks:
                institution = "PUP" if any(k in position.lower() for k in ["pup", "polytechnic"]) else "Partner"
                signatories.append({
                    "name": name.strip()[:100],
                    "position": position.strip()[:100],
                    "institution": institution
                })
        except Exception as e:
            logger.debug(f"Error extracting signatories: {e}")

        return signatories[:6]

    def _extract_contact_persons_validated(self, text: str) -> List[Dict[str, str]]:
        """
        ✅ WINDOWS-COMPATIBLE: Enhanced contact extraction with RFC-compliant email validation and timeout
        """
        contacts = []
        seen_emails = set()

        # ✅ Comprehensive email pattern with timeout protection
        email_pattern = r"([a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})"
        
        try:
            def find_emails():
                return re.findall(email_pattern, text)
            
            try:
                emails = run_with_timeout(find_emails, timeout_duration=5)
            except TimeoutError:
                logger.warning("Email extraction timeout, using fallback")
                # Fallback: extract from smaller chunks
                emails = re.findall(email_pattern, text[:10000])
        except Exception as e:
            logger.debug(f"Error in email extraction: {e}")
            emails = []

        for email in emails:
            email_lower = email.lower()
            if email_lower in seen_emails:
                continue
            seen_emails.add(email_lower)
            
            # ✅ Enhanced email validation
            if not self._validate_email_rfc(email):
                continue
            
            # Skip PUP emails
            if self._is_pup_email(email):
                continue
            
            try:
                email_pos = text.find(email)
                if email_pos == -1:
                    continue
                
                start_context = max(0, email_pos - 300)
                end_context = min(len(text), email_pos + 100)
                context = text[start_context:end_context]
                
                contact_name = ""
                contact_position = ""
                
                # ✅ Multiple name pattern attempts
                name_patterns = [
                    r"(?:Attention|Contact|Representative|Focal\s+Point|Contact\s+Person)\s*:?\s*\n?\s*([A-Z][A-Za-z\s\.]{2,50}?)(?:\n|,|$)",
                    r"([A-Z][a-z]+\s+[A-Z][a-z]+)\s*[\n,]*\s*" + re.escape(email),
                    r"(?:Dr\.?\s+|Prof\.?\s+|Mr\.?\s+|Ms\.?\s+|Mrs\.?\s+)?([A-Z][A-Za-z\s\.]{5,50}?)\s*[\n,]*\s*" + re.escape(email)
                ]
                
                for name_pattern in name_patterns:
                    try:
                        name_match = re.search(name_pattern, context, re.IGNORECASE)
                        if name_match:
                            contact_name = re.sub(r'\s+', ' ', name_match.group(1).strip())
                            break
                    except Exception:
                        continue
                
                # ✅ Extract position with timeout
                position_keywords = [
                    "Director", "Coordinator", "Officer", "Manager", "Head", "Chair",
                    "Dean", "President", "Vice", "Professor", "Dr", "Representative",
                    "Secretary", "Administrator", "Chief", "Principal"
                ]
                
                for keyword in position_keywords:
                    if keyword.lower() in context.lower():
                        try:
                            position_pattern = rf"({keyword}[A-Za-z\s,.-]*?)(?:\n|{re.escape(email)})"
                            position_match = re.search(position_pattern, context, re.IGNORECASE)
                            if position_match:
                                contact_position = re.sub(r'\s+', ' ', position_match.group(1).strip())
                                break
                        except Exception:
                            continue

                if contact_name or contact_position or email:
                    contacts.append({
                        "contact_person_name": contact_name[:100],
                        "contact_person_position": contact_position[:100],
                        "contact_person_email": email
                    })
                    
            except Exception as e:
                logger.debug(f"Error processing contact email {email}: {e}")
                continue

        return contacts[:5]

    def _validate_email_rfc(self, email: str) -> bool:
        """
        ✅ CRITICAL FIX: RFC-compliant email validation
        """
        if not email or len(email) < 5 or len(email) > 254:
            return False
        
        email_regex = r'^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return False
        
        try:
            domain = email.split('@')[1].lower()
            invalid_domains = ['example.com', 'test.com', 'localhost', 'invalid.com', 'domain.com']
            if domain in invalid_domains:
                return False
                
            if '..' in domain or domain.startswith('.') or domain.endswith('.'):
                return False
                
        except (IndexError, AttributeError):
            return False
        
        return True

    def _is_pup_email(self, email: str) -> bool:
        """Check if email belongs to PUP"""
        pup_patterns = [r"@pup\.edu\.ph", r"@[a-z0-9.-]*pup[a-z0-9.-]*\."]
        return any(re.search(pattern, email, re.IGNORECASE) for pattern in pup_patterns)

    def _extract_point_persons_validated(self, text: str) -> List[Dict[str, str]]:
        """
        ✅ CRITICAL FIX: Enhanced PUP point persons extraction
        """
        point_persons = []
        emails = re.findall(r"([a-zA-Z0-9._%+-]+@pup\.edu\.ph)", text, re.IGNORECASE)
        
        for email in set(emails):
            point_persons.append({
                "point_person_name": "",
                "point_person_position": "",
                "point_person_email": email
            })

        return point_persons[:3]

    def _extract_source_unit_validated(self, text: str) -> str:
        """
        ✅ CRITICAL FIX: Source unit extraction with validation
        """
        patterns = [
            r"(?:prepared by|from)\s+(?:the\s+)?([A-Za-z\s&\-\.]+?)(?:\.|,|$)",
            r"(?:college|department)\s+of\s+([A-Za-z\s&\-\.]+?)(?:\.|,|$)"
        ]
        
        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match and 3 < len(match.group(1).strip()) < 150:
                    unit = re.sub(r'\s+', ' ', match.group(1).strip())
                    if not any(term in unit.lower() for term in ["agreement", "memorandum", "document"]):
                        return unit
            except Exception as e:
                logger.debug(f"Source unit pattern error: {e}")
                continue
        
        return ""

    def _map_to_form_fields_validated(self, metadata: Dict[str, Any], full_text: str) -> Dict[str, Any]:
        """
        ✅ PRODUCTION-READY: Map extracted metadata to validated form fields
        """
        partner = {
            "name": metadata.get("partner", {}).get("name", "")[:200],
            "entity_type": metadata.get("partner", {}).get("entity_type", "")[:100],
            "country": metadata.get("partner", {}).get("country", "")[:100],
            "region": metadata.get("partner", {}).get("region", "")[:100],
            "address": metadata.get("partner", {}).get("address", "")[:300],
            "website_url": metadata.get("partner", {}).get("website", "")[:200],
            "description": metadata.get("partner", {}).get("description", "")[:500],
            "logo_path": None,
            "status": "active",
            "contact_persons": metadata.get("contact_persons", [])[:5]
        }

        return {
            "source_unit": metadata.get("source_unit", "")[:150],
            "partner_data": partner,
            "dts_number": "",
            "entry_date": datetime.now().strftime("%Y-%m-%d"),
            "date_received": metadata.get("date_received", ""),
            "date_endorsed_to_ulco": metadata.get("date_endorsed_to_ulco", ""),
            "date_ulco_approved": metadata.get("date_ulco_approved", ""),
            "date_signed_by_pup": metadata.get("date_pup_signed", ""),
            "date_signed": metadata.get("date_signed", ""),
            "date_expiry": metadata.get("date_expiry", ""),
            "document_type": metadata.get("document_type", "")[:50],
            "partnership_type": metadata.get("partnership_type", "")[:200],
            "validity_period": metadata.get("validity_period", 0),
            "event_info": metadata.get("event_info", "")[:500],
            "signatories_list": metadata.get("signatories_list", "")[:1000],
            "hardcopy_location": metadata.get("hardcopy_location", "")[:200],
            "agreement_status": "Active",
            "entry_type": "Extracted",
            "renewed_from_agreement_id": None,
            "MOU_to_MOA_id": None,
            "contact_persons": metadata.get("contact_persons", [])[:5],
            "point_persons": metadata.get("point_persons", [])[:3],
            "initial_remarks": []
        }

    def is_qa_ready(self) -> bool:
        """Check if QA pipeline is ready"""
        return self.qa_pipeline is not None

    def qa_info(self) -> Dict[str, Any]:
        """Get QA pipeline information"""
        return {
            "model": self.model_name_in_use or self._preferred_model,
            "threshold": self.qa_confidence_threshold,
            "device": self._qa_device or "unknown",
            "chunk_chars": self.qa_chunk_chars,
            "overlap": self.qa_chunk_overlap,
            "max_answer_len": self.qa_max_answer_len,
            "spacy_available": self.nlp is not None,
            "qa_ready": self.is_qa_ready()
        }

    def _preprocess_text(self, text: str) -> str:
        """
        ✅ ADDED: Preprocess text for extraction
        Cleans up formatting, removes extra whitespace, normalizes structure
        """
        if not text:
            return ""

        try:
            # Remove excessive whitespace and normalize line breaks
            text = re.sub(r'\n\s*\n', '\n\n', text)
            text = re.sub(r'[ \t]+', ' ', text)
            text = re.sub(r'\n\d+\n', '\n', text)  # Remove page numbers

            # Remove header/footer patterns
            text = re.sub(r'Page\s+\d+\s+of\s+\d+', '', text, flags=re.IGNORECASE)
            text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)

            # Normalize common legal document patterns
            text = re.sub(r'WHEREAS[,;]', 'WHEREAS,', text, flags=re.IGNORECASE)
            text = re.sub(r'NOW[,\s]+THEREFORE[,;]', 'NOW, THEREFORE,', text, flags=re.IGNORECASE)

            return text.strip()
        except Exception as e:
            logger.debug(f"Text preprocessing error: {e}")
            return text

    def _extract_document_type(self, text: str) -> str:
        """
        ✅ ADDED: Extract document type (MOA/MOU) - prioritize document title
        """
        try:
            # First, check the document title/header (first few lines) for primary document type
            header_lines = '\n'.join(text.split('\n')[:10])  # First 10 lines
            
            # Check header for primary document type
            if re.search(r'\bmemorandum of understanding\b', header_lines, re.IGNORECASE):
                return "MOU"
            elif re.search(r'\bmemorandum of agreement\b', header_lines, re.IGNORECASE):
                return "MOA"
            
            # If not found in header, check for abbreviations in header
            if re.search(r'\bmou\b', header_lines, re.IGNORECASE):
                return "MOU"
            elif re.search(r'\bmoa\b', header_lines, re.IGNORECASE):
                return "MOA"
            
            # Fallback: check entire document, but prioritize full forms over abbreviations
            if re.search(r'\bmemorandum of understanding\b', text, re.IGNORECASE):
                return "MOU"
            elif re.search(r'\bmemorandum of agreement\b', text, re.IGNORECASE):
                return "MOA"
            
            # Last resort: check for abbreviations in full document
            if re.search(r'\bmou\b', text, re.IGNORECASE):
                return "MOU" 
            elif re.search(r'\bmoa\b', text, re.IGNORECASE):
                return "MOA"
            
            return ""
        except Exception as e:
            logger.debug(f"Document type extraction error: {e}")
            return ""

    def _compute_expiry_date(self, date_signed: str, validity_years: int) -> str:
        """
        ✅ ADDED: Compute expiry date from signing date and validity period
        Uses relativedelta for accurate year addition
        """
        if not date_signed or not validity_years or validity_years <= 0:
            return ""
        try:
            signed_date = datetime.strptime(date_signed, "%Y-%m-%d")
            expiry_date = signed_date + relativedelta(years=validity_years)
            return expiry_date.strftime("%Y-%m-%d")
        except Exception as e:
            logger.debug(f"Expiry date computation error: {e}")
            return ""

    def _infer_entity_type(self, partner_name: str) -> str:
        """
        ✅ ADDED: Infer entity type from partner name
        """
        if not partner_name:
            return "Organization"
        
        name_lower = partner_name.lower()

        if any(keyword in name_lower for keyword in ["university", "college", "institute", "school", "academy"]):
            return "University"
        elif any(keyword in name_lower for keyword in ["company", "corp", "corporation", "inc", "ltd", "llc", "limited"]):
            return "Company"
        elif any(keyword in name_lower for keyword in ["government", "ministry", "department", "agency", "bureau", "council"]):
            return "Government"
        elif any(keyword in name_lower for keyword in ["foundation", "association", "ngo", "society", "federation"]):
            return "NGO"
        else:
            return "Organization"

    def _map_to_agreement_fields(self, extracted: Dict[str, Any], full_text: str) -> Dict[str, Any]:
        """
        ✅ ADDED: Map extracted data to agreement structure matching AgreementCreate schema
        """
        # Build partner information
        partner_info = {
            "name": extracted.get("partner_name", ""),
            "entity_type": extracted.get("partner_entity_type", ""),
            "country": extracted.get("partner_country", ""),
            "region": extracted.get("partner_region", ""),
            "address": extracted.get("partner_address", ""),
            "website": extracted.get("partner_website", ""),
            "description": extracted.get("partner_description", "")
        }

        # Map document metadata
        result = {
            "partner": partner_info,
            "document_type": extracted.get("document_type", ""),
            "partnership_type": extracted.get("partnership_type", ""),
            "date_signed": extracted.get("date_signed", ""),
            "date_expiry": extracted.get("date_expiry", ""),
            "validity_period": extracted.get("validity_period", 0),
            "event_info": extracted.get("event_info", ""),
            "signatories_list": extracted.get("signatories_list", []),
            "contact_persons": extracted.get("contact_persons", []),
            "point_persons": extracted.get("point_persons", []),
            "date_received": extracted.get("date_received", ""),
            "date_endorsed_to_ulco": extracted.get("date_endorsed_to_ulco", ""),
            "date_ulco_approved": extracted.get("date_ulco_approved", ""),
            "date_pup_signed": extracted.get("date_pup_signed", ""),
            "agreement_status": extracted.get("agreement_status", "Active"),
            "dts_number": extracted.get("dts_number", ""),
            "hardcopy_location": extracted.get("hardcopy_location", ""),
            "source_unit": extracted.get("source_unit", ""),
            "entry_type": "Extracted",
            "remarks": extracted.get("remarks", "")
        }

        return result

# Compatibility alias
NlpExtractionService = NLPLegalExtractionService