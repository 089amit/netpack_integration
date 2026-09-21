import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("========================================")
    print("Testing NetPack Python Backend (FastAPI)")
    print("========================================")

    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Root / health check")

    # 2. Admin Login
    login_payload = {
        "email": "admin@example.com",
        "password": "Admin@123"
    }
    res = client.post("/api/admin/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    data = res.json()
    assert "token" in data, "Token missing in login response"
    token = data["token"]
    print("[PASS] 2. Admin Login (JWT generated)")

    # 3. Validate Token
    res = client.post(
        "/api/admin/validate-token",
        json={"token": token},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200, f"Token validation failed: {res.text}"
    assert res.json().get("valid") is True, "Token reported as invalid"
    print("[PASS] 3. Admin Token Validation")

    # 4. Get Countries
    res = client.get("/api/location/country")
    assert res.status_code == 200, f"Get countries failed: {res.text}"
    countries = res.json()
    assert len(countries) > 0, "No countries returned"
    print(f"[PASS] 4. Location / Countries (Found {len(countries)} countries)")

    # 5. Rate Calculator
    calc_payload = {
        "weight": 5.5,
        "destination": "United Arab Emirates"
    }
    res = client.post("/api/rate/rate-calculator", json=calc_payload)
    assert res.status_code == 200, f"Rate calculator failed: {res.text}"
    rate_res = res.json()
    assert "totalRate" in rate_res, "totalRate missing in response"
    print(f"[PASS] 5. Rate Calculator (Weight 5.5kg to UAE -> Total: NPR {rate_res['totalRate']})")

    # 6. Create Enquiry
    enq_payload = {
        "senderName": "Sita Sharma",
        "senderPhone": "+977-9812345678",
        "senderCity": "Kathmandu",
        "receiverName": "Mohammed Al-Maktoum",
        "receiverTelephone": "+971-55-1234567",
        "receiverCity": "Dubai",
        "receiverCountry": "United Arab Emirates",
        "weight": 5.5,
        "noOfBox": 1,
        "estimatedRate": rate_res['totalRate'],
        "finalRate": rate_res['totalRate'],
        "items": [
            {
                "description": "Handmade Pashmina Shawls",
                "weight": 5.5,
                "quantity": 10,
                "unitPrice": 500,
                "hsCode": "6214.20"
            }
        ],
        "boxes": [
            {
                "weight": 5.5,
                "dimensions": "40x30x20",
                "length": 40.0,
                "breadth": 30.0,
                "height": 20.0
            }
        ]
    }
    res = client.post("/api/enquiry/webenquirycreate", json=enq_payload)
    assert res.status_code == 200, f"Enquiry creation failed: {res.text}"
    enq_data = res.json()
    enquiry_id = enq_data["enquiry"]["id"]
    tracking_no = enq_data["enquiry"]["trackingNumber"]
    print(f"[PASS] 6. Enquiry Created (ID: {enquiry_id}, Tracking: {tracking_no})")

    # 7. Convert Enquiry to Shipment
    res = client.post(f"/api/shipments/from-enquiry/{enquiry_id}")
    assert res.status_code == 200, f"Shipment conversion failed: {res.text}"
    shipment_data = res.json()
    shipment_id = shipment_data["shipment"]["id"]
    print(f"[PASS] 7. Shipment Created from Enquiry (Shipment ID: {shipment_id})")

    # 8. Assign Agent & Generate HAWB
    res = client.post(
        f"/api/shipments/{shipment_id}/assign-agent",
        json={"agentCode": "DXB"}
    )
    assert res.status_code == 200, f"Agent assignment failed: {res.text}"
    hawbno = res.json()["hawbno"]
    print(f"[PASS] 8. Agent Assigned & Sequential HAWB Generated ({hawbno})")

    # 9. Dashboard Analytics
    res = client.get("/api/analytics/dashboard")
    assert res.status_code == 200, f"Analytics dashboard failed: {res.text}"
    dashboard_metrics = res.json()
    print(f"[PASS] 9. Dashboard Analytics ({len(dashboard_metrics)} metric cards)")

    # 10. Python Integration Hook
    res = client.get("/api/integrations/status")
    assert res.status_code == 200
    print("[PASS] 10. Python Custom Integration Hook (/api/integrations/status)")

    print("========================================")
    print("ALL 10 VERIFICATION TESTS PASSED (100%)")
    print("========================================")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"[FAIL] Test Error: {e}")
        sys.exit(1)
