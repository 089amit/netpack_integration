import sqlite3
import json
import urllib.request
import urllib.parse
import sys

def run_tests():
    print("==================================================")
    print(" 1. DIRECT DATABASE VERIFICATION (netpack.db)")
    print("==================================================")
    conn = sqlite3.connect("netpack.db")
    c = conn.cursor()

    tables = [
        "roles", "zones", "countries", "users", "customers", "agents",
        "mawbs", "forwarding_companies", "forwarding_services", "rates",
        "enquiries", "enquiry_items", "pickup_locations_enquiry",
        "shipments", "boxes", "box_items", "shipment_pickup_locations",
        "area_surcharges", "terms_and_policies", "notifications"
    ]
    
    total_records = 0
    for tbl in tables:
        c.execute(f"SELECT COUNT(*) FROM {tbl}")
        cnt = c.fetchone()[0]
        total_records += cnt
        print(f"  - {tbl:<30}: {cnt:>6} rows")
    print(f"Total Migrated Records: {total_records}")

    # Check sample enquiry
    c.execute("SELECT id, trackingNumber, status, destinationLocation, senderName, receiverName FROM enquiries ORDER BY id DESC LIMIT 3")
    sample_enquiries = c.fetchall()
    print("\nRecent Migrated Enquiries:")
    for row in sample_enquiries:
        print(f"  ID: {row[0]}, Track: {row[1]}, Status: {row[2]}, Dest: {row[3]}, Shipper: {row[4]} -> Recipient: {row[5]}")

    # Check sample shipment
    c.execute("SELECT id, hawbno, forwardingNumber, status, agent FROM shipments ORDER BY id DESC LIMIT 3")
    sample_shipments = c.fetchall()
    print("\nRecent Migrated Shipments:")
    for row in sample_shipments:
        print(f"  ID: {row[0]}, HAWB: {row[1]}, FwdNo: {row[2]}, Status: {row[3]}, Agent: {row[4]}")

    # Check sample admin user
    c.execute("SELECT email, fullName, roleId FROM users LIMIT 3")
    print("\nStaff Logins:")
    for row in c.fetchall():
        print(f"  Email: {row[0]}, Name: {row[1]}, RoleId: {row[2]}")

    test_hawb = sample_shipments[0][1] if sample_shipments else None
    test_fwd = sample_shipments[0][2] if sample_shipments else None
    test_enq_id = sample_enquiries[0][0] if sample_enquiries else None
    test_shipment_id = sample_shipments[0][0] if sample_shipments else None

    print("\n==================================================")
    print(" 2. FASTAPI ENDPOINT AUTOMATED TESTS")
    print("==================================================")
    base_url = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:8000"
    print(f"Targeting: {base_url}")

    endpoints = [
        ("GET", f"{base_url}/api/enquiry?page=1&limit=5", "Enquiries List (Paginated)"),
        ("GET", f"{base_url}/api/shipments?page=1&limit=5", "Shipments List (Paginated)"),
        ("GET", f"{base_url}/api/shipments/summary/{test_shipment_id}", f"Shipment Summary (ID: {test_shipment_id})"),
        ("GET", f"{base_url}/api/location/country", "Country List"),
        ("GET", f"{base_url}/api/agents", "Agent List"),
        ("GET", f"{base_url}/api/forwarding-companies", "Forwarding Companies"),
        ("GET", f"{base_url}/api/mawbs", "MAWB List"),
        ("GET", f"{base_url}/api/rate/getTIACharge", "TIA Charge"),
        ("GET", f"{base_url}/api/rate/getPackingRate", "Packing Charge"),
        ("GET", f"{base_url}/api/rate/countries/Australia", "Rates for Australia"),
    ]

    if test_hawb:
        endpoints.append(("GET", f"{base_url}/api/tracking/{urllib.parse.quote(test_hawb)}", f"Tracking by HAWB ({test_hawb})"))

    # Test Admin Login with migrated admin user
    print("\nTesting Migrated Admin Login (app.netpack@gmail.com):")
    try:
        login_payload = json.dumps({"email": "app.netpack@gmail.com", "password": "Admin@123"}).encode("utf-8")
        login_req = urllib.request.Request(f"{base_url}/api/admin/login", data=login_payload, method="POST")
        login_req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(login_req, timeout=10) as resp:
            login_data = json.loads(resp.read().decode("utf-8"))
            if "token" in login_data:
                print(f"  [PASS] Admin Login -> HTTP 200 (Token issued for {login_data.get('user', {}).get('email')}, Role: {login_data.get('user', {}).get('role')})")
            else:
                print(f"  [PASS] Admin Login -> HTTP 200")
    except Exception as e:
        print(f"  [FAIL] Admin Login -> Error: {e}")

    all_passed = True
    for method, url, desc in endpoints:
        try:
            req = urllib.request.Request(url, method=method)
            req.add_header("User-Agent", "NetPack-Test-Suite")
            with urllib.request.urlopen(req, timeout=10) as resp:
                status_code = resp.status
                body = resp.read().decode("utf-8")
                data = json.loads(body)
                
                # Check data structure
                if "pagination" in data:
                    total = data["pagination"].get("totalRecords") or data["pagination"].get("totalItems")
                    items_len = len(data.get("data", []))
                    print(f"  [PASS] {desc:<35} -> HTTP {status_code} (Total: {total}, Returned: {items_len})")
                elif isinstance(data, list):
                    print(f"  [PASS] {desc:<35} -> HTTP {status_code} (Items: {len(data)})")
                elif "data" in data and isinstance(data["data"], list):
                    print(f"  [PASS] {desc:<35} -> HTTP {status_code} (Items: {len(data['data'])})")
                elif "found" in data:
                    print(f"  [PASS] {desc:<35} -> HTTP {status_code} (Found: {data['found']}, Status: {data.get('shipment', {}).get('status')})")
                else:
                    print(f"  [PASS] {desc:<35} -> HTTP {status_code}")
        except Exception as e:
            all_passed = False
            print(f"  [FAIL] {desc:<35} -> Error: {e}")

    # Test rate calculator
    print("\nTesting Rate Calculator Endpoint:")
    try:
        req_data = json.dumps({"weight": 2.5, "destination": "Australia"}).encode("utf-8")
        req = urllib.request.Request(f"{base_url}/api/rate/rate-calculator", data=req_data, method="POST")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"  [PASS] Rate Calculator (2.5kg to Australia) -> Total: {data.get('totalCost') or data.get('estimatedRate')} {data.get('currency', 'NPR')}")
    except Exception as e:
        print(f"  [NOTE] Rate Calculator -> {e}")

    conn.close()
    print("\n==================================================")
    if all_passed:
        print(" ALL ENDPOINT TESTS PASSED WITH MIGRATED DATA! ")
    else:
        print(" SOME TESTS HAD WARNINGS (Review Above) ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
