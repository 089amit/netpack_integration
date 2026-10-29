# NetPack Logistics Integration - Pending Bugs & Resolution Guide
*Document Created: October 25, 2026*

This document tracks all identified operational, frontend, and backend bugs along with their expected behaviors and planned technical resolutions.

---

## 1. Email Service Rate Limit & Custom Sender Configuration

### Problem:
- Automated confirmation emails failed with Zoho Mail SMTP error:
  `550 5.4.6 Unusual sending activity detected. To unblock: https://mail.zoho.com/UnblockMe`
  `554 5.7.8 Access Restricted`
- Zoho flagged the dynamic serverless IP (Vercel) as unusual activity and temporarily blocked outbound SMTP sending.

### Expected Behavior:
- Emails must send reliably without SMTP rate-limit lockouts.
- Sender must display as **`NetPack Logistic <noreply@netpacklogistic.com>`** with reply-to **`info@netpacklogistic.com`**.

### Resolution Plan:
1. **Immediate Unblock**: Complete captcha unblock at `https://mail.zoho.com/UnblockMe`.
2. **Brevo HTTPS Integration**:
   - Add `noreply@netpacklogistic.com` as an authorized sender in Brevo dashboard.
   - Add Brevo API key to environment: `BREVO_API_KEY=xkeysib-...` and `BREVO_FROM_EMAIL=noreply@netpacklogistic.com`.
3. **Backend Optimization**: Update `netpack-backend-python/services/email_service.py` to prioritize Brevo HTTPS API when configured so emails send immediately (<1s) without waiting for SMTP timeouts.

---

## 2. HAWB Breaking - Per-Box Value & Pieces Allocation

### Problem:
- When HAWBs are broken/split, the overall total consignment value and pieces are duplicated across all broken HAWBs in the Customs Manifest and Packing List.
- Breaking 1 master enquiry into multiple HAWBs retains the entire order's totals instead of breaking it down per box.

### Expected Behavior:
- **Customs Manifest & Packing List** must dynamically calculate and display:
  - Pieces (pcs): Only count the boxes and items allocated to that specific broken HAWB.
  - Value ($/NPR): Only sum the declared value of the boxes and items assigned to that specific broken HAWB.

### Technical Implementation:
- In `netpack-backend-python/routers/customs.py` (and manifest generator), filter boxes where `box.trackingNumber` or box relationship matches the specific HAWB child tracking number.
- In `react-netpack-admin-main` manifest table, calculate column sums from the filtered box subset rather than the parent enquiry totals.

---

## 3. Shipment Status Auto-Switching to "Picked Up" After HAWB Break

### Problem:
- Immediately upon breaking a HAWB, the shipment status is automatically changed to `"PICKED_UP"` / `"Picked Up"` in public tracking.

### Expected Behavior:
- Breaking a HAWB is an administrative pre-shipment action.
- The shipment status must remain **`"SHIPMENT_CREATED"`** (or `"Enquiry Generated"`) until a pickup rider physically verifies and marks the shipment as picked up.

### Technical Implementation:
- Audit HAWB break mutation / endpoint in `routers/enquiry.py` and `routers/shipment.py`.
- Ensure status mutation `status = "PICKED_UP"` is removed from the break HAWB logic, maintaining existing status.

---

## 4. Tracking Milestones - Master Public View vs Internal Box Splits

### Problem:
- Internal split events and HAWB breaking milestones appear directly in the public tracking timeline, confusing customers who track a single consignment.

### Expected Behavior:
- Customers tracking a master AWB should only see clean, customer-facing delivery milestones (Order Placed → Picked Up → In Transit → Customs Clearance → Out for Delivery → Delivered).
- Provide expandable, box-wise tracking details (similar to DHL, FedEx, UPS) where customers can see individual box weights and contents without exposing internal split log entries.

### Technical Implementation:
- In `models/tracking_event.py`, add `is_public` or `scope` flag (`CUSTOMER` vs `INTERNAL`).
- Filter out internal split milestones from public API endpoint `/api/v1/enquiry/track/{trackingNumber}`.

---

## 5. Pickup/Rider Photo Uploads & Admin Visibility

### Problem:
- Riders/pickup agents cannot upload dimension/weight verification photos in the rider mobile interface.
- Photos uploaded by admin do not load/render in either the customer portal or admin panel (broken image links).

### Expected Behavior:
- Riders can snap and upload box photos during pickup verification.
- Uploaded photos must store securely and generate working, accessible URLs that render across Customer App, Admin Panel, and Rider App.

### Technical Implementation:
- In `netpack-backend-python/routers/upload.py`: Check file upload path, permissions, and URL resolution (static file serving `/uploads` vs cloud URL).
- Ensure static directory `netpack-backend-python/uploads` is properly mounted in `main.py` with CORS headers.
- Update React image tags in admin and customer app to handle full domain URL prefixes.

---

## 6. Chargeable Weight vs Actual Weight Display

### Problem:
- Weight calculations and roundings are inconsistently displayed across customer apps, enquiry listings, and customs manifests.

### Expected Behavior:
- **Customer App (`customer.apk`) & Admin Enquiry Tab**:
  - Show **Chargeable Weight** (rounded-up weight).
  - Example: A box weighing `19.1 kg` actual weight must show as **`20 kg`** chargeable weight.
  - Volumetric weight `(Length × Breadth × Height) / 5000` rounded up if higher than gross weight.
  - Total chargeable weight must be the sum of each individual box's rounded chargeable weight.
- **Customs Manifest**:
  - Must display the exact **Actual Weight** (e.g., `19.1 kg`), never the rounded-up chargeable weight.

### Technical Implementation:
- Ensure database stores `actual_weight` and `chargeable_weight` cleanly on `boxes` and `enquiries`.
- In Customer App & Enquiry view serializer: return `chargeable_weight` (or `math.ceil(weight)`).
- In Customs Manifest export/table serializer: return exact decimal `actual_weight`.

---

## 7. Remove Duplicate Customs Clearance Hub Button

### Problem:
- In the Customs Clearance Hub screen, a duplicate button was present in the UI (as captured in user reference screenshot).

### Expected Behavior:
- Clean, single-action button layout for managing Customs Clearance Hubs.

### Technical Implementation:
- In `react-netpack-admin-main`, inspect the Customs Clearance Hub component and remove the redundant button element.

---

## 8. Multi-Stop Route: Failure Adding Stops

### Problem:
- Adding route stops / pickup stations in the stops creation modal fails to save/add stops.

### Expected Behavior:
- Multiple route stops can be added sequentially with address, contact person, phone, and remarks.
- Real-time validation should provide feedback if any required coordinate or address field is missing.

### Technical Implementation:
- Inspect backend stops router / endpoint schema validation and frontend stops modal state in `react-netpack-admin-main`.
- Ensure stops array payload matches database foreign keys and JSON schemas.

---

## 9. Account Registration Missing Mandatory Field Indicators (*)

### Problem:
- Sign-up / Account creation form does not clearly denote required vs optional fields with asterisks `*` or badges.

### Expected Behavior:
- All required inputs (Name, Email, Phone, Password, Company/Address where applicable) must display red asterisks (`*`) or clear visual mandatory tags.

### Technical Implementation:
- Update register/signup form fields in `react-netpack-admin-main` and customer portals to include `<span className="text-red-500">*</span>` on labels with explicit form validation tooltips.

---

## 10. Station-Wise Pickup Milestones (Rider & Consignee Tracking)

### Problem:
- When an enquiry has multiple pickup stations, the rider cannot mark each station individually as picked up, and consignees cannot see station-by-station progress.

### Expected Behavior:
- **Rider App**: Rider has an interactive checklist of pickup stations, allowing them to mark Station 1, Station 2, etc., as "Picked Up" sequentially with timestamps.
- **Consignee/Customer Tracking**: Tracking view reflects station-wise completion status so consignees know exactly which pickup stations have been cleared and which are pending.

### Technical Implementation:
- Add `pickup_stops` status tracking (`PENDING`, `PICKED_UP`, `SKIPPED`) in backend schema.
- Expose station status update API endpoint for riders (`PATCH /api/enquiry/{id}/stops/{stop_id}/status`).
- Render station milestones in public tracking and customer app timelines.

