import os
import io
from typing import Optional
from supabase import create_client
from pathlib import Path
from storage3.exceptions import StorageApiError

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "agreements")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in env")

print("SUPABASE key starts with:", SUPABASE_SERVICE_KEY[:10])
sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def _normalize_path(dts_number: str, filename: str) -> str:
    # Ensure no leading slashes and safe path
    dts = dts_number.strip("/")
    return f"{dts}/{filename.lstrip('/')}"

def upload_file(
    dts_number: str,
    version_number: int,
    file_stream,
    original_filename: str,
    upsert: bool | str = True
) -> str:
    """
    Uploads bytes from file_stream into the bucket under path:
      <dts_number>/<version_number><ext>
    Returns the stored object path (key) relative to the bucket.
    """
    # derive extension
    ext = Path(original_filename).suffix or ""
    object_name = f"{version_number}{ext}"
    object_path = _normalize_path(dts_number, object_name)  # e.g. "DT2025777777/2.pdf"

    # read bytes
    file_stream.seek(0)
    data = file_stream.read()
    if isinstance(data, str):
        data = data.encode()  # ensure bytes

    # Supabase needs upsert header as string
    upsert_str = "true" if upsert else "false"

    res = sb.storage.from_(SUPABASE_BUCKET).upload(object_path, data, {"upsert": upsert_str})

    # supabase client returns dict; on error 'error' key is present
    if isinstance(res, dict) and res.get("error"):
        raise RuntimeError(f"Supabase upload error: {res['error']}")

    return object_path  # relative path only, no bucket

def delete_file(object_path: str) -> None:
    """
    Delete object_path from bucket. object_path is the key stored in DB.
    """
    res = sb.storage.from_(SUPABASE_BUCKET).remove([object_path])
    # supabase returns dict or list; if error present raise
    if isinstance(res, dict) and res.get("error"):
        raise RuntimeError(f"Supabase delete error: {res['error']}")

    return object_path

def get_signed_url(object_path: str, expires_in: int = 3600) -> str:
    """
    Returns a signed URL valid for expires_in seconds.
    Falls back to public URL if object not found or signing fails.
    """
    try:
        res = sb.storage.from_(SUPABASE_BUCKET).create_signed_url(object_path, expires_in)
        if isinstance(res, dict):
            for key in ("signedURL", "signed_url", "signedurl"):
                if res.get(key):
                    return res[key]
    except StorageApiError as e:
        print(f"⚠️ Supabase signed URL failed for {object_path}: {e}")

    # fallback: return a public url if your bucket is public
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{object_path}"
    return public_url

def delete_folder(dts_number: str) -> None:
    """
    Delete all files under the given dts_number folder in Supabase.
    If folder is empty/missing, silently ignore.
    """
    prefix = dts_number.strip("/") + "/"
    try:
        # List all objects under folder
        files = sb.storage.from_(SUPABASE_BUCKET).list(path=prefix)
        if not files:
            return  # nothing to delete

        # Collect full paths
        object_paths = [prefix + f["name"] for f in files if "name" in f]
        if object_paths:
            res = sb.storage.from_(SUPABASE_BUCKET).remove(object_paths)
            if isinstance(res, dict) and res.get("error"):
                raise RuntimeError(f"Supabase delete error: {res['error']}")
    except Exception as e:
        print(f"⚠️ Supabase folder delete warning for {dts_number}: {e}")

