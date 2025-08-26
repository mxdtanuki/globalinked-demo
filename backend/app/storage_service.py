# storage_service.py
import os
from datetime import datetime
from supabase_client import supabase, SUPABASE_BUCKET

def build_file_path(agreement_id: int, version_number: int, filename: str) -> str:
    """
    storage path: agreements/{agreement_id}/v{number}/{filename}
    """
    return f"agreements/{agreement_id}/v{version_number}/{filename}"

def upload_file(agreement_id: int, version_number: int, file, filename: str) -> str:
    """
    Upload file bytes to storage and return the stored path
    """
    file_path = build_file_path(agreement_id, version_number, filename)
    file_bytes = file.read()  # `file` should be FastAPI UploadFile

    # Upload to bucket
    res = supabase.storage.from_(SUPABASE_BUCKET).upload(file_path, file_bytes)
    # Errors = exceptions in new version if fail

    return file_path

def get_signed_url(file_path: str, expires_in: int = 3600) -> str:
    """
    Create a signed URL for download
    """
    res = supabase.storage.from_(SUPABASE_BUCKET).create_signed_url(file_path, expires_in)
    return res.get("signedURL")  # returns a URL string
