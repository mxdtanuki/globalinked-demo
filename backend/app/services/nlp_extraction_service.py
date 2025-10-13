import os
import re
import logging
from datetime import datetime
from dateutil import parser
from typing import Dict, Any, List, Optional

from difflib import get_close_matches

import torch
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
    Service to extract structured metadata from agreements using
    a Legal-BERT encoder and a question-answering head.

    Behavior:
      - Preferred model resolution: explicit arg > QA_MODEL_OVERRIDE env var > default 'nlpaueb/legal-bert-base-uncased'
      - QA model loading is lazy and controlled by QA_LOAD_AT_STARTUP env var.
      - If model chosen lacks QA head, AutoModelForQuestionAnswering will initialize one (fine-tune recommended).
      - Fallback to a known QA-finetuned model ('deepset/roberta-base-squad2') if loading preferred model fails.
      - Per-question token-budgeting or env-driven char-chunking to avoid model token-limit errors.
    """

    def __init__(
        self,
        model_override: Optional[str] = None,
        qa_confidence_threshold: Optional[float] = None,
        document_processing_service: Optional[DocumentProcessingService] = None,
    ):
        # --- Regex patterns as fallback ---
        self.date_pattern = re.compile(
            r"(\b\d{1,2}(st|nd|rd|th)?\s+"
            r"(January|February|March|April|May|June|July|August|September|October|November|December)"
            r"[,]?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b)",
            re.IGNORECASE,
        )
        self.party_pattern = re.compile(
            r"between\s+(.*?)\s+and\s+(.*?)(?:,|\.)",
            re.IGNORECASE | re.DOTALL,
        )

        # Frontend partnership type options for matching
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
            'MOA on Student Competition', 'MOA on Faculty and Student Exchange'
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
        self.doc_processor = document_processing_service if document_processing_service else DocumentProcessingService()

        # QA pipeline + tokenizer placeholders (lazy-loaded)
        self.qa_pipeline: Optional[Pipeline] = None
        self.tokenizer: Optional[AutoTokenizer] = None
        self.model_name_in_use: Optional[str] = None
        self._qa_device: Optional[str] = None  # cpu or cuda:0

        # track preferred model name for lazy loading
        env_override = os.getenv("QA_MODEL_OVERRIDE", "").strip() or None
        override_model = model_override.strip() if (model_override and model_override.strip()) else env_override
        legal_bert_name = "nlpaueb/legal-bert-base-uncased"
        self._preferred_model = override_model if override_model else legal_bert_name

        # thresholds and QA config
        if qa_confidence_threshold is not None:
            try:
                self.qa_confidence_threshold = float(qa_confidence_threshold)
            except Exception:
                self.qa_confidence_threshold = float(os.getenv("QA_CONFIDENCE_THRESHOLD", "0.10"))
        else:
            self.qa_confidence_threshold = float(os.getenv("QA_CONFIDENCE_THRESHOLD", "0.10"))

        # NEW: char-based chunking and answer length via env
        # Set QA_CHUNK_CHARS > 0 to enable character-based sliding window chunking
        self.qa_chunk_chars: int = int(os.getenv("QA_CHUNK_CHARS", "0"))          # 0 = disabled (use tokenizer-based)
        self.qa_chunk_overlap: int = int(os.getenv("QA_CHUNK_OVERLAP", "200"))
        self.qa_max_answer_len: int = int(os.getenv("QA_MAX_ANS_LEN", "64"))

        # internal flags for loading
        self._qa_loading = False

        # Expanded questions for QA extraction
        self.questions = {
            "document_type": [
            "Is this document a Memorandum of Agreement or Memorandum of Understanding?",
            "What type of legal document is this - MOA or MOU?",
            "Document classification"
            ],
            "partnership_type": [
            "What is the specific purpose or subject matter of this agreement?",
            "What type of cooperation or partnership does this agreement establish?",
            "What activities or programs are covered by this agreement?"
            ],
            "date_signed": [
            "When was the agreement signed?",
            "What is the date of signing?",
            "Date signed"
            ],
            "validity_period": [
            "For how many years is this agreement valid or effective?",
            "What is the term or duration of this agreement in years?",
            "How long will this agreement remain in effect?"
            ],
            "date_expiry": [
            "What is the expiry date?",
            "When does the agreement expire?",
            "Date of expiry"
            ],
            "partner_name": [
            "What is the full legal name of the partner institution or organization?",
            "Who is the other contracting party besides PUP?",
            "What institution or entity is partnering with PUP?"
            ],
            "partner_entity_type": [
            "What type of entity is the partner?",
            "Is the partner a university, company, or organization?",
            "Partner entity type"
            ],
            "partner_country": [
            "In which country is the partner institution located?",
            "What is the partner's country of origin or location?",
            "Where is the partnering organization based geographically?"
            ],
            "partner_region": [
            "What region is the partner in?",
            "Partner region"
            ],
            "partner_address": [
            "What is the complete address of the partner institution?",
            "Where is the partner organization's principal office located?",
            "What is the partner's business or institutional address?"
            ],
            "partner_website": [
            "What is the website of the partner?",
            "Partner website"
            ],
            "partner_description": [
            "What is the description of the partner?",
            "Partner description"
            ],
            "signatories": [
            "Who are the signatories?",
            "Who signed the agreement?",
            "List the signatories with their names, positions"
            ],
            "contact_persons": [
            "Who should be contacted regarding notices or communications for this agreement?",
            "What are the contact details for correspondence about this agreement?",
            "Who are the designated contact persons and their email addresses?"
            ],
            "point_persons": [
            "Who are the point persons?",
            "Point persons with names, positions, and emails"
            ],
            "event_info": [
            "What are the main objectives or goals of this partnership?",
            "What specific activities or programs will be implemented under this agreement?",
            "What is the scope of cooperation outlined in this document?"
            ],
            "date_received": [
            "What is the date received?",
            "Date received"
            ],
            "date_endorsed_to_ulco": [
            "What is the date endorsed to ULCO?",
            "Date endorsed to ULCO"
            ],
            "date_ulco_approved": [
            "What is the date ULCO approved?",
            "Date ULCO approved"
            ],
            "date_pup_signed": [
            "What is the date PUP signed?",
            "Date PUP signed"
            ]
        }

    def _ensure_qa(self) -> bool:
        """
        Lazily load the QA tokenizer + model + pipeline.
        Returns True if QA pipeline is ready, False otherwise.

        Respects QA_LOAD_AT_STARTUP env var: if set to "0" or "false", do NOT auto-load.
        """
        # If already loaded, OK
        if self.qa_pipeline is not None and self.tokenizer is not None:
            return True

        # If configured to not auto-load, don't try to load at runtime
        if os.getenv("QA_LOAD_AT_STARTUP", "1").strip().lower() in ("0", "false", "no"):
            logger.info("QA auto-load disabled via QA_LOAD_AT_STARTUP; skipping model load.")
            return False

        # prevent concurrent loads
        if self._qa_loading:
            logger.debug("QA pipeline is currently loading by another thread/process; skipping.")
            return False

        self._qa_loading = True
        try:
            device = 0 if torch.cuda.is_available() else -1

            preferred = os.getenv("QA_MODEL_OVERRIDE") or self._preferred_model
            try:
                logger.info(f"Loading QA pipeline for model: {preferred}")
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
                logger.info(f"✓ QA pipeline loaded: {preferred} on {self._qa_device}")
                return True
            except Exception as e:
                # fallback to a known QA-finetuned model
                fallback = "deepset/roberta-base-squad2"
                logger.warning(f"Failed to load preferred QA model ({preferred}): {e}; attempting fallback {fallback}")
                try:
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
                except Exception as e2:
                    logger.error(f"Failed to load fallback QA model ({fallback}): {e2}; QA disabled, falling back to regex-only.")
                    self.qa_pipeline = None
                    self.tokenizer = None
                    self.model_name_in_use = None
                    self._qa_device = None
                    return False
        finally:
            self._qa_loading = None if self._qa_loading else False  # ensure it's not stuck truthy

    # Health helpers used by /health/qa
    def is_qa_ready(self) -> bool:
        return self.qa_pipeline is not None

    def qa_info(self) -> Dict[str, Any]:
        return {
            "model": self.model_name_in_use or self._preferred_model,
            "threshold": self.qa_confidence_threshold,
            "device": self._qa_device or "unknown",
            "chunk_chars": self.qa_chunk_chars,
            "overlap": self.qa_chunk_overlap,
            "max_answer_len": self.qa_max_answer_len,
        }

    def extract_agreement_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Main function to extract agreement metadata from a file.
        Detects file type, extracts text, and runs NLP extraction.
        Returns a dict matching AgreementCreate structure.
        """
        try:
            # Detect file extension
            _, ext = os.path.splitext(file_path)
            ext = ext.lstrip('.').lower()

            # Extract text
            text_data = self.doc_processor.extract_text_from_file(file_path, ext)
            if not text_data.get("success", False):
                return {"error": text_data.get("error", "Text extraction failed")}

            text = text_data["text"]

            if not text.strip():
                return {"error": "The document does not contain readable text. Please ensure the document is a text-based PDF or DOCX file and try again."}

            # Extract metadata using NLP
            metadata = self.extract_moa_for_agreement_response(text)

            # Build output dict matching AgreementCreate
            partner = metadata.get("partner", {})
            
            # Safely handle point_persons - ensure they're dictionaries
            point_persons = metadata.get("point_persons", [])
            if not isinstance(point_persons, list):
                point_persons = []
            
            # Filter out non-dict items and ensure proper structure
            formatted_point_persons = []
            for p in point_persons:
                if isinstance(p, dict):
                    formatted_point_persons.append({
                        "point_person_position": p.get("position", ""),
                        "point_person_name": p.get("name", ""),
                        "point_person_email": p.get("email", "")
                    })
                elif isinstance(p, str):
                    # Handle case where point person is just a string
                    formatted_point_persons.append({
                        "point_person_position": p,
                        "point_person_name": "",
                        "point_person_email": ""
                    })

            # Safely handle contact_persons - ensure they're dictionaries
            contact_persons = metadata.get("contact_persons", [])
            if not isinstance(contact_persons, list):
                contact_persons = []
            
            # Filter out non-dict items and ensure proper structure
            formatted_contact_persons = []
            for c in contact_persons:
                if isinstance(c, dict):
                    formatted_contact_persons.append({
                        "contact_person_position": c.get("position", ""),
                        "contact_person_name": c.get("name", ""),
                        "contact_person_email": c.get("email", "")
                    })
                elif isinstance(c, str):
                    # Handle case where contact person is just a string
                    formatted_contact_persons.append({
                        "contact_person_position": c,
                        "contact_person_name": "",
                        "contact_person_email": ""
                    })

            result = {
                "partner_data": {
                    "name": partner.get("name", ""),
                    "entity_type": partner.get("entity_type", ""),
                    "country": partner.get("country", ""),
                    "region": partner.get("region", ""),
                    "address": partner.get("address", ""),
                    "website_url": partner.get("website", ""),
                    "description": partner.get("description", ""),
                    "logo_path": None,
                    "status": "active",
                    "contact_persons": []  # Will populate below
                },
                "source_unit": None,
                "dts_number": metadata.get("dts_number"),
                "dts_status": metadata.get("dts_status", "OPEN - OIA"),
                "entry_date": datetime.now().strftime("%Y-%m-%d"),
                "date_received": metadata.get("date_received"),
                "date_endorsed_to_ulco": metadata.get("date_endorsed_to_ulco"),
                "date_ulco_approved": metadata.get("date_ulco_approved"),
                "date_signed_by_pup": metadata.get("date_pup_signed"),
                "date_signed": metadata.get("date_signed"),
                "date_expiry": metadata.get("date_expiry"),
                "document_type": metadata.get("document_type"),
                "partnership_type": metadata.get("partnership_type"),
                "validity_period": str(metadata.get("validity_period")) if metadata.get("validity_period") else None,
                "event_info": metadata.get("event_info"),
                "signatories_list": "; ".join(
                    f"{s['name']}, {s['position']}, {s['institution']}" for s in metadata.get("signatories_list", [])
                    if isinstance(s, dict)
                ) if metadata.get("signatories_list") else None,
                "point_persons": formatted_point_persons,
                "agreement_status": metadata.get("agreement_status", "Active"),
                "hardcopy_location": metadata.get("hardcopy_location"),
                "entry_type": metadata.get("entry_type", "Extracted"),
                "renewed_from_agreement_id": None,
                "MOU_to_MOA_id": None,
                "contact_persons": formatted_contact_persons,
                "initial_remarks": [
                    {"remark_text": metadata.get("remarks", "")}
                ] if metadata.get("remarks") else []
            }
            return result
        except Exception as e:
            logger.exception("Extraction failed")
            return {"error": f"Extraction failed: {str(e)}"}

    def extract_moa_for_agreement_response(self, text: str) -> Dict[str, Any]:
        """
        Extract and map fields using Legal-BERT QA and regex fallback.
        Enhanced to match the exact field mapping requirements.
        """
        clean_text = self._preprocess_text(text)
        extracted: Dict[str, Any] = {}

        print(f"🔍 Starting extraction from text length: {len(clean_text)}")

        # Use QA for main fields (chunked)
        qa_results = {}
        for field, question_list in self.questions.items():
            answer = self._extract_with_qa(clean_text, question_list)
            if answer:
                qa_results[field] = answer
                print(f"✅ QA extracted {field}: {answer}")
            else:
                print(f"⚠️  QA returned no answer for {field}")

        # Enhanced partner name extraction from "BETWEEN ... AND ..." pattern
        partner_name = self._extract_partner_name(clean_text)
        if partner_name:
            extracted["partner_name"] = partner_name
            print(f"🎯 Partner name found: {partner_name}")

        # Enhanced address extraction from "principal office at ..." pattern
        partner_address = self._extract_partner_address(clean_text)
        if partner_address:
            extracted["partner_address"] = partner_address
            print(f"🏢 Partner address found: {partner_address}")

        # Extract country from text and infer region
        partner_country = self._extract_partner_country(clean_text)
        if partner_country:
            extracted["partner_country"] = partner_country
            extracted["partner_region"] = self.region_mapping.get(partner_country, "")
            print(f"🌍 Partner country/region: {partner_country}/{extracted.get('partner_region')}")

        # Document type detection (MOA/MOU)
        doc_type = self._extract_document_type(clean_text)
        if doc_type:
            extracted["document_type"] = doc_type
            print(f"📄 Document type: {doc_type}")

        # Enhanced date extraction from header/date clause
        date_signed = self._extract_date_signed(clean_text)
        if date_signed:
            extracted["date_signed"] = date_signed
            print(f"📅 Date signed: {date_signed}")

        # Enhanced validity period extraction
        validity_period = self._extract_validity_period(clean_text)
        if validity_period:
            extracted["validity_period"] = validity_period
            # Compute expiry date
            if extracted.get("date_signed"):
                expiry_date = self._compute_expiry_date(extracted["date_signed"], validity_period)
                if expiry_date:
                    extracted["date_expiry"] = expiry_date
                    print(f"⏰ Validity: {validity_period} years, expires: {expiry_date}")

        # Partnership type matching to dropdown options
        partnership_type = self._extract_partnership_type(clean_text, qa_results.get("partnership_type"))
        if partnership_type:
            extracted["partnership_type"] = partnership_type
            print(f"🤝 Partnership type: {partnership_type}")

        # Event info from purpose/scope sections
        event_info = self._extract_event_info(clean_text, qa_results.get("event_info"))
        if event_info:
            extracted["event_info"] = event_info
            print(f"ℹ️  Event info: {event_info[:100]}...")

        # Enhanced signatories extraction from "By:" section
        signatories = self._extract_signatories(clean_text)
        if signatories:
            extracted["signatories_list"] = signatories
            print(f"✍️  Signatories found: {len(signatories)} people")

        # Enhanced contacts extraction from NOTICES section (PUP side)
        contacts = self._extract_contact_persons_partner_side(clean_text)
        if contacts:
            extracted["contact_persons"] = contacts
            print(f"📞 Partner contacts found: {len(contacts)} people")

        # Enhanced point persons extraction (PUP side)
        point_persons = self._extract_point_persons_pup_side(clean_text)
        if point_persons:
            extracted["point_persons"] = point_persons
            print(f"👥 PUP point persons: {len(point_persons)} people")

        # Entity type inference
        if extracted.get("partner_name"):
            entity_type = self._infer_entity_type(extracted["partner_name"])
            extracted["partner_entity_type"] = entity_type
            print(f"🏛️  Entity type: {entity_type}")

        # Merge QA results
        extracted.update(qa_results)

        # Map to final structure
        return self._map_to_agreement_fields(extracted, clean_text)

    def _extract_partner_name(self, text: str) -> str:
        """Extract partner name from BETWEEN ... AND ... pattern"""
        patterns = [
            # Pattern 1: "between ... and PARTNER_NAME," - capture the partner name after "and"
            r"between\s+.*?\s+and\s+([^,;\.]+?)(?:\s*,|\s*\(|\s*;|\s+are\s+hereinafter|\s+herein)",
            
            # Pattern 2: More specific - look for "between PUP/POLYTECHNIC and PARTNER_NAME"
            r"between\s+(?:.*?(?:pup|polytechnic).*?)\s+and\s+([^,;\.]+?)(?:\s*,|\s*\(|\s*;|\s+are\s+hereinafter|\s+herein)",
            
            # Pattern 3: "POLYTECHNIC ... and PARTNER_NAME"
            r"polytechnic.*?and\s+([^,;\.]+?)(?:\s*,|\s*\(|\s*;|\s+are\s+hereinafter|\s+herein)",
            
            # Pattern 4: Simple "and PARTNER_NAME" after PUP context
            r"(?:pup|polytechnic).*?and\s+([A-Z][A-Z\s&\-\.]+?)(?:\s*,|\s*\(|\s*;|\s+are\s+hereinafter|\s+herein)"
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                partner_name = match.group(1).strip()
                
                # Skip if it contains PUP/POLYTECHNIC
                if re.search(r'\b(pup|polytechnic)\b', partner_name, re.IGNORECASE):
                    continue
                    
                # Clean up the partner name
                # Remove common legal phrases
                partner_name = re.sub(r'\s+(are\s+hereinafter.*|herein.*|collectively.*)', '', partner_name, flags=re.IGNORECASE)
                
                # Remove trailing punctuation and whitespace
                partner_name = re.sub(r'[,;\.]\s*$', '', partner_name.strip())
                
                # Remove extra whitespace
                partner_name = re.sub(r'\s+', ' ', partner_name)
                
                if partner_name and len(partner_name) > 2:  # Ensure it's not just initials
                    return partner_name

        return ""

    def _extract_partner_address(self, text: str) -> str:
        """Extract partner address from different sections based on document type"""
        
        # First, try MOA-style extraction from header/parties section
        moa_patterns = [
            # Pattern for "with principal offices at ADDRESS, represented herein"
            r"offices at\s+(.+?)(?:\s*,\s*represented|,\s*herein|\.|$)",
            r"office at\s+(.+?)(?:\s*,\s*represented|,\s*herein|\.|$)",
            r"located at\s+(.+?)(?:\s*,\s*represented|,\s*herein|\.|$)",
            r"office address[:\s]+(.+?)(?:\s*,\s*represented|,\s*herein|\.|$)",
        ]

        # Try MOA-style patterns first
        for pattern in moa_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
            for match in matches:
                address = match.strip()
                # Skip if it's clearly PUP's address (Manila/Sta Mesa context)
                if not re.search(r'\b(manila.*sta\.?\s*mesa|sta\.?\s*mesa.*manila|mabini.*campus)\b', address, re.IGNORECASE):
                    # Clean up the address
                    address = re.sub(r'\s+', ' ', address)
                    if len(address) > 10:  # Ensure it's substantial
                        return address[:200]  # Limit length

        # If no MOA-style address found, try MOU-style from NOTICES section
        mou_patterns = [
            # Pattern for NOTICES section addresses
            r"To\s*:\s*(?!.*pup)(.+?)(?:\n\s*Attention|Address[:\s]|Tel\.|Fax|E-mail|\n\s*To\s*:|$)",
            r"Address[:\s]+(.+?)(?:\n|Tel\.|Fax|E-mail|Attention|$)",
            r"(?:Address|Located at)[:\s]+(.+?)(?:\n|$)",
        ]

        # Look for addresses in NOTICES or similar sections
        notices_section = re.search(r"NOTICES?\s*[:.]?\s*(.*?)(?:\n\s*IN WITNESS|$)", text, re.IGNORECASE | re.DOTALL)
        if notices_section:
            notices_text = notices_section.group(1)
            
            for pattern in mou_patterns:
                matches = re.findall(pattern, notices_text, re.IGNORECASE | re.DOTALL)
                for match in matches:
                    address = match.strip()
                    # Skip PUP addresses
                    if not re.search(r'\b(pup|polytechnic|manila.*sta\.?\s*mesa|sta\.?\s*mesa.*manila|mabini)\b', address, re.IGNORECASE):
                        # Clean up address
                        address = re.sub(r'\s+', ' ', address)
                        address = re.sub(r'\n', ' ', address)  # Remove newlines
                        if len(address) > 10:
                            return address[:200]

        # Fallback: general address patterns in full document
        fallback_patterns = [
            r"address[:\s]+(.+?)(?:\s*attention|tel\.|fax|\n|$)",
            r"located at\s+(.+?)(?:\n|tel\.|fax|attention|$)"
        ]

        for pattern in fallback_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                address = match.strip()
                # Skip PUP addresses
                if not re.search(r'\b(pup|polytechnic|manila.*sta\.?\s*mesa|mabini)\b', address, re.IGNORECASE):
                    address = re.sub(r'\s+', ' ', address)
                    if len(address) > 10:
                        return address[:200]

        return ""

    def _extract_partner_country(self, text: str) -> str:
        """Extract country from text by matching against country list"""
        text_lower = text.lower()

        # Direct country name matching
        for country in self.country_options:
            if country.lower() in text_lower:
                # Verify it's not part of PUP's context
                country_context = self._get_text_around_match(text, country, 50)
                if not re.search(r'\b(pup|polytechnic|philippines|manila)\b', country_context, re.IGNORECASE):
                    return country

        return ""

    def _get_text_around_match(self, text: str, match_word: str, context_chars: int) -> str:
        """Get text context around a matched word"""
        pos = text.lower().find(match_word.lower())
        if pos == -1:
            return ""
        start = max(0, pos - context_chars)
        end = min(len(text), pos + len(match_word) + context_chars)
        return text[start:end]

    def _extract_document_type(self, text: str) -> str:
        """Extract document type (MOA/MOU) - prioritize document title"""
        
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

    def _extract_date_signed(self, text: str) -> str:
        """Extract signing date from header/date clause"""
        patterns = [
            r"entered into\s+(?:this\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+\w+\s+\d{4})",
            r"signed\s+(?:this\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+\w+\s+\d{4})",
            r"this\s+(\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+\w+\s+\d{4})",
            r"date[d:]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
            r"(\w+\s+\d{1,2},?\s+\d{4})"
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1).strip()
                try:
                    parsed = parser.parse(date_str, fuzzy=True)
                    return parsed.strftime("%Y-%m-%d")
                except Exception:
                    continue

        return ""

    def _extract_validity_period(self, text: str) -> int:
        """Extract validity period in years"""
        patterns = [
            r"shall\s+remain\s+in\s+effect\s+for\s+a\s+period\s+of\s+(\w+)\s*\(\s*(\d+)\s*\)\s*years?",
            r"period\s+of\s+(\w+)\s*\(\s*(\d+)\s*\)\s*years?",
            r"valid\s+for\s+.*?(\d+)\s*years?",
            r"duration\s+of\s+(\d+)\s*years?",
            r"term\s+of\s+(\d+)\s*years?"
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    # Try to get number from either group
                    groups = match.groups()
                    for group in groups:
                        if group and group.isdigit():
                            return int(group)
                        elif group:
                            # Try to parse word numbers
                            word_to_num = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
                            if group.lower() in word_to_num:
                                return word_to_num[group.lower()]
                except ValueError:
                    continue

        return 0

    def _compute_expiry_date(self, date_signed: str, validity_years: int) -> str:
        """Compute expiry date from signing date and validity period"""
        try:
            signed_date = datetime.strptime(date_signed, "%Y-%m-%d")
            expiry_date = signed_date.replace(year=signed_date.year + validity_years)
            return expiry_date.strftime("%Y-%m-%d")
        except Exception:
            return ""

    def _extract_partnership_type(self, text: str, qa_result: str = "") -> str:
        """Extract and match partnership type to dropdown options"""
        # Check QA result first
        if qa_result:
            matched = self._match_partnership_type(qa_result)
            if matched:
                return matched

        # Look for specific partnership patterns
        patterns = [
            r"for\s+the\s+(.+?)(?:\n|$)",
            r"purpose.*?(?:for|of)\s+(.+?)(?:\n|$)",
            r"cooperation\s+in\s+(.+?)(?:\n|$)",
            r"collaboration.*?in\s+(.+?)(?:\n|$)"
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                purpose = match.group(1).strip()
                # Try to match against dropdown options
                if "research" in purpose.lower():
                    return "MOA on Research"
                elif "academic" in purpose.lower() and "exchange" in purpose.lower():
                    return "MOA on Academic Exchange"
                elif "international" in purpose.lower() and "cooperation" in purpose.lower():
                    return "MOA on International Educational Cooperation"

        return ""

    def _extract_event_info(self, text: str, qa_result: str = "") -> str:
        """Extract event info from purpose/scope sections"""
        if qa_result:
            return qa_result

        # Look for objectives/purpose sections
        patterns = [
            r"OBJECTIVES?\s*\n\s*(.+?)(?:\n\s*ARTICLE|\n\s*[A-Z]{3,}|$)",
            r"PURPOSE\s*\n\s*(.+?)(?:\n\s*ARTICLE|\n\s*[A-Z]{3,}|$)",
            r"SCOPE\s*\n\s*(.+?)(?:\n\s*ARTICLE|\n\s*[A-Z]{3,}|$)"
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                info = match.group(1).strip()
                # Clean up and limit length
                info = re.sub(r'\s+', ' ', info)
                return info[:500]

        return ""

    def _extract_signatories(self, text: str) -> List[Dict[str, str]]:
        """Extract signatories from 'By:' sections"""
        signatories = []

        # Look for signature blocks
        signature_pattern = r"By:\s*\n?\s*([A-Z][A-Z\s\.]+)\s*\n?\s*([A-Za-z\s,\.-]+?)(?:\n|$)"
        matches = re.findall(signature_pattern, text, re.MULTILINE)

        for match in matches:
            name = match[0].strip()
            position = match[1].strip()

            # Determine institution based on context
            institution = "PUP" if any(keyword in position.lower() for keyword in ["pup", "polytechnic"]) else "Partner"

            signatories.append({
                "name": name,
                "position": position,
                "institution": institution
            })

        return signatories

    def _extract_contact_persons_partner_side(self, text: str) -> List[Dict[str, str]]:
        """Extract contact persons from NOTICES section (PARTNER side)"""
        contacts = []

        # Look for non-PUP contact info (partner side)
        sections = re.split(r"To\s*:", text, flags=re.IGNORECASE)

        for section in sections:
            if not re.search(r'\bpup\b', section, re.IGNORECASE) and "@" in section:
                # Extract email
                email_match = re.search(r"e-mail\s*:\s*(\S+@\S+)", section, re.IGNORECASE)
                email = email_match.group(1) if email_match else ""

                # Extract attention line
                attention_match = re.search(r"Attention\s*:\s*(.+?)(?:\n|$)", section, re.IGNORECASE)
                position = attention_match.group(1) if attention_match else ""

                if email:
                    contacts.append({
                        "name": "",
                        "position": position,
                        "email": email
                    })

        # Fallback: if no structured contacts found, try to extract from partner context
        if not contacts:
            # Look for email addresses that aren't clearly PUP-related
            email_pattern = r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"
            emails = re.findall(email_pattern, text)
            
            for email in emails[:2]:  # Limit to first 2 partner emails
                # Skip PUP emails
                if not re.search(r'pup|polytechnic', email, re.IGNORECASE):
                    contacts.append({
                        "name": "",
                        "position": "",
                        "email": email
                    })

        return contacts

    def _extract_point_persons_pup_side(self, text: str) -> List[Dict[str, str]]:
        """Extract point persons from NOTICES section (PUP side)"""
        point_persons = []

        # Look for PUP contact info in notices section
        pup_pattern = r"To\s*:\s*PUP.*?\n(.*?)(?:\n\s*To\s*:|$)"
        match = re.search(pup_pattern, text, re.IGNORECASE | re.DOTALL)

        if match:
            pup_section = match.group(1)

            # Extract email
            email_match = re.search(r"e-mail\s*:\s*(\S+@\S+)", pup_section, re.IGNORECASE)
            email = email_match.group(1) if email_match else ""

            # Extract attention line for position
            attention_match = re.search(r"Attention\s*:\s*(.+?)(?:\n|$)", pup_section, re.IGNORECASE)
            position = attention_match.group(1) if attention_match else ""

            if position or email:
                point_persons.append({
                    "name": "",  # Usually just position given
                    "position": position,
                    "email": email
                })

        # Fallback: look for general PUP email patterns in document
        if not point_persons:
            pup_email_patterns = [
                r"([a-zA-Z0-9._%+-]+@pup\.edu\.ph)",
                r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*pup[a-zA-Z0-9.-]*\.[a-zA-Z]{2,})"
            ]
            for pattern in pup_email_patterns:
                emails = re.findall(pattern, text, re.IGNORECASE)
                for email in emails[:3]:  # Limit to first 3 PUP emails found
                    point_persons.append({
                        "name": "",
                        "position": "",
                        "email": email
                    })

        return point_persons

    def _infer_entity_type(self, partner_name: str) -> str:
        """Infer entity type from partner name"""
        name_lower = partner_name.lower()

        if any(keyword in name_lower for keyword in ["university", "college", "institute", "school"]):
            return "University"
        elif any(keyword in name_lower for keyword in ["company", "corp", "inc", "ltd", "llc"]):
            return "Company"
        elif any(keyword in name_lower for keyword in ["government", "ministry", "department", "agency"]):
            return "Government"
        else:
            return "Organization"

    def _preprocess_text(self, text: str) -> str:
        """
        Preprocess text for Legal-BERT extraction.
        Cleans up formatting, removes extra whitespace, normalizes structure.
        """
        if not text:
            return ""

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

    def _chunk_by_chars(self, text: str, n: int, overlap: int) -> List[str]:
        """Create overlapping character-based chunks"""
        if n <= 0 or not text:
            return [text] if text else [""]
        chunks: List[str] = []
        i = 0
        step = max(1, n - max(0, overlap))
        L = len(text)
        while i < L:
            chunks.append(text[i:i+n])
            if i + n >= L:
                break
            i += step
        return chunks

    def _extract_with_qa(self, text: str, questions: List[str]) -> str:
        """
        Extract information using Legal-BERT QA pipeline.
        Uses chunking to handle long documents and per-question token budgeting.
        """
        if not self._ensure_qa() or not questions:
            return ""

        best_answer = ""
        best_score = 0.0

        try:
            # Prefer env-driven char chunking if configured; else tokenizer-length logic
            if self.qa_chunk_chars > 0:
                chunks = self._chunk_by_chars(text, self.qa_chunk_chars, self.qa_chunk_overlap)
            else:
                # Calculate max chunk size based on model's max length
                max_model_length = getattr(self.tokenizer, 'model_max_length', 512)
                chunk_size = max(256, max_model_length - 100)  # Leave room for question

                # Split text into chunks if too long
                if len(text.split()) > chunk_size:
                    chunks = self._create_chunks(text, chunk_size)
                else:
                    chunks = [text]

            # Try each question on each chunk
            for question in questions:
                for chunk in chunks:
                    try:
                        result = self.qa_pipeline(
                            question=question,
                            context=chunk,
                            handle_impossible_answer=True,
                            max_answer_len=self.qa_max_answer_len
                        )
                        score = float(result.get("score", 0.0))
                        if score > best_score and score >= self.qa_confidence_threshold:
                            best_answer = (result.get("answer") or "").strip()
                            best_score = score
                    except Exception as e:
                        logger.warning(f"QA extraction failed for question '{question}': {e}")
                        continue

        except Exception as e:
            logger.error(f"QA pipeline error: {e}")
            return ""

        return best_answer.strip() if best_answer else ""

    def _create_chunks(self, text: str, max_words: int, overlap: int = 50) -> List[str]:
        """
        Create overlapping chunks of text for QA processing (word-based).
        """
        words = text.split()
        chunks = []

        step = max(1, max_words - overlap)
        for i in range(0, len(words), step):
            chunk_words = words[i:i + max_words]
            if chunk_words:
                chunks.append(' '.join(chunk_words))

        return chunks

    def _match_partnership_type(self, extracted_type: str) -> str:
        """
        Match extracted partnership type to predefined dropdown options using fuzzy matching.
        """
        if not extracted_type:
            return ""

        # Direct exact match first
        for option in self.partnership_options:
            if extracted_type.lower() == option.lower():
                return option

        # Fuzzy matching with difflib
        matches = get_close_matches(
            extracted_type,
            self.partnership_options,
            n=1,
            cutoff=0.6
        )

        if matches:
            return matches[0]

        # Keyword-based matching for common patterns
        extracted_lower = extracted_type.lower()

        # Research-related
        if any(keyword in extracted_lower for keyword in ['research', 'collaboration']):
            if 'training' in extracted_lower:
                return 'MOA on Training and Research Collaboration'
            else:
                return 'MOA on Research'

        # Exchange-related
        if 'exchange' in extracted_lower:
            if 'faculty' in extracted_lower:
                return 'MOA on Faculty Exchange'
            elif 'student' in extracted_lower:
                return 'MOA on Student Exchange'
            elif 'academic' in extracted_lower:
                return 'MOA on Academic Exchange'
            elif 'cultural' in extracted_lower:
                return 'MOA on Cultural Exchange'
            else:
                return 'MOA on Academic Exchange'

        # Educational cooperation
        if any(keyword in extracted_lower for keyword in ['education', 'academic', 'cooperation']):
            return 'MOA on International Educational Cooperation'

        # Training/internship
        if any(keyword in extracted_lower for keyword in ['training', 'internship']):
            return 'MOA on Training and Research Collaboration'

        # Default fallback
        return 'Agreement'

    def _map_to_agreement_fields(self, extracted: Dict[str, Any], full_text: str) -> Dict[str, Any]:
        """
        Map extracted data to the final agreement structure matching AgreementCreate schema.
        Combines all extracted information into properly structured format.
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
            "dts_status": extracted.get("dts_status", "OPEN - OIA"),
            "hardcopy_location": extracted.get("hardcopy_location", ""),
            "entry_type": "Extracted",
            "remarks": extracted.get("remarks", "")
        }

        # Add any additional fields from QA extraction
        for field in ["partner_website", "partner_description"]:
            if field in extracted and not result["partner"].get(field.replace("partner_", "")):
                result["partner"][field.replace("partner_", "")] = extracted[field]

        return result


class NLPService:
    """
    Prepares extracted document text for BERT / NLP pipeline.
    Handles cleanup and simple chunking for systems that don't have tokenizer available.
    """

    def prepare_for_bert_extraction(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        if not extracted_data.get("success", False):
            return extracted_data

        text = extracted_data.get("text", "")
        processed_text = self._preprocess_legal_text(text)
        chunks = self._split_text_into_chunks(processed_text, max_length=512)

        return {
            "success": True,
            "original_text": text,
            "processed_text": processed_text,
            "text_chunks": chunks,
            "metadata": {
                "total_pages": extracted_data.get("total_pages", 0),
                "extraction_method": extracted_data.get("extraction_method", ""),
                "chunk_count": len(chunks)
            }
        }

    def _preprocess_legal_text(self, text: str) -> str:
        text = re.sub(r"\n\s*\n", "\n\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n\d+\n", "\n", text)
        return text.strip()

    def _split_text_into_chunks(self, text: str, max_length: int = 512, overlap: int = 50) -> List[str]:
        words = text.split()
        chunks = []
        current_chunk = []
        current_length = 0

        for word in words:
            word_length = len(word) + 1
            if current_length + word_length > max_length and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = current_chunk[-overlap:] + [word]
                current_length = sum(len(w) + 1 for w in current_chunk)
            else:
                current_chunk.append(word)
                current_length += word_length

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks


# Alias for compatibility with main.py import
NlpExtractionService = NLPLegalExtractionService