import json
import urllib.request
import urllib.parse

BASE_URL = "http://127.0.0.1:8000"

def post_json(path, data):
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def put_json(path, data):
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(path):
    with urllib.request.urlopen(f"{BASE_URL}{path}") as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_tests():
    print("=== TESTING NEW LOGISTICS FEATURES ===")

    # 1. Test Customer Creation with City
    print("\n[TEST 1] Creating Customer (Consignee) with City...")
    import time
    ts = int(time.time())
    cust_payload = {
        "name": f"Global Trade Consignee {ts} LLC",
        "phone": f"+971-50-{ts % 10000000:07d}",
        "email": f"consignee_{ts}@globaltrade.ae",
        "address1": "Sheikh Zayed Road, Building 5",
        "address2": "Suite 801",
        "city": "Dubai",
        "state": "Dubai",
        "countryId": 1,
        "postcode": "00000"
    }
    # Clean up if exists
    cust_res = post_json("/api/customer/", cust_payload)
    cust_id = cust_res.get("id")
    print(f"-> Customer created with ID: {cust_id}")
    fetched_cust = get_json(f"/api/customer/getById/{cust_id}")
    print(f"   Saved City in DB: '{fetched_cust.get('city')}'")
    assert fetched_cust.get("city") == "Dubai", f"Expected 'Dubai', got '{fetched_cust.get('city')}'"

    # 2. Test Enquiry Creation with Consignee City
    print("\n[TEST 2] Creating Enquiry with Consignee (Receiver) City...")
    enquiry_payload = {
        "sender": {
            "name": "Himalayan Pashmina Hub",
            "addressLine1": "Thamel Marg",
            "city": "Kathmandu",
            "country": "Nepal",
            "telephoneEmail": "+977-9801122334"
        },
        "receiver": {
            "name": "Global Trade Consignee LLC",
            "addressLine1": "Sheikh Zayed Road, Building 5",
            "address2": "Suite 801",
            "city": "Dubai",
            "state": "Dubai",
            "country": "United Arab Emirates",
            "postcode": "00000",
            "telephone": "+971-50-9991122",
            "email": "consignee@globaltrade.ae"
        },
        "boxes": [
            {"length": 40.0, "breadth": 30.0, "height": 20.0, "weight": 6.5, "quantity": 1}
        ]
    }
    enquiry_res = post_json("/api/enquiry/webenquirycreate", enquiry_payload)
    enq = enquiry_res.get("enquiry", {})
    enq_id = enq.get("id")
    tracking_no = enq.get("trackingNumber")
    print(f"-> Enquiry created! ID: {enq_id}, Tracking: {tracking_no}")
    print(f"   Receiver City in DB: '{enq.get('receiverCity')}'")
    assert enq.get("receiverCity") == "Dubai", f"Expected 'Dubai', got '{enq.get('receiverCity')}'"

    # 3. Test Pushing to Shipment & Assigning Forwarding Details
    print("\n[TEST 3] Pushing Enquiry to Shipment & Updating Forwarding Details...")
    push_res = post_json("/api/shipments/from-enquiries", {"enquiryIds": [enq_id]})
    shipments_res = get_json("/api/shipments/?limit=10")
    matching = [s for s in shipments_res.get("data", []) if s.get("enquiryId") == enq_id]
    assert len(matching) > 0, "Shipment should have been created"
    shp = matching[0]
    shp_id = shp.get("id")
    print(f"-> Shipment created! ID: {shp_id}, HAWB: {shp.get('hawbno')}")

    # Update shipment with DPD forwarding number
    fwd_number = "0141 5128 7788 34 Y"
    update_res = put_json(f"/api/shipments/{shp_id}", {
        "agentId": 1,
        "hawbNumber": shp.get("hawbno"),
        "forwardingNumber": fwd_number,
        "status": "IN_TRANSIT"
    })
    print(f"-> Updated shipment with forwarding number: {fwd_number}")

    # 4. Test Forwarding Details Shown in Enquiry
    print("\n[TEST 4] Verifying Forwarding Details are returned in Enquiries...")
    enq_list = get_json(f"/api/enquiry/?search={tracking_no}")
    matched_enq = enq_list.get("data", [])[0]
    print(f"   Enquiry Forwarding Company: '{matched_enq.get('forwardingCompanyName')}'")
    print(f"   Enquiry Forwarding Number: '{matched_enq.get('forwardingNumber')}'")
    print(f"   Enquiry Forwarding Details: '{matched_enq.get('forwardingDetails')}'")
    assert matched_enq.get("forwardingNumber") == fwd_number, f"Expected {fwd_number}, got {matched_enq.get('forwardingNumber')}"

    # Also test direct get by ID
    direct_enq = get_json(f"/api/enquiry/{enq_id}")
    assert direct_enq.get("forwardingNumber") == fwd_number, "Direct enquiry lookup missing forwarding number"

    # 5. Test Carrier & Airline Tracking API
    print("\n[TEST 5] Testing Extensible Tracking Providers API...")
    provs = get_json("/api/tracking/providers")
    provider_keys = [p["key"] for p in provs.get("providers", [])]
    print(f"-> Registered tracking providers: {provider_keys}")
    assert "dpd" in provider_keys and "fedex" in provider_keys and "airline" in provider_keys

    # Track by Enquiry Tracking Number
    print("\n[TEST 6] Tracking Cargo via Enquiry Tracking Number...")
    track_res = get_json(f"/api/tracking/{tracking_no}")
    print(f"-> Tracking found: {track_res.get('found')}")
    print(f"   Carrier: {track_res.get('forwardingCompany')}")
    print(f"   Carrier Tracking URL: {track_res.get('carrierTrackingUrl')}")
    print(f"   Checkpoints count: {len(track_res.get('checkpoints', []))}")
    for cp in track_res.get("checkpoints", []):
        print(f"   * [{cp.get('source')}] {cp.get('location')} - {cp.get('status')}: {cp.get('activity')}")
    assert track_res.get("found") is True
    assert len(track_res.get("checkpoints", [])) >= 2

    # Track by Forwarding Number directly
    print("\n[TEST 7] Tracking Cargo via Forwarding Number...")
    encoded_fwd = urllib.parse.quote(fwd_number)
    track_fwd_res = get_json(f"/api/tracking/{encoded_fwd}")
    assert track_fwd_res.get("found") is True
    print(f"-> Successfully tracked via Carrier Forwarding Number! HAWB: {track_fwd_res.get('hawbNumber')}")

    # 6. Test Tracking Synchronization & Transit Points
    print("\n[TEST 8] Testing Tracking Sync for Shipment...")
    sync_res = post_json(f"/api/tracking/sync/{shp_id}", {})
    print(f"-> Sync message: {sync_res.get('message')}")
    assert sync_res.get("tracking", {}).get("found") is True

    # 7. Test Webhook Receiver
    print("\n[TEST 9] Testing Carrier Webhook Receiver...")
    webhook_res = post_json("/api/tracking/webhook/dpd", {
        "trackingNumber": fwd_number,
        "status": "DELIVERED",
        "location": "Customer Premises"
    })
    print(f"-> Webhook response: {webhook_res.get('message')}")
    assert webhook_res.get("status") == "success"

    print("\n>>> ALL NEW LOGISTICS FEATURES VERIFIED SUCCESSFULLY! <<<\n")

if __name__ == "__main__":
    run_tests()
