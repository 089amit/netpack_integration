from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import urllib.parse
from database import get_db
from services.manifest_service import generate_manifest_excel, generate_datasheet_excel

router = APIRouter(prefix="/api/manifest", tags=["Manifest"])

@router.get("/generate-manifest/{mawbNumber}")
def download_manifest(mawbNumber: str, db: Session = Depends(get_db)):
    try:
        decoded_mawb = urllib.parse.unquote(mawbNumber).strip()
        excel_stream = generate_manifest_excel(db, decoded_mawb)
        safe_name = urllib.parse.quote(decoded_mawb)
        headers = {
            "Content-Disposition": f'attachment; filename="manifest-{safe_name}.xlsx"'
        }
        return StreamingResponse(
            excel_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Manifest generation failed: {str(e)}")

@router.get("/generate-datasheet/{mawbNumber}")
def download_datasheet(mawbNumber: str, db: Session = Depends(get_db)):
    try:
        decoded_mawb = urllib.parse.unquote(mawbNumber).strip()
        excel_stream = generate_datasheet_excel(db, decoded_mawb)
        safe_name = urllib.parse.quote(decoded_mawb)
        headers = {
            "Content-Disposition": f'attachment; filename="datasheet-{safe_name}.xlsx"'
        }
        return StreamingResponse(
            excel_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data sheet generation failed: {str(e)}")
