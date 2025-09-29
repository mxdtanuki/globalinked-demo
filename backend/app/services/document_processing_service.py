import os
import tempfile
from typing import Optional, Dict, Any
import pdfplumber
from docx import Document
from paddleocr import PaddleOCR
import fitz  # PyMuPDF
from PIL import Image
import io

class DocumentProcessingService:
    def __init__(self):
        # Initialize PaddleOCR
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        
    def extract_text_from_file(self, file_path: str, file_extension: str) -> Dict[str, Any]:
        """
        Extract text from various document formats (PDF, DOCX) with OCR fallback.
        """
        try:
            if file_extension.lower() == 'pdf':
                return self._extract_from_pdf(file_path)
            elif file_extension.lower() in ['docx', 'doc']:
                return self._extract_from_docx(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'text': '',
                'pages': []
            }
    
    def _extract_from_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text from PDF using pdfplumber, with OCR fallback for scanned pages.
        """
        extracted_text = []
        pages_data = []
        
        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Try to extract text directly
                    text = page.extract_text()
                    
                    if text and text.strip():  # If text extraction successful
                        extracted_text.append(text)
                        pages_data.append({
                            'page_number': page_num + 1,
                            'text': text,
                            'method': 'direct'
                        })
                    else:
                        # Fallback to OCR for scanned/image pages
                        ocr_text = self._ocr_page_from_pdf(file_path, page_num)
                        extracted_text.append(ocr_text)
                        pages_data.append({
                            'page_number': page_num + 1,
                            'text': ocr_text,
                            'method': 'ocr'
                        })
                        
        except Exception as e:
            # If pdfplumber fails, try OCR on entire PDF
            try:
                ocr_text = self._ocr_entire_pdf(file_path)
                extracted_text = [ocr_text]
                pages_data = [{
                    'page_number': 1,
                    'text': ocr_text,
                    'method': 'ocr_fallback'
                }]
            except Exception as ocr_error:
                return {
                    'success': False,
                    'error': f"PDF extraction failed: {str(e)}, OCR fallback failed: {str(ocr_error)}",
                    'text': '',
                    'pages': []
                }
        
        full_text = '\n\n'.join(extracted_text)
        
        return {
            'success': True,
            'text': full_text,
            'pages': pages_data,
            'total_pages': len(pages_data),
            'extraction_method': 'pdfplumber_with_ocr_fallback'
        }
    
    def _extract_from_docx(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text from DOCX file using python-docx.
        """
        try:
            doc = Document(file_path)
            paragraphs = []
            
            for para in doc.paragraphs:
                if para.text.strip():
                    paragraphs.append(para.text)
            
            # Also extract from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            paragraphs.append(cell.text)
            
            full_text = '\n\n'.join(paragraphs)
            
            return {
                'success': True,
                'text': full_text,
                'pages': [{
                    'page_number': 1,
                    'text': full_text,
                    'method': 'docx'
                }],
                'total_pages': 1,
                'extraction_method': 'python-docx'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"DOCX extraction failed: {str(e)}",
                'text': '',
                'pages': []
            }
    
    def _ocr_page_from_pdf(self, file_path: str, page_num: int) -> str:
        """
        Extract text from a specific PDF page using OCR.
        """
        try:
            # Open PDF and get page as image
            pdf_doc = fitz.open(file_path)
            page = pdf_doc.load_page(page_num)
            
            # Convert page to image
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x scaling for better OCR
            img_data = pix.tobytes("png")
            
            # Convert to PIL Image
            img = Image.open(io.BytesIO(img_data))
            
            # Perform OCR
            ocr_result = self.ocr.ocr(img, cls=True)
            
            # Extract text from OCR results
            text_lines = []
            if ocr_result and ocr_result[0]:
                for line in ocr_result[0]:
                    if line and len(line) > 1:
                        text_lines.append(line[1][0])  # Text content
            
            pdf_doc.close()
            return '\n'.join(text_lines)
            
        except Exception as e:
            return f"OCR failed for page {page_num + 1}: {str(e)}"
    
    def _ocr_entire_pdf(self, file_path: str) -> str:
        """
        Perform OCR on entire PDF by converting all pages to images.
        """
        try:
            pdf_doc = fitz.open(file_path)
            all_text = []
            
            for page_num in range(len(pdf_doc)):
                page = pdf_doc.load_page(page_num)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                
                ocr_result = self.ocr.ocr(img, cls=True)
                
                if ocr_result and ocr_result[0]:
                    page_text = []
                    for line in ocr_result[0]:
                        if line and len(line) > 1:
                            page_text.append(line[1][0])
                    all_text.append('\n'.join(page_text))
            
            pdf_doc.close()
            return '\n\n'.join(all_text)
            
        except Exception as e:
            raise Exception(f"Full PDF OCR failed: {str(e)}")
    
    def prepare_for_bert_extraction(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare extracted text for NLP Legal BERT processing.
        
        Args:
            extracted_data: Result from extract_text_from_file
            
        Returns:
            Processed data ready for BERT model
        """
        if not extracted_data.get('success', False):
            return extracted_data
            
        text = extracted_data.get('text', '')
        
        # Basic text preprocessing for legal documents
        processed_text = self._preprocess_legal_text(text)
        
        # Split into chunks if text is too long (BERT has token limits)
        chunks = self._split_text_into_chunks(processed_text, max_length=512)
        
        return {
            'success': True,
            'original_text': text,
            'processed_text': processed_text,
            'text_chunks': chunks,
            'metadata': {
                'total_pages': extracted_data.get('total_pages', 0),
                'extraction_method': extracted_data.get('extraction_method', ''),
                'chunk_count': len(chunks)
            }
        }
    
    def _preprocess_legal_text(self, text: str) -> str:
        """
        Basic preprocessing for legal text before BERT processing.
        """
        import re
        
        # Remove excessive whitespace
        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        
        # Remove page numbers and headers/footers (basic)
        text = re.sub(r'\n\d+\n', '\n', text)
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        
        return text.strip()
    
    def _split_text_into_chunks(self, text: str, max_length: int = 512, overlap: int = 50) -> list:
        """
        Split text into chunks suitable for BERT processing.
        """
        words = text.split()
        chunks = []
        current_chunk = []
        current_length = 0
        
        for word in words:
            word_length = len(word) + 1  # +1 for space
            
            if current_length + word_length > max_length and current_chunk:
                # Save current chunk
                chunks.append(' '.join(current_chunk))
                
                # Start new chunk with overlap
                overlap_words = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = overlap_words + [word]
                current_length = sum(len(w) + 1 for w in current_chunk)
            else:
                current_chunk.append(word)
                current_length += word_length
        
        # Add remaining chunk
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
