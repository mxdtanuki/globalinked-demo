from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.utils.audit_utils import log_file_upload
from typing import List, Optional
from storage3.exceptions import StorageApiError
import traceback
from app.database import get_db
from app.models.agreements import Agreements
from app.models.users import Users
from app.utils.utils import get_current_user
from app.models.document_versions import DocumentVersions
from app.schemas.document_schemas import DocumentVersionResponse
from app.models.partners import Partners
from app.schemas.document_schemas import DocumentVersionFullResponse
from app.services.supabase_service import (
    upload_file,
    get_signed_url,
    delete_file
)

router = APIRouter(prefix="/documents", tags=["Documents"])

# placeholder user id until auth is implemented
PLACEHOLDER_USER_ID = 1


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
    current_user: Users = Depends(get_current_user),
):
    print(f"UPLOAD VERSION HIT: dts_number={dts_number}, file={file.filename}, version_comment={version_comment}, status_at_upload={status_at_upload}")

    # Upload a new version
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
        log_file_upload(db, current_user, dts_number, new_version.version_number)
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
    """List all versions for a dts_number."""
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
    """Get signed download URL."""
    v = db.query(DocumentVersions).filter(DocumentVersions.version_id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")
    return {"download_url": get_signed_url(v.file_path)}

# -------------------------------
# READ for docVersions with partner + agreement info
# -------------------------------
@router.get("/versions/all", response_model=List[DocumentVersionFullResponse])
async def list_all_versions(db: Session = Depends(get_db)):
    results = (
        db.query(
            DocumentVersions.version_id,
            DocumentVersions.uploaded_at,
            DocumentVersions.dts_number,
            DocumentVersions.version_number,
            DocumentVersions.version_comment,
            DocumentVersions.status_at_upload,
            DocumentVersions.file_path,
            DocumentVersions.user_id,   
            Agreements.document_type,
            Agreements.partnership_type,
            Partners.name.label("partner_name"),
            func.max(DocumentVersions.uploaded_at).over(
                partition_by=DocumentVersions.dts_number
            ).label("latest_uploaded_at"),
        )
        .join(Agreements, DocumentVersions.dts_number == Agreements.dts_number)
        .join(Partners, Agreements.partner_id == Partners.partner_id)
        .order_by(
            func.max(DocumentVersions.uploaded_at).over(
                partition_by=DocumentVersions.dts_number
            ).desc(),
            DocumentVersions.uploaded_at.desc()
        )
        .all()
    )

    response = []
    for r in results:
        # Safe signed URL
        try:
            download_url = get_signed_url(r.file_path)
        except Exception as e:
            print(f"Error signing URL for {r.file_path}: {e}")
            download_url = None

        response.append({
            "version_id": r.version_id,
            "uploaded_at": r.uploaded_at,
            "dts_number": r.dts_number,
            "version_number": r.version_number,
            "version_comment": r.version_comment,
            "status_at_upload": r.status_at_upload,
            "document_type": r.document_type,
            "partnership_type": r.partnership_type,
            "partner_name": r.partner_name,
            "file_path": r.file_path,
            "download_url": download_url,
            "user_id": r.user_id,   
        })

    return response

'''
@router.get("/versions/all", response_model=List[DocumentVersionFullResponse])
async def list_all_versions(db: Session = Depends(get_db)):
    results = (
        db.query(
            DocumentVersions.version_id,
            DocumentVersions.uploaded_at,
            DocumentVersions.dts_number,
            DocumentVersions.version_number,
            DocumentVersions.version_comment,
            DocumentVersions.status_at_upload,
            DocumentVersions.file_path,
            DocumentVersions.user_id,   
            Agreements.document_type,
            Agreements.partnership_type,
            Partners.name.label("partner_name"),
        )
        .join(Agreements, DocumentVersions.dts_number == Agreements.dts_number)
        .join(Partners, Agreements.partner_id == Partners.partner_id)
        .order_by(DocumentVersions.uploaded_at.desc())
        .all()
    )

    response = []
    for r in results:
        response.append({
            "version_id": r.version_id,
            "uploaded_at": r.uploaded_at,
            "dts_number": r.dts_number,
            "version_number": r.version_number,
            "version_comment": r.version_comment,
            "status_at_upload": r.status_at_upload,
            "document_type": r.document_type,
            "partnership_type": r.partnership_type,
            "partner_name": r.partner_name,
            "file_path": r.file_path,
            "download_url": get_signed_url(r.file_path),
            "user_id": r.user_id,   
        })

    return response
'''
# -------------------------------
# UPDATE (Replace file / metadata)
# -------------------------------
@router.put("/versions/{version_id}", response_model=dict)
async def update_version(
    request: Request,
    version_id: int,
    version_comment: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    print("⚡ Request content-type:", request.headers.get("content-type"))

    try:
        v = db.query(DocumentVersions).filter(DocumentVersions.version_id == version_id).first()
        if not v:
            raise HTTPException(status_code=404, detail="Version not found")

        new_file_path = None
        if file:
            print(f"📂 Received file: {file.filename}")
            new_file_path = upload_file(
                dts_number=v.dts_number,
                version_number=v.version_number,
                file_stream=file.file,
                original_filename=file.filename,
                upsert=True
            )
            print(f"✅ Uploaded file to: {new_file_path}")

        if new_file_path:
            old_path = v.file_path
            v.file_path = new_file_path

            # Only delete if the object key actually changed
            if old_path != new_file_path:
                try:
                    delete_file(old_path)
                    print(f"🗑️ Deleted old file: {old_path}")
                except Exception as del_err:
                    print("⚠️ Delete failed:", del_err)


        if version_comment is not None:
            print(f"✏️ Updating comment: {version_comment}")
            v.version_comment = version_comment

        db.commit()
        db.refresh(v)

        return {
            "status": "updated",
            "version": DocumentVersionResponse(
                version_id=v.version_id,
                dts_number=v.dts_number,
                version_number=v.version_number,
                file_path=v.file_path,
                download_url=get_signed_url(v.file_path),
                uploaded_at=v.uploaded_at,
                user_id=v.user_id,
                version_comment=v.version_comment,
                status_at_upload=v.status_at_upload,
            ).model_dump()
        }

    except Exception as e:
        print("Unhandled error in update_version:", e)
        traceback.print_exc()
        raise


'''
@router.put("/versions/{version_id}", response_model=dict)
async def update_version(
    request: Request,
    version_id: int,
    version_comment: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    print("⚡ Request content-type:", request.headers.get("content-type"))
    """
    Update only version_comment and/or replace the file.
    Never delete old file unless new one is confirmed uploaded.
    """
    v = db.query(DocumentVersions).filter(DocumentVersions.version_id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")

    # Step 1: Upload replacement file (if provided) but don't delete yet
    if file:
        try:
            new_file_path = upload_file(
                dts_number=v.dts_number,
                version_number=v.version_number,
                file_stream=file.file,
                original_filename=file.filename,
                upsert=True
            )
        except Exception as e:
            import traceback
            print("🔥 Upload error in update_version:", e)
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to upload replacement file: {str(e)}")


    # Step 2: Apply DB updates
    if new_file_path:
        old_path = v.file_path
        v.file_path = new_file_path
        try:
            delete_file(old_path)  # now it's safe
        except Exception:
            # log warning but don’t fail request
            pass

    if version_comment is not None:
        v.version_comment = version_comment

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
'''
# -------------------------------
# DELETE
# -------------------------------
@router.delete("/versions/{version_id}", response_model=dict)
async def delete_version(version_id: int, db: Session = Depends(get_db)):
    """Delete a document version + file from Supabase.
    Only allow deleting the oldest or latest version for a given dts_number.
    """
    v = db.query(DocumentVersions).filter(DocumentVersions.version_id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")

    # Get min and max version numbers for this dts_number
    min_ver, max_ver = (
        db.query(
            func.min(DocumentVersions.version_number),
            func.max(DocumentVersions.version_number)
        )
        .filter(DocumentVersions.dts_number == v.dts_number)
        .first()
    )

    # Check rule
    if v.version_number not in (min_ver, max_ver):
        raise HTTPException(
            status_code=400,
            detail="Only the oldest or latest version of a document can be deleted."
        )

    try:
        delete_file(v.file_path)
    except Exception as e:
        print(f"⚠️ Supabase delete warning: {e}")

    db.delete(v)
    db.commit()
    return {"status": "deleted", "version_id": version_id}


# -------------------------------
# NLP EXTRACTION
# -------------------------------
@router.post("/extract-metadata", response_model=dict)
async def extract_agreement_metadata(
    request: Request,
    file: UploadFile = File(...),
):
    """
    Extract agreement metadata from uploaded document using the shared NLP service.
    """
    try:
        print(f"NLP extraction endpoint called, filename={getattr(file, 'filename', None)}")

        # Save uploaded file temporarily
        import tempfile, os
        suffix = os.path.splitext(getattr(file, 'filename', 'upload'))[1] or ''
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp_path = tmp.name
        try:
            content = await file.read()
            tmp.write(content)
            tmp.flush()
        finally:
            tmp.close()

        print(f"Saved uploaded file to temporary path: {tmp_path}")

        try:
            nlp_service = getattr(request.app.state, "nlp_service", None)
            if nlp_service is None:
                # Fallback (shouldn't be necessary if startup handler sets it)
                print("⚠ app.state.nlp_service not found — instantiating NLPLegalExtractionService lazily (not recommended)")
                from app.services.nlp_extraction_service import NLPLegalExtractionService
                nlp_service = NLPLegalExtractionService()
            else:
                print("Using startup-instantiated NLPLegalExtractionService")

            metadata = nlp_service.extract_agreement_metadata(tmp_path)
            print(f"NLP extraction completed, result type: {type(metadata)}")

        except Exception as nlp_error:
            print(f"NLP service initialization/extraction failed: {nlp_error}")
            import traceback
            traceback.print_exc()
            metadata = {"error": f"NLP extraction failed: {str(nlp_error)}"}

        # Clean up temp file
        try:
            os.remove(tmp_path)
            print(f"Temporary file {tmp_path} cleaned up")
        except Exception as cleanup_error:
            print(f"Warning: failed to remove temp file {tmp_path}: {cleanup_error}")

        # Handle service-level errors
        if isinstance(metadata, dict) and metadata.get("error"):
            error_msg = metadata.get("error", "Unknown extraction error")
            print(f"NLP service returned error: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail=f"Document processing failed: {error_msg}. Please check if the document contains readable text and try again."
            )

        print("NLP extraction succeeded, returning metadata")
        return {"status": "success", "metadata": metadata}

    except HTTPException:
        raise
    except Exception as e:
        import traceback as _tb
        print("NLP extraction exception:", str(e))
        _tb.print_exc()
        raise HTTPException(status_code=500, detail=f"NLP extraction failed: {str(e)}")


