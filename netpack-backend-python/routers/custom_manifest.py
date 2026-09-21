import os
import re
import uuid
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple, Union

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pandas as pd

from database import get_db
from models import MAWB, Shipment, Enquiry, EnquiryItem, Box, Country
from models.customs_consignee import CustomsConsignee, CustomsSetting
from services.custom_manifest_service import (
    suggest_bag_markings,
    prepare_wtbox_data,
    generate_wtbox_excel,
    split_manifest,
    generate_custom_manifest_excel,
    generate_chamber_docx,
    generate_tracking_report_excel,
    create_manifest_zip_bundle,
    extract_sheet_matrix,
    extract_chamber_preview,
    DEFAULT_MAX_BAG_WEIGHT,
    TEMP_OUTPUT_DIR
)


router = APIRouter(prefix="/api/customs", tags=["Customs & Chamber Generator"])

# ─── Schemas ──────────────────────────────────────────────────────────────────

class ConsigneeInput(BaseModel):
    id: Optional[int] = None
    name: str
    address: Optional[str] = ""
    country: Optional[str] = "UK"
    isDefault: Optional[bool] = False

class CustomsSettingsPayload(BaseModel):
    maxBoxPerPart: Optional[int] = 10
    maxUsdPerPart: Optional[float] = 950.0
    maxWeightPerPart: Optional[float] = 1500.0
    lastManifestNumber: Optional[str] = ""

class PreviewPartsRequest(BaseModel):
    mawbNumber: str
    maxBoxPerPart: Optional[int] = 10
    maxUsdPerPart: Optional[float] = 950.0
    maxWeightPerPart: Optional[float] = 1500.0
    isBagBased: Optional[bool] = False
    maxBagWeight: Optional[float] = 30.0
    bagMarkings: Optional[Dict[str, str]] = None
    separateClearanceHawbs: Optional[List[str]] = None

class GenerateCustomsRequest(BaseModel):
    mawbNumber: str
    consignee: Optional[ConsigneeInput] = None
    invoiceNumbers: Optional[List[str]] = None
    invoiceDate: Optional[str] = None
    maxBoxPerPart: Optional[int] = 10
    maxUsdPerPart: Optional[float] = 950.0
    maxWeightPerPart: Optional[float] = 1500.0
    isBagBased: Optional[bool] = False
    maxBagWeight: Optional[float] = 30.0
    bagMarkings: Optional[Dict[str, str]] = None
    separateClearanceHawbs: Optional[List[str]] = None
    narrationText: Optional[str] = None

# ─── Settings Endpoints ───────────────────────────────────────────────────────

@router.get("/settings")
def get_customs_settings(db: Session = Depends(get_db)):
    def _get(k: str, default: str) -> str:
        s = db.query(CustomsSetting).filter(CustomsSetting.key == k).first()
        return s.value if s and s.value is not None else default

    return {
        "maxBoxPerPart": int(_get("max_box_per_part", "10")),
        "maxUsdPerPart": float(_get("max_usd_per_part", "950")),
        "maxWeightPerPart": float(_get("max_weight_per_part", "1500")),
        "lastManifestNumber": _get("last_manifest_number", "")
    }

@router.post("/settings")
@router.put("/settings")
def update_customs_settings(payload: CustomsSettingsPayload, db: Session = Depends(get_db)):
    def _set(k: str, v: Any):
        s = db.query(CustomsSetting).filter(CustomsSetting.key == k).first()
        if not s:
            s = CustomsSetting(key=k, value=str(v))
            db.add(s)
        else:
            s.value = str(v)

    if payload.maxBoxPerPart is not None:
        _set("max_box_per_part", payload.maxBoxPerPart)
    if payload.maxUsdPerPart is not None:
        _set("max_usd_per_part", payload.maxUsdPerPart)
    if payload.maxWeightPerPart is not None:
        _set("max_weight_per_part", payload.maxWeightPerPart)
    if payload.lastManifestNumber is not None:
        _set("last_manifest_number", payload.lastManifestNumber)

    db.commit()
    return {"message": "Settings saved successfully"}

# ─── Consignees Endpoints ─────────────────────────────────────────────────────

@router.get("/consignees")
def list_consignees(db: Session = Depends(get_db)):
    consignees = db.query(CustomsConsignee).order_by(CustomsConsignee.isDefault.desc(), CustomsConsignee.id.asc()).all()
    if not consignees:
        # Seed default
        default_c = CustomsConsignee(
            name="ESHIPPER EXPRESS COURIER",
            address="Unit 4, Heathrow Cargo Centre",
            country="UK",
            isDefault=True
        )
        db.add(default_c)
        db.commit()
        db.refresh(default_c)
        consignees = [default_c]

    return [
        {
            "id": c.id,
            "name": c.name,
            "address": c.address or "",
            "country": c.country or "UK",
            "isDefault": c.isDefault
        }
        for c in consignees
    ]

@router.post("/consignees")
def create_consignee(payload: ConsigneeInput, db: Session = Depends(get_db)):
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Consignee name is required")

    c = CustomsConsignee(
        name=payload.name.strip(),
        address=(payload.address or "").strip(),
        country=(payload.country or "UK").strip(),
        isDefault=bool(payload.isDefault)
    )
    if c.isDefault:
        db.query(CustomsConsignee).update({"isDefault": False})
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "name": c.name, "address": c.address, "country": c.country, "isDefault": c.isDefault}

@router.delete("/consignees/{consignee_id}")
def delete_consignee(consignee_id: int, db: Session = Depends(get_db)):
    c = db.query(CustomsConsignee).filter(CustomsConsignee.id == consignee_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consignee not found")
    db.delete(c)
    db.commit()
    return {"message": "Consignee deleted"}

@router.post("/consignees/reset")
def reset_consignees(db: Session = Depends(get_db)):
    db.query(CustomsConsignee).delete()
    default_c = CustomsConsignee(
        name="ESHIPPER EXPRESS COURIER",
        address="Unit 4, Heathrow Cargo Centre",
        country="UK",
        isDefault=True
    )
    db.add(default_c)
    db.commit()
    return {"message": "Consignees reset to default"}

# ─── MAWB Data Extraction ─────────────────────────────────────────────────────

def _fetch_mawb_shipments(mawb_query: str, db: Session) -> Tuple[Any, List[Dict[str, Any]]]:
    clean_q = mawb_query.strip()
    mawb = db.query(MAWB).filter((MAWB.mawbNumber == clean_q) | (MAWB.destination == clean_q)).first()
    if not mawb and clean_q.isdigit():
        mawb = db.query(MAWB).filter(MAWB.id == int(clean_q)).first()
    if not mawb:
        mawb = db.query(MAWB).filter(MAWB.mawbNumber.ilike(f"%{clean_q}%")).first()

    if not mawb:
        raise HTTPException(status_code=404, detail=f"MAWB '{mawb_query}' not found")

    # Get all linked shipments
    shipments = db.query(Shipment).filter(
        (Shipment.mawbId == mawb.id) | (Shipment.enquiry.has(Enquiry.mawbId == mawb.id))
    ).all()

    formatted_shipments = []
    for s in shipments:
        enq = s.enquiry
        country_name = s.country.name if s.country else (enq.country.name if enq and enq.country else "")
        boxes = s.boxes or (enq.boxes if enq else []) or []
        items = enq.items if enq else []

        pcs = len(boxes) if boxes else (enq.noOfBox if enq and enq.noOfBox else 1)
        w = sum([float(b.weight or 0.0) for b in boxes]) if boxes else (float(enq.weight) if enq and enq.weight else 0.0)
        # Extract items
        enquiry_items = []
        for it in items:
            it_qty = float(it.quantity or 1)
            it_unit_price = float(it.unitPrice or 0.0)
            it_tot_val = float(it.totalValue) if it.totalValue is not None else (it_qty * it_unit_price)
            if it_tot_val == 0.0 and it.value:
                it_tot_val = float(it.value)
            enquiry_items.append({
                "id": it.id,
                "description": it.description or "General Goods",
                "quantity": int(it_qty),
                "unitPrice": it_unit_price,
                "value": float(it.value or 0.0),
                "totalValue": round(it_tot_val, 2),
                "weight": float(it.weight or 0.0),
                "hsCode": it.hsCode or ""
            })

        # Calculate true declared customs value from the sum of enquiry items
        items_total_val = sum([it["totalValue"] for it in enquiry_items]) if enquiry_items else 0.0
        if items_total_val > 0:
            val = items_total_val
        elif enq and enq.items:
            val = sum([float(it.totalValue or ((it.quantity or 1) * (it.unitPrice or 0.0))) for it in enq.items])
        else:
            val = float(enq.estimatedRate or 100.0) if (enq and enq.currency == 'USD') else 100.0

        goods_desc = ", ".join([it["description"] for it in enquiry_items if it.get("description")]) if enquiry_items else "General Goods"

        formatted_shipments.append({
            "id": s.id,
            "hawbno": s.hawbno or (f"NP-HAWB-{s.id:04d}"),
            "forwardingNumber": s.forwardingNumber or "N/A",
            "forwardingServiceName": (s.service.name if s.service else (s.forwardingCompany.name if s.forwardingCompany else "Standard")),
            "senderName": enq.senderName if enq else "Shipper",
            "receiverName": enq.receiverName if enq else "Consignee",
            "destinationCountryName": country_name,
            "noOfBox": pcs,
            "weight": round(w, 2),
            "value": round(val, 2),
            "goodsDescription": goods_desc,
            "status": s.status or "IN_TRANSIT",
            "enquiryItems": enquiry_items
        })

    return mawb, formatted_shipments

@router.get("/mawb-data/{mawbNumber}")
def get_mawb_customs_data(mawbNumber: str, maxBagWeight: float = Query(DEFAULT_MAX_BAG_WEIGHT), db: Session = Depends(get_db)):
    mawb, shipments = _fetch_mawb_shipments(mawbNumber, db)
    auto_bags = suggest_bag_markings(shipments, max_bag_weight=maxBagWeight)
    wt_rows = prepare_wtbox_data(shipments, auto_bags, max_bag_weight=maxBagWeight)

    total_boxes = sum([r["Box"] for r in wt_rows])
    total_weight = sum([r["Weight"] for r in wt_rows])
    total_usd = sum([s["value"] for s in shipments])

    return {
        "mawb": {
            "id": mawb.id,
            "mawbNumber": mawb.mawbNumber,
            "flightNumber": mawb.flightNumber,
            "flightDate": mawb.departureDate.isoformat() if mawb.departureDate else None,
            "arrivalDate": mawb.dateOfArrival.isoformat() if mawb.dateOfArrival else None,
            "destination": mawb.destination,
            "airlineName": mawb.airlineName
        },
        "shipments": shipments,
        "wtRows": wt_rows,
        "suggestedBags": auto_bags,
        "summary": {
            "totalShipments": len(shipments),
            "totalBoxes": total_boxes,
            "totalWeight": round(total_weight, 2),
            "totalUsd": round(total_usd, 2)
        }
    }

@router.post("/preview-parts")
def preview_parts(payload: PreviewPartsRequest, db: Session = Depends(get_db)):
    mawb, shipments = _fetch_mawb_shipments(payload.mawbNumber, db)
    max_box = payload.maxBoxPerPart or 10
    max_usd = payload.maxUsdPerPart or 950.0
    max_wt = payload.maxWeightPerPart or 1500.0
    is_bag = bool(payload.isBagBased)
    max_bag = payload.maxBagWeight or DEFAULT_MAX_BAG_WEIGHT
    bag_markings = payload.bagMarkings or suggest_bag_markings(shipments, max_bag_weight=max_bag)
    sep_hawbs = payload.separateClearanceHawbs or []

    parts = split_manifest(
        shipments=shipments,
        max_box_per_part=max_box,
        max_usd_per_part=max_usd,
        max_weight_per_part=max_wt,
        is_bag_based=is_bag,
        bag_markings=bag_markings,
        separate_clearance_hawbs=sep_hawbs
    )

    result_parts = []
    for p_idx, part_shipments in enumerate(parts, 1):
        p_boxes = sum(int(s.get("noOfBox") or 1) for s in part_shipments)
        p_weight = sum(float(s.get("weight") or 0.0) for s in part_shipments)
        p_usd = sum(float(s.get("value") or 0.0) for s in part_shipments)
        p_hawbs = [s.get("hawbno") for s in part_shipments]
        result_parts.append({
            "partNumber": p_idx,
            "boxes": p_boxes,
            "weight": round(p_weight, 2),
            "usd": round(p_usd, 2),
            "shipmentCount": len(part_shipments),
            "hawbs": p_hawbs
        })

    return {
        "partsCount": len(parts),
        "parts": result_parts
    }

# ─── Generation Endpoint ──────────────────────────────────────────────────────

@router.post("/generate")
def generate_customs_package(payload: GenerateCustomsRequest, db: Session = Depends(get_db)):
    mawb, shipments = _fetch_mawb_shipments(payload.mawbNumber, db)
    if not shipments:
        raise HTTPException(status_code=400, detail="No shipments linked to this MAWB")

    consignee_dict = payload.consignee.dict() if payload.consignee else {"name": "ESHIPPER EXPRESS COURIER", "address": "", "country": "UK"}
    max_box = payload.maxBoxPerPart or 10
    max_usd = payload.maxUsdPerPart or 950.0
    max_wt = payload.maxWeightPerPart or 1500.0
    invoice_date = payload.invoiceDate or datetime.now().strftime("%Y-%m-%d")
    max_bag = payload.maxBagWeight or DEFAULT_MAX_BAG_WEIGHT
    bag_markings = payload.bagMarkings or suggest_bag_markings(shipments, max_bag_weight=max_bag)
    sep_hawbs = payload.separateClearanceHawbs or []

    # 1. WT-Box
    wt_rows = prepare_wtbox_data(shipments, bag_markings, sep_hawbs, max_bag_weight=max_bag)
    wtbox_bytes = generate_wtbox_excel(wt_rows, reference=mawb.mawbNumber)
    wtbox_filename = f"WT_Box_Report_{re.sub(r'[^a-zA-Z0-9]', '_', mawb.mawbNumber)}.xlsx"
    with open(os.path.join(TEMP_OUTPUT_DIR, wtbox_filename), "wb") as f:
        f.write(wtbox_bytes)

    # 2. Tracking Report
    tracking_bytes = generate_tracking_report_excel(shipments, reference=mawb.mawbNumber)
    tracking_filename = f"Tracking_Report_{re.sub(r'[^a-zA-Z0-9]', '_', mawb.mawbNumber)}.xlsx"
    with open(os.path.join(TEMP_OUTPUT_DIR, tracking_filename), "wb") as f:
        f.write(tracking_bytes)

    # 3. Split parts for Customs Manifest & Chamber
    parts = split_manifest(
        shipments=shipments,
        max_box_per_part=max_box,
        max_usd_per_part=max_usd,
        max_weight_per_part=max_wt,
        is_bag_based=bool(payload.isBagBased),
        bag_markings=bag_markings,
        separate_clearance_hawbs=sep_hawbs
    )

    if not parts:
        raise HTTPException(status_code=400, detail="No active shipments remaining after Separate Clearance exclusions.")

    # Invoices
    invoice_nums = payload.invoiceNumbers or []
    while len(invoice_nums) < len(parts):
        next_num = f"INV-{len(invoice_nums) + 1:03d}"
        invoice_nums.append(next_num)

    # Persist last used invoice number in settings
    if invoice_nums and invoice_nums[0]:
        first_inv = invoice_nums[0].strip()
        last_s = db.query(CustomsSetting).filter(CustomsSetting.key == "last_manifest_number").first()
        if not last_s:
            db.add(CustomsSetting(key="last_manifest_number", value=first_inv))
        else:
            last_s.value = first_inv
        try:
            db.commit()
        except Exception:
            db.rollback()

    generated_parts = []
    zip_bundle_files: Dict[str, bytes] = {
        wtbox_filename: wtbox_bytes,
        tracking_filename: tracking_bytes
    }

    safe_mawb = re.sub(r'[^a-zA-Z0-9]', '_', mawb.mawbNumber)

    for p_idx, part_shipments in enumerate(parts, 1):
        inv_no = invoice_nums[p_idx - 1]
        safe_inv = re.sub(r'[^a-zA-Z0-9_\-]', '_', inv_no)

        # Excel Customs Manifest & Real Packing List
        manifest_bytes = generate_custom_manifest_excel(
            part_shipments=part_shipments,
            part_number=p_idx,
            invoice_number=inv_no,
            invoice_date=invoice_date,
            consignee_info=consignee_dict,
            bag_markings=bag_markings,
            narration_text=payload.narrationText
        )
        manifest_fname = f"Custom_Manifest_{safe_mawb}_Part{p_idx}_{safe_inv}.xlsx"
        with open(os.path.join(TEMP_OUTPUT_DIR, manifest_fname), "wb") as f:
            f.write(manifest_bytes)
        zip_bundle_files[manifest_fname] = manifest_bytes

        # Chamber Certificate Word docx
        part_boxes = sum(int(s.get("noOfBox") or 1) for s in part_shipments)
        part_usd = sum(float(s.get("value") or 100.0) for s in part_shipments)
        # Real packing PCS count
        part_pcs = 0
        for s in part_shipments:
            items = s.get("enquiryItems") or []
            if items:
                part_pcs += sum(int(it.get("quantity") or 1) for it in items)
            else:
                part_pcs += int(s.get("noOfBox") or 1)

        chamber_bytes = generate_chamber_docx(
            consignee_info=consignee_dict,
            invoice_number=inv_no,
            invoice_date=invoice_date,
            total_usd=part_usd,
            total_boxes=part_boxes,
            packing_total_pcs=part_pcs
        )
        chamber_fname = None
        if chamber_bytes:
            chamber_fname = f"Chamber_Certificate_{safe_mawb}_Part{p_idx}_{safe_inv}.docx"
            with open(os.path.join(TEMP_OUTPUT_DIR, chamber_fname), "wb") as f:
                f.write(chamber_bytes)
            zip_bundle_files[chamber_fname] = chamber_bytes

        # Extract sheets for direct on-screen table preview
        manifest_sheets = extract_sheet_matrix(manifest_bytes)
        chamber_preview = extract_chamber_preview(chamber_bytes) if chamber_bytes else None

        generated_parts.append({
            "partNumber": p_idx,
            "invoiceNumber": inv_no,
            "boxes": part_boxes,
            "pcs": part_pcs,
            "usd": round(part_usd, 2),
            "shipmentCount": len(part_shipments),
            "manifestFilename": manifest_fname,
            "chamberFilename": chamber_fname,
            "manifestDownloadUrl": f"/api/customs/download/{manifest_fname}",
            "chamberDownloadUrl": f"/api/customs/download/{chamber_fname}" if chamber_fname else None,
            "sheets": manifest_sheets,
            "chamber": chamber_preview
        })

    # ZIP Bundle
    zip_filename = f"Complete_Customs_Package_{safe_mawb}.zip"
    zip_bytes = create_manifest_zip_bundle(zip_bundle_files)
    with open(os.path.join(TEMP_OUTPUT_DIR, zip_filename), "wb") as f:
        f.write(zip_bytes)

    # Remember last invoice number
    last_inv = invoice_nums[-1] if invoice_nums else ""
    s = db.query(CustomsSetting).filter(CustomsSetting.key == "last_manifest_number").first()
    if not s:
        db.add(CustomsSetting(key="last_manifest_number", value=last_inv))
    else:
        s.value = last_inv
    db.commit()

    return {
        "success": True,
        "mawbNumber": mawb.mawbNumber,
        "partsCount": len(parts),
        "parts": generated_parts,
        "wtboxFilename": wtbox_filename,
        "trackingFilename": tracking_filename,
        "zipFilename": zip_filename,
        "downloadUrls": {
            "zip": f"/api/customs/download/{zip_filename}",
            "wtbox": f"/api/customs/download/{wtbox_filename}",
            "tracking": f"/api/customs/download/{tracking_filename}"
        }
    }

@router.get("/preview-manifest/{filename}")
def preview_manifest_file(filename: str):
    safe_name = os.path.basename(filename)
    filepath = os.path.join(TEMP_OUTPUT_DIR, safe_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    with open(filepath, "rb") as f:
        data = f.read()
    return extract_sheet_matrix(data)

@router.get("/preview-chamber/{filename}")
def preview_chamber_file(filename: str):
    safe_name = os.path.basename(filename)
    filepath = os.path.join(TEMP_OUTPUT_DIR, safe_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    with open(filepath, "rb") as f:
        data = f.read()
    return extract_chamber_preview(data)


# ─── Download Endpoint ────────────────────────────────────────────────────────

@router.get("/download/{filename}")
def download_customs_file(filename: str):
    safe_name = os.path.basename(filename)
    filepath = os.path.join(TEMP_OUTPUT_DIR, safe_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Requested file not found or expired")

    media_type = "application/octet-stream"
    if safe_name.endswith(".xlsx"):
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif safe_name.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif safe_name.endswith(".zip"):
        media_type = "application/zip"

    return FileResponse(
        path=filepath,
        filename=safe_name,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'}
    )

# ─── Offline File Upload (Backward Compatibility) ────────────────────────────

@router.post("/upload-offline")
async def upload_offline_manifest(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_manifest.xlsx"
    ext = os.path.splitext(filename)[1].lower()

    content = await file.read()
    temp_path = os.path.join(TEMP_OUTPUT_DIR, f"offline_{uuid.uuid4().hex[:8]}_{filename}")
    with open(temp_path, "wb") as f:
        f.write(content)

    try:
        if ext in [".xlsx", ".xls"]:
            df = pd.read_excel(temp_path)
        elif ext == ".csv":
            df = pd.read_csv(temp_path)
        else:
            raise HTTPException(status_code=400, detail="Please upload a .xlsx or .csv file")

        # Normalize column names
        col_map = {}
        for c in df.columns:
            clean = str(c).strip().lower()
            if "hawb" in clean:
                col_map[c] = "hawbno"
            elif "box" in clean or "pcs" in clean or "piece" in clean:
                col_map[c] = "noOfBox"
            elif "wt" in clean or "weight" in clean:
                col_map[c] = "weight"
            elif "val" in clean or "usd" in clean or "gbp" in clean:
                col_map[c] = "value"
            elif "send" in clean or "shipper" in clean or "consigner" in clean:
                col_map[c] = "senderName"
            elif "rec" in clean or "consignee" in clean:
                col_map[c] = "receiverName"
            elif "dest" in clean or "country" in clean:
                col_map[c] = "destinationCountryName"
            elif "desc" in clean or "good" in clean:
                col_map[c] = "goodsDescription"
            elif "fwd" in clean or "forward" in clean or "track" in clean:
                col_map[c] = "forwardingNumber"
            elif "serv" in clean:
                col_map[c] = "forwardingServiceName"

        df.rename(columns=col_map, inplace=True)
        shipments = []
        for idx, row in df.iterrows():
            hawb = str(row.get("hawbno") or f"OFFLINE-{idx+1:03d}").strip()
            pcs = int(pd.to_numeric(row.get("noOfBox"), errors="coerce") or 1)
            w = float(pd.to_numeric(row.get("weight"), errors="coerce") or 1.0)
            v = float(pd.to_numeric(row.get("value"), errors="coerce") or 50.0)
            sender = str(row.get("senderName") or "Shipper").strip()
            receiver = str(row.get("receiverName") or "Consignee").strip()
            c_name = str(row.get("destinationCountryName") or "UK").strip()
            desc = str(row.get("goodsDescription") or "General Goods").strip()

            shipments.append({
                "id": idx + 1,
                "hawbno": hawb,
                "forwardingNumber": str(row.get("forwardingNumber") or "N/A"),
                "forwardingServiceName": str(row.get("forwardingServiceName") or "Standard"),
                "senderName": sender,
                "receiverName": receiver,
                "destinationCountryName": c_name,
                "noOfBox": pcs,
                "weight": round(w, 2),
                "value": round(v, 2),
                "goodsDescription": desc,
                "status": "OFFLINE_IMPORTED",
                "enquiryItems": []
            })

        auto_bags = suggest_bag_markings(shipments)
        wt_rows = prepare_wtbox_data(shipments, auto_bags)

        return {
            "success": True,
            "filename": filename,
            "shipments": shipments,
            "wtRows": wt_rows,
            "suggestedBags": auto_bags,
            "summary": {
                "totalShipments": len(shipments),
                "totalBoxes": sum(r["Box"] for r in wt_rows),
                "totalWeight": round(sum(r["Weight"] for r in wt_rows), 2),
                "totalUsd": round(sum(s["value"] for s in shipments), 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
