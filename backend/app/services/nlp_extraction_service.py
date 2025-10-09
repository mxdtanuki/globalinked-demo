import os
import re
import logging
from datetime import datetime
from dateutil import parser
from typing import Dict, Any, List, Optional, Tuple

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
      - Per-question token-budgeting in the QA stage to avoid model token-limit errors.
    """

    def __init__(self, model_override: Optional[str] = None, qa_confidence_threshold: Optional[float] = None):
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
        self.doc_processor = DocumentProcessingService()

        # QA pipeline + tokenizer placeholders (lazy-loaded)
        self.qa_pipeline: Optional[Pipeline] = None
        self.tokenizer: Optional[AutoTokenizer] = None
        self.model_name_in_use: Optional[str] = None

        # track preferred model name for lazy loading
        env_override = os.getenv("QA_MODEL_OVERRIDE", "").strip() or None
        override_model = model_override.strip() if (model_override and model_override.strip()) else env_override
        legal_bert_name = "nlpaueb/legal-bert-base-uncased"
        self._preferred_model = override_model if override_model else legal_bert_name

        # store threshold
        if qa_confidence_threshold is not None:
            try:
                self.qa_confidence_threshold = float(qa_confidence_threshold)
            except Exception:
                self.qa_confidence_threshold = float(os.getenv("QA_CONFIDENCE_THRESHOLD", "0.10"))
        else:
            self.qa_confidence_threshold = float(os.getenv("QA_CONFIDENCE_THRESHOLD", "0.10"))

        # internal flags for loading
        self._qa_loading = False

        # Expanded questions for QA extraction
        self.questions = {
            "document_type": [
                "What type of document is this?",
                "Is this a Memorandum of Agreement or Memorandum of Understanding?",
                "Document type"
            ],
            "partnership_type": [
                "What is the agreement on?",
                "What is the partnership type?",
                "What is the subject of the agreement?"
            ],
            "date_signed": [
                "When was the agreement signed?",
                "What is the date of signing?",
                "Date signed"
            ],
            "validity_period": [
                "What is the validity period?",
                "How many years is the agreement valid for?",
                "Validity period in years"
            ],
            "date_expiry": [
                "What is the expiry date?",
                "When does the agreement expire?",
                "Date of expiry"
            ],
            "partner_name": [
                "What is the name of the partner institution?",
                "Who is the other party to the agreement?",
                "Partner name"
            ],
            "partner_entity_type": [
                "What type of entity is the partner?",
                "Is the partner a university, company, or organization?",
                "Partner entity type"
            ],
            "partner_country": [
                "What country is the partner located in?",
                "Partner country"
            ],
            "partner_region": [
                "What region is the partner in?",
                "Partner region"
            ],
            "partner_address": [
                "What is the address of the partner?",
                "Partner address"
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
                "Who are the contact persons?",
                "Contact persons with names, positions, and emails",
                "Notices to"
            ],
            "point_persons": [
                "Who are the point persons?",
                "Point persons with names, positions, and emails"
            ],
            "event_info": [
                "What are the objectives of the agreement?",
                "What is the purpose of the cooperation?",
                "What activities are planned?",
                "Event info or context"
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
                logger.info(f"✓ QA pipeline loaded: {preferred}")
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
                    logger.info(f"✓ Fallback QA model loaded: {fallback}")
                    return True
                except Exception as e2:
                    logger.error(f"Failed to load fallback QA model ({fallback}): {e2}; QA disabled, falling back to regex-only.")
                    self.qa_pipeline = None
                    self.tokenizer = None
                    self.model_name_in_use = None
                    return False
        finally:
            self._qa_loading = False

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
                ) if metadata.get("signatories_list") else None,
                "point_persons": [
                    {
                        "point_person_position": p.get("position", ""),
                        "point_person_name": p.get("name", ""),
                        "point_person_email": p.get("email", "")
                    } for p in metadata.get("point_persons", [])
                ],
                "agreement_status": metadata.get("agreement_status", "Active"),
                "hardcopy_location": metadata.get("hardcopy_location"),
                "entry_type": metadata.get("entry_type", "Extracted"),
                "renewed_from_agreement_id": None,
                "MOU_to_MOA_id": None,
                "contact_persons": [
                    {
                        "contact_person_position": c.get("position", ""),
                        "contact_person_name": c.get("name", ""),
                        "contact_person_email": c.get("email", "")
                    } for c in metadata.get("contact_persons", [])
                ],
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
        """
        clean_text = self._preprocess_text(text)
        extracted: Dict[str, Any] = {}

        # Use QA for main fields (chunked)
        for field, question_list in self.questions.items():
            answer = self._extract_with_qa(clean_text, question_list)
            if answer:
                extracted[field] = answer
                logger.debug(f"QA extracted {field}: {answer}")
            else:
                logger.debug(f"QA returned no answer for {field}; will use regex fallback")

        # Post-process and map to schema
        extracted = self._map_to_agreement_fields(extracted, clean_text)

        # (rest of regex fallbacks unchanged...)
        # Document type detection
        if not extracted.get("document_type"):
            if re.search(r'\bmemorandum of agreement\b|\bmoa\b', clean_text, re.IGNORECASE):
                extracted["document_type"] = "MOA"
            elif re.search(r'\bmemorandum of understanding\b|\bmou\b', clean_text, re.IGNORECASE):
                extracted["document_type"] = "MOU"

        # Partner name extraction - more patterns (improved selection logic)
        if not extracted.get("partner_name"):
            partner_patterns = [
                r"between\s+(.+?)\s+and\s+(.+?)(?:\s*,|\s*\.|\s*and|\s*with)",
                r"party\s+(.+?)\s+and\s+(.+?)(?:\s*,|\s*\.|\s*and|\s*with)",
                r"this agreement is made between\s+(.+?)\s+and\s+(.+?)(?:\s*,|\s*\.|\s*and|\s*with)",
                r"entered into by and between\s+(.+?)\s+and\s+(.+?)(?:\s*,|\s*\.|\s*and|\s*with)"
            ]
            for pattern in partner_patterns:
                matches = re.findall(pattern, clean_text, re.IGNORECASE | re.DOTALL)
                if matches:
                    for match in matches:
                        party1, party2 = match[0].strip(), match[1].strip()
                        p1_lower = party1.lower()
                        p2_lower = party2.lower()
                        # If one contains 'pup' and the other does not -> choose the non-PUP party
                        if ("pup" in p1_lower or "polytechnic" in p1_lower) and ("pup" not in p2_lower and "polytechnic" not in p2_lower):
                            extracted["partner_name"] = party2
                        elif ("pup" in p2_lower or "polytechnic" in p2_lower) and ("pup" not in p1_lower and "polytechnic" not in p1_lower):
                            extracted["partner_name"] = party1
                        else:
                            # fallback: pick the longer, non-empty candidate
                            extracted["partner_name"] = party1 if len(party1) >= len(party2) else party2
                        if extracted.get("partner_name"):
                            break
                    if extracted.get("partner_name"):
                        break

        # Date signed - more patterns
        if not extracted.get("date_signed"):
            date_patterns = [
                r"signed\s+on\s+(.+?)(?:\s*,|\s*\.|\s*and|\s*with|\s*$)",
                r"date[:\s]+(.+?)(?:\s*,|\s*\.|\s*and|\s*with|\s*$)",
                r"executed\s+on\s+(.+?)(?:\s*,|\s*\.|\s*and|\s*with|\s*$)",
                r"this\s+\d+\w*\s+day\s+of\s+(.+?)(?:\s*,|\s*\.|\s*and|\s*with|\s*$)"
            ]
            for pattern in date_patterns:
                match = re.search(pattern, clean_text, re.IGNORECASE)
                if match:
                    date_str = match.group(1).strip()
                    try:
                        parsed = parser.parse(date_str, fuzzy=True)
                        extracted["date_signed"] = parsed.strftime("%Y-%m-%d")
                        break
                    except Exception:
                        continue

        # Validity period - more patterns
        if not extracted.get("validity_period"):
            validity_patterns = [
                r"valid\s+for\s+a\s+period\s+of\s+(\d+)\s+years?",
                r"validity\s+period\s+of\s+(\d+)\s+years?",
                r"term\s+of\s+(\d+)\s+years?",
                r"duration\s+of\s+(\d+)\s+years?",
                r"(\d+)\s+years?\s+from\s+the\s+date",
                r"period\s+of\s+(\d+)\s+years?"
            ]
            for pattern in validity_patterns:
                match = re.search(pattern, clean_text, re.IGNORECASE)
                if match:
                    try:
                        years = int(match.group(1))
                        extracted["validity_period"] = years
                        break
                    except Exception:
                        continue

        # DTS number extraction
        if not extracted.get("dts_number"):
            dts_patterns = [
                r"dts[:\s]*no[:\.\s]*(\w+)",
                r"dts[:\s]*number[:\.\s]*(\w+)",
                r"dts[:\s]*(\w+)",
                r"reference[:\s]*no[:\.\s]*(\w+)",
                r"ref[:\s]*no[:\.\s]*(\w+)"
            ]
            for pattern in dts_patterns:
                match = re.search(pattern, clean_text, re.IGNORECASE)
                if match:
                    extracted["dts_number"] = match.group(1).upper()
                    break

        # Regex for DTS status
        dts_status_match = re.search(r"DTS\s*Status[:\s]*(\w+)", clean_text, re.IGNORECASE)
        if dts_status_match:
            extracted["dts_status"] = dts_status_match.group(1)

        # Compute date_expiry if validity and date_signed are available
        if extracted.get("validity_period") and extracted.get("date_signed"):
            try:
                signed_date = datetime.strptime(extracted["date_signed"], "%Y-%m-%d")
                expiry_date = signed_date.replace(year=signed_date.year + int(extracted["validity_period"]))
                extracted["date_expiry"] = expiry_date.strftime("%Y-%m-%d")
            except Exception:
                pass

        return extracted

    def _extract_with_qa(self, text: str, questions: List[str]) -> str:
        """
        Use QA pipeline to extract answer from text.

        - Enforce per-question token budget: question tokens + context tokens <= tokenizer.model_max_length - SAFETY_BUFFER.
        - Chunk text per question with an allowed context token budget.
        - Aggregate the highest-scoring answer across chunks/questions.
        - Returns an empty string on failure.
        """
        # Try to ensure QA pipeline is ready (this will respect QA_LOAD_AT_STARTUP)
        if not self.qa_pipeline or not self.tokenizer:
            loaded = self._ensure_qa()
            if not loaded:
                # QA unavailable by design (QA_LOAD_AT_STARTUP disabled or failure) -> return empty so regex fallback applies
                return ""

        best_answer = ""
        best_score = 0.0

        # Model token limit
        max_model_tokens = getattr(self.tokenizer, "model_max_length", 512)
        # Minimum context tokens we consider meaningful
        MIN_CONTEXT_TOKENS = 64
        # Safety buffer for special tokens
        SAFETY_BUFFER = 8
        # Base chunk cap (do not exceed this even if model_max is large)
        DEFAULT_CHUNK_BASE = min(512, max_model_tokens - 32)

        for question in questions:
            # Determine token length of question
            try:
                q_enc = self.tokenizer.encode(question, add_special_tokens=False)
                q_len = len(q_enc)
            except Exception:
                # fallback heuristic: number of words
                q_len = min(128, max(1, len(question.split())))

            # Compute allowed context tokens for this question
            allowed_context_tokens = max_model_tokens - q_len - SAFETY_BUFFER

            if allowed_context_tokens < MIN_CONTEXT_TOKENS:
                # Question too long to allow meaningful context — skip it
                logger.debug(f"Skipping QA question (too long): '{question[:80]}...' (q_len={q_len}, model_max={max_model_tokens})")
                continue

            # Choose chunk size for this question
            chunk_size = min(DEFAULT_CHUNK_BASE, allowed_context_tokens)
            # overlap as fraction of chunk_size
            overlap = min(128, max(16, int(chunk_size * 0.15)))

            # Create chunks sized for this question
            chunks = self._chunk_text_tokenizer(text, self.tokenizer, chunk_size=chunk_size, overlap=overlap)

            for chunk_text in chunks:
                try:
                    result = self.qa_pipeline(question=question, context=chunk_text)
                    if isinstance(result, list):
                        candidate = result[0] if result else None
                    else:
                        candidate = result

                    if not candidate:
                        continue

                    score = float(candidate.get("score", 0.0))
                    answer_text = candidate.get("answer", "").strip()
                    if answer_text and score >= self.qa_confidence_threshold and score > best_score:
                        best_answer = answer_text
                        best_score = score
                except Exception as e:
                    logger.debug(f"QA chunk call failed: {e}")
                    continue

        return best_answer.strip() if best_answer else ""

    def _chunk_text_tokenizer(self, text: str, tokenizer: AutoTokenizer, chunk_size: int = 512, overlap: int = 64) -> List[str]:
        """
        Break text into token-aware chunks using the tokenizer, then decode them back to text.
        """
        if not tokenizer:
            # fallback naive splitting (word-based)
            words = text.split()
            chunks = []
            current = []
            cur_len = 0
            for w in words:
                if cur_len + len(w) + 1 > chunk_size and current:
                    chunks.append(" ".join(current))
                    current = current[-overlap:] + [w]
                    cur_len = sum(len(x) + 1 for x in current)
                else:
                    current.append(w)
                    cur_len += len(w) + 1
            if current:
                chunks.append(" ".join(current))
            return chunks

        # Tokenize full text to ids
        try:
            encoding = tokenizer.encode(text, add_special_tokens=False)
        except Exception:
            encoding = tokenizer.encode(text)

        total_tokens = len(encoding)
        if total_tokens == 0:
            return [text]

        chunks = []
        start = 0
        while start < total_tokens:
            end = min(start + chunk_size, total_tokens)
            chunk_ids = encoding[start:end]
            try:
                chunk_text = tokenizer.decode(chunk_ids, skip_special_tokens=True, clean_up_tokenization_spaces=True)
            except Exception:
                # fallback: slice words
                words = text.split()
                chunk_text = " ".join(words[max(0, start - overlap):min(len(words), end + overlap)])
            chunks.append(chunk_text)
            if end == total_tokens:
                break
            start = max(0, end - overlap)

        return chunks

    def _map_to_agreement_fields(self, extracted: Dict[str, Any], text: str) -> Dict[str, Any]:
        """
        Map QA answers to agreement schema fields.
        """
        mapped: Dict[str, Any] = {}

        # Document type
        doc_type = extracted.get("document_type", "") or ""
        low_doc_type = doc_type.lower()
        if "memorandum of agreement" in low_doc_type or "moa" in low_doc_type:
            mapped["document_type"] = "MOA"
        elif "memorandum of understanding" in low_doc_type or "mou" in low_doc_type:
            mapped["document_type"] = "MOU"

        # Partnership type - match to frontend options
        partnership = extracted.get("partnership_type", "")
        mapped["partnership_type"] = self._match_partnership_type(partnership)

        # Dates
        date_str = extracted.get("date_signed", "")
        if date_str:
            try:
                parsed = parser.parse(date_str, fuzzy=True)
                mapped["date_signed"] = parsed.strftime("%Y-%m-%d")
            except Exception:
                mapped["date_signed"] = date_str

        # Validity
        validity_str = extracted.get("validity_period", "")
        if validity_str:
            try:
                years = int(re.search(r'\d+', str(validity_str)).group())
                mapped["validity_period"] = years
            except Exception:
                pass

        # Partner as dict
        partner_name = extracted.get("partner_name", "")
        if partner_name:
            # Extract entity type
            entity_type = extracted.get("partner_entity_type", "")
            if not entity_type:
                pn_lower = partner_name.lower()
                if "university" in pn_lower or "college" in pn_lower:
                    entity_type = "University"
                elif "company" in pn_lower or "corp" in pn_lower or "inc" in pn_lower:
                    entity_type = "Company"
                else:
                    entity_type = "Organization"

            # Extract country and region
            country = extracted.get("partner_country", "")
            if not country:
                # scan for country names in the document text
                for c in self.country_options:
                    if c.lower() in text.lower():
                        country = c
                        break
            region = self.region_mapping.get(country, "") if country else ""

            mapped["partner"] = {
                "name": partner_name,
                "entity_type": entity_type,
                "country": country,
                "region": region,
                "address": extracted.get("partner_address", ""),
                "website": extracted.get("partner_website", ""),
                "description": extracted.get("partner_description", "")
            }

        # Signatories as list of dicts
        sigs_text = extracted.get("signatories", "") or ""
        mapped["signatories_list"] = self._parse_signatories(sigs_text)

        # Contacts and points as list of dicts
        contacts_text = extracted.get("contact_persons", "") or ""
        mapped["contact_persons"] = self._parse_persons(contacts_text)

        points_text = extracted.get("point_persons", "") or ""
        mapped["point_persons"] = self._parse_persons(points_text)

        # Additional fields
        mapped["event_info"] = extracted.get("event_info", "")
        mapped["hardcopy_location"] = extracted.get("hardcopy_location", "")
        mapped["date_received"] = extracted.get("date_received", "")
        mapped["date_endorsed_to_ulco"] = extracted.get("date_endorsed_to_ulco", "")
        mapped["date_ulco_approved"] = extracted.get("date_ulco_approved", "")
        mapped["date_pup_signed"] = extracted.get("date_pup_signed", "")
        mapped["remarks"] = extracted.get("remarks", "")

        # DTS and status
        if extracted.get("dts_number"):
            mapped["dts_number"] = extracted.get("dts_number")
        if extracted.get("dts_status"):
            mapped["dts_status"] = extracted.get("dts_status")

        return mapped

    def _parse_signatories(self, text: str) -> List[Dict[str, str]]:
        """
        Parse signatories text into list of dicts {name, position, institution}.
        Assumes format: "Name, Position, Institution; Name2, Position2, Institution2"
        """
        signatories: List[Dict[str, str]] = []
        if not text:
            return signatories
        for sig in text.split(";"):
            parts = [p.strip() for p in sig.split(",") if p.strip()]
            if len(parts) >= 3:
                signatories.append({"name": parts[0], "position": parts[1], "institution": parts[2]})
            elif len(parts) == 2:
                signatories.append({"name": parts[0], "position": parts[1], "institution": ""})
            else:
                signatories.append({"name": sig.strip(), "position": "", "institution": ""})
        return signatories

    def _parse_persons(self, text: str) -> List[Dict[str, str]]:
        """
        Parse contact/point persons text into list of dicts {name, position, email}.
        Assumes format: "Name, Position, Email; Name2, Position2, Email2"
        """
        persons: List[Dict[str, str]] = []
        if not text:
            return persons
        for person in text.split(";"):
            parts = [p.strip() for p in person.split(",") if p.strip()]
            if len(parts) >= 3:
                persons.append({"name": parts[0], "position": parts[1], "email": parts[2]})
            elif len(parts) == 2:
                persons.append({"name": parts[0], "position": parts[1], "email": ""})
            else:
                persons.append({"name": person.strip(), "position": "", "email": ""})
        return persons

    def _match_partnership_type(self, extracted: str) -> str:
        """
        Match extracted partnership type to closest frontend option.
        """
        if not extracted:
            return ""
        matches = get_close_matches(extracted.lower(), [opt.lower() for opt in self.partnership_options], n=1, cutoff=0.6)
        if matches:
            # Find original case
            for opt in self.partnership_options:
                if opt.lower() == matches[0]:
                    return opt
        return extracted  # Return as-is if no match

    def _preprocess_text(self, text: str) -> str:
        text = re.sub(r"\n\s*\n\s*\n", "\n\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()

    def _normalize_dates(self, dates: List[str]) -> List[str]:
        normalized: List[str] = []
        for d in dates:
            try:
                parsed = parser.parse(d, fuzzy=True)
                normalized.append(parsed.strftime("%Y-%m-%d"))
            except Exception:
                normalized.append(d.strip())
        return normalized


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