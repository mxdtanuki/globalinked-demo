from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from database import get_db
from models.agreements import Agreements
from models.document_versions import DocumentVersions
from storage_service import upload_file, get_signed_url
# from dependencies import get_current_user 

router = APIRouter(prefix="/agreements", tags=["Agreements"])

# Upload document version
@router.post("/{agreement_id}/versions", response_model=dict)
async def upload_document_version(
    agreement_id: int,
    file: UploadFile = File(...),
    version_comment: str = Form(None),
    status_at_upload: str = Form(None),
    db: Session = Depends(get_db),
    # current_user: Users = Depends(get_current_user)  # if auth enabled
):
    # 1. Validate if agreement exists
    agreement = db.query(Agreements).filter(Agreements.agreement_id == agreement_id).first()
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")

    # 2. Determine next version number
    last_version = db.query(func.max(DocumentVersions.version_number))\
        .filter(DocumentVersions.agreement_id == agreement_id).scalar()
    version_number = (last_version or 0) + 1

    # 3. Upload to storage
    try:
        stored_path = upload_file(
            agreement_id=agreement_id,
            version_number=version_number,
            file=file.file,
            filename=file.filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    # 4. Insert row
    new_version = DocumentVersions(
        agreement_id=agreement_id,
        version_number=version_number,
        file_path=stored_path,
        uploaded_at=datetime.utcnow(),
        user_id=1,  # TODO: replace with `current_user.user_id`
        version_comment=version_comment,
        status_at_upload=status_at_upload,
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    # 5. Return metadata + signed url
    signed_url = get_signed_url(new_version.file_path)
    return {
        "status": "uploaded",
        "version": {
            "version_id": new_version.version_id,
            "version_number": new_version.version_number,
            "file_path": new_version.file_path,
            "download_url": signed_url,
            "uploaded_at": new_version.uploaded_at.isoformat(),
            "version_comment": new_version.version_comment,
            "status_at_upload": new_version.status_at_upload,
        }
    }

# List all versions for an agreement
@router.get("/{agreement_id}/versions", response_model=List[dict])
async def list_document_versions(
    agreement_id: int,
    db: Session = Depends(get_db),
    # current_user: Users = Depends(get_current_user)
):
    versions = db.query(DocumentVersions).filter(
        DocumentVersions.agreement_id == agreement_id
    ).order_by(DocumentVersions.version_number.desc()).all()

    result = []
    for v in versions:
        result.append({
            "version_id": v.version_id,
            "version_number": v.version_number,
            "file_path": v.file_path,
            "download_url": get_signed_url(v.file_path),
            "uploaded_at": v.uploaded_at.isoformat(),
            "version_comment": v.version_comment,
            "status_at_upload": v.status_at_upload
        })
    return result

# Get a specific version download URL
@router.get("/versions/{version_id}/download", response_model=dict)
async def download_version(version_id: int, db: Session = Depends(get_db)):
    version = db.query(DocumentVersions).filter(
        DocumentVersions.version_id == version_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    return {"download_url": get_signed_url(version.file_path)}

'''
# FRONT END APPLICATION SAMPLE
async function uploadAgreementVersion(agreementId, file, comment, status) {
  const token = localStorage.getItem('access_token'); // for auth if needed

  const formData = new FormData();
  formData.append('file', file);
  formData.append('version_comment', comment || '');
  formData.append('status_at_upload', status || '');

  const response = await fetch(`${API_BASE_URL}/agreements/${agreementId}/versions`, {
    method: 'POST',
    headers: {
      // 'Authorization': `Bearer ${token}`, // if you use auth
    },
    body: formData
  });

  if (!response.ok) throw new Error('Upload failed!');
  return await response.json();
}
'''
