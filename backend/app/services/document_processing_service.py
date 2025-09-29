import io
from typing import Dict, Any
import pdfplumber
from docx import Document
from paddleocr import PaddleOCR
import fitz  # PyMuPDF
from PIL import Image


class DocumentProcessingService:
    """
    Handles document parsing and OCR for PDFs and DOCX files.
    Falls back to OCR if text extraction fails.
    """

    def __init__(self):
        # Initialize PaddleOCR (English, angle detection enabled, no verbose logs)
        self.ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)

    def extract_text_from_file(self, file_path: str, file_extension: str) -> Dict[str, Any]:
        """
        Extract text from PDF or DOCX. Falls back to OCR for PDFs if needed.
        """
        try:
            if file_extension.lower() == "pdf":
                return self._extract_from_pdf(file_path)
            elif file_extension.lower() in ["docx", "doc"]:
                return self._extract_from_docx(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "text": "",
                "pages": []
            }

    def _extract_from_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text from a PDF. Uses pdfplumber first, then OCR if no text.
        """
        extracted_text = []
        pages_data = []

        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()

                    if text and text.strip():
                        # Direct extraction success
                        extracted_text.append(text)
                        pages_data.append({
                            "page_number": page_num + 1,
                            "text": text,
                            "method": "direct"
                        })
                    else:
                        # OCR fallback for scanned/image-only pages
                        ocr_text = self._ocr_page_from_pdf(file_path, page_num)
                        extracted_text.append(ocr_text)
                        pages_data.append({
                            "page_number": page_num + 1,
                            "text": ocr_text,
                            "method": "ocr"
                        })
        except Exception as e:
            # If pdfplumber fails entirely, OCR the whole PDF
            try:
                ocr_text = self._ocr_entire_pdf(file_path)
                extracted_text = [ocr_text]
                pages_data = [{
                    "page_number": 1,
                    "text": ocr_text,
                    "method": "ocr_fallback"
                }]
            except Exception as ocr_error:
                return {
                    "success": False,
                    "error": f"PDF extraction failed: {str(e)}, OCR fallback failed: {str(ocr_error)}",
                    "text": "",
                    "pages": []
                }

        return {
            "success": True,
            "text": "\n\n".join(extracted_text),
            "pages": pages_data,
            "total_pages": len(pages_data),
            "extraction_method": "pdfplumber_with_ocr_fallback"
        }

    def _extract_from_docx(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text from a DOCX file using python-docx.
        """
        try:
            doc = Document(file_path)
            paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]

            # Extract table text too
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            paragraphs.append(cell.text)

            full_text = "\n\n".join(paragraphs)

            return {
                "success": True,
                "text": full_text,
                "pages": [{
                    "page_number": 1,
                    "text": full_text,
                    "method": "docx"
                }],
                "total_pages": 1,
                "extraction_method": "python-docx"
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"DOCX extraction failed: {str(e)}",
                "text": "",
                "pages": []
            }

    def _ocr_page_from_pdf(self, file_path: str, page_num: int) -> str:
        """
        OCR a single PDF page.
        """
        try:
            pdf_doc = fitz.open(file_path)
            page = pdf_doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # upscale for OCR accuracy
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
