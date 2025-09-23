import os
from typing import Optional
from supabase import create_client
from pathlib import Path

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "agreements")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in env")

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def _normalize_path(dts_number: str, filename: str) -> str:
    # Ensure no leading slashes and safe path
    dts = dts_number.strip("/")
    return f"{dts}/{filename.lstrip('/')}"

def upload_file(dts_number: str, version_number: int, file_stream, original_filename: str, upsert: bool = True) -> str:
    """
    Uploads bytes from file_stream into the bucket under path:
      <dts_number>/<version_number><ext>
    Returns the stored object path (key).
    """
    # derive extension
    ext = Path(original_filename).suffix or ""
    object_name = f"{version_number}{ext}"
    object_path = _normalize_path(dts_number, object_name)
    # read bytes
    file_stream.seek(0)
    data = file_stream.read()
    if isinstance(data, str):
        data = data.encode()  # ensure bytes
    res = sb.storage.from_(SUPABASE_BUCKET).upload(object_path, data, {"upsert": upsert})
    # supabase client returns dict; on error 'error' key is present
    if isinstance(res, dict) and res.get("error"):
        raise RuntimeError(f"Supabase upload error: {res['error']}")
    return object_path

def delete_file(object_path: str) -> None:
    """
    Delete object_path from bucket. object_path is the key stored in DB.
    """
    res = sb.storage.from_(SUPABASE_BUCKET).remove([object_path])
    # supabase returns dict or list; if error present raise
    if isinstance(res, dict) and res.get("error"):
        raise RuntimeError(f"Supabase delete error: {res['error']}")

def create_folder_placeholder(dts_number: str) -> str:
    """
    Creates a small placeholder file so the bucket 'folder' exists:
    <dts_number>/.placeholder
    Returns object path.
    """
    object_path = _normalize_path(dts_number, ".placeholder")
    res = sb.storage.from_(SUPABASE_BUCKET).upload(object_path, b"", {"upsert": False})
    if isinstance(res, dict) and res.get("error"):
        # Some storage providers may refuse zero-byte; try small byte instead
        res = sb.storage.from_(SUPABASE_BUCKET).upload(object_path, b" ", {"upsert": False})
        if isinstance(res, dict) and res.get("error"):
            raise RuntimeError(f"Supabase create-folder error: {res['error']}")
    return object_path

def get_signed_url(object_path: str, expires_in: int = 3600) -> str:
    """
    Returns a signed URL valid for expires_in seconds.
    """
    res = sb.storage.from_(SUPABASE_BUCKET).create_signed_url(object_path, expires_in)
    # supabase-py returns a dict with 'signedURL' or 'signed_url' or similar
    if isinstance(res, dict):
        for key in ("signedURL", "signed_url", "signedurl"):
            if res.get(key):
                return res[key]
    # fallback: return a public url if your bucket is public
    # public URL format: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{object_path}
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{object_path}"
    return public_url
