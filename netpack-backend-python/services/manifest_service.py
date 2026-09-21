import io
import math
from datetime import datetime
from typing import Tuple, List, Any, Dict
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from sqlalchemy.orm import Session
from models.mawb import MAWB
from models.shipment import Shipment
from models.enquiry import Enquiry

def _get_mawb_and_cargo(db: Session, mawb_identifier: str) -> Tuple[MAWB, List[Dict[str, Any]]]:
    mawb = None
    try:
        mid = int(mawb_identifier)
        mawb = db.query(MAWB).filter(MAWB.id == mid).first()
    except (ValueError, TypeError):
        pass

    if not mawb:
        mawb = db.query(MAWB).filter(MAWB.mawbNumber == mawb_identifier).first()
    if not mawb:
        mawb = db.query(MAWB).filter(MAWB.mawbNumber.ilike(f"%{mawb_identifier}%")).first()

    if not mawb:
        raise ValueError(f"MAWB '{mawb_identifier}' not found")

    cargo_list: List[Dict[str, Any]] = []
    seen_shipment_ids = set()
    seen_enquiry_ids = set()

    # 1. Shipments directly linked to MAWB
    for s in mawb.shipments:
        if s.id in seen_shipment_ids:
            continue
        seen_shipment_ids.add(s.id)
        if s.enquiryId:
            seen_enquiry_ids.add(s.enquiryId)

        enq = s.enquiry
        boxes = list(s.boxes) if s.boxes else (list(enq.boxes) if (enq and enq.boxes) else [])
        items = list(enq.items) if (enq and enq.items) else []
        cust = s.customer or (enq.customer if enq else None)

        cargo_list.append({
            "shipment": s,
            "enquiry": enq,
            "hawbno": s.hawbno or (enq.trackingNumber if enq else f"SHP-{s.id}"),
            "date": s.createdAt or (enq.createdAt if enq else datetime.utcnow()),
            "shipper_name": (enq.senderName if enq else None) or (cust.name if cust else "Shipper"),
            "shipper_phone": (enq.senderPhone if enq else None) or (cust.phone if cust else ""),
            "shipper_address": (enq.senderAddressLine1 if enq else None) or (cust.address1 if cust else ""),
            "shipper_location": (enq.senderLocation if enq else None) or (enq.senderAddressLine2 if enq else "") or (cust.city if cust else ""),
            "shipper_city": (enq.senderCity if enq else None) or "Kathmandu",
            "shipper_postcode": (enq.senderPostcode if enq else None) or "44600",
            "shipper_country": (enq.senderCountry if enq else None) or "Nepal",
            "receiver_name": (enq.receiverName if enq else None) or "Consignee",
            "receiver_phone": (enq.receiverTelephone if enq else None) or "",
            "receiver_address": (enq.receiverAddressLine1 if enq else None) or "",
            "receiver_address2": (enq.receiverAddressLine2 if enq else None) or "",
            "receiver_city": (enq.receiverCity if enq else None) or (enq.receiverLocation if enq else ""),
            "receiver_state": (enq.receiverState if enq else None) or "",
            "receiver_postcode": (enq.receiverPostcode if enq else None) or "",
            "receiver_email": (enq.receiverEmail if enq else None) or "",
            "receiver_country": (enq.receiverCountry if enq else None) or (s.country.name if s.country else (enq.country.name if enq and enq.country else "")),
            "pieces": len(boxes) if boxes else (enq.noOfBox if enq else 1) or 1,
            "weight": (sum([b.weight or 0.0 for b in boxes]) if boxes else None) or (enq.weight if enq else 10.0) or 10.0,
            "boxes": boxes,
            "items": items,
            "commodity": ", ".join([i.description for i in items if i.description]) if items else "General Goods",
            "declared_value": sum([i.totalValue or (i.value or 0) for i in items]) if items else ((enq.finalRate or enq.estimatedRate or 0) if enq else 50),
            "forwarding_company": s.forwardingCompany.name if s.forwardingCompany else "DPD",
            "service": s.service.name if (s and s.service) else ("https://track.dpd.co.uk" if "UK" in (s.forwardingCompany.name if s and s.forwardingCompany else "") else "https://tracking.dpd.de"),
            "forwarding_no": s.forwardingNumber or "0141 5128 7788 34 Y"
        })

    # 2. Enquiries linked to MAWB that might not have a shipment in mawb.shipments
    for enq in mawb.enquiry:
        if enq.id in seen_enquiry_ids:
            continue
        seen_enquiry_ids.add(enq.id)

        shipment = enq.shipments[0] if enq.shipments else None
        if shipment and shipment.id in seen_shipment_ids:
            continue
        if shipment:
            seen_shipment_ids.add(shipment.id)

        boxes = list(enq.boxes)
        items = list(enq.items)
        cust = enq.customer

        fwd_company = (shipment.forwardingCompany.name if shipment and shipment.forwardingCompany else "DPD")
        fwd_service = (shipment.service.name if shipment and shipment.service else ("https://track.dpd.co.uk" if "UK" in fwd_company else "https://tracking.dpd.de"))

        cargo_list.append({
            "shipment": shipment,
            "enquiry": enq,
            "hawbno": (shipment.hawbno if shipment else None) or enq.trackingNumber,
            "date": enq.createdAt or datetime.utcnow(),
            "shipper_name": enq.senderName or (cust.name if cust else "Shipper"),
            "shipper_phone": enq.senderPhone or (cust.phone if cust else ""),
            "shipper_address": enq.senderAddressLine1 or (cust.address1 if cust else ""),
            "shipper_location": enq.senderLocation or enq.senderAddressLine2 or (cust.city if cust else ""),
            "shipper_city": enq.senderCity or "Kathmandu",
            "shipper_postcode": enq.senderPostcode or "44600",
            "shipper_country": enq.senderCountry or "Nepal",
            "receiver_name": enq.receiverName or "Consignee",
            "receiver_phone": enq.receiverTelephone or "",
            "receiver_address": enq.receiverAddressLine1 or "",
            "receiver_address2": enq.receiverAddressLine2 or "",
            "receiver_city": enq.receiverCity or enq.receiverLocation or "",
            "receiver_state": enq.receiverState or "",
            "receiver_postcode": enq.receiverPostcode or "",
            "receiver_email": enq.receiverEmail or "",
            "receiver_country": enq.receiverCountry or (enq.country.name if enq.country else ""),
            "pieces": len(boxes) if boxes else (enq.noOfBox or 1),
            "weight": (sum([b.weight or 0.0 for b in boxes]) if boxes else None) or (enq.weight or 10.0),
            "boxes": boxes,
            "items": items,
            "commodity": ", ".join([i.description for i in items if i.description]) if items else "General Goods",
            "declared_value": sum([i.totalValue or (i.value or 0) for i in items]) if items else (enq.finalRate or enq.estimatedRate or 50),
            "forwarding_company": fwd_company,
            "service": fwd_service,
            "forwarding_no": (shipment.forwardingNumber if shipment else None) or "0141 5128 7788 34 Y"
        })

    return mawb, cargo_list

def generate_manifest_excel(db: Session, mawb_number: str) -> io.BytesIO:
    """
    Generates the Airline Cargo Manifest matching sample Image 1:
    - Top header block: From / Consignee / MAWB Details
    - Columns: S.NO, CONSIGNER, HAWB#, BAG#, CONSIGNEE, CONTENTS, GBP, Total B, Actual WT, CHG WT, DIMM, Forwarding Company, Service, Forwarding #
    """
    mawb, cargo_list = _get_mawb_and_cargo(db, mawb_number)

    wb = Workbook()
    ws = wb.active
    ws.title = "Manifest"

    # Styling fonts & borders
    bold_font = Font(name="Calibri", size=10, bold=True)
    regular_font = Font(name="Calibri", size=9)
    header_font = Font(name="Calibri", size=9, bold=True)
    border_side = Side(border_style="thin", color="000000")
    thin_border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)

    # Calculate total boxes across all cargo
    total_boxes_count = sum([int(item["pieces"]) for item in cargo_list]) or 1

    flight_date_str = mawb.departureDate.strftime('%d/%m/%Y') if mawb.departureDate else datetime.utcnow().strftime('%d/%m/%Y')
    arrival_date_str = mawb.dateOfArrival.strftime('%d/%m/%Y') if mawb.dateOfArrival else datetime.utcnow().strftime('%d/%m/%Y')

    # Row 1-7: Header Block
    ws["A1"] = "From"
    ws["A1"].font = bold_font
    ws["A2"] = "DANFE LOGISTICS"
    ws["A2"].font = regular_font
    ws["A3"] = "TEKU"
    ws["A3"].font = regular_font
    ws["A4"] = "44600"
    ws["A4"].font = regular_font
    ws["A5"] = "KATHMANDU"
    ws["A5"].font = regular_font
    ws["A6"] = "NEPAL"
    ws["A6"].font = regular_font
    ws["A7"] = "TEL: +977 015335942"
    ws["A7"].font = regular_font

    ws["C1"] = "Consignee"
    ws["C1"].font = bold_font
    ws["C7"] = "TEL:"
    ws["C7"].font = regular_font

    ws["F1"] = "MAWB Details"
    ws["F1"].font = bold_font
    ws["F2"] = f"MAWB No: {mawb.mawbNumber.upper()}"
    ws["F2"].font = regular_font
    ws["F3"] = f"Flight Date: {flight_date_str}"
    ws["F3"].font = regular_font
    ws["F4"] = f"Arrival Date: {arrival_date_str}"
    ws["F4"].font = regular_font
    ws["F5"] = f"Total Boxes: {total_boxes_count}"
    ws["F5"].font = regular_font

    # Row 9: Table Header
    headers = [
        "S.NO", "CONSIGNER", "HAWB#", "BAG#", "CONSIGNEE", "CONTENTS",
        "GBP", "Total B", "Actual WT", "CHG WT", "DIMM", "Forwarding Company", "Service", "Forwarding #"
    ]

    header_row = 9
    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=header_row, column=col_idx, value=h)
        cell.font = header_font
        cell.border = thin_border
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    row_idx = header_row
    current_bag = 1750
    sn = 1

    for item in cargo_list:
        row_idx += 1
        num_boxes = int(item["pieces"]) or 1
        boxes = item["boxes"]

        # 1. BAG#
        start_bag = current_bag
        end_bag = current_bag + num_boxes - 1
        bag_str = f"{start_bag}" if num_boxes == 1 else f"{start_bag}-{end_bag}"
        current_bag += num_boxes

        # 2. DIMM & Weights
        dim_list = []
        actual_wt = 0.0
        total_vol_wt = 0.0

        if boxes:
            for b in boxes:
                l = float(b.length or 30.0)
                w = float(b.breadth or 20.0)
                h = float(b.height or 20.0)
                wt = float(b.weight or 0.0)
                dim_list.append(f"{int(l)}x{int(w)}x{int(h)}")
                actual_wt += wt
                total_vol_wt += (l * w * h) / 5000.0
        else:
            actual_wt = float(item["weight"] or 10.0)
            dim_list.append("30x30x30")
            total_vol_wt = (30.0 * 30.0 * 30.0) / 5000.0

        if actual_wt <= 0.0:
            actual_wt = float(item["weight"] or 10.0)

        dimm_str = ", ".join(dim_list)
        chg_wt = max(actual_wt, total_vol_wt)
        # Match logistics sample rounding (ceil / whole kg if within margin)
        chg_wt_rounded = round(chg_wt, 2)
        if abs(chg_wt_rounded - round(chg_wt_rounded)) < 0.15:
            chg_wt_rounded = float(round(chg_wt_rounded))

        # 3. Multiline CONSIGNER
        consigner_parts = [
            item["shipper_name"],
            item["shipper_address"],
            item["shipper_location"] if item["shipper_location"] != item["shipper_address"] else "",
            item["shipper_city"],
            "-",
            item["shipper_postcode"],
            item["shipper_country"],
            "-",
            f"TEL: {item['shipper_phone']}" if item["shipper_phone"] else "-"
        ]
        consigner_text = "\n".join([p for p in consigner_parts if p])

        # 4. Multiline CONSIGNEE
        consignee_parts = [
            item["receiver_name"],
            item["receiver_address"],
            item["receiver_address2"] if item["receiver_address2"] else "",
            item["receiver_city"],
            item["receiver_state"] if item["receiver_state"] else "",
            item["receiver_postcode"],
            item["receiver_country"],
            item["receiver_email"] if item["receiver_email"] else "",
            f"TEL: {item['receiver_phone']}" if item["receiver_phone"] else ""
        ]
        consignee_text = "\n".join([p for p in consignee_parts if p])

        val = round(float(item["declared_value"]), 2)
        if val == int(val):
            val = int(val)

        row_values = [
            sn,
            consigner_text,
            item["hawbno"],
            bag_str,
            consignee_text,
            item["commodity"],
            val,
            num_boxes,
            f"{actual_wt:.2f}",
            f"{chg_wt_rounded:.2f}",
            dimm_str,
            item["forwarding_company"],
            item["service"],
            item["forwarding_no"]
        ]

        # Set row height for multiline text
        ws.row_dimensions[row_idx].height = 125

        for col_idx, val_entry in enumerate(row_values, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val_entry)
            cell.font = regular_font
            cell.border = thin_border

            # Alignment logic
            if col_idx in (1, 3, 4, 8):
                cell.alignment = Alignment(horizontal="center", vertical="top")
            elif col_idx in (7, 9, 10):
                cell.alignment = Alignment(horizontal="right", vertical="top")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

        sn += 1

    # Set column widths matching sample
    col_widths = {
        "A": 6,   # S.NO
        "B": 28,  # CONSIGNER
        "C": 16,  # HAWB#
        "D": 14,  # BAG#
        "E": 30,  # CONSIGNEE
        "F": 28,  # CONTENTS
        "G": 8,   # GBP
        "H": 8,   # Total B
        "I": 11,  # Actual WT
        "J": 11,  # CHG WT
        "K": 22,  # DIMM
        "L": 18,  # Forwarding Company
        "M": 26,  # Service
        "N": 22   # Forwarding #
    }
    for col_letter, width in col_widths.items():
        ws.column_dimensions[col_letter].width = width

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output

def generate_datasheet_excel(db: Session, mawb_number: str) -> io.BytesIO:
    """
    Generates the Master Cargo Datasheet matching sample Image 2:
    - Clean flat table structure
    - Exact 30 columns:
      No, HAWB, Return AWB, CONNECTION, BAG NO, Consignee, Consignee Address,
      Consignee City, POST CODE, Consignee State, Country, PHONE NO, Consignee Email,
      NO OF PCS, Actual WT, CHG WT, DIMM, BOXES DET, Goods Description,
      Shipper Name, Shipper Address, Shipper Location, Shipper City, POSTAL CODE,
      Shipper Country, MAWB No, Destination, Forwarding Company, Service, Forwarding Number
    """
    mawb, cargo_list = _get_mawb_and_cargo(db, mawb_number)

    wb = Workbook()
    ws = wb.active
    ws.title = "Datasheet"

    regular_font = Font(name="Calibri", size=9)
    header_font = Font(name="Calibri", size=9, bold=True)
    border_side = Side(border_style="thin", color="D3D3D3")
    thin_border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)

    # Exact headers from Image 2
    headers = [
        "No", "HAWB", "Return AWB", "CONNECTION", "BAG NO",
        "Consignee", "Consignee Address", "Consignee City", "POST CODE", "Consignee State", "Country",
        "PHONE NO", "Consignee Email", "NO OF PCS", "Actual WT", "CHG WT", "DIMM", "BOXES DET",
        "Goods Description", "Shipper Name", "Shipper Address", "Shipper Location", "Shipper City",
        "POSTAL CODE", "Shipper Country", "MAWB No", "Destination", "Forwarding Company", "Service", "Forwarding Number"
    ]

    header_row = 1
    ws.row_dimensions[1].height = 24
    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=header_row, column=col_idx, value=h)
        cell.font = header_font
        cell.border = thin_border
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    row_idx = header_row
    current_bag = 1750
    sn = 1

    for item in cargo_list:
        row_idx += 1
        num_boxes = int(item["pieces"]) or 1
        boxes = item["boxes"]

        # BAG NO & BOXES DET
        start_bag = current_bag
        end_bag = current_bag + num_boxes - 1
        bag_str = f"{start_bag}" if num_boxes == 1 else f"{start_bag}-{end_bag}"
        current_bag += num_boxes

        # DIMM & Weights
        dim_list = []
        actual_wt = 0.0
        total_vol_wt = 0.0

        if boxes:
            for b in boxes:
                l = float(b.length or 30.0)
                w = float(b.breadth or 20.0)
                h = float(b.height or 20.0)
                wt = float(b.weight or 0.0)
                dim_list.append(f"{int(l)}x{int(w)}x{int(h)}")
                actual_wt += wt
                total_vol_wt += (l * w * h) / 5000.0
        else:
            actual_wt = float(item["weight"] or 10.0)
            dim_list.append("30x30x30")
            total_vol_wt = (30.0 * 30.0 * 30.0) / 5000.0

        if actual_wt <= 0.0:
            actual_wt = float(item["weight"] or 10.0)

        dimm_str = ", ".join(dim_list)
        chg_wt = max(actual_wt, total_vol_wt)
        chg_wt_rounded = round(chg_wt, 2)
        if abs(chg_wt_rounded - round(chg_wt_rounded)) < 0.15:
            chg_wt_rounded = float(round(chg_wt_rounded))

        # Single-line Consignee address
        consignee_addr = ", ".join([p for p in [item["receiver_address"], item["receiver_address2"]] if p])

        row_values = [
            sn,                                           # 1. No
            item["hawbno"],                               # 2. HAWB
            "",                                           # 3. Return AWB
            mawb.airlineName or "",                       # 4. CONNECTION
            bag_str,                                      # 5. BAG NO
            item["receiver_name"],                        # 6. Consignee
            consignee_addr,                               # 7. Consignee Address
            item["receiver_city"],                        # 8. Consignee City
            item["receiver_postcode"],                    # 9. POST CODE
            item["receiver_state"],                       # 10. Consignee State
            item["receiver_country"],                     # 11. Country
            item["receiver_phone"],                       # 12. PHONE NO
            item["receiver_email"],                       # 13. Consignee Email
            num_boxes,                                    # 14. NO OF PCS
            f"{actual_wt:.2f}",                           # 15. Actual WT
            f"{chg_wt_rounded:.2f}",                      # 16. CHG WT
            dimm_str,                                     # 17. DIMM
            bag_str,                                      # 18. BOXES DET
            item["commodity"],                            # 19. Goods Description
            item["shipper_name"],                         # 20. Shipper Name
            item["shipper_address"],                      # 21. Shipper Address
            item["shipper_location"],                     # 22. Shipper Location
            item["shipper_city"],                         # 23. Shipper City
            item["shipper_postcode"],                     # 24. POSTAL CODE
            item["shipper_country"],                      # 25. Shipper Country
            mawb.mawbNumber.upper(),                      # 26. MAWB No
            mawb.destination or item["receiver_country"] or "LHR", # 27. Destination
            item["forwarding_company"],                   # 28. Forwarding Company
            item["service"],                              # 29. Service
            item["forwarding_no"]                         # 30. Forwarding Number
        ]

        ws.row_dimensions[row_idx].height = 20

        for col_idx, val_entry in enumerate(row_values, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val_entry)
            cell.font = regular_font
            cell.border = thin_border

            if col_idx in (1, 14):
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx in (15, 16):
                cell.alignment = Alignment(horizontal="right", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

        sn += 1

    # Freeze header row
    ws.freeze_panes = "A2"

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = col[0].column_letter
        ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output

