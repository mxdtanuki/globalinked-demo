import os
import re
import logging
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


class NLPLegalExtractionService:
    """
    Enhanced Legal Document Extraction Service using spaCy NER + Legal-BERT QA.
    
    Process Flow:
    1. Document preprocessing
    2. spaCy NER for entity extraction (organizations, dates, persons, locations)
    3. Legal-BERT QA for specific legal document fields
    4. Intelligent field mapping and validation
    5. Result structuring for form fields
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
            "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "HongKong", "Macao", "Japan"
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

        # Configuration
        if qa_confidence_threshold is not None:
            self.qa_confidence_threshold = float(qa_confidence_threshold)
        else:
            self.qa_confidence_threshold = float(os.getenv("QA_CONFIDENCE_THRESHOLD", "0.05"))

        self.qa_chunk_chars: int = int(os.getenv("QA_CHUNK_CHARS", "2000"))
        self.qa_chunk_overlap: int = int(os.getenv("QA_CHUNK_OVERLAP", "300"))
        self.qa_max_answer_len: int = int(os.getenv("QA_MAX_ANS_LEN", "128"))

        self._qa_loading = False

        # Enhanced questions dictionary with comprehensive coverage
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
        """Load spaCy model for NER"""
        try:
            self.nlp = spacy.load("en_core_web_sm")
            self.matcher = Matcher(self.nlp.vocab)
            self._add_legal_patterns()
            logger.info("✓ spaCy model loaded successfully")
        except OSError:
            logger.warning("spaCy en_core_web_sm model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
            self.matcher = None

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
            [{"LOWER": {"IN": ["university", "college", "institute", "school"]}},
             {"IS_TITLE": True, "OP": "*"}],
            [{"IS_TITLE": True, "OP": "+"}, 
             {"LOWER": {"IN": ["university", "college", "institute", "school"]}}]
        ]
        self.matcher.add("INSTITUTION", university_patterns)

        date_patterns = [
            [{"IS_DIGIT": True}, {"LOWER": {"IN": ["january", "february", "march", "april", "may", "june",
                                                   "july", "august", "september", "october", "november", "december"]}},
             {"IS_DIGIT": True}],
            [{"IS_DIGIT": True}, {"TEXT": "/"}, {"IS_DIGIT": True}, {"TEXT": "/"}, {"IS_DIGIT": True}]
        ]
        self.matcher.add("CUSTOM_DATE", date_patterns)

    def extract_agreement_metadata(self, file_path: str) -> Dict[str, Any]:
        """Enhanced extraction pipeline with spaCy NER + Legal-BERT QA"""
        try:
            _, ext = os.path.splitext(file_path)
            ext = ext.lstrip('.').lower()
            
            text_data = self.doc_processor.extract_text_from_file(file_path, ext)
            if not text_data.get("success", False):
                return {"error": text_data.get("error", "Text extraction failed")}

            text = text_data["text"]
            if not text.strip():
                return {"error": "The document does not contain readable text."}

            logger.info(f"🔍 Starting enhanced extraction from text length: {len(text)}")

            ner_entities = self._extract_with_spacy(text)
            logger.info(f"🏷️ spaCy NER found {len(ner_entities)} entity types")  # ✅ FIXED: Added emoji

            qa_results = self._extract_with_enhanced_qa(text, ner_entities)
            logger.info(f"🤖 Legal-BERT QA completed")  # ✅ FIXED: Added emoji

            metadata = self._combine_and_validate_results(text, ner_entities, qa_results)

            result = self._map_to_form_fields(metadata, text)
            
            logger.info("✅ Enhanced NLP extraction completed successfully")
            return result

        except Exception as e:
            logger.exception("Enhanced extraction failed")
            return {"error": f"Extraction failed: {str(e)}"}

    def _extract_with_spacy(self, text: str) -> Dict[str, List[Any]]:
        """Extract entities using spaCy NER"""
        entities = {
            "PERSON": [], "ORG": [], "GPE": [], "DATE": [], "MONEY": [],
            "DOCUMENT_TYPE": [], "INSTITUTION": [], "CUSTOM_DATE": []
        }

        if not self.nlp:
            logger.warning("spaCy not available, skipping NER")
            return entities

        try:
            doc = self.nlp(text)

            for ent in doc.ents:
                if ent.label_ in entities:
                    entities[ent.label_].append({
                        "text": ent.text.strip(),
                        "start": ent.start_char,
                        "end": ent.end_char,
                        "confidence": 1.0
                    })

            if self.matcher:
                matches = self.matcher(doc)
                for match_id, start, end in matches:
                    label = self.nlp.vocab.strings[match_id]
                    span = doc[start:end]
                    if label in entities:
                        entities[label].append({
                            "text": span.text.strip(),
                            "start": span.start_char,
                            "end": span.end_char,
                            "confidence": 1.0
                        })

            entities = self._filter_spacy_entities(entities, text)

        except Exception as e:
            logger.error(f"spaCy processing failed: {e}")

        return entities

    def _normalize_entity_text(self, text: str) -> str:
        """Normalize entity text (whitespace, punctuation, articles)"""
        try:
            # Normalize whitespace
            text = re.sub(r'\s+', ' ', text)
            # Remove trailing punctuation
            text = re.sub(r'[,;\.]\s*$', '', text)
            # Remove leading articles
            text = re.sub(r'^(?:the|a|an)\s+', '', text, flags=re.IGNORECASE)
            return text.strip()
        except Exception as e:
            logger.debug(f"Error normalizing entity text: {e}")
            return text.strip()


    def _filter_spacy_entities(self, entities: Dict[str, List[Any]], text: str) -> Dict[str, List[Any]]:
        """Filter and clean spaCy entities for relevance - IMPROVED"""
        
        # Remove duplicates first
        entities = self._remove_duplicate_entities(entities)
        
        filtered_orgs = []
        for org in entities.get("ORG", []):
            org_text = org["text"].lower()
            # Filter out only PUP-related organizations
            pup_keywords = ["pup", "polytechnic university of the philippines", 
                        "polytechnic university", "manila", "sta. mesa"]
            
            if not any(keyword in org_text for keyword in pup_keywords):
                if len(org["text"]) > 3:  
                    filtered_orgs.append(org)
        
        entities["ORG"] = filtered_orgs[:5]

        filtered_gpe = []
        for gpe in entities.get("GPE", []):
            gpe_text = gpe["text"]
            # Accept any proper location (city, region, country)
            if len(gpe_text) > 2 and gpe_text[0].isupper():
                filtered_gpe.append(gpe)
        
        entities["GPE"] = filtered_gpe[:5]

        filtered_dates = []
        for date_ent in entities.get("DATE", []):
            date_text = date_ent["text"]
            if not any(rel_term in date_text.lower() for rel_term in 
                    ["today", "next", "last", "current", "this"]):
                if len(date_text) > 4:
                    filtered_dates.append(date_ent)
        entities["DATE"] = filtered_dates[:5]

        filtered_persons = []
        for person in entities.get("PERSON", []):
            person_text = person["text"].lower()
            if not any(legal_term in person_text for legal_term in 
                    ["whereas", "therefore", "herein", "agreement", "party"]):
                if len(person["text"]) > 3:
                    filtered_persons.append(person)
        entities["PERSON"] = filtered_persons[:10]

        return entities

    def _extract_with_enhanced_qa(self, text: str, ner_entities: Dict[str, List[Any]]) -> Dict[str, Any]:
        """Enhanced QA extraction using Legal-BERT with NER context"""
        if not self._ensure_qa():
            logger.warning("Legal-BERT not available, using regex fallback")
            return {}

        qa_results = {}
        enhanced_chunks = self._create_enhanced_chunks(text, ner_entities)
        
        for field, questions in self.questions.items():
            best_answer = ""
            best_score = 0.0
            
            for question in questions:
                for chunk_data in enhanced_chunks:
                    chunk_text = chunk_data["text"]
                    context_info = chunk_data["context"]
                    
                    enhanced_question = self._enhance_question_with_context(question, field, context_info)
                    
                    try:
                        result = self.qa_pipeline(
                            question=enhanced_question,
                            context=chunk_text,
                            handle_impossible_answer=True,
                            max_answer_len=self.qa_max_answer_len
                        )
                        
                        score = float(result.get("score", 0.0))
                        answer = result.get("answer", "").strip()
                        
                        if score >= self.qa_confidence_threshold and self._validate_qa_answer(answer, field, ner_entities):
                            if score > best_score:
                                best_answer = answer
                                best_score = score
                                
                    except Exception as e:
                        logger.debug(f"QA failed for {field}: {e}")
                        continue
            
            if best_answer:
                qa_results[field] = best_answer
                logger.info(f"✅ Enhanced QA extracted {field}: {best_answer[:50]}... (score: {best_score:.3f})")

        return qa_results

    def _create_enhanced_chunks(self, text: str, ner_entities: Dict[str, List[Any]]) -> List[Dict[str, Any]]:
        """Create chunks with NER entity context"""
        if self.qa_chunk_chars <= 0:
            return [{"text": text, "context": self._summarize_entities(ner_entities)}]

        chunks = []
        text_length = len(text)
        
        for i in range(0, text_length, self.qa_chunk_chars - self.qa_chunk_overlap):
            chunk_start = i
            chunk_end = min(i + self.qa_chunk_chars, text_length)
            chunk_text = text[chunk_start:chunk_end]
            
            chunk_entities = self._get_chunk_entities(ner_entities, chunk_start, chunk_end)
            chunk_context = self._summarize_entities(chunk_entities)
            
            chunks.append({
                "text": chunk_text,
                "context": chunk_context,
                "entities": chunk_entities
            })

        return chunks

    def _get_chunk_entities(self, ner_entities: Dict[str, List[Any]], start: int, end: int) -> Dict[str, List[Any]]:
        """Get NER entities that fall within a text chunk"""
        chunk_entities = {}
        
        for entity_type, entities in ner_entities.items():
            chunk_entities[entity_type] = []
            for entity in entities:
                if (entity["start"] < end and entity["end"] > start):
                    chunk_entities[entity_type].append(entity)
                    
        return chunk_entities

    def _summarize_entities(self, entities: Dict[str, List[Any]]) -> str:
        """Summarize entities into context string"""
        context_parts = []
        
        if entities.get("ORG"):
            orgs = [e["text"] for e in entities["ORG"][:2]]
            context_parts.append(f"Organizations: {', '.join(orgs)}")
            
        if entities.get("GPE"):
            places = [e["text"] for e in entities["GPE"][:2]]
            context_parts.append(f"Locations: {', '.join(places)}")
            
        if entities.get("DATE"):
            dates = [e["text"] for e in entities["DATE"][:2]]
            context_parts.append(f"Dates: {', '.join(dates)}")

        return ". ".join(context_parts) if context_parts else ""

    def _enhance_question_with_context(self, question: str, field: str, context: str) -> str:
        """Add NER context to improve QA accuracy"""
        if not context:
            return question
            
        field_specific_enhancements = {
            "partner_name": f"Given organizations mentioned: {context}. {question}",
            "partner_country": f"Given locations mentioned: {context}. {question}",
            "date_signed": f"Given dates mentioned: {context}. {question}",
            "date_expiry": f"Given dates mentioned: {context}. {question}",
            "date_received": f"Given dates mentioned: {context}. {question}",
            "date_endorsed_to_ulco": f"Given dates mentioned: {context}. {question}",
            "date_ulco_approved": f"Given dates mentioned: {context}. {question}",
            "date_pup_signed": f"Given dates mentioned: {context}. {question}"
        }
        
        return field_specific_enhancements.get(field, question)
    
    def _validate_date(self, date_string: str) -> bool:
        if not date_string:
            return False
        
        try:
            parsed = parser.parse(date_string, fuzzy=True)
            current_year = datetime.now().year
            
            # Check if year is reasonable
            if 1950 <= parsed.year <= current_year + 20:
                logger.debug(f"✓ Valid date: {date_string} -> {parsed.strftime('%Y-%m-%d')}")
                return True
            else:
                logger.debug(f"⚠️ Date year out of range: {parsed.year}")
                return False
                
        except ValueError as ve:
            logger.debug(f"Value error parsing date: {ve}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error validating date: {e}")
            return False

    def _validate_qa_answer(self, answer: str, field: str, ner_entities: Dict[str, List[Any]]) -> bool:
        """Enhanced validation with better business logic and date checking"""
        
        if not answer or len(answer.strip()) < 2:
            return False
        
        answer_lower = answer.lower()
        
        if field == "document_type":
            valid_types = ["mou", "moa", "memorandum", "agreement", "understanding", "contract"]
            return any(doc_type in answer_lower for doc_type in valid_types)
        
        elif field == "partner_name":
            # More lenient - only filter out obvious PUP references
            pup_keywords = [
                "^pup$",
                "polytechnic university of the philippines",
                "polytechnic university"
            ]
            if any(re.search(kw, answer_lower) for kw in pup_keywords):
                return False
            return len(answer) > 5 and any(c.isupper() for c in answer)
        
        elif field == "partner_country":
            return any(country.lower() in answer_lower for country in self.country_options)
        
        elif field in ["date_signed", "date_expiry", "date_received", 
                    "date_endorsed_to_ulco", "date_ulco_approved", "date_pup_signed"]:
            # Must contain valid date format AND be a valid date
            if not re.search(r'\d{4}|\d{1,2}[/-]\d{1,2}', answer):
                return False
            return self._validate_date(answer)
        
        elif field == "validity_period":
            # Extract number and validate range
            match = re.search(r'(\d+)', answer)
            if match:
                years = int(match.group(1))
                return 1 <= years <= 100 
            return False
        
        elif field == "source_unit":
            exclude_terms = ["agreement", "memorandum", "document", "contract"]
            if any(term in answer_lower for term in exclude_terms):
                return False
            return 3 < len(answer) < 150
        
        return True

    def _combine_and_validate_results(self, text: str, ner_entities: Dict[str, List[Any]], qa_results: Dict[str, Any]) -> Dict[str, Any]:
        """Combine spaCy NER and QA results with validation"""
        combined = {}
        
        doc_type = qa_results.get("document_type")
        if not doc_type:
            doc_type = self._extract_document_type_enhanced(text, ner_entities)
        combined["document_type"] = doc_type
        
        partner_name = qa_results.get("partner_name")
        if not partner_name and ner_entities.get("ORG"):
            for org in ner_entities["ORG"]:
                if not any(pup_term in org["text"].lower() for pup_term in ["pup", "polytechnic"]):
                    partner_name = org["text"]
                    break
        if not partner_name:
            partner_name = self._extract_partner_name_enhanced(text)
        combined["partner_name"] = partner_name
        
        country = qa_results.get("partner_country")
        if not country and ner_entities.get("GPE"):
            for gpe in ner_entities["GPE"]:
                if gpe["text"] in self.country_options:
                    country = gpe["text"]
                    break
        if not country:
            country = self._extract_country_enhanced(text)
        combined["partner_country"] = country
        combined["partner_region"] = self.region_mapping.get(country, "")
        
        address = self._extract_address_enhanced(text, ner_entities)
        combined["partner_address"] = address
    
        website = self._extract_partner_website_enhanced(text)
        combined["partner_website"] = website
        
        description = self._extract_partner_description_enhanced(text, partner_name)
        combined["partner_description"] = description
        
        date_signed = qa_results.get("date_signed")
        if not date_signed and ner_entities.get("DATE"):
            date_signed = self._parse_best_date(ner_entities["DATE"], "signed")
        if not date_signed:
            date_signed = self._extract_date_signed_enhanced(text)
        combined["date_signed"] = date_signed
        
        validity = self._extract_validity_enhanced(text, qa_results.get("validity_period"))
        combined["validity_period"] = validity
        
        expiry_date = qa_results.get("date_expiry")
        if not expiry_date and date_signed and validity:
            expiry_date = self._compute_expiry_date(date_signed, validity)
        combined["date_expiry"] = expiry_date
        
        partnership_type = self._match_partnership_type_enhanced(
            text, qa_results.get("partnership_type")
        )
        combined["partnership_type"] = partnership_type
        
        event_info = qa_results.get("event_info") or self._extract_event_info_enhanced(text)
        combined["event_info"] = event_info
        
        if combined.get("partner_name"):
            combined["partner_entity_type"] = self._infer_entity_type(combined["partner_name"])
        
        combined["signatories_list"] = self._extract_signatories_enhanced(text, ner_entities)
        combined["contact_persons"] = self._extract_contacts_enhanced(text, ner_entities)
        combined["point_persons"] = self._extract_point_persons_enhanced(text, ner_entities)
        
        # Extract administrative dates
        combined["date_received"] = qa_results.get("date_received") or ""
        combined["date_endorsed_to_ulco"] = qa_results.get("date_endorsed_to_ulco") or ""
        combined["date_ulco_approved"] = qa_results.get("date_ulco_approved") or ""
        combined["date_pup_signed"] = qa_results.get("date_pup_signed") or ""
        combined["hardcopy_location"] = qa_results.get("hardcopy_location") or ""
        combined["source_unit"] = qa_results.get("source_unit") or self._extract_source_unit(text)
        
        return combined


    def _detect_agreement_type_advanced(self, text: str) -> str:
        """Advanced detection of agreement type"""
        agreement_patterns = {
            "MOA": [
                r"\bMemorandum of Agreement\b",
                r"\bMOA\b(?!\s+on)",  # MOA not followed by "on"
                r"Memorandum.*Agreement"
            ],
            "MOU": [
                r"\bMemorandum of Understanding\b",
                r"\bMOU\b",
                r"Memorandum.*Understanding"
            ],
            "Contract": [
                r"\bContract\b",
                r"\bService Agreement\b"
            ]
        }
        
        for doc_type, patterns in agreement_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    logger.debug(f"✓ Detected agreement type: {doc_type}")
                    return doc_type
        
        logger.debug("No advanced agreement type detected")
        return ""
    def _extract_document_type_enhanced(self, text: str, ner_entities: Dict[str, List[Any]]) -> str:
        """Enhanced document type detection"""
        if ner_entities.get("DOCUMENT_TYPE"):
            for dt in ner_entities["DOCUMENT_TYPE"]:
                if "understanding" in dt["text"].lower():
                    return "MOU"
                elif "agreement" in dt["text"].lower():
                    return "MOA"
        
        header_lines = '\n'.join(text.split('\n')[:10])
        if re.search(r'\bmemorandum of understanding\b', header_lines, re.IGNORECASE):
            return "MOU"
        elif re.search(r'\bmemorandum of agreement\b', header_lines, re.IGNORECASE):
            return "MOA"
            
        return ""

    def _extract_partner_name_enhanced(self, text: str) -> str:
        """Enhanced partner name extraction - works with any type of organization"""
        # Improved patterns for extracting partner names with better boundary checking
        patterns = [
            # Pattern 1: "between PUP and [PARTNER]"
            r"between\s+(?:the\s+)?(?:Polytechnic\s+University\s+of\s+the\s+Philippines|PUP)\b.*?\s+and\s+(?:the\s+)?([^,;\.]+?)(?:\s*,|\s*\(|\s*herein)",
            # Pattern 2: "[PARTNER] and PUP"
            r"between\s+(?:the\s+)?([^,;\.]+?)\s+and\s+(?:the\s+)?(?:Polytechnic\s+University\s+of\s+the\s+Philippines|PUP)\b",
            # Pattern 3: "This MOU/MOA between [PARTNER] and PUP"
            r"(?:This|the)\s+(?:MOU|MOA|Agreement)\s+(?:is\s+)?(?:entered\s+into\s+)?between\s+(?:the\s+)?(.+?)\s+and\s+(?:the\s+)?(?:Polytechnic\s+University|PUP)\b",
            # Pattern 4: "PARTIES: PUP and [PARTNER]"
            r"PARTIES?\s*:?\s*(?:the\s+)?(?:Polytechnic\s+University\s+of\s+the\s+Philippines|PUP)\b\s+and\s+(?:the\s+)?([^,\n]+)",
            # Pattern 5: "Partner Organization: [NAME]"
            r"(?:Partner|Partner\s+Organization|Counterpart)\s*:?\s*\n?\s*([A-Z][A-Za-z\s&\-\.,]+?)(?:\n|,|$)",
            # Pattern 6: "with [ORGANIZATION TYPE]"
            r"with\s+(?:the\s+)?([A-Z][A-Za-z\s&\-\.,]+?)(?:\s+(?:University|College|Institute|Company|Corporation|Agency|Foundation|Organization|Ltd|Inc|Corp))",
            # Pattern 7: Better handling of quotes and parentheses
            r'["\']?([A-Z][A-Za-z\s&\-\.,]+?)(?:\s+(?:University|College|Institute|Company|Corporation|Agency|Foundation))["\']?\s+(?:and|,|\(|,\s+a)'
        ]

        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
                if match:
                    name = match.group(1).strip()
                    name = re.sub(r'\s+', ' ', name)# Normalize whitespace
                    name = re.sub(r'[,;\.]\s*$', '', name)# Remove trailing punctuation more carefully
                    name = re.sub(r'^the\s+', '', name, flags=re.IGNORECASE)   # Remove leading "the" if present
                    
                    # Validate name
                    if len(name) > 5:
                        # More specific PUP filtering - only filter exact PUP references
                        pup_exact_filters = [
                            r"^pup$",
                            r"^polytechnic\s+university\s+of\s+the\s+philippines$",
                            r"^polytechnic\s+university$"
                        ]
                        is_pup = False
                        for pup_filter in pup_exact_filters:
                            if re.match(pup_filter, name.lower()):
                                is_pup = True
                                break
                        
                        if not is_pup and any(c.isupper() for c in name):
                            logger.debug(f"Extracted partner name: {name}")
                            return name
            except Exception as e:
                logger.debug(f"Pattern matching error in partner name extraction: {e}")
                continue

        logger.debug("No partner name extracted using patterns")
        return ""

    def _extract_partner_website_enhanced(self, text: str) -> str:
        """Extract partner website/URL from document"""
        url_patterns = [
            r'https?://(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
            r'(?:website|url|web)\s*:?\s*(https?://[^\s,;]+)',
            r'(?:visit|visit us at)\s+(https?://[^\s,;]+)'
        ]
        
        for pattern in url_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Filter out PUP URLs
                if not any(pup_keyword in match.lower() for pup_keyword in 
                        ["pup", "polytechnic", ".edu.ph", "pup.edu"]):
                    if "http" in match.lower():
                        return match
                    else:
                        return f"https://{match}"
        
        logger.debug("No partner website extracted")
        return ""
    
    def _extract_partner_description_enhanced(self, text: str, partner_name: str) -> str:
        """Extract description of partner organization"""
        if not partner_name:
            return ""
        
        try:
            # Find context around partner name
            pattern = rf'{re.escape(partner_name)}[\s,]*(?:is|a|an|the)\s+(.+?)(?:\.|,|\n)'
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            
            if match:
                description = match.group(1).strip()
                description = re.sub(r'\s+', ' ', description)
                # Limit length
                return description[:300]
            
            logger.debug(f"No description found for {partner_name}")
            return ""
        except Exception as e:
            logger.debug(f"Error extracting partner description: {e}")
            return ""

    def _extract_country_enhanced(self, text: str) -> str:
        """Enhanced country extraction with improved filtering logic"""
        
        for country in self.country_options:
            pattern = rf'\b{re.escape(country)}\b'
            matches = re.finditer(pattern, text, re.IGNORECASE)
            
            for match in matches:
                # Get context around the country mention
                start = max(0, match.start() - 100)
                end = min(len(text), match.end() + 100)
                context = text[start:end].lower()
          
                pup_indicators = [
                    "pup ",
                    "polytechnic university of the philippines",
                    "polytechnic university",
                    "sta. mesa",
                    "mabini"  # PUP main campus location
                ]
                
                is_pup_context = any(indicator in context for indicator in pup_indicators)
                
                # If country is NOT in PUP context, return it
                if not is_pup_context:
                    return country
        
        logger.debug("No country extracted")
        return ""


    def _extract_address_enhanced(self, text: str, ner_entities: Dict[str, List[Any]]) -> str:
        """Enhanced address extraction using NER locations"""
        address_patterns = [
            r"offices?\s+at\s+(.+?)(?:\s*,\s*represented|,\s*herein|\.|$)",
            r"located\s+at\s+(.+?)(?:\s*,\s*represented|,\s*herein|\.|$)",
            r"address[:\s]+(.+?)(?:\s*,|\n|$)",
            r"principal\s+office\s*:?\s*(.+?)(?:\n|$)",
            r"headquarters?\s*:?\s*(.+?)(?:\n|$)",
            r"p\.?o\.?\s+box\s+(\d+[^\n]*?)(?:\n|$)",  # P.O. Box format
            r"(\d+\s+[A-Z].+?(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr|Circle|Cir).*?)(?:\n|$)",  # Street address
            r"(?:Address|Location):\s*([^,]+,?\s*[^,]+,?\s*[^\n]+)"  # City, Region, Country format
        ]

        for pattern in address_patterns:
            try:
                matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
                for match in matches:
                    address = match.strip()
                    # More lenient filtering - only filter exact PUP references
                    if not re.search(r'\bpup\b(?!\s*\()', address, re.IGNORECASE):  # PUP not in parentheses
                        if len(address) > 10:
                            return address[:300]
            except Exception as e:
                logger.debug(f"Error in address pattern: {e}")
                continue

        if ner_entities.get("GPE"):
            locations = [gpe["text"] for gpe in ner_entities["GPE"][:3]]
            if locations:
                return ", ".join(locations)

        logger.debug("No address extracted")
        return ""

    def _parse_best_date(self, date_entities: List[Dict], date_type: str) -> str:
        """Parse the most likely date from NER entities"""
        for date_ent in date_entities:
            date_text = date_ent["text"]
            try:
                parsed = parser.parse(date_text, fuzzy=True)
                current_year = datetime.now().year
                if 1990 <= parsed.year <= current_year + 10:
                    return parsed.strftime("%Y-%m-%d")
            except Exception:
                continue
        return ""

    def _extract_date_signed_enhanced(self, text: str) -> str:
        """Enhanced date signed extraction"""
        patterns = [
            r"entered\s+into\s+(?:this\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+\w+\s+\d{4})",
            r"signed\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})",
            r"this\s+(\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+\w+\s+\d{4})",
            r"date[d:]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})"
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    parsed = parser.parse(match.group(1), fuzzy=True)
                    return parsed.strftime("%Y-%m-%d")
                except Exception:
                    continue
        return ""

    def _extract_validity_enhanced(self, text: str, qa_result: str = "") -> int:
        """Enhanced validity period extraction"""
        if qa_result and re.search(r'\d+', qa_result):
            try:
                return int(re.search(r'\d+', qa_result).group())
            except:
                pass

        # Spelled-out number mapping
        number_words = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'twenty': 20, 'fifty': 50
        }

        patterns = [
            r"period\s+of\s+(?:(\w+)|(\d+))\s*\(?\s*(\d+)?\s*\)?\s*years?",  # "period of three (3) years"
            r"valid\s+(?:for|through).*?(?:(\d+)|(\w+))\s*years?",  # "valid for 3 years" or "valid for three years"
            r"term\s+of\s+(?:(\d+)|(\w+))\s*years?",  # "term of 3 years"
            r"(?:(\d+)|(\w+))\s*years?\s+(?:term|validity|period)",  # "3 years term"
            r"(?:renewal|extend).*?(?:(\d+)|(\w+))\s*years?",  # "renewal for 3 years"
            r"shall\s+(?:be\s+)?valid\s+for\s+(?:(\d+)|(\w+))\s*years?"  # "shall be valid for 3 years"
        ]

        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    for group in match.groups():
                        if group:
                            # Try numeric first
                            if group.isdigit():
                                value = int(group)
                                if 1 <= value <= 100:
                                    logger.debug(f"✓ Extracted validity: {value} years")
                                    return value
                            # Try spelled-out
                            elif group.lower() in number_words:
                                value = number_words[group.lower()]
                                logger.debug(f"✓ Extracted validity: {value} years (from '{group}')")
                                return value
            except Exception as e:
                logger.debug(f"Error in validity pattern: {e}")
                continue
        
        logger.debug("No validity period extracted")
        return 0

    def _match_partnership_type_enhanced(self, text: str, qa_result: str = "") -> str:
        """Enhanced partnership type matching"""
        if qa_result:
            matched = self._match_partnership_type(qa_result)
            if matched:
                return matched

        if re.search(r'\brenewal\b', text, re.IGNORECASE):
            return "MOU ON RENEWAL"

        text_lower = text.lower()
        
        if any(term in text_lower for term in ["research", "collaboration"]):
            if "training" in text_lower:
                return "MOA on Training and Research Collaboration"
            return "MOA on Research"
            
        if "exchange" in text_lower:
            if "faculty" in text_lower:
                return "MOA on Faculty Exchange"
            elif "student" in text_lower:
                return "MOA on Student Exchange"
            elif "academic" in text_lower:
                return "MOA on Academic Exchange"
                
        if "cooperation" in text_lower and "international" in text_lower:
            return "MOA on International Educational Cooperation"
            
        return "Agreement"

    def _extract_event_info_enhanced(self, text: str) -> str:
        """Enhanced event info extraction"""
        section_patterns = [
            r"PURPOSE\s*:?\s*\n?(.*?)(?:\n\s*(?:ARTICLE|WHEREAS|NOW|$))",
            r"OBJECTIVES?\s*:?\s*\n?(.*?)(?:\n\s*(?:ARTICLE|WHEREAS|NOW|$))",
            r"SCOPE\s*:?\s*\n?(.*?)(?:\n\s*(?:ARTICLE|WHEREAS|NOW|$))",
            r"This\s+(?:MOU|MOA|Agreement).*?(?:is|for)\s+(.*?)(?:\.|$)"
        ]

        for pattern in section_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                info = match.group(1).strip()
                info = re.sub(r'\s+', ' ', info)
                if len(info) > 20:
                    return info[:500]
        return ""

    def _extract_signatories_enhanced(self, text: str, ner_entities: Dict[str, List[Any]]) -> str:
        """Enhanced signatory extraction using NER persons"""
        signatories = []

        signature_blocks = re.findall(
            r"By:\s*\n?\s*([A-Z][A-Z\s\.]+)\s*\n?\s*([A-Za-z\s,\.-]+?)(?:\n|$)", 
            text, re.MULTILINE
        )

        for name, position in signature_blocks:
            institution = "PUP" if any(k in position.lower() for k in ["pup", "polytechnic"]) else "Partner"
            signatories.append({
                "name": name.strip(),
                "position": position.strip(),
                "institution": institution
            })

        if len(signatories) < 2 and ner_entities.get("PERSON"):
            for person in ner_entities["PERSON"][:4]:
                person_context = self._get_text_around_position(text, person["start"], 100)
                if any(sig_word in person_context.lower() for sig_word in ["by:", "signed", "president", "director"]):
                    signatories.append({
                        "name": person["text"],
                        "position": "",
                        "institution": "Unknown"
                    })

        signatories_text = "; ".join(
            f"{s['name']}, {s['position']}, {s['institution']}" 
            for s in signatories[:6]
        )
        
        return signatories_text

    def _extract_contacts_enhanced(self, text: str, ner_entities: Dict[str, List[Any]]) -> List[Dict[str, str]]:
        """Enhanced contact extraction with better institution filtering"""
        contacts = []
        seen_emails = set()  # Track emails to avoid duplicates

        email_pattern = r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"
        emails = re.findall(email_pattern, text)

        for email in emails:
            # Skip if already processed
            if email.lower() in seen_emails:
                continue
            seen_emails.add(email.lower())
            
            # Filter: Skip PUP emails (these go to point_persons, not contacts)
            pup_email_indicators = [
                r"@pup\.edu\.ph",
                r"@[a-z0-9.-]*pup[a-z0-9.-]*\.",
                r"@[a-z0-9.-]*polytechnic[a-z0-9.-]*\."
            ]
            is_pup_email = any(
                re.search(indicator, email, re.IGNORECASE) 
                for indicator in pup_email_indicators
            )
            if is_pup_email:
                continue  # This should go to point_persons instead
            
            # Extract context around email
            email_pos = text.find(email)
            if email_pos == -1:
                continue
            
            # Get more context for better parsing
            start_context = max(0, email_pos - 300)
            end_context = min(len(text), email_pos + 100)
            context = text[start_context:end_context]
            
            # Extract contact person information
            contact_name = ""
            contact_position = ""
            
            # Try to find name before email
            name_pattern = r"(?:Attention|Contact|Representative|Focal Point)\s*:?\s*\n?\s*([A-Z][A-Za-z\s\.]+?)(?:\n|,|$)"
            name_match = re.search(name_pattern, context, re.IGNORECASE)
            if name_match:
                contact_name = name_match.group(1).strip()
                contact_name = re.sub(r'\s+', ' ', contact_name)
            
            # Try to find position/title
            position_keywords = [
                "Director", "Coordinator", "Officer", "Manager", "Head", "Chair",
                "Dean", "President", "Vice", "Professor", "Dr.", "Representative"
            ]
            
            for keyword in position_keywords:
                if keyword.lower() in context.lower():
                    # Find the full position line
                    position_pattern = rf"{keyword}[^\n]*"
                    position_match = re.search(position_pattern, context, re.IGNORECASE)
                    if position_match:
                        contact_position = position_match.group(0).strip()
                        break
            if email:
                contacts.append({
                    "contact_person_name": contact_name,
                    "contact_person_position": contact_position,
                    "contact_person_email": email
                })

        return contacts[:5]

    def _extract_point_persons_enhanced(self, text: str, ner_entities: Dict[str, List[Any]]) -> List[Dict[str, str]]:
        """Enhanced PUP point persons extraction"""
        point_persons = []

        pup_email_patterns = [
            r"([a-zA-Z0-9._%+-]+@pup\.edu\.ph)",
            r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*pup[a-zA-Z0-9.-]*\.[a-zA-Z]{2,})"
        ]

        for pattern in pup_email_patterns:
            emails = re.findall(pattern, text, re.IGNORECASE)
            for email in emails:
                email_pos = text.find(email)
                context = text[max(0, email_pos - 200):email_pos + 50]
                
                attention_match = re.search(r"Attention\s*:\s*(.+?)(?:\n|$)", context, re.IGNORECASE)
                position = attention_match.group(1) if attention_match else ""

                point_persons.append({
                    "point_person_name": "",
                    "point_person_position": position,
                    "point_person_email": email
                })

        return point_persons[:3]
    
    def _remove_duplicate_entities(self, entities: Dict[str, List[Any]]) -> Dict[str, List[Any]]:
        """Remove duplicate entities within each category"""
        deduplicated = {}
        
        try:
            for entity_type, entity_list in entities.items():
                seen = set()
                unique_entities = []
                
                for entity in entity_list:
                    entity_text_lower = entity["text"].lower().strip()
                    if entity_text_lower not in seen:
                        seen.add(entity_text_lower)
                        unique_entities.append(entity)
                
                deduplicated[entity_type] = unique_entities
            
            logger.debug(f"✓ Removed duplicates from NER entities")
            return deduplicated
            
        except Exception as e:
            logger.debug(f"Error removing duplicate entities: {e}")
            return entities


    def _get_text_around_position(self, text: str, position: int, radius: int) -> str:
        """Get text context around a specific position"""
        start = max(0, position - radius)
        end = min(len(text), position + radius)
        return text[start:end]

    def _compute_expiry_date(self, date_signed: str, validity_years: int) -> str:
        """
        Compute expiry date from signing date and validity period.
        """
        if not date_signed or not validity_years or validity_years <= 0:
            logger.debug(f"Cannot compute expiry: date_signed={date_signed}, validity_years={validity_years}")
            return ""
        try:
            # Parse the signed date
            signed_date = datetime.strptime(date_signed, "%Y-%m-%d")

            expiry_date = signed_date + relativedelta(years=validity_years)
            
            result = expiry_date.strftime("%Y-%m-%d")
            logger.debug(f"✓ Computed expiry date: {date_signed} + {validity_years} years = {result}")
            return result
            
        except ValueError as ve:
            logger.warning(f"Date format error in expiry calculation: {ve}")
            return ""
        except Exception as e:
            logger.error(f"Unexpected error computing expiry date: {e}")
            return ""

    def _infer_entity_type(self, partner_name: str) -> str:
        """Infer partner entity type from organization name"""
        name_lower = partner_name.lower()
        
        # University/Educational Institution
        if any(k in name_lower for k in ["university", "college", "institute", "school", "academy", "educational"]):
            return "University"
        
        # Company/Corporation
        elif any(k in name_lower for k in ["company", "corp", "corporation", "inc", "ltd", "llc", "enterprise", "industries"]):
            return "Company"
        
        # Government/Public Organization
        elif any(k in name_lower for k in ["government", "ministry", "department", "agency", "bureau", "administration", "authority"]):
            return "Government"
        
        # Non-Profit/NGO
        elif any(k in name_lower for k in ["foundation", "association", "society", "ngo", "non-profit", "nonprofit", "charity"]):
            return "NGO"
        
        # Research Organization
        elif any(k in name_lower for k in ["research", "laboratory", "institute", "center", "council", "board"]):
            return "Research Organization"
        
        # International Organization
        elif any(k in name_lower for k in ["international", "global", "world", "united nations", "un"]):
            return "International Organization"
        
        # Default fallback
        return "Organization"

    def _match_partnership_type(self, extracted_type: str) -> str:
        """Fuzzy match partnership type to dropdown options"""
        if not extracted_type:
            return ""

        for option in self.partnership_options:
            if extracted_type.lower() == option.lower():
                return option

        matches = get_close_matches(extracted_type, self.partnership_options, n=1, cutoff=0.6)
        return matches[0] if matches else ""

    def _extract_source_unit(self, text: str) -> str:
        """Extract source unit from document '"""
        patterns = [
            # Pattern for "prepared by" statements
            r"(?:prepared\s+by|submitted\s+by|originated\s+from|initiated\s+by)\s+(?:the\s+)?([A-Za-z\s&\-\.]+?)(?:\.|,|$)",
            # Pattern for "college/department of"
            r"(?:college|department|office|unit)\s+(?:of|:)\s+([A-Za-z\s&\-\.]+?)(?:\.|,|$)",
            # Pattern for "FROM:" or "ORIGINATING UNIT:"
            r"(?:FROM|ORIGINATING\s+UNIT|SOURCE\s+UNIT)\s*:?\s*([A-Za-z\s&\-\.]+?)(?:\n|$)",
            # Pattern for "SUBMITTED BY" with unit
            r"SUBMITTED\s+BY\s*:?\s*([A-Za-z\s&\-\.]+?)(?:\n|$)"
        ]

        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    unit = match.group(1).strip()
                    unit = re.sub(r'\s+', ' ', unit) # Normalize whitespace
                    
                    # Validate
                    if 3 < len(unit) < 150:
                        return unit
            except Exception as e:
                logger.debug(f"Error in source unit pattern: {e}")
                continue

        logger.debug("No source unit extracted")
        return ""

    def _map_to_form_fields(self, metadata: Dict[str, Any], full_text: str) -> Dict[str, Any]:
        """Map extracted metadata to form field structure matching agreement controller"""
        partner = {
            "name": metadata.get("partner_name", ""),
            "entity_type": metadata.get("partner_entity_type", ""),
            "country": metadata.get("partner_country", ""),
            "region": metadata.get("partner_region", ""),
            "address": metadata.get("partner_address", ""),
            "website_url": metadata.get("partner_website", ""),  # ✅ FIXED: Now populated
            "description": metadata.get("partner_description", ""),  # ✅ FIXED: Now populated
            "logo_path": None,
            "status": "active",
            "contact_persons": metadata.get("contact_persons", [])
        }

        return {
            "source_unit": metadata.get("source_unit"),
            "partner_data": partner,
            "dts_number": "",
            "entry_date": datetime.now().strftime("%Y-%m-%d"),
            "date_received": metadata.get("date_received", ""),
            "date_endorsed_to_ulco": metadata.get("date_endorsed_to_ulco", ""),
            "date_ulco_approved": metadata.get("date_ulco_approved", ""),
            "date_signed_by_pup": metadata.get("date_pup_signed", ""),
            "date_signed": metadata.get("date_signed", ""),
            "date_expiry": metadata.get("date_expiry", ""),
            "document_type": metadata.get("document_type", ""),
            "partnership_type": metadata.get("partnership_type", ""),
            "validity_period": metadata.get("validity_period"),
            "event_info": metadata.get("event_info", ""),
            "signatories_list": metadata.get("signatories_list", ""),
            "hardcopy_location": metadata.get("hardcopy_location", ""),
            "agreement_status": "Active",
            "entry_type": "Extracted",
            "renewed_from_agreement_id": None,
            "MOU_to_MOA_id": None,
            "contact_persons": metadata.get("contact_persons", []),
            "point_persons": metadata.get("point_persons", []),
            "initial_remarks": []
        }

    def _ensure_qa(self) -> bool:
        """Ensure QA pipeline is loaded"""
        if self.qa_pipeline is not None and self.tokenizer is not None:
            return True

        if os.getenv("QA_LOAD_AT_STARTUP", "1").strip().lower() in ("0", "false", "no"):
            return False

        if self._qa_loading:
            return False

        self._qa_loading = True
        try:
            device = 0 if torch.cuda.is_available() else -1
            preferred = self._preferred_model

            try:
                logger.info(f"Loading Legal-BERT QA pipeline: {preferred}")
                self.tokenizer = AutoTokenizer.from_pretrained(preferred, use_fast=True)
                qa_model = AutoModelForQuestionAnswering.from_pretrained(preferred)
                self.qa_pipeline = pipeline(
                    "question-answering",
                    model=qa_model,
                    tokenizer=self.tokenizer,
                    device=device
                )
                self.model_name_in_use = preferred
                self._qa_device = "cuda:0" if device == 0 else "cpu"
                logger.info(f"✓ Legal-BERT QA pipeline loaded successfully on {self._qa_device}")
                return True

            except Exception as e:
                fallback = "deepset/roberta-base-squad2"
                logger.warning(f"Legal-BERT failed ({str(e)[:50]}), trying fallback: {fallback}")
                
                self.tokenizer = AutoTokenizer.from_pretrained(fallback, use_fast=True)
                qa_model = AutoModelForQuestionAnswering.from_pretrained(fallback)
                self.qa_pipeline = pipeline(
                    "question-answering",
                    model=qa_model,
                    tokenizer=self.tokenizer,
                    device=device
                )
                self.model_name_in_use = fallback
                self._qa_device = "cuda:0" if device == 0 else "cpu"
                logger.info(f"✓ Fallback QA model loaded: {fallback} on {self._qa_device}")
                return True

        except Exception as e:
            logger.error(f"Failed to load any QA model: {e}")
            self.qa_pipeline = None
            self.tokenizer = None
            return False
        finally:
            self._qa_loading = False

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


# Compatibility alias
NlpExtractionService = NLPLegalExtractionService