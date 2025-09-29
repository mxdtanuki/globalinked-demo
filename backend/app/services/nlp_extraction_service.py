import re
from datetime import datetime
from dateutil import parser
from typing import Dict, Any, List
from transformers import pipeline
import torch
from difflib import get_close_matches


class NLPLegalExtractionService:
    def __init__(self):
        # Regex patterns as fallback
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

        # Initialize Legal-BERT QA pipeline
        model_name = "nlpaueb/legal-bert-base-uncased"
        self.qa_pipeline = pipeline(
            "question-answering",
            model=model_name,
            tokenizer=model_name,
            device=0 if torch.cuda.is_available() else -1
        )

        # Questions for QA extraction
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
            "partner_name": [
                "What is the name of the partner institution?",
                "Who is the other party to the agreement?",
                "Partner name"
            ],
            "partner_entity_type": [
                "What type of entity is the partner?",
                "Is the partner a university or organization?",
                "Partner entity type"
            ],
            "partner_country": [
                "What country is the partner from?",
                "Partner country"
            ],
            "signatories": [
                "Who are the signatories?",
                "Who signed the agreement?",
                "Signatories"
            ],
            "contact_persons": [
                "Who are the contact persons?",
                "Contact persons",
                "Notices to"
            ],
            "point_persons": [
                "Who are the point persons?",
                "Point persons"
            ],
            "event_info": [
                "What are the objectives of the agreement?",
                "What is the purpose of the cooperation?",
                "What activities are planned?",
                "Event info or context"
            ]
        }

    def extract_moa_for_agreement_response(self, text: str) -> Dict[str, Any]:
        """
        Extract and map fields using Legal-BERT QA and regex fallback.
        """
        clean_text = self._preprocess_text(text)
        extracted: Dict[str, Any] = {}

        # Use QA for main fields
        for field, question_list in self.questions.items():
            answer = self._extract_with_qa(clean_text, question_list)
            if answer:
                extracted[field] = answer

        # Post-process and map to schema
        extracted = self._map_to_agreement_fields(extracted)

        # Fallback to regex for dates and parties if QA missed
        if not extracted.get("date_signed"):
            date_matches = re.findall(self.date_pattern, clean_text)
            if date_matches:
                normalized_dates = self._normalize_dates([d[0] for d in date_matches])
                extracted["date_signed"] = normalized_dates[0] if normalized_dates else None

        if not extracted.get("partners"):
            party_matches = re.findall(self.party_pattern, clean_text)
            if party_matches:
                extracted["partners"] = [
                    {"name": p[0].strip(), "entity_type": "University"},
                    {"name": p[1].strip(), "entity_type": "University"},
                ]

        # Additional regex extractions for validity / expiry
        validity_match = re.search(r"period of\s+(\w+)\s*\(?(\d+)?\)?\s*years?", clean_text, re.IGNORECASE)
        if validity_match and not extracted.get("validity_period"):
            years = int(validity_match.group(2) or validity_match.group(1))
            extracted["validity_period"] = years
            if extracted.get("date_signed"):
                try:
                    start_date = datetime.fromisoformat(extracted["date_signed"])
                    expiry = start_date.replace(year=start_date.year + years)
                    extracted["date_expiry"] = expiry.date().isoformat()
                except Exception:
                    extracted["date_expiry"] = None

        return extracted

    def _extract_with_qa(self, text: str, questions: List[str]) -> str:
        """
        Use QA pipeline to extract answer from text.
        """
        best_answer = ""
        best_score = 0.0

        for question in questions:
            try:
                result = self.qa_pipeline(question=question, context=text)
                if result['score'] > best_score and result['score'] > 0.1:  # Confidence threshold
                    best_answer = result['answer']
                    best_score = result['score']
            except Exception:
                continue

        return best_answer.strip() if best_answer else ""

    def _map_to_agreement_fields(self, extracted: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map QA answers to agreement schema fields.
        """
        mapped = {}

        # Document type
        doc_type = extracted.get("document_type", "").lower()
        if "memorandum of agreement" in doc_type or "moa" in doc_type:
            mapped["document_type"] = "MOA"
        elif "memorandum of understanding" in doc_type or "mou" in doc_type:
            mapped["document_type"] = "MOU"
        else:
            mapped["document_type"] = "Legal Document"

        # Partnership type - match to frontend options
        partnership = extracted.get("partnership_type", "")
        mapped["partnership_type"] = self._match_partnership_type(partnership)

        # Dates
        date_str = extracted.get("date_signed", "")
        if date_str:
            try:
                parsed = parser.parse(date_str, fuzzy=True)
                mapped["date_signed"] = parsed.strftime("%Y-%m-%d")
            except:
                mapped["date_signed"] = date_str

        # Validity
        validity_str = extracted.get("validity_period", "")
        if validity_str:
            try:
                years = int(re.search(r'\d+', validity_str).group())
                mapped["validity_period"] = years
            except:
                pass

        # Partners
        partner_name = extracted.get("partner_name", "")
        if partner_name:
            mapped["partners"] = [{"name": partner_name, "entity_type": extracted.get("partner_entity_type", "University")}]

        # Signatories
        sigs = extracted.get("signatories", "")
        if sigs:
            mapped["signatories_list"] = [s.strip() for s in sigs.split(",") if s.strip()]

        # Contacts / point persons
        contacts_str = extracted.get("contact_persons", "")
        if contacts_str:
            mapped["contact_persons"] = [{"name": c.strip()} for c in contacts_str.split(",") if c.strip()]

        point_str = extracted.get("point_persons", "")
        if point_str:
            mapped["point_persons"] = [{"name": p.strip()} for p in point_str.split(",") if p.strip()]

        # Event info
        mapped["event_info"] = extracted.get("event_info", "")

        return mapped

    def _match_partnership_type(self, extracted: str) -> str:
        """
        Match extracted partnership type to closest frontend option.
        """
        if not extracted:
            return ""
        matches = get_close_matches(extracted.lower(), [opt.lower() for opt in self.partnership_options], n=1, cutoff=0.6)
        if matches:
            # Find the original case
            for opt in self.partnership_options:
                if opt.lower() == matches[0]:
                    return opt
        return extracted  # Return as-is if no match

    def _preprocess_text(self, text: str) -> str:
        text = re.sub(r"\n\s*\n\s*\n", "\n\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()

    def _normalize_dates(self, dates: List[str]) -> List[str]:
        normalized = []
        for d in dates:
            try:
                parsed = parser.parse(d, fuzzy=True)
                normalized.append(parsed.strftime("%Y-%m-%d"))
            except Exception:
                normalized.append(d.strip())
        return normalized


class NLPService:
    """
    Prepares extracted document text for Legal-BERT / NLP pipeline.
    Handles cleanup and chunking for model input.
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