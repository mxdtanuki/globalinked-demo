from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Optional

from app.database import get_db
from app.models.agreements import Agreements
from app.models.document_versions import DocumentVersions
from app.schemas.document_schemas import DocumentVersionResponse
from app.services.supabase_service import (
    upload_file,
    get_signed_url,
    delete_file,
    create_folder_placeholder
)

router = APIRouter(prefix="/documents", tags=["Documents"])

# placeholder user id until auth is implemented
PLACEHOLDER_USER_ID = 2


# -------------------------------
# CREATE (Upload new document version)
# -------------------------------
@router.post("/{dts_number}/versions", response_model=dict)
async def upload_version(
    dts_number: str,
    file: UploadFile = File(...),
    version_comment: Optional[str] = Form(None),
    status_at_upload: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    print(f"UPLOAD VERSION HIT: dts_number={dts_number}, file={file.filename}, version_comment={version_comment}, status_at_upload={status_at_upload}")

    """Upload a new version for an agreement identified by dts_number."""
    # 1 Validate agreement exists
    agreement = db.query(Agreements).filter(Agreements.dts_number == dts_number).first()
    if not agreement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agreement not found")

    # 2 Determine next version_number
    last_version = db.query(func.max(DocumentVersions.version_number))\
        .filter(DocumentVersions.dts_number == dts_number).scalar()
    version_number = (last_version or 0) + 1

    # 3 Upload file to Supabase storage
    try:
        stored_path = upload_file(
            dts_number=dts_number,
            version_number=version_number,
            file_stream=file.file,
            original_filename=file.filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    # 4 Insert DB row
    new_version = DocumentVersions(
        dts_number=dts_number,
        version_number=version_number,
        file_path=stored_path,
        uploaded_at=datetime.utcnow(),
        user_id=PLACEHOLDER_USER_ID,
        version_comment=version_comment,
        status_at_upload=status_at_upload 
    )
    db.add(new_version)
    try:
        db.commit()
    except Exception as e:
        print(f"DB COMMIT FAILED: {e}")
        raise
    db.refresh(new_version)

    download_url = get_signed_url(new_version.file_path)
    return {
        "status": "uploaded",
        "version": DocumentVersionResponse(
            version_id=new_version.version_id,
            dts_number=new_version.dts_number,
            version_number=new_version.version_number,
            file_path=new_version.file_path,
            download_url=download_url,
            uploaded_at=new_version.uploaded_at,
            user_id=new_version.user_id,
            version_comment=new_version.version_comment,
            status_at_upload=new_version.status_at_upload
        ).model_dump()
    }


# -------------------------------
# READ (List all versions by dts_number)
# -------------------------------
@router.get("/{dts_number}/versions", response_model=List[DocumentVersionResponse])
async def list_versions(dts_number: str, db: Session = Depends(get_db)):
    """List all document versions for a dts_number (descending by version_number)."""
    versions = db.query(DocumentVersions)\
        .filter(DocumentVersions.dts_number == dts_number)\
        .order_by(DocumentVersions.version_number.desc())\
        .all()

    return [
        DocumentVersionResponse(
            version_id=v.version_id,
            dts_number=v.dts_number,
            version_number=v.version_number,
            file_path=v.file_path,
            download_url=get_signed_url(v.file_path),
            uploaded_at=v.uploaded_at,
            user_id=v.user_id,
            version_comment=v.version_comment,
            status_at_upload=v.status_at_upload
        )
        for v in versions
    ]


# -------------------------------
# READ (Download one version)
# -------------------------------
@router.get("/versions/{version_id}/download", response_model=dict)
async def get_download_url(version_id: int, db: Session = Depends(get_db)):
    """Get a signed download URL for one version by version_id."""
    v = db.query(DocumentVersions).filter(DocumentVersions.version_id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")
    return {"download_url": get_signed_url(v.file_path)}


# -------------------------------
# UPDATE (Replace file / metadata)
# -------------------------------
@router.put("/versions/{version_id}", response_model=dict)
async def update_version(
    version_id: int,
    version_comment: Optional[str] = Form(None),
    status_at_upload: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Update metadata of a version and optionally replace the file.
    File name stays <version_number>.<ext>.
    """
    v = db.query(DocumentVersions).filter(DocumentVersions.version_id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")

    # If file provided -> replace
    if file:
        try:
            delete_file(v.file_path)  # best effort
        except Exception:
            pass
        try:
            stored_path = upload_file(
                dts_number=v.dts_number,
                version_number=v.version_number,
                file_stream=file.file,
                original_filename=file.filename,
                upsert=True
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload replacement file: {e}")
        v.file_path = stored_path

    if version_comment is not None:
        v.version_comment = version_comment
    if status_at_upload is not None:
        v.status_at_upload = status_at_upload

    db.commit()
    db.refresh(v)

    return {"status": "updated", "version": DocumentVersionResponse(
        version_id=v.version_id,
        dts_number=v.dts_number,
        version_number=v.version_number,
        file_path=v.file_path,
        download_url=get_signed_url(v.file_path),
        uploaded_at=v.uploaded_at,
        user_id=v.user_id,
        version_comment=v.version_comment,
        status_at_upload=v.status_at_upload,
    ).model_dump()}


# -------------------------------
# DELETE
# -------------------------------
@router.delete("/versions/{version_id}", response_model=dict)
async def delete_version(version_id: int, db: Session = Depends(get_db)):
    """Delete a document version + file from Supabase."""
    v = db.query(DocumentVersions).filter(DocumentVersions.version_id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")

    try:
        delete_file(v.file_path)
    except Exception:
        pass

    db.delete(v)
    db.commit()
    return {"status": "deleted", "version_id": version_id}


# -------------------------------
# Utility: Create folder
# -------------------------------
@router.post("/{dts_number}/create-folder", response_model=dict)
async def create_folder(dts_number: str):
    """Manually create a folder (prefix) in Supabase for this DTS number."""
    try:
        path = create_folder_placeholder(dts_number)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "created", "path": path}
