import sys
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from models.customer import Customer
from models.enquiry import Enquiry
from models.shipment import Shipment

client = TestClient(app)

def test_features():
    print("=== Running End-to-End Verification ===")
    db = SessionLocal()

    try:
        # 1. Test Customer Signup
        test_email = f"testcust_{int(sys.argv[1]) if len(sys.argv) > 1 else 12345}@example.com"
        print(f"\n1. Testing Customer Signup ({test_email})...")
        signup_res = client.post("/api/customer/auth/signup", json={
            "name": "Prashant Sharma",
            "email": test_email,
            "phone": "+977-9812345678",
            "password": "Password@123",
            "address1": "Lazimpat, Kathmandu",
            "city": "Kathmandu"
        })
        print(f"   Signup status: {signup_res.status_code}")
        assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
        signup_data = signup_res.json()
        token = signup_data["token"]
        assert token, "Token missing from signup"
        headers = {"Authorization": f"Bearer {token}"}
        print("   [PASS] Customer Signup succeeded with token generation")

        # 2. Test Customer Login
        print("\n2. Testing Customer Login...")
        login_res = client.post("/api/customer/auth/login", json={
            "email": test_email,
            "password": "Password@123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        assert login_res.json()["token"], "Token missing from login"
        print("   [PASS] Customer Login succeeded")

        # 3. Test Google Auth Endpoint
        print("\n3. Testing Google Auth Endpoint...")
        run_id = sys.argv[1] if len(sys.argv) > 1 else "12345"
        google_res = client.post("/api/customer/auth/google", json={
            "email": f"google_{test_email}",
            "name": "Google User",
            "googleId": f"goog-{run_id}"
        })
        assert google_res.status_code == 200, f"Google auth failed: {google_res.text}"
        assert google_res.json()["token"], "Google auth token missing"
        print("   [PASS] Customer Google OAuth integration succeeded")

        # 4. Test Customer Booking (Only Commodity & Approximate Weight)
        print("\n4. Testing Customer Booking (Commodity & Approx Weight)...")
        booking_res = client.post("/api/customer/enquiries", headers=headers, json={
            "commodity": "Pashmina Shawls & Handicrafts",
            "approximateWeight": 3.5,
            "receiverName": "John Doe",
            "receiverPhone": "+1-555-0199",
            "receiverCountry": "United States",
            "receiverCity": "San Francisco",
            "receiverAddress": "742 Market St, Suite 400",
            "receiverPostcode": "94103",
            "isPickupRequired": True,
            "pickupAddress": "Lazimpat, Kathmandu",
            "pickupPhone": "+977-9812345678",
            "pickupPreferredTime": "Morning (10:00 AM - 01:00 PM)",
            "pickupNote": "Ring doorbell at gate"
        })
        assert booking_res.status_code == 200, f"Booking failed: {booking_res.text}"
        booking_data = booking_res.json()
        tracking_no = booking_data["trackingNumber"]
        enquiry_id = booking_data["enquiryId"]
        assert tracking_no, "Tracking number was not generated"
        print(f"   [OK] Booking created: Tracking #{tracking_no}, Enquiry #{enquiry_id}")

        # 5. Verify Customer Booking Properties in Database
        enq = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
        assert enq.isFromCustomer == True, "isFromCustomer should be True"
        assert enq.weight == 3.5, "Weight should match approximateWeight"
        assert enq.pickupRequired == True, "pickupRequired should be True"
        assert enq.trackingMode == "MANUAL", "Default trackingMode should be MANUAL"
        assert len(enq.pickupLocations) > 0, "Pickup location should be registered"
        print("   [PASS] Verified database constraints: isFromCustomer=True, pickupRequired=True, trackingMode='MANUAL'")

        # 6. Test Tracking Endpoint & Milestones
        print(f"\n6. Testing Tracking Endpoint for #{tracking_no}...")
        track_res = client.get(f"/api/tracking/{tracking_no}")
        assert track_res.status_code == 200, f"Tracking failed: {track_res.text}"
        t_data = track_res.json()
        assert t_data["found"] == True
        assert t_data["trackingMode"] == "MANUAL"
        assert t_data["isFromCustomer"] == True
        assert t_data["pickupRequired"] == True
        # Checkpoints check before pickup
        cp_statuses = [cp["status"] for cp in t_data["checkpoints"]]
        print(f"   Checkpoints before pickup: {cp_statuses}")
        assert "ENQUIRY_GENERATED" in cp_statuses

        # Simulate driver picking up cargo
        from datetime import datetime
        enq.status = "PICKED_UP"
        enq.pickedUpAt = datetime.utcnow()
        db.commit()

        track_res_picked = client.get(f"/api/tracking/{tracking_no}")
        cp_statuses_picked = [cp["status"] for cp in track_res_picked.json()["checkpoints"]]
        print(f"   Checkpoints after pickup: {cp_statuses_picked}")
        assert "PICKED_UP" in cp_statuses_picked, "PICKED_UP should be included after cargo is picked up"
        print("   [PASS] Tracking milestones verified successfully (ENQUIRY_GENERATED and dynamic PICKED_UP)")

        # 7. Test Tracking Mode Toggle
        print("\n7. Testing Tracking Mode Toggle (MANUAL -> API -> MANUAL)...")
        toggle_res = client.patch(f"/api/enquiry/{enquiry_id}/tracking-mode", json={"trackingMode": "API"})
        assert toggle_res.status_code == 200, f"Toggle to API failed: {toggle_res.text}"
        db.refresh(enq)
        assert enq.trackingMode == "API"

        track_res_api = client.get(f"/api/tracking/{tracking_no}")
        assert track_res_api.json()["trackingMode"] == "API"
        print("   [PASS] Successfully toggled to API mode")

        toggle_res2 = client.patch(f"/api/enquiry/{enquiry_id}/tracking-mode", json={"trackingMode": "MANUAL"})
        assert toggle_res2.status_code == 200
        db.refresh(enq)
        assert enq.trackingMode == "MANUAL"
        print("   [PASS] Successfully toggled back to MANUAL mode")

        # 8. Test Customer My-Shipments Endpoint
        print("\n8. Testing Customer My-Shipments Endpoint...")
        my_ship_res = client.get("/api/customer/my-shipments", headers=headers)
        assert my_ship_res.status_code == 200, f"My-shipments failed: {my_ship_res.text}"
        shipments_list = my_ship_res.json()
        assert len(shipments_list) >= 1
        assert any(s["trackingNumber"] == tracking_no for s in shipments_list)
        print(f"   [OK] Retrieved {len(shipments_list)} customer shipment(s)")

        # 9. Test Customer Notifications Endpoint
        print("\n9. Testing Customer Notifications Endpoint...")
        notifs_res = client.get("/api/customer/notifications", headers=headers)
        assert notifs_res.status_code == 200, f"Notifications failed: {notifs_res.text}"
        notifs_list = notifs_res.json()
        assert len(notifs_list) >= 1
        notif_id = notifs_list[0]["id"]
        print(f"   [OK] Retrieved {len(notifs_list)} notification(s)")

        # Mark notification as read
        read_res = client.patch(f"/api/customer/notifications/{notif_id}/read", headers=headers)
        assert read_res.status_code == 200
        print("   [PASS] Notification marked as read successfully")

        print("\n=== All Tests Passed Successfully! ===")
    finally:
        db.close()

if __name__ == "__main__":
    test_features()
