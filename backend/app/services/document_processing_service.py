import io
from typing import Dict, Any
import pdfplumber
import os
import logging
import numpy as np

logger = logging.getLogger(__name__)

try:
    from docx import Document as DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    logger.warning("python-docx not available, DOCX processing disabled")

try:
    import fitz  
    FITZ_AVAILABLE = True
except ImportError:
    FITZ_AVAILABLE = False
    logger.warning("PyMuPDF not available, advanced PDF processing disabled")

from PIL import Image

class DocumentProcessingService:
    """
    Handles document parsing and OCR for PDFs, DOCX files, and images.
    Falls back to OCR if text extraction fails.
    """

    def __init__(self):
        self.ocr = None
        # allow disabling paddleocr via env var (useful for deployments)
        self._paddleocr_disabled = os.environ.get("DISABLE_PADDLEOCR", "0") in ("1", "true", "True")

    def _ensure_ocr(self):
        """
        Lazily import and instantiate PaddleOCR when first needed.
        Returns True if OCR is available, False otherwise.
        """
        if self._paddleocr_disabled:
            return False

        if self.ocr is not None:
            return True

        try:
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(use_angle_cls=True, lang="en")
            return True
        except Exception as e:
            logger.warning(f"PaddleOCR not available or failed to initialize: {e}")
            self.ocr = None
            return False

    def _extract_from_image(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text from an image file using OCR.
        """
        try:
            img = Image.open(file_path)
            img_array = np.array(img)

            if not self._ensure_ocr():
                return {
                    "success": False,
                    "error": "OCR not available (PaddleOCR disabled or failed to initialize)",
                    "text": "",
                    "pages": []
                }

            ocr_result = self.ocr.ocr(img_array, cls=True)
            img.close()

            text = "\n".join(line[1][0] for line in ocr_result[0]) if ocr_result and ocr_result[0] else ""
            return {
                "success": True,
                "text": text,
                "pages": [{
                    "page_number": 1,
                    "text": text,
                    "method": "ocr"
                }],
                "total_pages": 1,
                "extraction_method": "paddleocr_image"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Image OCR failed: {str(e)}",
                "text": "",
                "pages": []
            }

    def _ocr_page_from_pdf(self, file_path: str, page_num: int) -> str:
        """
        OCR a single PDF page.
        """
        if not FITZ_AVAILABLE:
            return "PDF OCR not available - PyMuPDF not installed"

        try:
            if not self._ensure_ocr():
                return "PDF OCR not available - PaddleOCR disabled or failed to initialize"

            pdf_doc = fitz.open(file_path)
            page = pdf_doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            img_array = np.array(img)

            ocr_result = self.ocr.ocr(img_array, cls=True)
            img.close()
            pdf_doc.close()

            return "\n".join(line[1][0] for line in ocr_result[0]) if ocr_result and ocr_result[0] else ""
        except Exception as e:
            return f"OCR failed for page {page_num + 1}: {str(e)}"

    def _ocr_entire_pdf(self, file_path: str) -> str:
        """
        OCR all pages in a PDF.
        """
        if not FITZ_AVAILABLE:
            return "PDF OCR not available - PyMuPDF not installed"

        try:
            if not self._ensure_ocr():
                return "PDF OCR not available - PaddleOCR disabled or failed to initialize"

            pdf_doc = fitz.open(file_path)
            all_text = []

            for page_num in range(len(pdf_doc)):
                page = pdf_doc.load_page(page_num)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                img_array = np.array(img)

                ocr_result = self.ocr.ocr(img_array, cls=True)
                img.close()
                if ocr_result and ocr_result[0]:
                    all_text.append("\n".join(line[1][0] for line in ocr_result[0]))

            pdf_doc.close()
            return "\n\n".join(all_text)
        except Exception as e:
            return f"PDF OCR failed: {e}"
        
    def extract_text_from_file(self, file_path: str, ext: str) -> Dict[str, Any]:
        """
        Unified interface expected by NLPLegalExtractionService.
        Returns:
          {
            "success": bool,
            "text": str,
            "pages": List[{"page_number": int, "text": str, "method": str}],
            "total_pages": int,
            "extraction_method": str,
            "error": Optional[str]
          }
        """
        try:
            ext = (ext or "").lower()

            # PDF handling
            if ext == "pdf":
                pages = []
                text_chunks = []
                extraction_method = "pdfplumber"

                try:
                    with pdfplumber.open(file_path) as pdf:
                        for i, page in enumerate(pdf.pages):
                            page_text = page.extract_text() or ""
                            pages.append({
                                "page_number": i + 1,
                                "text": page_text,
                                "method": "pdfplumber"
                            })
                            if page_text.strip():
                                text_chunks.append(page_text)
                except Exception as e:
                    # If pdfplumber fails entirely, try OCR whole PDF
                    ocr_all = self._ocr_entire_pdf(file_path)
                    if isinstance(ocr_all, str) and ocr_all.startswith("PDF OCR failed"):
                        return {
                            "success": False,
                            "error": f"PDF parsing failed and OCR fallback failed: {ocr_all}",
                            "text": "",
                            "pages": [],
                            "total_pages": 0,
                            "extraction_method": "pdfplumber+ocr"
                        }
                    return {
                        "success": True,
                        "text": ocr_all or "",
                        "pages": [{"page_number": 1, "text": ocr_all or "", "method": "paddleocr_pdf"}],
                        "total_pages": 1,
                        "extraction_method": "paddleocr_pdf"
                    }

                full_text = "\n\n".join(text_chunks).strip()

                # If no text was extracted, fallback to OCR
                if not full_text:
                    ocr_all = self._ocr_entire_pdf(file_path)
                    return {
                        "success": bool(ocr_all and ocr_all.strip()),
                        "error": None if (ocr_all and ocr_all.strip()) else "Unable to extract text from PDF (OCR also empty)",
                        "text": ocr_all or "",
                        "pages": [{"page_number": 1, "text": ocr_all or "", "method": "paddleocr_pdf"}],
                        "total_pages": 1,
                        "extraction_method": "paddleocr_pdf"
                    }

                return {
                    "success": True,
                    "text": full_text,
                    "pages": pages,
                    "total_pages": len(pages),
                    "extraction_method": extraction_method
                }

            # DOCX handling (note: .doc legacy format not supported)
            if ext == "docx":
                if not DOCX_AVAILABLE:
                    return {
                        "success": False,
                        "error": "DOCX support not available (python-docx not installed)",
                        "text": "",
                        "pages": [],
                        "total_pages": 0,
                        "extraction_method": "docx"
                    }
                try:
                    doc = DocxDocument(file_path)
                    paragraphs = [p.text for p in doc.paragraphs if p.text]
                    text = "\n".join(paragraphs).strip()
                    return {
                        "success": bool(text),
                        "error": None if text else "Document contains no readable text",
                        "text": text,
                        "pages": [{"page_number": 1, "text": text, "method": "docx"}],
                        "total_pages": 1,
                        "extraction_method": "docx"
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "error": f"DOCX parsing failed: {str(e)}",
                        "text": "",
                        "pages": [],
                        "total_pages": 0,
                        "extraction_method": "docx"
                    }

            # Image handling
            if ext in ("png", "jpg", "jpeg", "tif", "tiff", "bmp", "gif"):
                result = self._extract_from_image(file_path)
                return result

            return {
                "success": False,
                "error": f"Unsupported file type: .{ext}",
                "text": "",
                "pages": [],
                "total_pages": 0,
                "extraction_method": "unsupported"
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Text extraction failed: {str(e)}",
                "text": "",
                "pages": [],
                "total_pages": 0,
                "extraction_method": "unknown"
            }