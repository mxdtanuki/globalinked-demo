import os
import re
import logging
import threading
from datetime import datetime
from dateutil import parser
from typing import Dict, Any, List, Optional
from dateutil.relativedelta import relativedelta

import torch
import spacy
from spacy.matcher import Matcher
from transformers import pipeline, Pipeline

from .document_processing_service import DocumentProcessingService

logger = logging.getLogger(__name__)


class ExtractionTimeoutError(Exception):
    """Custom timeout exception for extraction operations"""
    pass


def run_with_timeout(func, args=(), kwargs=None, timeout_duration=5):
    """
    WINDOWS-COMPATIBLE: Run a function with timeout using threading
    """
    if kwargs is None:
        kwargs = {}
    
    result = [ExtractionTimeoutError("Function call timed out")]
    
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
        raise ExtractionTimeoutError(f"Operation timed out after {timeout_duration} seconds")
    
    if isinstance(result[0], Exception):
        raise result[0]
    
    return result[0]


class NLPLegalExtractionService:
    """
    Production-Ready Legal Document Extraction Service using spaCy NER + Legal-BERT QA.
    
    - LAZY LOADING: Models load ONLY when first extraction is requested
    - 3-LAYER EXTRACTION: spaCy NER → Legal-BERT QA → Regex Fallback
    - WINDOWS-COMPATIBLE: Threading-based timeouts (no Unix signals)
    """

    def __init__(
        self,
        model_override: Optional[str] = None,
        qa_confidence_threshold: Optional[float] = None,
        document_processing_service: Optional[DocumentProcessingService] = None,
    ):
        # Lazy load spaCy
        self.nlp = None
        self.matcher = None
        self._spacy_loading = False
        self._spacy_attempted = False
        
        # PUP-related filters - names and addresses to exclude
        self.pup_filters = [
            r"polytechnic\s+university\s+of\s+the\s+philippines",
            r"\bpup\b",
            r"polytechnic\s+university",
            r"sta\.?\s*mesa",
            r"santa\s+mesa",
            r"manila,?\s*philippines",
            r"a\.?\s*mabini\s*campus",
            r"mabini\s*campus",
        ]
        
        # Common false positive patterns for signatories
        self.signatory_blacklist = [
            "GOVERNING LAW", "GENERAL PROVISIONS", "WHEREAS", "ARTICLE",
            "AGREEMENT", "MEMORANDUM", "UNIVERSITY", "WITNESSETH", 
            "NOW THEREFORE", "TERMS AND CONDITIONS", "BINDING OBLIGATIONS",
            "INTELLECTUAL PROPERTY", "CONFIDENTIALITY", "NOTICES",
            "DISPUTE RESOLUTION", "INDEMNITY", "VARIATIONS", "ANTI-CORRUPTION",
            "PERSONAL DATA", "EXCLUSIVENESS", "NON-BINDING", "TERM OF PARTNERSHIP",
            "PROPOSED PARTNERSHIP", "INTERNATIONAL AFFAIRS", "OFFICE OF",
        ]
        
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

        # Region mapping
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
        self.doc_processor = document_processing_service or DocumentProcessingService()

        # QA pipeline - lazy loaded
        self.qa_pipeline: Optional[Pipeline] = None
        self.model_name_in_use: Optional[str] = None
        self._qa_device: Optional[int] = None
        self._qa_loading = False

        # Model preferences
        env_override = os.getenv("QA_MODEL_OVERRIDE", "").strip() or None
        override_model = model_override.strip() if (model_override and model_override.strip()) else env_override
        self._preferred_model = override_model or "nlpaueb/legal-bert-base-uncased"

        # Configuration
        self.qa_confidence_threshold = float(qa_confidence_threshold) if qa_confidence_threshold is not None else float(os.getenv("QA_CONFIDENCE_THRESHOLD", "0.05"))
        self.qa_chunk_chars = int(os.getenv("QA_CHUNK_CHARS", "2000"))
        self.qa_chunk_overlap = int(os.getenv("QA_CHUNK_OVERLAP", "300"))
        self.qa_max_answer_len = int(os.getenv("QA_MAX_ANS_LEN", "128"))

        # QA questions
        self.questions = {
            "document_type": [
                "What type of document is this - Memorandum of Agreement (MOA) or Memorandum of Understanding (MOU)?",
                "Is this a MOA or MOU document?",
                "What is the document type?"
            ],
            "partnership_type": [
                "What is the specific purpose of this agreement - research, academic exchange, student exchange, or cooperation?",
                "What type of partnership is established - research collaboration, academic program, or educational cooperation?",
                "What activities or programs are covered - research, exchange, training, or conferences?"
            ],
            "date_signed": [
                "What is the signing date or execution date of this agreement?",
                "When was this document signed or executed?",
                "What is the date this agreement was entered into?"
            ],
            "partner_name": [
                "Who is the partner institution or organization (not PUP)?",
                "What is the name of the institution partnering with PUP?",
                "Which university or organization is the other party?"
            ],
            "partner_country": [
                "In which country is the partner institution located?",
                "What is the country of the partner organization?",
                "Where is the partner institution based?"
            ],
            "partner_address": [
                "What is the address of the partner institution?",
                "Where is the partner organization located?",
                "What is the principal office address of the partner?"
            ],
            "event_info": [
                "What is the purpose or objective of this partnership?",
                "What activities will be implemented under this agreement?",
                "What is the scope of cooperation outlined?"
            ]
        }

        logger.info("NLP Service initialized (models will load on first use)")

    def _ensure_spacy_loaded(self):
        """Lazy load spaCy when first extraction is requested"""
        if self.nlp is not None or self._spacy_loading or self._spacy_attempted:
            return

        self._spacy_loading = True
        self._spacy_attempted = True
        
        try:
            logger.info("Loading spaCy model...")
            self.nlp = spacy.load("en_core_web_sm")
            self.matcher = Matcher(self.nlp.vocab)
            self._add_legal_patterns()
            logger.info("spaCy model loaded successfully")
        except OSError:
            logger.warning("spaCy model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
            self.matcher = None
        except Exception as e:
            logger.error(f"Failed to load spaCy: {e}")
            self.nlp = None
            self.matcher = None
        finally:
            self._spacy_loading = False

    def _add_legal_patterns(self):
        """Add custom patterns for legal document entities"""
        if not self.matcher:
            return

        doc_type_patterns = [
            [{"LOWER": "memorandum"}, {"LOWER": "of"}, {"LOWER": "understanding"}],
            [{"LOWER": "memorandum"}, {"LOWER": "of"}, {"LOWER": "agreement"}],
            [{"UPPER": "MOU"}],
            [{"UPPER": "MOA"}]
        ]
        self.matcher.add("DOCUMENT_TYPE", doc_type_patterns)

        university_patterns = [
            [{"LOWER": {"IN": ["university", "college", "institute", "school"]}}, {"IS_TITLE": True, "OP": "*"}],
            [{"IS_TITLE": True, "OP": "+"}, {"LOWER": {"IN": ["university", "college", "institute", "school"]}}]
        ]
        self.matcher.add("INSTITUTION", university_patterns)

    def extract_agreement_metadata(self, file_path: str) -> Dict[str, Any]:
        """Main extraction entry point with lazy loading"""
        try:
            logger.info("Starting extraction request...")
            self._ensure_spacy_loaded()

            _, ext = os.path.splitext(file_path)
            ext = ext.lstrip('.').lower()
            
            text_data = self.doc_processor.extract_text_from_file(file_path, ext)
            if not text_data.get("success", False):
                return {"error": text_data.get("error", "Text extraction failed")}

            text = text_data["text"]
            if not text.strip():
                return {"error": "The document does not contain readable text."}

            logger.info(f"Starting extraction from text length: {len(text)}")

            metadata = self.extract_moa_for_agreement_response(text)
            result = self._map_to_form_fields_validated(metadata, text)
            
            logger.info("Extraction completed successfully")
            return result

        except Exception as e:
            logger.exception("Extraction failed")
            return {"error": f"Extraction failed: {str(e)}"}

    def _extract_date_signed_validated(self, text: str) -> str:
        """Date extraction with validation - handles multiple date formats including ordinals"""
        
        # Month mapping for reliable parsing
        months = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
            'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'jun': 6, 'jul': 7, 'aug': 8,
            'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        }
        
        patterns = [
            # "22nd day of April 2020" - ordinal with "day of"
            (r"(?:this\s+)?(\d{1,2})(?:st|nd|rd|th)\s+day\s+of\s+(\w+)\s+(\d{4})", 'ordinal'),
            # "entered into this 22nd day of April 2020"
            (r"entered\s+into\s+(?:this\s+)?(\d{1,2})(?:st|nd|rd|th)\s+day\s+of\s+(\w+)\s+(\d{4})", 'ordinal'),
            # "signed on April 22, 2020"
            (r"signed\s+(?:on\s+)?(\w+)\s+(\d{1,2}),?\s+(\d{4})", 'mdy'),
            # "April 22, 2020" or "April 22 2020"
            (r"(\w+)\s+(\d{1,2}),?\s+(\d{4})", 'mdy'),
            # "22 April 2020"
            (r"(\d{1,2})\s+(\w+)\s+(\d{4})", 'dmy'),
            # "2020-04-22" ISO format
            (r"(\d{4})-(\d{2})-(\d{2})", 'iso'),
            # "22/04/2020" or "04/22/2020" (try both interpretations)
            (r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", 'ambiguous'),
            # "expiring on April 22, 2020" - for expiry
            (r"expir(?:ing|es?)\s+(?:on\s+)?(\w+)\s+(\d{1,2}),?\s+(\d{4})", 'mdy'),
        ]

        # Look in signature section first (more reliable)
        signature_section = ""
        sig_markers = [r"IN\s+WITNESS\s+WHEREOF", r"WITNESS\s+MY\s+HAND", r"SIGNED", r"Date\s*:"]
        for marker in sig_markers:
            match = re.search(marker, text, re.IGNORECASE)
            if match:
                signature_section = text[match.start():min(match.start() + 1000, len(text))]
                break

        # Try signature section first, then full text
        search_texts = [signature_section, text] if signature_section else [text]

        for search_text in search_texts:
            for pattern, date_format in patterns:
                try:
                    match = re.search(pattern, search_text, re.IGNORECASE)
                    if match:
                        groups = match.groups()
                        
                        try:
                            year = None
                            month = None
                            day = None
                            
                            if date_format == 'iso':
                                # ISO format: YYYY-MM-DD
                                year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
                            
                            elif date_format == 'ordinal':
                                # DD Ordinal MMMM YYYY
                                day = int(groups[0])
                                month_str = groups[1].lower()
                                year = int(groups[2])
                                month = months.get(month_str)
                                
                                if not month:
                                    try:
                                        # Fallback: try parser
                                        parsed = parser.parse(f"{groups[0]} {groups[1]} {groups[2]}", fuzzy=True)
                                        day, month, year = parsed.day, parsed.month, parsed.year
                                    except Exception:
                                        continue
                            
                            elif date_format == 'mdy':
                                # MMMM DD YYYY
                                month_str = groups[0].lower()
                                day = int(groups[1])
                                year = int(groups[2])
                                month = months.get(month_str)
                                
                                if not month:
                                    try:
                                        parsed = parser.parse(f"{groups[0]} {groups[1]} {groups[2]}", fuzzy=True)
                                        day, month, year = parsed.day, parsed.month, parsed.year
                                    except Exception:
                                        continue
                            
                            elif date_format == 'dmy':
                                # DD MMMM YYYY
                                day = int(groups[0])
                                month_str = groups[1].lower()
                                year = int(groups[2])
                                month = months.get(month_str)
                                
                                if not month:
                                    try:
                                        parsed = parser.parse(f"{groups[0]} {groups[1]} {groups[2]}", fuzzy=True)
                                        day, month, year = parsed.day, parsed.month, parsed.year
                                    except Exception:
                                        continue
                            
                            elif date_format == 'ambiguous':
                                # Could be DD/MM/YYYY or MM/DD/YYYY - try both
                                d1, d2, year = int(groups[0]), int(groups[1]), int(groups[2])
                                # Assume DD/MM/YYYY first (more common globally)
                                if d1 <= 31 and d2 <= 12:
                                    day, month = d1, d2
                                elif d1 <= 12 and d2 <= 31:
                                    day, month = d2, d1
                                else:
                                    continue
                            
                            # Validate the date
                            if month and day and year:
                                if 1 <= month <= 12 and 1 <= day <= 31 and 1990 <= year <= datetime.now().year + 20:
                                    try:
                                        parsed_date = datetime(year, month, day)
                                        logger.info(f"✅ Extracted date: {parsed_date.strftime('%Y-%m-%d')} from '{match.group()}'")
                                        return parsed_date.strftime("%Y-%m-%d")
                                    except ValueError:
                                        # Invalid date like Feb 30
                                        logger.debug(f"Invalid date constructed: {year}-{month}-{day}")
                                        continue
                        
                        except (ValueError, TypeError, AttributeError) as e:
                            logger.debug(f"Date parsing exception for '{match.group()}': {e}")
                            continue
                
                except Exception as e:
                    logger.debug(f"Date extraction pattern error: {e}")
                    continue
        
        logger.debug("No valid date found in document")
        return ""

    def _extract_date_expiry_from_text(self, text: str) -> str:
        """Extract expiry date directly from text"""
        patterns = [
            # "expiring on September 10, 2028"
            r"expir(?:ing|es?)\s+(?:on\s+)?(\w+)\s+(\d{1,2}),?\s+(\d{4})",
            # "valid until September 10, 2028"
            r"valid\s+(?:until|through)\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})",
            # "until September 10, 2028"
            r"until\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})",
            # "ending on September 10, 2028"
            r"end(?:ing|s)?\s+(?:on\s+)?(\w+)\s+(\d{1,2}),?\s+(\d{4})",
        ]

        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    date_str = f"{match.group(1)} {match.group(2)} {match.group(3)}"
                    parsed = parser.parse(date_str, fuzzy=True)
                    current_year = datetime.now().year
                    if 1990 <= parsed.year <= current_year + 50:
                        return parsed.strftime("%Y-%m-%d")
            except Exception:
                continue

        return ""

    def extract_moa_for_agreement_response(self, text: str) -> Dict[str, Any]:
        """Extract MOA/MOU metadata"""
        clean_text = self._preprocess_text(text)
        extracted: Dict[str, Any] = {}

        logger.info(f"Starting combined extraction from text length: {len(clean_text)}")

        ner_results = {}
        if self.nlp is not None:
            ner_results = self._extract_with_spacy_ner(clean_text)

        qa_results = self._extract_with_legal_bert_qa(clean_text)

        extracted = self._combine_extraction_results(ner_results, qa_results)

        # Fill in missing fields
        logger.info("Step 4: Regex fallback extraction...")
        
        if not extracted.get("partner_name"):
            # Try NER first
            partner_name = self._extract_partner_name_ner_based(clean_text, self.nlp)
            if not partner_name:
                # Fallback to regex for simple cases
                partner_name = self._extract_partner_name_with_timeout(clean_text)
            if partner_name:
                extracted["partner_name"] = partner_name

        if not extracted.get("partner_address"):
            extracted["partner_address"] = self._extract_partner_address_safe(clean_text)

        if not extracted.get("partner_country"):
            partner_country = self._extract_partner_country_validated(clean_text)
            if partner_country:
                extracted["partner_country"] = partner_country
                extracted["partner_region"] = self.region_mapping.get(partner_country, "")

        if not extracted.get("document_type"):
            extracted["document_type"] = self._extract_document_type(clean_text)

        if not extracted.get("date_signed"):
            date_signed = self._extract_date_signed_enhanced(clean_text)
            if date_signed:
                extracted["date_signed"] = date_signed

        # Get validity period
        if not extracted.get("validity_period"):
            validity_period = self._extract_validity_period_keyword_based(clean_text)
            if validity_period:
                extracted["validity_period"] = validity_period

        # Get expiry date
        if not extracted.get("date_expiry"):
            extracted["date_expiry"] = self._extract_date_expiry_from_text(clean_text)
        
        # If still no expiry but we have date_signed and validity, compute it
        if not extracted.get("date_expiry") and extracted.get("date_signed") and extracted.get("validity_period"):
            extracted["date_expiry"] = self._compute_expiry_date(
                extracted["date_signed"], 
                extracted["validity_period"]
            )

        if not extracted.get("partnership_type"):
            # Get partnership type
            partnership_type = self._extract_partnership_type_keyword_based(clean_text)
            if partnership_type:
                extracted["partnership_type"] = partnership_type

        if not extracted.get("event_info"):
            extracted["event_info"] = self._extract_event_info_structured(clean_text)

        if not extracted.get("signatories_list"):
            # Get signatories
            signatories = self._extract_signatories_ner_based(clean_text, self.nlp)
            if signatories:
                extracted["signatories_list"] = signatories

        if not extracted.get("contact_persons"):
            extracted["contact_persons"] = self._extract_contact_persons_validated(clean_text)

        if not extracted.get("point_persons"):
            extracted["point_persons"] = self._extract_point_persons_validated(clean_text)

        if extracted.get("partner_name") and not extracted.get("partner_entity_type"):
            # Try to extract entity type from document context first
            entity_type_from_context = self._extract_entity_type_from_context(clean_text, extracted["partner_name"])
            if entity_type_from_context:
                extracted["partner_entity_type"] = entity_type_from_context
            else:
                # Fall back to inferring from partner name
                extracted["partner_entity_type"] = self._infer_entity_type(extracted["partner_name"])

        if not extracted.get("source_unit"):
            extracted["source_unit"] = self._extract_source_unit_validated(clean_text)

        logger.info(f"Extraction complete - date_signed: {extracted.get('date_signed')}, date_expiry: {extracted.get('date_expiry')}, validity: {extracted.get('validity_period')}")
        return self._map_to_agreement_fields(extracted, clean_text)

    def _extract_with_spacy_ner(self, text: str) -> Dict[str, Any]:
        """NER extraction"""
        results = {}
        
        if not self.nlp:
            return results

        try:
            max_chars = 100000
            doc = self.nlp(text[:max_chars])
            
            orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
            if orgs:
                partners = [org for org in orgs if not re.match(r'pup|polytechnic university', org, re.IGNORECASE)]
                if partners:
                    results["partner_name"] = partners[0]

            dates = [ent.text for ent in doc.ents if ent.label_ == "DATE"]
            if dates:
                results["dates_found"] = dates[:3]

            locations = [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]]
            if locations:
                results["locations_found"] = locations[:3]

            del doc

        except Exception as e:
            logger.debug(f"spaCy NER extraction error: {e}")

        return results

    def _extract_with_legal_bert_qa(self, text: str) -> Dict[str, Any]:
        """Legal-BERT QA extraction"""
        results = {}

        if not self.is_qa_ready():
            logger.info("Loading Legal-BERT QA pipeline...")
            self._ensure_qa_loaded()

        if not self.is_qa_ready():
            logger.warning("Legal-BERT QA not available")
            return results

        try:
            logger.info("Running Legal-BERT QA extraction...")

            partner_answer = self._ask_qa_best(text, self.questions.get("partner_name", []))
            if partner_answer and len(partner_answer) > 5:
                results["partner_name"] = partner_answer[:200]

            doc_type_answer = self._ask_qa_best(text, self.questions.get("document_type", []))
            if doc_type_answer:
                if "agreement" in doc_type_answer.lower():
                    results["document_type"] = "MOA"
                elif "understanding" in doc_type_answer.lower():
                    results["document_type"] = "MOU"

            partnership_answer = self._ask_qa_best(text, self.questions.get("partnership_type", []))
            if partnership_answer and len(partnership_answer) > 5:
                results["partnership_type"] = partnership_answer[:200]
                logger.info(f"QA found partnership: {partnership_answer}")

            date_answer = self._ask_qa_best(text, self.questions.get("date_signed", []))
            if date_answer:
                results["date_signed_raw"] = date_answer

            country_answer = self._ask_qa_best(text, self.questions.get("partner_country", []))
            if country_answer:
                results["partner_country_raw"] = country_answer

            address_answer = self._ask_qa_best(text, self.questions.get("partner_address", []))
            if address_answer and len(address_answer) > 10:
                results["partner_address"] = address_answer[:300]

            event_answer = self._ask_qa_best(text, self.questions.get("event_info", []))
            if event_answer and len(event_answer) > 20:
                results["event_info"] = event_answer[:500]

        except Exception as e:
            logger.error(f"Legal-BERT QA extraction error: {e}")

        return results

    def _combine_extraction_results(self, ner_results: Dict[str, Any], qa_results: Dict[str, Any]) -> Dict[str, Any]:
        """Combine NER and QA results (prefer QA, fallback to NER)"""
        return {
            "partner_name": qa_results.get("partner_name") or ner_results.get("partner_name") or "",
            "document_type": qa_results.get("document_type", ""),
            "partnership_type": qa_results.get("partnership_type", ""),
            "partner_address": qa_results.get("partner_address", ""),
            "partner_country": qa_results.get("partner_country_raw", ""),
            "event_info": qa_results.get("event_info", ""),
            "date_signed": qa_results.get("date_signed_raw", ""),
        }

    def _ensure_qa_loaded(self):
        """Lazy-load Legal-BERT QA pipeline"""
        if self._qa_loading or self.qa_pipeline is not None:
            return

        self._qa_loading = True
        try:
            logger.info(f"Loading Legal-BERT model: {self._preferred_model}")
            
            self._qa_device = 0 if torch.cuda.is_available() else -1
            logger.info(f"Using device: {'GPU' if self._qa_device == 0 else 'CPU'}")

            self.qa_pipeline = pipeline(
                "question-answering",
                model=self._preferred_model,
                tokenizer=self._preferred_model,
                device=self._qa_device
            )
            
            self.model_name_in_use = self._preferred_model
            logger.info("Legal-BERT QA pipeline loaded successfully")

        except Exception as e:
            logger.error(f"Failed to load Legal-BERT: {e}")
            self.qa_pipeline = None
        finally:
            self._qa_loading = False

    def _ask_qa_best(self, context: str, questions: List[str], max_context_len: int = 4000) -> str:
        """Ask multiple QA questions and return best answer"""
        if not self.qa_pipeline or not questions:
            return ""

        try:
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

            return best_answer.strip() if best_answer else ""

        except Exception as e:
            logger.debug(f"QA extraction error: {e}")
            return ""

    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for extraction"""
        if not text:
            return ""

        try:
            text = re.sub(r'\n\s*\n', '\n\n', text)
            text = re.sub(r'[ \t]+', ' ', text)
            text = re.sub(r'\n\d+\n', '\n', text)
            text = re.sub(r'Page\s+\d+\s+of\s+\d+', '', text, flags=re.IGNORECASE)
            text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
            text = re.sub(r'WHEREAS[,;]', 'WHEREAS,', text, flags=re.IGNORECASE)
            text = re.sub(r'NOW[,\s]+THEREFORE[,;]', 'NOW, THEREFORE,', text, flags=re.IGNORECASE)
            return text.strip()
        except Exception as e:
            logger.debug(f"Text preprocessing error: {e}")
            return text

    def _extract_document_type(self, text: str) -> str:
        """Extract document type (MOA/MOU)"""
        try:
            header_lines = '\n'.join(text.split('\n')[:10])
            
            if re.search(r'\bmemorandum of understanding\b', header_lines, re.IGNORECASE):
                return "MOU"
            if re.search(r'\bmemorandum of agreement\b', header_lines, re.IGNORECASE):
                return "MOA"
            if re.search(r'\bmou\b', header_lines, re.IGNORECASE):
                return "MOU"
            if re.search(r'\bmoa\b', header_lines, re.IGNORECASE):
                return "MOA"
            
            if re.search(r'\bmemorandum of understanding\b', text, re.IGNORECASE):
                return "MOU"
            if re.search(r'\bmemorandum of agreement\b', text, re.IGNORECASE):
                return "MOA"
            if re.search(r'\bmou\b', text, re.IGNORECASE):
                return "MOU"
            if re.search(r'\bmoa\b', text, re.IGNORECASE):
                return "MOA"
            
            return ""
        except Exception as e:
            logger.debug(f"Document type extraction error: {e}")
            return ""

    def _compute_expiry_date(self, date_signed: str, validity_years: int) -> str:
        """Compute expiry date from signing date and validity period"""
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
        """Infer entity type from name."""
        if not partner_name:
            return "Organization"
        
        name_lower = partner_name.lower()

        # Educational institutions
        edu_keywords = ["university", "college", "institute", "school", "academy", 
                       "polytechnic", "technical college", "high school"]
        if any(kw in name_lower for kw in edu_keywords):
            logger.debug(f"[Entity Type] Inferred 'University' from name: {partner_name}")
            return "University"
        
        # Companies and businesses
        company_keywords = ["company", "corp", "corporation", "inc", "ltd", "llc", 
                            "limited", "enterprises", "co.", "co"]
        if any(kw in name_lower for kw in company_keywords):
            return "Company"
        
        # Government organizations
        gov_keywords = ["government", "ministry", "department", "agency", "bureau", 
                       "council", "senate", "parliament", "commission"]
        if any(kw in name_lower for kw in gov_keywords):
            return "Government"
        
        # NGOs and non-profit
        ngo_keywords = ["foundation", "association", "ngo", "society", "federation", 
                       "trust", "organization", "institute of international"]
        if any(kw in name_lower for kw in ngo_keywords):
            return "NGO"
        
        return "Organization"

    def _extract_entity_type_from_context(self, text: str, partner_name: str) -> str:
        """Extract entity type directly from document context describing the partner"""
        if not partner_name:
            return ""
        
        # Create a regex pattern to find the partner name and its description
        partner_name_escaped = re.escape(partner_name)
        
        # Pattern to find partner name description - captures ~200 chars after partner name mention
        pattern = "(?:The\\s+)?" + partner_name_escaped + "[,\\.]?\\s+(?:is\\s+)?(?:an?\\s+)?(.{10,200}?)(?:,|established|with|represented|\\.|$)"
        
        try:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                description = match.group(1).strip()
                
                # Keywords to detect entity type from description
                edu_keywords = ["institution of higher learning", "university", "college", 
                               "educational institution", "academic institution", "polytechnic"]
                company_keywords = ["company", "corporation", "business", "commercial enterprise"]
                gov_keywords = ["government", "ministry", "agency", "bureau", "commission", "state"]
                ngo_keywords = ["foundation", "organization", "ngo", "association", "non-profit"]
                
                desc_lower = description.lower()
                
                if any(kw in desc_lower for kw in edu_keywords):
                    logger.info(f"[Entity Type] Extracted from context: University")
                    return "University"
                if any(kw in desc_lower for kw in company_keywords):
                    return "Company"
                if any(kw in desc_lower for kw in gov_keywords):
                    return "Government"
                if any(kw in desc_lower for kw in ngo_keywords):
                    return "NGO"
        except Exception as e:
            logger.debug(f"Error extracting entity type from context: {e}")
        
        return ""

    def _extract_partner_name_ner_based(self, text: str, nlp) -> str:
        """Extract partner name using spaCy NER"""
        if not nlp:
            return ""
        
        try:
            doc = nlp(text[:100000])
            
            orgs = []
            for ent in doc.ents:
                if ent.label_ == "ORG":
                    org_text = ent.text.strip()
                    # Skip PUP, doc titles, and very long/short names
                    if (len(org_text) > 3 and len(org_text) < 150 and
                        "polytechnic" not in org_text.lower() and 
                        "pup" not in org_text.lower() and
                        "memorandum" not in org_text.lower() and
                        "agreement" not in org_text.lower() and
                        "moa" not in org_text.lower() and
                        "mou" not in org_text.lower()):
                        orgs.append(org_text)
                        logger.debug(f"[NER] Found ORG: {org_text}")
            
            # Return first valid org
            if orgs:
                logger.info(f"[Partner Name] NER-based extraction: {orgs[0]}")
                return orgs[0]
        except Exception as e:
            logger.debug(f"NER-based partner name extraction error: {e}")
        
        return ""

    def _extract_date_signed_enhanced(self, text: str) -> str:
        """Extract date from text with multiple formats"""
        # Look for signature section first (dates more reliable there)
        signature_markers = [
            r"IN\s+WITNESS\s+WHEREOF",
            r"WITNESS\s+MY\s+HAND",
            r"SIGNED\s+IN\s+THE\s+PRESENCE",
        ]
        
        signature_pos = -1
        for marker in signature_markers:
            match = re.search(marker, text, re.IGNORECASE)
            if match:
                signature_pos = match.start()
                break
        
        # Search in signature section first, then full document
        search_order = []
        if signature_pos > 0:
            search_order.append(text[signature_pos:min(signature_pos + 2000, len(text))])
        search_order.append(text)
        
        # Month mapping
        months = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
            'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'jun': 6, 'jul': 7, 'aug': 8,
            'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        }
        
        # Comprehensive date patterns
        patterns = [
            # Ordinal format: "17th day of October 2024" or "17th day of October\n2024"
            (r"(\d{1,2})(?:st|nd|rd|th)\s+day\s+of\s+([A-Za-z]+)\s*(\d{4})", 'ordinal'),
            # Standard format: "October 17, 2024" or "October 17 2024"
            (r"([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})", 'mdy'),
            # ISO format: "2024-10-17"
            (r"(\d{4})-(\d{2})-(\d{2})", 'iso'),
            # Date range start: "from October 17, 2024"
            (r"from\s+([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})", 'mdy'),
        ]
        
        for search_text in search_order:
            for pattern, fmt in patterns:
                try:
                    matches = re.finditer(pattern, search_text, re.IGNORECASE)
                    for match in matches:
                        groups = match.groups()
                        try:
                            if fmt == 'ordinal':
                                day, month_str, year = int(groups[0]), groups[1], int(groups[2])
                                month = months.get(month_str.lower())
                            elif fmt == 'mdy':
                                month_str, day, year = groups[0], int(groups[1]), int(groups[2])
                                month = months.get(month_str.lower())
                            elif fmt == 'iso':
                                year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
                            
                            if month and 1 <= month <= 12 and 1 <= day <= 31 and 1990 <= year <= 2100:
                                date_obj = datetime(year, month, day)
                                logger.info(f"[Date Signed] Extracted: {date_obj.strftime('%Y-%m-%d')}")
                                return date_obj.strftime("%Y-%m-%d")
                        except (ValueError, TypeError):
                            continue
                except Exception as e:
                    logger.debug(f"Date pattern error: {e}")
                    continue
        
        logger.debug("No valid date found")
        return ""

    def _extract_validity_period_keyword_based(self, text: str) -> int:
        """Extract validity period from text"""
        number_words = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        }
        
        # Look for validity period patterns
        validity_keywords = [
            # Match "for the period of five (5) years" or "for the period of 5 years"
            r"\bfor\s+the\s+period\s+of\s+(\w+|\d+)\s*(?:\(\d+\))?\s+years",
            # Match "for period of X years" or "for X years"
            r"for\s+(?:the\s+)?(?:period\s+)?of\s+(\w+|\d+)\s*(?:\(\d+\))?\s+years",
            # Match "Valid for X years" 
            r"valid\s+for\s+(\w+|\d+)\s+years",
            # Match "Term of X years"
            r"(?:term|duration)\s+(?:of|is)\s+(\w+|\d+)\s*(?:\(\d+\))?\s+years",
            # Match standalone numbers before "year"
            r"(\d+)\s*(?:\(\w+\))?\s+years?(?:\s+(?:term|validity|period|duration))?",
        ]
        
        for pattern in validity_keywords:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    # Extract the captured value
                    captured = match.group(1).strip() if match.groups() else match.group(0)
                    
                    # Try to convert to number
                    if captured.isdigit():
                        value = int(captured)
                    else:
                        # Try word-based number
                        value = number_words.get(captured.lower(), 0)
                    
                    if 1 <= value <= 100:
                        logger.info(f"[Validity Period] Extracted: {value} years from pattern: {pattern}")
                        return value
            except Exception as e:
                logger.debug(f"Validity period error: {e}")
                continue
        
        return 0

    def _extract_signatories_ner_based(self, text: str, nlp) -> List[str]:
        """Extract signatories using spaCy NER"""
        if not nlp:
            return []
        
        signatories = []
        seen = set()
        
        try:
            # Find where signatures are
            sig_markers = ["IN WITNESS", "WITNESS MY", "SIGNED IN", "SIGNATURES"]
            sig_pos = -1
            for marker in sig_markers:
                match = re.search(marker, text, re.IGNORECASE)
                if match:
                    sig_pos = max(sig_pos, match.start())
            
            # Get signature section
            if sig_pos > 0:
                sig_section = text[sig_pos:]
            else:
                sig_section = text[max(0, len(text) - 3000):]
            
            # Find person names
            doc = nlp(sig_section[:8000])  # Limit to 8K chars
            
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    name = ent.text.strip()
                    # Skip invalid names
                    if (len(name) > 3 and len(name) < 60 and 
                        name.upper() not in seen and
                        "notary" not in name.lower() and
                        "page" not in name.lower()):
                        seen.add(name.upper())
                        signatories.append(name)
                        logger.debug(f"[Signatory] NER found: {name}")
            
            logger.info(f"[Signatories] NER-based extraction: {len(signatories)} found")
            
        except Exception as e:
            logger.debug(f"NER-based signatory extraction error: {e}")
        
        return signatories[:15]

    def _extract_partnership_type_keyword_based(self, text: str) -> str:
        """Identify partnership type from document"""
        partnership_keywords = {
            "Faculty Exchange": ["faculty exchange", "academic exchange", "faculty training"],
            "Research Collaboration": ["research collaboration", "collaborative research", "joint research"],
            "Student Exchange": ["student exchange", "student mobility"],
            "Joint Degree": ["joint degree", "dual degree"],
            "Capacity Building": ["capacity building", "training program"],
            "Academic Cooperation": ["academic cooperation", "academic collaboration"],
        }
        
        text_lower = text.lower()
        
        # Count keyword matches for each type
        scores = {}
        for ptype, keywords in partnership_keywords.items():
            score = sum(text_lower.count(kw) for kw in keywords)
            if score > 0:
                scores[ptype] = score
        
        if scores:
            best_type = max(scores.items(), key=lambda x: x[1])[0]
            logger.info(f"[Partnership Type] Extracted: {best_type}")
            return best_type
        
        return ""

    def _map_to_agreement_fields(self, extracted: Dict[str, Any], full_text: str) -> Dict[str, Any]:
        """Map extracted data to agreement structure"""
        partner_info = {
            "name": extracted.get("partner_name", ""),
            "entity_type": extracted.get("partner_entity_type", ""),
            "country": extracted.get("partner_country", ""),
            "region": extracted.get("partner_region", ""),
            "address": extracted.get("partner_address", ""),
            "website": extracted.get("partner_website", ""),
            "description": extracted.get("partner_description", "")
        }

        return {
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
            "hardcopy_location": extracted.get("hardcopy_location", "")[:200] if extracted.get("hardcopy_location") else "",
            "source_unit": extracted.get("source_unit", ""),
            "dts_number": extracted.get("dts_number", ""),
            "agreement_status": "Initial Review",
            "entry_type": "New",
            "renewed_from_agreement_id": None,
            "MOU_to_MOA_id": None,
            "initial_remarks": []
        }

    def _map_to_form_fields_validated(self, metadata: Dict[str, Any], full_text: str) -> Dict[str, Any]:
        """Map extracted metadata to validated form fields"""
        partner = {
            "name": (metadata.get("partner", {}).get("name", "") or "")[:200],
            "entity_type": (metadata.get("partner", {}).get("entity_type", "") or "")[:100],
            "country": (metadata.get("partner", {}).get("country", "") or "")[:100],
            "region": (metadata.get("partner", {}).get("region", "") or "")[:100],
            "address": (metadata.get("partner", {}).get("address", "") or "")[:300],
            "website_url": (metadata.get("partner", {}).get("website", "") or "")[:200],
            "description": (metadata.get("partner", {}).get("description", "") or "")[:500],
            "logo_path": None,
            "status": "Initial Review",
            "contact_persons": metadata.get("contact_persons", [])[:5]
        }

        # Ensure signatories_list is a list of strings
        signatories = metadata.get("signatories_list", [])
        if isinstance(signatories, list):
            signatories_list = signatories[:20]
        else:
            signatories_list = []

        return {
            "source_unit": (metadata.get("source_unit", "") or "")[:150],
            "partner_data": partner,
            "dts_number": metadata.get("dts_number", "") or "",
            "entry_date": datetime.now().strftime("%Y-%m-%d"),
            "date_received": metadata.get("date_received", "") or "",
            "date_endorsed_to_ulco": metadata.get("date_endorsed_to_ulco", "") or "",
            "date_ulco_approved": metadata.get("date_ulco_approved", "") or "",
            "date_signed_by_pup": metadata.get("date_pup_signed", "") or "",
            "date_signed": metadata.get("date_signed", "") or "",
            "date_expiry": metadata.get("date_expiry", "") or "",
            "document_type": (metadata.get("document_type", "") or "")[:50],
            "partnership_type": (metadata.get("partnership_type", "") or "")[:200],
            "validity_period": metadata.get("validity_period", 0) or 0,
            "event_info": (metadata.get("event_info", "") or "")[:500],
            "signatories_list": signatories_list,
            "hardcopy_location": (metadata.get("hardcopy_location", "") or "")[:200],
            "agreement_status": "Active",
            "entry_type": "New",  # Changed from "Extracted" to "New"
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
            "device": self._qa_device if self._qa_device is not None else "unknown",
            "chunk_chars": self.qa_chunk_chars,
            "overlap": self.qa_chunk_overlap,
            "max_answer_len": self.qa_max_answer_len,
            "spacy_available": self.nlp is not None,
            "qa_ready": self.is_qa_ready()
        }

    def _extract_partner_name_with_timeout(self, text: str) -> str:
        """Partner name extraction with timeout protection - filters out PUP"""
        if len(text) > 50000:
            text = text[:50000]
        
        # Extract the first few lines which often contain the parties (BETWEEN X AND Y)
        header_section = '\n'.join(text.split('\n')[:20])
        
        patterns = [
            # Pattern: "BETWEEN X AND Y" - extract first party if second is PUP
            (r"BETWEEN\s+\n\s*([A-Z][A-Za-z\s\(\)\&\-\.]{5,100}?)\s*\n\s*(?:and|AND)\s*\n\s*(?:POLYTECHNIC|PUP)", header_section, 1),
            # Pattern: "BETWEEN X AND Y" - extract second party if first is PUP
            (r"BETWEEN\s+(?:POLYTECHNIC|PUP)[A-Za-z\s\.]*\n\s*(?:and|AND)\s*\n\s*([A-Z][A-Za-z\s\(\)\&\-\.]{5,100}?)(?:\n|$)", header_section, 1),
            # Pattern: "University : [NAME]" or "University: [NAME]"
            (r"University\s*:\s*([A-Z][A-Za-z\s\(\)\&\-\.]{5,100}?)(?:\n|$)", header_section, 1),
            # Pattern: "Organization : [NAME]"
            (r"Organization\s*:\s*([A-Z][A-Za-z\s\(\)\&\-\.]{5,100}?)(?:\n|$)", header_section, 1),
            # Pattern: Standard "BETWEEN [ORG] AND PUP"
            (r"BETWEEN\s+(?:the\s+)?([A-Z][A-Za-z\s\(\)]{5,100}?)(?:\s*,|\s*\n).*?(?:university|college|institute|institution|organization|company).*?AND", text, 1),
            # Pattern: Partner/Counterpart label
            (r"(?:Partner|Counterpart|Second\s+Party|Party\s+B)\s*:?\s*([A-Z][A-Za-z\s&\-\.,]{5,100}?)(?:\n|,|;|\(|$)", text, 1),
            # Pattern: hereinafter referred to as
            (r"([A-Z][A-Za-z\s&\-\.]{10,80}?),?\s*hereinafter\s+referred\s+to\s+as\s+[\"']?(?:the\s+)?(?:Partner|Second\s+Party|University|Institute|Company)", text, 1),
            # Pattern: "a [type] established in [country]" (not Philippines)
            (r"([A-Z][A-Za-z\s&\-\.]{5,80}?),?\s+a\s+(?:leading\s+)?(?:public\s+|private\s+)?(?:research\s+)?(?:university|college|institute|institution|organization|company)\s+(?:duly\s+)?(?:established|organized|incorporated)\s+(?:in|under).*?(?!Philippines)([A-Za-z]+)", text, 1),
        ]

        for pattern, search_text, group_idx in patterns:
            try:
                def regex_search():
                    return re.search(pattern, search_text, re.IGNORECASE | re.DOTALL)
                
                try:
                    match = run_with_timeout(regex_search, timeout_duration=5)
                except ExtractionTimeoutError:
                    logger.warning(f"Regex timeout on partner name pattern")
                    continue
                
                if match:
                    name = match.group(group_idx).strip()
                    name = re.sub(r'\s+', ' ', name)
                    name = re.sub(r'[,;\.]\s*$', '', name)
                    name = re.sub(r'^(?:the|a|an)\s+', '', name, flags=re.IGNORECASE)
                    # Remove parenthetical abbreviations at end like "(UI)"
                    name = re.sub(r'\s*\([A-Z]{2,5}\)\s*$', '', name)
                    
                    # Filter out PUP-related names - STRICT CHECK
                    if self._is_pup_related(name):
                        logger.debug(f"Filtered out PUP-related name: {name}")
                        continue
                    
                    # Additional strict PUP check
                    pup_keywords = [
                        "polytechnic", "pup", "sta. mesa", "sta mesa",
                        "mabini", "manila", "philippines"
                    ]
                    name_lower = name.lower()
                    if any(kw in name_lower for kw in pup_keywords):
                        logger.debug(f"Filtered out name with PUP keyword: {name}")
                        continue
                    
                    if 5 <= len(name) <= 100 and any(c.isupper() for c in name):
                        logger.info(f"✅ Extracted partner name: {name}")
                        return name
            except Exception as e:
                logger.debug(f"Partner name extraction error: {e}")
                continue

        logger.debug("No partner name found")
        return ""

    def _extract_partner_address_safe(self, text: str) -> str:
        """Extract partner address."""
        # Patterns for address capture
        patterns = [
            # "with principal office at ADDRESS, CITY" - most common in legal docs
            r"principal\s+office\s+at\s+(.{10,200}?),\s*(?:[A-Z][a-z]+)(?:,|\s+represented|\s+herein)",
            # "with principal office at ADDRESS, CITY, COUNTRY"
            r"principal\s+office\s+at\s+(.{8,100}?),\s+([A-Za-z]+)(?:,|\s+[A-Z]|\s+represented)",
            # Direct match pattern for street address then comma then city
            r"office\s+at\s+(.{8,120}?),\s+([A-Z][a-z]+)(?:[,.]|\s+represented|\s+herein)",
            # Located at pattern
            r"(?:is\s+)?located\s+at\s+(.{10,200}?)(?:\s*,\s*represented|,\s*herein|\s*[a-z]+[,.]|$)",
            # Address label pattern
            r"(?:address|location|headquarters?)\s*:?\s*(.{10,150}?)(?:\n|,|;|$)",
            # Pattern for street number and name
            r"(\d+\s+[A-Z][a-z]+\s+(?:Avenue|Street|Road|Drive|Court|Boulevard|Way|Parkway|Lane))(?:[,.]|\s+[A-Z][a-z]+[,.])",
        ]

        for pattern in patterns:
            try:
                def regex_search():
                    return re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
                
                try:
                    matches = run_with_timeout(regex_search, timeout_duration=3)
                except ExtractionTimeoutError:
                    continue
                
                for match in matches:
                    # Get the first capture group (address)
                    address = match.group(1) if match.lastindex and match.lastindex >= 1 else match.group(0)
                    address = re.sub(r'\s+', ' ', address.strip())
                    
                    # Filter out PUP-related addresses
                    if self._is_pup_related(address):
                        continue
                    
                    # Additional specific filters for Manila/Philippines PUP campus
                    pup_address_indicators = [
                        r"sta\.?\s*mesa",
                        r"santa\s+mesa",
                        r"manila,?\s*philippines",
                        r"mabini\s*campus",
                        r"a\.?\s*mabini\s*campus",
                        r"room\s+\d+.*main\s*campus",
                        r"south\s+wing.*main\s*campus",
                    ]
                    is_pup_address = any(re.search(p, address, re.IGNORECASE) for p in pup_address_indicators)
                    
                    if not is_pup_address and 8 <= len(address) <= 300:
                        logger.info(f"[Address] Extracted: {address}")
                        return address
            except Exception as e:
                logger.debug(f"Error in address pattern: {e}")
                continue

        return ""

    def _extract_partner_country_validated(self, text: str) -> str:
        """Extract country from text."""
        # Pattern matching for countries mentioned after "principal office at ADDRESS,"
        country_patterns = [
            # Pattern: "principal office at ADDRESS, CITY, COUNTRY"
            r"principal\s+office\s+at\s+.{10,100},\s+[A-Za-z]+,\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)(?:,|\s+represented|\s+herein)",
            # Pattern: "location is COUNTRY" or "located in COUNTRY"
            r"(?:located|established)\s+(?:in|on)\s+([A-Z][a-z]+)(?:,|\s+with|\s+represented)",
            # Pattern: comma-separated after address mention
            r"office\s+at\s+.{8,100},\s+([A-Za-z]+)(?:,|\s+represented)",
        ]
        
        # Try patterns first
        for pattern in country_patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    country_text = match.group(1).strip()
                    # Check if it's actually a country
                    for country in self.country_options:
                        if country.lower() == country_text.lower():
                            if country.lower() != "philippines":
                                logger.info(f"[Country] Extracted from pattern: {country}")
                                return country
            except Exception as e:
                logger.debug(f"Error in country pattern: {e}")
                continue
        
        # Fall back to existing method
        for country in self.country_options:
            # Skip Philippines as it's PUP's country
            if country.lower() == "philippines":
                continue
                
            pattern = rf'\b{re.escape(country)}\b'
            matches = re.finditer(pattern, text, re.IGNORECASE)
            
            for match in matches:
                start = max(0, match.start() - 150)
                end = min(len(text), match.end() + 150)
                context = text[start:end].lower()
                
                # Skip if this appears in PUP context
                pup_indicators = [
                    "pup ", "polytechnic university of the philippines", 
                    "sta. mesa", "sta.mesa", "santa mesa",
                    "manila, philippines", "manila,philippines",
                    "republic of the philippines"
                ]
                if any(indicator in context for indicator in pup_indicators):
                    # Check if the country appears BEFORE PUP mention (likely partner)
                    country_pos = context.find(country.lower())
                    pup_pos = min(
                        (context.find(ind) for ind in pup_indicators if ind in context),
                        default=len(context)
                    )
                    if country_pos < pup_pos:
                        logger.info(f"[Country] Extracted: {country}")
                        return country
                    continue
                
                # Valid country found in non-PUP context
                logger.info(f"[Country] Extracted: {country}")
                return country
        
        return ""

    def _extract_validity_period_comprehensive(self, text: str) -> int:
        """Comprehensive validity extraction with number words and various formats"""
        number_words = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20, 'fifty': 50
        }

        patterns = [
            r"(?:period|term)\s+of\s+(?:(\w+)\s*)?\(?\s*(\d+)\s*\)?\s*years?",
            r"valid\s+(?:for|through)(?:\s+a)?(?:\s+period)?(?:\s+of)?\s+(?:(\d+)|(\w+))\s*years?",
            r"(?:term|duration)\s+(?:of|shall\s+be)\s+(?:(\d+)|(\w+))\s*years?",
            r"(?:(\d+)|(\w+))[\s\-]*years?\s+(?:term|validity|period|duration)",
            r"remain\s+(?:valid|in\s+force)\s+for\s+(?:(\w+)\s*)?\(?\s*(\d+)\s*\)?\s*years?",
            r"effective\s+for\s+(?:a\s+)?period\s+of\s+(?:(\w+)\s*)?\(?\s*(\d+)\s*\)?\s*years?",
        ]

        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    for group in match.groups():
                        if group:
                            group = group.strip()
                            if group.isdigit():
                                value = int(group)
                                if 1 <= value <= 100:
                                    return value
                            elif group.lower() in number_words:
                                return number_words[group.lower()]
            except Exception as e:
                logger.debug(f"Validity pattern error: {e}")
                continue
        
        return 0

    def _extract_partnership_type_with_confidence(self, text: str) -> str:
        """Partnership type matching with keyword analysis"""
        text_lower = text.lower()
        
        if re.search(r'\brenewal\b', text_lower):
            return "MOU ON RENEWAL"
        
        type_scores = {}
        
        keyword_mappings = {
            "MOA on Training and Research Collaboration": ["research", "training", "collaboration"],
            "MOA on Research": ["research", "study", "investigation", "scientific"],
            "MOA on Faculty Exchange": ["faculty", "professor", "teacher", "exchange"],
            "MOA on Student Exchange": ["student", "exchange", "mobility", "scholar"],
            "MOA on Academic Exchange": ["academic", "exchange", "educational"],
            "MOA on Cultural Exchange": ["cultural", "culture", "heritage", "arts"],
            "MOA on Internship": ["internship", "intern", "practicum", "on-the-job"],
            "MOA on Conferences": ["conference", "seminar", "symposium", "workshop"],
            "MOA on International Educational Cooperation": ["international", "cooperation", "educational", "global"],
            "Cooperation Agreement": ["cooperation", "collaborate", "partnership"],
            "Joint Education Programs and Training Cooperation": ["joint", "education", "program", "training"],
        }
        
        for partnership_type, keywords in keyword_mappings.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                type_scores[partnership_type] = score
        
        if type_scores:
            best_match = max(type_scores, key=type_scores.get)
            if type_scores[best_match] >= 2:
                return best_match
        
        if "exchange" in text_lower:
            return "MOA on Academic Exchange"
        if "cooperation" in text_lower or "collaboration" in text_lower:
            return "Cooperation Agreement"
        
        return "Agreement"

    def _extract_event_info_structured(self, text: str) -> str:
        """Event info extraction using multiple strategies"""
        section_patterns = [
            (r"(?:PURPOSE|OBJECTIVE)S?\s*[:\-]?\s*\n?([\s\S]{50,800}?)(?=\n\s*(?:ARTICLE|SECTION|\d+\.|WHEREAS|NOW|SCOPE|TERM|$))", "Purpose"),
            (r"SCOPE\s*(?:OF\s+(?:WORK|COOPERATION|COLLABORATION|AGREEMENT))?\s*[:\-]?\s*\n?([\s\S]{50,800}?)(?=\n\s*(?:ARTICLE|SECTION|\d+\.|WHEREAS|NOW|PURPOSE|TERM|$))", "Scope"),
            (r"(?:PROPOSED\s+)?PARTNERSHIP\s*[:\-]?\s*\n?([\s\S]{50,800}?)(?=\n\s*(?:\d+\.\s*Term|\d+\.\s*Exclusiveness|\d+\.\s*Intellectual|ARTICLE|$))", "Partnership"),
            (r"(?:AREAS?\s+OF\s+)?COOPERATION\s*[:\-]?\s*\n?([\s\S]{50,800}?)(?=\n\s*(?:ARTICLE|SECTION|\d+\.|TERM|$))", "Cooperation"),
            (r"WHEREAS[,:]?\s+(?:the\s+parties\s+)?(?:wish|desire|intend|agree)\s+to\s+([\s\S]{30,400}?)(?=\n\s*(?:WHEREAS|NOW|ARTICLE|$))", "Intent"),
        ]

        extracted_sections = []
        
        for pattern, section_name in section_patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    content = match.group(1).strip()
                    content = re.sub(r'\s+', ' ', content)
                    content = re.sub(r'^\d+\.\d*\s*', '', content)
                    
                    if 30 <= len(content) <= 600:
                        extracted_sections.append(content)
            except Exception as e:
                logger.debug(f"Event info pattern error ({section_name}): {e}")
                continue

        if extracted_sections:
            best_section = max(extracted_sections, key=len)
            return best_section[:500]

        subsection_pattern = r"(?:1\.1|1\.2|a\)|b\)|i\)|ii\.)\s*([A-Z][^.!?\n]{20,200})"
        subsections = re.findall(subsection_pattern, text)
        if subsections:
            activities = [s.strip() for s in subsections[:4]]
            if activities:
                return "Activities include: " + "; ".join(activities)[:500]

        activity_keywords = [
            ("academic exchange", "Academic Exchange"),
            ("student exchange", "Student Exchange Program"),
            ("faculty exchange", "Faculty Exchange Program"),
            ("research collaboration", "Research Collaboration"),
            ("joint research", "Joint Research Projects"),
            ("professional development", "Professional Development"),
            ("cultural exchange", "Cultural Exchange"),
            ("training program", "Training Programs"),
            ("knowledge sharing", "Knowledge Sharing"),
            ("educational cooperation", "Educational Cooperation"),
            ("internship", "Internship Program"),
        ]
        
        found_activities = []
        text_lower = text.lower()
        for keyword, activity_name in activity_keywords:
            if keyword in text_lower:
                found_activities.append(activity_name)
        
        if found_activities:
            return f"Partnership activities include: {', '.join(found_activities[:6])}"

        return ""

    def _extract_contact_persons_validated(self, text: str) -> List[Dict[str, str]]:
        """Extract contact persons (partner contacts) with email validation"""
        contacts = []
        seen_emails = set()

        email_pattern = r"([a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})"
        
        try:
            emails = re.findall(email_pattern, text[:15000])
        except Exception:
            emails = []

        for email in emails:
            email_lower = email.lower()
            
            if email_lower in seen_emails or not self._validate_email_rfc(email):
                continue
            
            if self._is_pup_email(email):
                continue
                
            seen_emails.add(email_lower)
            
            try:
                email_pos = text.find(email)
                if email_pos == -1:
                    continue
                
                start_context = max(0, email_pos - 350)
                end_context = min(len(text), email_pos + 100)
                context = text[start_context:end_context]
                
                contact_name = ""
                contact_position = ""
                
                name_patterns = [
                    r"(?:Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?|Engr\.?|Atty\.?)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)",
                    r"([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[\n,<]",
                    r"Attention:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
                ]
                
                for name_pattern in name_patterns:
                    name_match = re.search(name_pattern, context)
                    if name_match:
                        contact_name = re.sub(r'\s+', ' ', name_match.group(1).strip())
                        if len(contact_name) > 5 and not self._is_pup_related(contact_name):
                            break
                
                position_keywords = ["Director", "Coordinator", "Officer", "Manager", "Dean", 
                                    "Professor", "Head", "Chair", "President", "Secretary"]
                for keyword in position_keywords:
                    if keyword.lower() in context.lower():
                        position_match = re.search(rf"({keyword}[A-Za-z\s,.\-]{{0,60}})", context, re.IGNORECASE)
                        if position_match:
                            contact_position = re.sub(r'\s+', ' ', position_match.group(1).strip())[:100]
                            break

                contacts.append({
                    "contact_person_name": contact_name[:100] if contact_name else "",
                    "contact_person_position": contact_position,
                    "contact_person_email": email
                })
                    
            except Exception as e:
                logger.debug(f"Contact extraction error: {e}")
                continue

        return contacts[:5]

    def _validate_email_rfc(self, email: str) -> bool:
        """RFC-compliant email validation"""
        if not email or len(email) < 5 or len(email) > 254:
            return False
        
        if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$', email):
            return False
        
        try:
            local, domain = email.split('@')
            if domain.lower() in ['example.com', 'test.com', 'localhost', 'invalid.com', 'domain.com']:
                return False
            if '..' in domain or domain.startswith('.') or domain.endswith('.'):
                return False
            if len(local) > 64:
                return False
        except (IndexError, AttributeError, ValueError):
            return False
        
        return True

    def _is_pup_email(self, email: str) -> bool:
        """Check if email belongs to PUP"""
        return bool(re.search(r"@pup\.edu\.ph", email, re.IGNORECASE))

    def _extract_point_persons_validated(self, text: str) -> List[Dict[str, str]]:
        """Extract PUP point persons (emails with @pup.edu.ph)"""
        point_persons = []
        seen_emails = set()
        
        emails = re.findall(r"([a-zA-Z0-9._%+-]+@pup\.edu\.ph)", text, re.IGNORECASE)
        
        for email in set(emails):
            if email.lower() in seen_emails:
                continue
            seen_emails.add(email.lower())
            
            try:
                email_pos = text.find(email)
                if email_pos == -1:
                    continue
                
                start_context = max(0, email_pos - 350)
                end_context = min(len(text), email_pos + 100)
                context = text[start_context:end_context]
                
                person_name = ""
                person_position = ""
                
                name_patterns = [
                    r"(?:Dr\.?|Prof\.?|Engr\.?|Atty\.?)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)",
                    r"([A-Z][a-z]+\s+[A-Z][a-z]+)\s*[\n,]",
                ]
                
                for name_pattern in name_patterns:
                    name_match = re.search(name_pattern, context)
                    if name_match:
                        person_name = re.sub(r'\s+', ' ', name_match.group(1).strip())
                        break
                
                position_keywords = ["Director", "Coordinator", "Professor", "Dean", "Officer", "Head"]
                for keyword in position_keywords:
                    if keyword.lower() in context.lower():
                        position_match = re.search(rf"({keyword}[A-Za-z\s,.\-]{{0,50}})", context, re.IGNORECASE)
                        if position_match:
                            person_position = re.sub(r'\s+', ' ', position_match.group(1).strip())[:100]
                            break
                
                point_persons.append({
                    "point_person_name": person_name[:100] if person_name else "",
                    "point_person_position": person_position,
                    "point_person_email": email
                })
                
            except Exception as e:
                logger.debug(f"Point person extraction error: {e}")
                continue

        return point_persons[:5]

    def _extract_source_unit_validated(self, text: str) -> str:
        """Source unit extraction - finds college, department, or office name"""
        patterns = [
            # "Office of International Affairs"
            r"(?:Attention\s*:\s*)?(?:Office\s+of\s+)?([A-Za-z\s&\-\.]+?(?:Affairs|International|Sciences|Engineering|Department|Unit))(?:\s*\n|$)",
            # "prepared by / from / submitted by [unit]"
            r"(?:prepared\s+by|from|submitted\s+by|initiated\s+by)\s+(?:the\s+)?(?:Office\s+of\s+)?([A-Za-z\s&\-\.]+?(?:College|Department|Office|Campus|Unit|Division|Institute))(?:\s*[,\.\n]|$)",
            # "College of X" or "Department of X"
            r"(?:College|Department|Office|Faculty)\s+of\s+([A-Za-z\s&\-\.]+?)(?:\s*[,\.\n]|$)",
            # "PUP X Campus" or "PUP X Branch"
            r"PUP\s+([A-Za-z\s\-\.]+?(?:Campus|Branch|Center|Office))(?:\s*[,\.\n]|$)",
            # Standalone mentions in signature area
            r"(?:COLLEGE|DEPARTMENT|OFFICE|UNIT)\s+(?:OF\s+)?([A-Za-z\s&\-\.]+?)(?:\n|$)",
        ]
        
        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    unit = re.sub(r'\s+', ' ', match.group(1).strip())
                    
                    # Filter out invalid/generic terms
                    invalid_terms = [
                        "agreement", "memorandum", "document", "partnership", 
                        "cooperation", "understanding", "entering", "similar",
                        "parties", "both", "entire", "shall", "this", "that",
                        "any", "all", "other", "such", "nothing", "no", "or", "and"
                    ]
                    
                    unit_lower = unit.lower()
                    if any(term in unit_lower for term in invalid_terms):
                        continue
                    
                    # Check minimum length and format
                    if 3 < len(unit) < 150:
                        logger.info(f"✅ Extracted source unit: {unit}")
                        return unit
            except Exception as e:
                logger.debug(f"Source unit extraction error: {e}")
                continue
        
        logger.debug("No source unit found")
        return ""

    def _is_pup_related(self, text: str) -> bool:
        """Check if text is related to PUP (our university)"""
        if not text:
            return False
        text_lower = text.lower().strip()
        
        pup_direct_keywords = [
            "polytechnic university of the philippines",
            "polytechnic university",
            "pup main",
            "pup manila",
            "pup sta",
            "pup santa",
            "sta. mesa",
            "sta mesa",
            "santa mesa",
            "mabini campus",
        ]
        for keyword in pup_direct_keywords:
            if keyword in text_lower:
                return True
        
        if text_lower == "pup" or text_lower.startswith("pup "):
            return True
        
        for pattern in self.pup_filters:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True
        
        return False

    def _extract_signatories_safe(self, text: str) -> List[str]:
        """Extract signatories as list of person names."""
        signatories = []
        seen_names = set()
        
        try:
            # Look for signature section first (usually at the end)
            signature_section = ""
            sig_markers = [
                r"IN\s+WITNESS\s+WHEREOF",
                r"SIGNED\s+BY",
                r"SIGNATURES?:\s*",
                r"EXECUTED\s+BY",
                r"FOR\s+AND\s+ON\s+BEHALF",
                r"CONFORME:",
                r"WITNESS\s+MY\s+HAND",
                r"SIGNED\s+IN\s+THE\s+PRESENCE",
            ]
            
            # Find the LAST occurrence of signature markers (more reliable)
            last_marker_pos = -1
            for marker in sig_markers:
                for match in re.finditer(marker, text, re.IGNORECASE):
                    if match.start() > last_marker_pos:
                        last_marker_pos = match.start()
            
            if last_marker_pos > 0:
                signature_section = text[last_marker_pos:]
            else:
                # Use last 25% of document
                signature_section = text[int(len(text) * 0.75):]

            # Pattern 1: "DR. NAME" or "PROF. NAME" format - common in formal documents
            titled_names = re.findall(
                r"(?:DR\.?|PROF\.?|MR\.?|MS\.?|MRS\.?|HON\.?|ENGR\.?|ATTY\.?)\s+([A-Z][A-Za-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][A-Za-z]+){1,3})",
                signature_section,
                re.IGNORECASE
            )
            for name in titled_names:
                name = re.sub(r'\s+', ' ', name.strip())
                # Title case the name
                name = name.title()
                if name and len(name) > 4:  # Basic length check
                    if self._is_valid_signatory(name, seen_names):
                        seen_names.add(name.upper())
                        signatories.append(name)
                        logger.debug(f"[Signatory] Found titled name: {name}")

            # Pattern 2: Names after position titles like "Rector", "President"
            position_then_name = re.findall(
                r"(?:Rector|President|Director|Dean|Chancellor|Chairman|Chairperson|Vice\s*President|Secretary|Head)\s*[:\n]+\s*(?:DR\.?|PROF\.?|MR\.?|MS\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+){1,3})",
                signature_section,
                re.IGNORECASE
            )
            for name in position_then_name:
                name = re.sub(r'\s+', ' ', name.strip()).title()
                if self._is_valid_signatory(name, seen_names):
                    seen_names.add(name.upper())
                    signatories.append(name)

            # Pattern 3: Names under underscore signature lines
            underscore_names = re.findall(
                r"_{3,}\s*\n\s*(?:DR\.?|PROF\.?|MR\.?|MS\.?)?\s*([A-Z][A-Za-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][A-Za-z]+){1,3})",
                signature_section,
                re.IGNORECASE
            )
            for name in underscore_names:
                name = re.sub(r'\s+', ' ', name.strip()).title()
                if self._is_valid_signatory(name, seen_names):
                    seen_names.add(name.upper())
                    signatories.append(name)

            # Pattern 4: Names with positions after (e.g., "John Smith, President")
            name_then_position = re.findall(
                r"([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+){1,3})\s*\n\s*(?:Rector|President|Director|Dean|Chancellor|Chairman)",
                signature_section,
                re.IGNORECASE
            )
            for name in name_then_position:
                name = re.sub(r'\s+', ' ', name.strip()).title()
                if self._is_valid_signatory(name, seen_names):
                    seen_names.add(name.upper())
                    signatories.append(name)

            # Pattern 5: ALL CAPS names (2-4 words) that appear on their own line
            all_caps_names = re.findall(
                r"\n\s*([A-Z][A-Z\.\s]{4,40}[A-Z])\s*\n",
                signature_section
            )
            for name in all_caps_names:
                name = re.sub(r'\s+', ' ', name.strip())
                name_title = name.title()
                if self._is_valid_signatory(name, seen_names):
                    seen_names.add(name.upper())
                    signatories.append(name_title)

            # Additional pattern: Names immediately after institutional roles
            role_pattern = r"(?:Vice President|President|Dean|Rector|Chancellor|Director|Chair|Secretary)\s+(?:for|of)?\s*(?:[A-Za-z\s]+)?\n\s*(?:DR\.?|PROF\.?|MR\.?|MS\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})"
            role_names = re.findall(role_pattern, signature_section, re.IGNORECASE | re.MULTILINE)
            for name in role_names:
                name = re.sub(r'\s+', ' ', name.strip()).title()
                if name and len(name) > 4:
                    if self._is_valid_signatory(name, seen_names):
                        seen_names.add(name.upper())
                        signatories.append(name)
                        logger.debug(f"[Signatory] Found from role pattern: {name}")

            logger.info(f"[Signatories] Extracted {len(signatories)} signatories: {signatories}")
            
        except Exception as e:
            logger.debug(f"Error extracting signatories: {e}")

        return signatories[:15]  # Return up to 15 signatories

    def _is_valid_signatory(self, name: str, seen_names: set) -> bool:
        """Validate if a name is a valid signatory (person name, not organization)"""
        if not name:
            return False
        
        name_upper = name.upper()
        name_lower = name.lower()
        
        # Already seen
        if name_upper in seen_names:
            return False
        
        # Too short or too long
        if len(name) < 5 or len(name) > 45:
            return False
        
        # Check against blacklist
        for blacklisted in self.signatory_blacklist:
            if blacklisted in name_upper:
                return False
        
        # Filter out PUP-related
        if self._is_pup_related(name):
            return False
        
        # Must have at least 2 words (first and last name), max 5
        words = [w for w in name.split() if len(w) > 1]  # Filter out single letters except initials
        if len(words) < 2 or len(words) > 5:
            return False
        
        # Filter out organization names (universities, companies, etc.)
        org_indicators = [
            "university", "universitas", "college", "institute", "institution",
            "corporation", "company", "inc", "ltd", "llc", "foundation",
            "association", "organization", "ministry", "department", "office",
            "division", "unit", "section", "bureau", "agency", "center",
            "centre", "school", "academy", "polytechnic", "teknologi",
            "indonesia", "philippines", "thailand", "vietnam", "malaysia",
            "singapore", "japan", "korea", "china", "taiwan", "international",
            "national", "state", "republic", "government", "affairs",
            "witness", "whereof", "party", "parties", "agreement", "memorandum"
        ]
        if any(indicator in name_lower for indicator in org_indicators):
            return False
        
        # Filter out common non-name patterns
        non_name_patterns = [
            r"^\d",      # Starts with number
            r"\d$",      # Ends with number
            r"@",        # Contains email
            r"www\.",    # Website
            r"http",     # URL
            r"^[A-Z]{2,}$",  # All caps single word (likely abbreviation)
        ]
        for pattern in non_name_patterns:
            if re.search(pattern, name):
                return False
        
        # Each word should be reasonably short (names, not sentences)
        if any(len(word) > 12 for word in words):
            return False
        
        # At least one word should look like a typical first/last name (3-10 chars, letters only)
        has_name_like_word = any(
            3 <= len(word) <= 10 and word.isalpha() 
            for word in words
        )
        if not has_name_like_word:
            return False
        
        return True
    

# Compatibility alias
NlpExtractionService = NLPLegalExtractionService