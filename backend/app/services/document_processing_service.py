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
    """Document parsing and OCR service."""

    def __init__(self):
        self.ocr = None
        # allow disabling paddleocr via env var (useful for deployments)
        self._paddleocr_disabled = os.environ.get("DISABLE_PADDLEOCR", "0") in ("1", "true", "True")

    def _ensure_ocr(self):
        """Initialize PaddleOCR if needed."""
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
        """Extract text from image using OCR."""
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
        Uses fallback chain: Primary method → Secondary → OCR
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
        MIN_TEXT_LENGTH = 100  # Reject extraction if text is too short (likely garbage)
        
        try:
            ext = (ext or "").lower()

            # ===== PDF HANDLING =====
            if ext == "pdf":
                logger.info(f"Starting PDF extraction from {file_path}")
                
                # METHOD 1: Try pdfplumber (primary - fast, handles native text)
                try:
                    logger.debug("Attempting PDF extraction via pdfplumber...")
                    pages = []
                    text_chunks = []
                    
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
                    
                    full_text = "\n\n".join(text_chunks).strip()
                    
                    # If we got good text, return it
                    if full_text and len(full_text) >= MIN_TEXT_LENGTH:
                        logger.info(f"✅ pdfplumber extraction successful ({len(full_text)} chars)")
                        return {
                            "success": True,
                            "text": full_text,
                            "pages": pages,
                            "total_pages": len(pages),
                            "extraction_method": "pdfplumber"
                        }
                    else:
                        logger.debug(f"pdfplumber extraction returned insufficient text ({len(full_text)} chars), trying fallback...")
                
                except Exception as e:
                    logger.debug(f"pdfplumber extraction failed: {e}, trying fallback...")
                
                # METHOD 2: Try PyMuPDF (secondary - alternative PDF extraction)
                if FITZ_AVAILABLE:
                    try:
                        logger.debug("Attempting PDF extraction via PyMuPDF...")
                        text_chunks = []
                        pages = []
                        
                        pdf_doc = fitz.open(file_path)
                        for page_num in range(len(pdf_doc)):
                            page = pdf_doc.load_page(page_num)
                            page_text = page.get_text()
                            pages.append({
                                "page_number": page_num + 1,
                                "text": page_text,
                                "method": "fitz"
                            })
                            if page_text.strip():
                                text_chunks.append(page_text)
                        pdf_doc.close()
                        
                        full_text = "\n\n".join(text_chunks).strip()
                        
                        if full_text and len(full_text) >= MIN_TEXT_LENGTH:
                            logger.info(f"✅ PyMuPDF extraction successful ({len(full_text)} chars)")
                            return {
                                "success": True,
                                "text": full_text,
                                "pages": pages,
                                "total_pages": len(pages),
                                "extraction_method": "fitz"
                            }
                        else:
                            logger.debug(f"PyMuPDF extraction returned insufficient text ({len(full_text)} chars), trying OCR...")
                    
                    except Exception as e:
                        logger.debug(f"PyMuPDF extraction failed: {e}, trying OCR...")
                
                # METHOD 3: Fall back to OCR (handles scanned/image-based PDFs)
                logger.debug("Attempting PDF extraction via OCR (PaddleOCR)...")
                ocr_all = self._ocr_entire_pdf(file_path)
                
                if ocr_all and isinstance(ocr_all, str) and len(ocr_all) >= MIN_TEXT_LENGTH and not ocr_all.startswith("PDF OCR"):
                    logger.info(f"✅ OCR extraction successful ({len(ocr_all)} chars)")
                    return {
                        "success": True,
                        "text": ocr_all,
                        "pages": [{"page_number": 1, "text": ocr_all, "method": "paddleocr_pdf"}],
                        "total_pages": 1,
                        "extraction_method": "paddleocr_pdf"
                    }
                
                # All methods failed
                error_msg = "Unable to extract text from PDF (pdfplumber/PyMuPDF/OCR all failed or returned insufficient text)"
                logger.error(f"❌ {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "text": "",
                    "pages": [],
                    "total_pages": 0,
                    "extraction_method": "pdf_failed"
                }

            # ===== DOCX HANDLING =====
            if ext == "docx":
                logger.info(f"Starting DOCX extraction from {file_path}")
                
                if not DOCX_AVAILABLE:
                    error_msg = "DOCX support not available (python-docx not installed)"
                    logger.error(f"❌ {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg,
                        "text": "",
                        "pages": [],
                        "total_pages": 0,
                        "extraction_method": "docx"
                    }
                
                try:
                    doc = DocxDocument(file_path)
                    paragraphs = [p.text for p in doc.paragraphs if p.text]
                    text = "\n".join(paragraphs).strip()
                    
                    if text and len(text) >= MIN_TEXT_LENGTH:
                        logger.info(f"✅ DOCX extraction successful ({len(text)} chars)")
                        return {
                            "success": True,
                            "error": None,
                            "text": text,
                            "pages": [{"page_number": 1, "text": text, "method": "docx"}],
                            "total_pages": 1,
                            "extraction_method": "docx"
                        }
                    else:
                        error_msg = f"Document contains insufficient readable text ({len(text)} chars)"
                        logger.warning(f"⚠️ {error_msg}")
                        return {
                            "success": False,
                            "error": error_msg,
                            "text": "",
                            "pages": [],
                            "total_pages": 0,
                            "extraction_method": "docx"
                        }
                
                except Exception as e:
                    error_msg = f"DOCX parsing failed: {str(e)}"
                    logger.error(f"❌ {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg,
                        "text": "",
                        "pages": [],
                        "total_pages": 0,
                        "extraction_method": "docx"
                    }

            # ===== IMAGE HANDLING =====
            if ext in ("png", "jpg", "jpeg", "tif", "tiff", "bmp", "gif"):
                logger.info(f"Starting image extraction from {file_path}")
                result = self._extract_from_image(file_path)
                
                # Check if text is sufficient
                text = result.get("text", "")
                if text and len(text) >= MIN_TEXT_LENGTH:
                    logger.info(f"✅ Image extraction successful ({len(text)} chars)")
                    result["success"] = True
                else:
                    logger.error(f"❌ Image extraction returned insufficient text ({len(text)} chars)")
                    result["success"] = False
                    result["error"] = "Image does not contain sufficient readable text"
                
                return result

            # ===== UNSUPPORTED FORMAT =====
            error_msg = f"Unsupported file type: .{ext}"
            logger.error(f"❌ {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "text": "",
                "pages": [],
                "total_pages": 0,
                "extraction_method": "unsupported"
            }

        except Exception as e:
            error_msg = f"Text extraction failed: {str(e)}"
            logger.exception(f"❌ {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "text": "",
                "pages": [],
                "total_pages": 0,
                "extraction_method": "unknown"
            }