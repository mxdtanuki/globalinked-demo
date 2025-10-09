import io
from typing import Dict, Any
import pdfplumber
import os
try:
    from docx import Document as DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("Warning: python-docx not available, DOCX processing disabled")

try:
    import fitz  
    FITZ_AVAILABLE = True
except ImportError:
    FITZ_AVAILABLE = False
    print("Warning: PyMuPDF not available, advanced PDF processing disabled")

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
            # Log the error and mark OCR as unavailable (avoid raising)
            print(f"Warning: PaddleOCR not available or failed to initialize: {e}")
            self.ocr = None
            return False

    def _extract_from_image(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text from an image file using OCR.
        """
        try:
            img = Image.open(file_path)

            if not self._ensure_ocr():
                return {
                    "success": False,
                    "error": "OCR not available (PaddleOCR disabled or failed to initialize)",
                    "text": "",
                    "pages": []
                }

            ocr_result = self.ocr.ocr(img, cls=True)
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

            ocr_result = self.ocr.ocr(img, cls=True)
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

                ocr_result = self.ocr.ocr(img, cls=True)
                if ocr_result and ocr_result[0]:
                    all_text.append("\n".join(line[1][0] for line in ocr_result[0]))

            pdf_doc.close()
            return "\n\n".join(all_text)
        except Exception as e:
            return f"PDF OCR failed: {e}"