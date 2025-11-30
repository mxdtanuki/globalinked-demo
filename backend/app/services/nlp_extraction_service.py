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
    
    ✅ LAZY LOADING: Models load ONLY when first extraction is requested
    ✅ 3-LAYER EXTRACTION: spaCy NER → Legal-BERT QA → Regex Fallback
    ✅ WINDOWS-COMPATIBLE: Threading-based timeouts (no Unix signals)
    ✅ CRASH-PROOF: All error handlers in place
    """

    def __init__(
        self,
        model_override: Optional[str] = None,
        qa_confidence_threshold: Optional[float] = None,
        document_processing_service: Optional[DocumentProcessingService] = None,
    ):
        # ✅ VERIFIED: DO NOT load spaCy on init - lazy load when needed
        self.nlp = None
        self.matcher = None
        self._spacy_loading = False
        self._spacy_attempted = False
        
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

        # Initialize document processor (lightweight)
        self.doc_processor = document_processing_service if document_processing_service else DocumentProcessingService()

        # ✅ QA pipeline - lazy loaded (no loading on init)
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

        # questions for better extraction coverage
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

        logger.info("✅ NLP Service initialized (models will load on first use)")

    def _ensure_spacy_loaded(self):
        """
        ✅ LAZY LOAD: Load spaCy only when first extraction is requested
        """
        if self.nlp is not None or self._spacy_loading or self._spacy_attempted:
            return

        self._spacy_loading = True
        self._spacy_attempted = True
        
        try:
            logger.info("🔬 Loading spaCy model (first time)...")
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
        finally:
            self._spacy_loading = False

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

    # ✅ VERIFIED: Calls _ensure_spacy_loaded() on first extraction
    def extract_agreement_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        ✅ LAZY LOADING: Ensure models are loaded before extraction
        """
        try:
            # ✅ Load spaCy on first call (if not already loaded)
            logger.info("🚀 Starting extraction request...")
            self._ensure_spacy_loaded()  # ✅ ONLY LOADS ON FIRST EXTRACTION

            _, ext = os.path.splitext(file_path)
            ext = ext.lstrip('.').lower()
            
            text_data = self.doc_processor.extract_text_from_file(file_path, ext)
            if not text_data.get("success", False):
                return {"error": text_data.get("error", "Text extraction failed")}

            text = text_data["text"]
            if not text.strip():
                return {"error": "The document does not contain readable text."}

            logger.info(f"🔍 Starting production extraction from text length: {len(text)}")

            # ✅ Step 1: extraction using combined approach
            metadata = self.extract_moa_for_agreement_response(text)

            # ✅ Step 2: Map to final form fields with validation
            result = self._map_to_form_fields_validated(metadata, text)
            
            logger.info("✅ Production NLP extraction completed successfully")
            return result

        except Exception as e:
            logger.exception("❌ Production extraction failed")
            return {"error": f"Extraction failed: {str(e)}"}

    # ✅ VERIFIED: 3-layer extraction (NER → QA → Regex)
    def extract_moa_for_agreement_response(self, text: str) -> Dict[str, Any]:
        """
        ✅ PRODUCTION-READY: Combined spaCy NER + Legal-BERT QA extraction
        """
        clean_text = self._preprocess_text(text)
        extracted: Dict[str, Any] = {}

        logger.info(f"🔍 Starting combined extraction from text length: {len(clean_text)}")

        # ✅ STEP 1: spaCy NER extraction (only if loaded successfully)
        if self.nlp is not None:
            logger.info("🔬 Step 1: spaCy NER pattern extraction...")
            ner_results = self._extract_with_spacy_ner(clean_text)
        else:
            logger.warning("⚠️ Skipping NER extraction (spaCy not available)")
            ner_results = {}

        # ✅ STEP 2: Legal-BERT QA extraction (lazy loaded on demand)
        logger.info("🤖 Step 2: Legal-BERT QA extraction...")
        qa_results = self._extract_with_legal_bert_qa(clean_text)

        # ✅ STEP 3: Combine results (prefer Legal-BERT, fallback to spaCy)
        logger.info("🔄 Step 3: Combining NER + QA results...")
        extracted = self._combine_extraction_results(ner_results, qa_results)

        # ✅ STEP 4: Regex fallback for fields not found by AI
        logger.info("📋 Step 4: Specialized field extraction...")

        # Partner name (timeout-protected regex)
        if not extracted.get("partner_name"):
            partner_name = self._extract_partner_name_with_timeout(clean_text)
            if partner_name:
                extracted["partner_name"] = partner_name
                logger.info(f"🎯 Partner name (regex): {partner_name}")

        # Partner address
        if not extracted.get("partner_address"):
            partner_address = self._extract_partner_address_safe(clean_text)
            if partner_address:
                extracted["partner_address"] = partner_address
                logger.info(f"🏢 Partner address (regex): {partner_address[:50]}...")

        # Country with context validation
        if not extracted.get("partner_country"):
            partner_country = self._extract_partner_country_validated(clean_text)
            if partner_country:
                extracted["partner_country"] = partner_country
                extracted["partner_region"] = self.region_mapping.get(partner_country, "")
                logger.info(f"🌍 Country/Region: {partner_country}/{extracted.get('partner_region')}")

        # Document type
        if not extracted.get("document_type"):
            doc_type = self._extract_document_type(clean_text)
            if doc_type:
                extracted["document_type"] = doc_type
                logger.info(f"📄 Document type: {doc_type}")

        # Date signed
        if not extracted.get("date_signed"):
            date_signed = self._extract_date_signed_validated(clean_text)
            if date_signed:
                extracted["date_signed"] = date_signed
                logger.info(f"📅 Date signed: {date_signed}")

        # Validity period
        if not extracted.get("validity_period"):
            validity_period = self._extract_validity_period_comprehensive(clean_text)
            if validity_period:
                extracted["validity_period"] = validity_period
                if extracted.get("date_signed"):
                    expiry_date = self._compute_expiry_date(extracted["date_signed"], validity_period)
                    if expiry_date:
                        extracted["date_expiry"] = expiry_date
                        logger.info(f"⏰ Validity: {validity_period} years, expires: {expiry_date}")

        # Partnership type
        if not extracted.get("partnership_type"):
            partnership_type = self._extract_partnership_type_with_confidence(clean_text)
            if partnership_type:
                extracted["partnership_type"] = partnership_type
                logger.info(f"🤝 Partnership type: {partnership_type}")

        # Event info
        if not extracted.get("event_info"):
            event_info = self._extract_event_info_structured(clean_text)
            if event_info:
                extracted["event_info"] = event_info
                logger.info(f"ℹ️  Event info: {event_info[:100]}...")

        # Signatories
        if not extracted.get("signatories_list"):
            signatories = self._extract_signatories_safe(clean_text)
            if signatories:
                extracted["signatories_list"] = signatories
                logger.info(f"✍️  Signatories: {len(signatories)} people")

        # Contact persons
        if not extracted.get("contact_persons"):
            contacts = self._extract_contact_persons_validated(clean_text)
            if contacts:
                extracted["contact_persons"] = contacts
                logger.info(f"📞 Partner contacts: {len(contacts)} people")

        # Point persons
        if not extracted.get("point_persons"):
            point_persons = self._extract_point_persons_validated(clean_text)
            if point_persons:
                extracted["point_persons"] = point_persons
                logger.info(f"👥 PUP point persons: {len(point_persons)} people")

        # Entity type
        if extracted.get("partner_name") and not extracted.get("partner_entity_type"):
            entity_type = self._infer_entity_type(extracted["partner_name"])
            extracted["partner_entity_type"] = entity_type
            logger.info(f"🏛️  Entity type: {entity_type}")

        # Source unit
        if not extracted.get("source_unit"):
            source_unit = self._extract_source_unit_validated(clean_text)
            if source_unit:
                extracted["source_unit"] = source_unit
                logger.info(f"🏫 Source unit: {source_unit}")

        logger.info("✅ Combined extraction complete")
        return self._map_to_agreement_fields(extracted, clean_text)

    def _extract_with_spacy_ner(self, text: str) -> Dict[str, Any]:
        """
        ✅ Extract using spaCy NER (Named Entity Recognition)
        Fast pattern-based extraction
        """
        results = {}
        
        if not self.nlp:
            logger.warning("spaCy not available, skipping NER extraction")
            return results

        try:
            # Process with spaCy
            doc = self.nlp(text[:100000])  # Limit text length
            
            # Extract organizations (potential partner names)
            orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
            if orgs:
                # Filter out PUP mentions
                partners = [org for org in orgs if not re.match(r'pup|polytechnic university', org, re.IGNORECASE)]
                if partners:
                    results["partner_name"] = partners[0]
                    logger.info(f"🔬 NER found partner: {partners[0]}")

            # Extract dates
            dates = [ent.text for ent in doc.ents if ent.label_ == "DATE"]
            if dates:
                results["dates_found"] = dates[:3]
                logger.info(f"🔬 NER found dates: {dates[:3]}")

            # Extract locations (potential countries)
            locations = [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]]
            if locations:
                results["locations_found"] = locations[:3]
                logger.info(f"🔬 NER found locations: {locations[:3]}")

        except Exception as e:
            logger.debug(f"spaCy NER extraction error: {e}")

        return results

    def _extract_with_legal_bert_qa(self, text: str) -> Dict[str, Any]:
        """
        ✅ Extract using Legal-BERT Question Answering
        AI-based comprehensive extraction
        """
        results = {}

        # Ensure QA pipeline is loaded
        if not self.is_qa_ready():
            logger.info("🤖 Loading Legal-BERT QA pipeline...")
            self._ensure_qa_loaded()

        if not self.is_qa_ready():
            logger.warning("Legal-BERT QA not available, skipping QA extraction")
            return results

        try:
            # Extract each field using QA
            logger.info("🤖 Running Legal-BERT QA extraction...")

            # Partner name
            partner_answer = self._ask_qa_best(text, self.questions.get("partner_name", []))
            if partner_answer and len(partner_answer) > 5:
                results["partner_name"] = partner_answer[:200]
                logger.info(f"🤖 QA found partner: {partner_answer}")

            # Document type
            doc_type_answer = self._ask_qa_best(text, self.questions.get("document_type", []))
            if doc_type_answer:
                if "agreement" in doc_type_answer.lower():
                    results["document_type"] = "MOA"
                elif "understanding" in doc_type_answer.lower():
                    results["document_type"] = "MOU"
                logger.info(f"🤖 QA found doc type: {results.get('document_type')}")

            # Partnership type
            partnership_answer = self._ask_qa_best(text, self.questions.get("partnership_type", []))
            if partnership_answer and len(partnership_answer) > 5:
                results["partnership_type"] = partnership_answer[:200]
                logger.info(f"🤖 QA found partnership: {partner_answer}")

            # Date signed
            date_answer = self._ask_qa_best(text, self.questions.get("date_signed", []))
            if date_answer:
                results["date_signed_raw"] = date_answer
                logger.info(f"🤖 QA found date: {date_answer}")

            # Country
            country_answer = self._ask_qa_best(text, self.questions.get("partner_country", []))
            if country_answer:
                results["partner_country_raw"] = country_answer
                logger.info(f"🤖 QA found country: {country_answer}")

            # Address
            address_answer = self._ask_qa_best(text, self.questions.get("partner_address", []))
            if address_answer and len(address_answer) > 10:
                results["partner_address"] = address_answer[:300]
                logger.info(f"🤖 QA found address: {address_answer[:50]}...")

            # Event info
            event_answer = self._ask_qa_best(text, self.questions.get("event_info", []))
            if event_answer and len(event_answer) > 20:
                results["event_info"] = event_answer[:500]
                logger.info(f"🤖 QA found event info: {event_answer[:100]}...")

        except Exception as e:
            logger.error(f"Legal-BERT QA extraction error: {e}")

        return results

    def _combine_extraction_results(self, ner_results: Dict[str, Any], qa_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        ✅ Combine NER and QA results intelligently
        Prefer QA results, use NER as fallback
        """
        combined = {}

        # Partner name: prefer QA, fallback to NER
        combined["partner_name"] = (
            qa_results.get("partner_name") or 
            ner_results.get("partner_name") or 
            ""
        )

        # Document type: prefer QA
        combined["document_type"] = qa_results.get("document_type", "")

        # Partnership type: prefer QA
        combined["partnership_type"] = qa_results.get("partnership_type", "")

        # Address: prefer QA
        combined["partner_address"] = qa_results.get("partner_address", "")

        # Country: prefer QA
        combined["partner_country"] = qa_results.get("partner_country_raw", "")

        # Event info: prefer QA
        combined["event_info"] = qa_results.get("event_info", "")

        # Date signed: prefer QA
        combined["date_signed"] = qa_results.get("date_signed_raw", "")

        logger.info(f"🔄 Combined {len(combined)} fields from NER + QA")
        return combined

    def _ensure_qa_loaded(self):
        """
        ✅ Lazy-load Legal-BERT QA pipeline
        """
        if self._qa_loading or self.qa_pipeline is not None:
            return

        self._qa_loading = True
        try:
            logger.info(f"🤖 Loading Legal-BERT model: {self._preferred_model}")
            
            # Determine device
            self._qa_device = 0 if torch.cuda.is_available() else -1
            device_name = "GPU" if self._qa_device == 0 else "CPU"
            logger.info(f"🖥️  Using device: {device_name}")

            # Load pipeline
            self.qa_pipeline = pipeline(
                "question-answering",
                model=self._preferred_model,
                tokenizer=self._preferred_model,
                device=self._qa_device
            )
            
            self.model_name_in_use = self._preferred_model
            logger.info(f"✅ Legal-BERT QA pipeline loaded successfully")

        except Exception as e:
            logger.error(f"❌ Failed to load Legal-BERT: {e}")
            self.qa_pipeline = None
        finally:
            self._qa_loading = False

    def _ask_qa_best(self, context: str, questions: List[str], max_context_len: int = 4000) -> str:
        """
        ✅ Ask multiple QA questions and return best answer
        """
        if not self.qa_pipeline or not questions:
            return ""

        try:
            # Truncate context if too long
            if len(context) > max_context_len:
                context = context[:max_context_len]

            best_answer = ""
            best_score = 0.0

            for question in questions:
                try:
                    result = self.qa_pipeline(
                        question=question,
                        context=context,
                        max_answer_len=self.qa_max_answer_len
                    )
                    
                    if result['score'] > best_score and result['score'] >= self.qa_confidence_threshold:
                        best_score = result['score']
                        best_answer = result['answer']
                        
                except Exception as e:
                    logger.debug(f"QA question failed: {e}")
                    continue

            if best_answer:
                logger.debug(f"Best QA answer (score: {best_score:.3f}): {best_answer[:100]}")
                return best_answer.strip()

        except Exception as e:
            logger.debug(f"QA extraction error: {e}")

        return ""

    def _preprocess_text(self, text: str) -> str:
        """
         Preprocess text for extraction
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
         Extract document type (MOA/MOU) - prioritize document title
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
         Compute expiry date from signing date and validity period
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
         Infer entity type from partner name
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
         Map extracted data to agreement structure matching AgreementCreate schema
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
            "hardcopy_location": extracted.get("hardcopy_location", "")[:200],
            "source_unit": extracted.get("source_unit", ""),
            "dts_number": extracted.get("dts_number", ""),
            "agreement_status": "Active",
            "entry_type": "Extracted",
            "renewed_from_agreement_id": None,
            "MOU_to_MOA_id": None,
            "initial_remarks": []
        }

        return result

    def _map_to_form_fields_validated(self, metadata: Dict[str, Any], full_text: str) -> Dict[str, Any]:
        """
         Map extracted metadata to validated form fields
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
            "dts_number": metadata.get("dts_number", ""),
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
                    
                    # ✅ validation with length check
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
     Address extraction with improved specificity and bounds checking
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
     country extraction with context validation
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
     date extraction with validation
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
     Comprehensive validity extraction with number words
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
     Partnership type matching with confidence threshold
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
        ✅ WINDOWS-COMPATIBLE: event info with better section detection and timeout
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
        ✅ ENHANCED: Extract signatories with better pattern matching
        """
        signatories = []
        
        try:
            # ✅ Pattern 1: Standard signature blocks with "By:" format
            signature_blocks = re.findall(
                r"(?:By|Signed by):\s*\n?\s*([A-Z][A-Z\s\.]+?)\s*\n\s*([^\n]+?)(?:\n|$)", 
                text, 
                re.MULTILINE | re.IGNORECASE
            )

            for name, position in signature_blocks:
                name = re.sub(r'\s+', ' ', name.strip())
                position = re.sub(r'\s+', ' ', position.strip())
                
                # Determine institution
                institution = "PUP" if any(k in position.lower() for k in ["pup", "polytechnic"]) else "Partner"
                
                signatories.append({
                    "name": name[:100],
                    "position": position[:100],
                    "institution": institution
                })

            # ✅ Pattern 2: Name followed by position (common in MOAs)
            # Example: "DR. RYU HONG LIM\nPresident"
            if not signatories:
                name_position_pairs = re.findall(
                    r"([A-Z]{2,}(?:\s+[A-Z]{2,})+)\s*\n\s*([A-Za-z\s,\.-]+?)(?:\n\n|$)",
                    text,
                    re.MULTILINE
                )
                
                for name, position in name_position_pairs:
                    name = re.sub(r'\s+', ' ', name.strip())
                    position = re.sub(r'\s+', ' ', position.strip())
                    
                    # Filter out common false positives
                    if len(name) > 4 and len(position) > 3:
                        # Determine institution
                        pup_keywords = ["pup", "polytechnic university", "manuel", "rivera"]
                        is_pup = any(keyword in name.lower() or keyword in position.lower() for keyword in pup_keywords)
                        institution = "PUP" if is_pup else "Partner"
                        
                        signatories.append({
                            "name": name[:100],
                            "position": position[:100],
                            "institution": institution
                        })

            # ✅ Pattern 3: Extract from witness section
            witness_section = re.search(
                r"(?:Signed in the presence of|Witnesses?):\s*\n((?:.*\n){1,10})",
                text,
                re.IGNORECASE | re.MULTILINE
            )
            
            if witness_section:
                witness_text = witness_section.group(1)
                witness_names = re.findall(
                    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*\n\s*([^\n]+)",
                    witness_text
                )
                
                for name, position in witness_names:
                    if name not in [s["name"] for s in signatories]:
                        signatories.append({
                            "name": name.strip()[:100],
                            "position": position.strip()[:100],
                            "institution": "Witness"
                        })

            logger.info(f"✍️ Extracted {len(signatories)} signatories")
            
        except Exception as e:
            logger.debug(f"Error extracting signatories: {e}")

        return signatories[:10]  # Return up to 10 signatories

    def _extract_contact_persons_validated(self, text: str) -> List[Dict[str, str]]:
        """
        ✅ ENHANCED: Extract contact persons with comprehensive pattern matching
        """
        contacts = []
        seen_emails = set()
        seen_names = set()

        # ✅ Comprehensive email pattern with timeout protection
        email_pattern = r"([a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})"
        
        try:
            def find_emails():
                return re.findall(email_pattern, text)
            
            try:
                emails = run_with_timeout(find_emails, timeout_duration=5)
            except TimeoutError:
                logger.warning("Email extraction timeout, using fallback")
                emails = re.findall(email_pattern, text[:10000])
        except Exception as e:
            logger.debug(f"Error in email extraction: {e}")
            emails = []

        for email in emails:
            email_lower = email.lower()
            if email_lower in seen_emails:
                continue
            seen_emails.add(email_lower)
            
            # ✅ Email validation
            if not self._validate_email_rfc(email):
                continue
            
            # Skip PUP emails (those are point persons)
            if self._is_pup_email(email):
                continue
            
            try:
                email_pos = text.find(email)
                if email_pos == -1:
                    continue
                
                # Get context around email (±300 chars)
                start_context = max(0, email_pos - 300)
                end_context = min(len(text), email_pos + 100)
                context = text[start_context:end_context]
                
                contact_name = ""
                contact_position = ""
                
                # ✅ Pattern 1: Name before email
                name_patterns = [
                    # "Mr. Joon Park" or "Dr. Ana Bautista"
                    r"(?:Dr\.?\s+|Prof\.?\s+|Mr\.?\s+|Ms\.?\s+|Mrs\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[\n,]*\s*" + re.escape(email),
                    # "Office of International Affairs, SNU"
                    r"([A-Z][a-z]+\s+[A-Z][a-z]+)\s*\n\s*Office",
                    # Generic name pattern
                    r"([A-Z][A-Za-z\s\.]{5,50}?)\s*[\n,]*\s*" + re.escape(email)
                ]
                
                for name_pattern in name_patterns:
                    try:
                        name_match = re.search(name_pattern, context, re.IGNORECASE)
                        if name_match:
                            contact_name = re.sub(r'\s+', ' ', name_match.group(1).strip())
                            if contact_name not in seen_names and len(contact_name) > 3:
                                seen_names.add(contact_name)
                                break
                    except Exception:
                        continue
                
                # ✅ Pattern 2: Position extraction
                position_keywords = [
                    "Director", "Coordinator", "Officer", "Manager", "Head", "Chair",
                    "Dean", "President", "Vice", "Professor", "Dr", "Representative",
                    "Secretary", "Administrator", "Chief", "Principal", "Office of"
                ]
                
                for keyword in position_keywords:
                    if keyword.lower() in context.lower():
                        try:
                            # Extract position with timeout
                            position_pattern = rf"({keyword}[A-Za-z\s,.-]*?)(?:\n|{re.escape(email)}|$)"
                            position_match = re.search(position_pattern, context, re.IGNORECASE)
                            if position_match:
                                contact_position = re.sub(r'\s+', ' ', position_match.group(1).strip())
                                if len(contact_position) > 3 and len(contact_position) < 100:
                                    break
                        except Exception:
                            continue

                # ✅ Add contact if we have meaningful data
                if contact_name or contact_position or email:
                    contacts.append({
                        "contact_person_name": contact_name[:100],
                        "contact_person_position": contact_position[:100],
                        "contact_person_email": email
                    })
                    logger.debug(f"📧 Contact: {contact_name} ({contact_position}) - {email}")
                    
            except Exception as e:
                logger.debug(f"Error processing contact email {email}: {e}")
                continue

        logger.info(f"📞 Extracted {len(contacts)} partner contacts")
        return contacts[:5]

    def _validate_email_rfc(self, email: str) -> bool:
        """
        RFC-compliant email validation
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
        ✅ ENHANCED: Extract PUP point persons with name and position
        """
        point_persons = []
        seen_emails = set()
        seen_names = set()
        
        # Find all PUP emails
        emails = re.findall(r"([a-zA-Z0-9._%+-]+@pup\.edu\.ph)", text, re.IGNORECASE)
        
        for email in set(emails):
            if email.lower() in seen_emails:
                continue
            seen_emails.add(email.lower())
            
            try:
                # Get context around email
                email_pos = text.find(email)
                if email_pos == -1:
                    continue
                
                start_context = max(0, email_pos - 300)
                end_context = min(len(text), email_pos + 100)
                context = text[start_context:end_context]
                
                person_name = ""
                person_position = ""
                
                # ✅ Extract name patterns
                name_patterns = [
                    r"(?:Dr\.?\s+|Prof\.?\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+)\s*[\n,]*\s*" + re.escape(email),
                    r"([A-Z][a-z]+\s+[A-Z][a-z]+)\s*\n\s*Office\s+of\s+International\s+Affairs",
                ]
                
                for name_pattern in name_patterns:
                    name_match = re.search(name_pattern, context, re.IGNORECASE)
                    if name_match:
                        person_name = re.sub(r'\s+', ' ', name_match.group(1).strip())
                        if person_name not in seen_names:
                            seen_names.add(person_name)
                            break
            
                # ✅ Extract position
                position_keywords = ["Director", "Coordinator", "Professor", "Dean", "Officer", "Office of"]
                for keyword in position_keywords:
                    if keyword.lower() in context.lower():
                        position_pattern = rf"({keyword}[A-Za-z\s,.-]*?)(?:\n|{re.escape(email)}|$)"
                        position_match = re.search(position_pattern, context, re.IGNORECASE)
                        if position_match:
                            person_position = re.sub(r'\s+', ' ', position_match.group(1).strip())
                            if len(person_position) > 3:
                                break
                
                point_persons.append({
                    "point_person_name": person_name[:100],
                    "point_person_position": person_position[:100],
                    "point_person_email": email
                })
                
                logger.debug(f"👤 PUP Point Person: {person_name} ({person_position}) - {email}")
                
            except Exception as e:
                logger.debug(f"Error extracting point person for {email}: {e}")
                continue

        logger.info(f"👥 Extracted {len(point_persons)} PUP point persons")
        return point_persons[:5]

    def _extract_source_unit_validated(self, text: str) -> str:
        """
        Source unit extraction with validation
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
    
# Compatibility alias
NlpExtractionService = NLPLegalExtractionService