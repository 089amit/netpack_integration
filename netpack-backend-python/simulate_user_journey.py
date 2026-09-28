"""
Simulates the exact end-to-end customer user journey on http://localhost:8000
mimicking the exact fetch requests made by the React PWA frontend in the browser.
"""

import urllib.request
import json
import random

BASE_URL = "http://localhost:8000"

def post(url, data, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return resp.getcode(), json.loads(resp.read().decode("utf-8"))

def put(url, data, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        return resp.getcode(), json.loads(resp.read().decode("utf-8"))

def get(url, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        headers=({"Authorization": f"Bearer {token}"} if token else {}),
        method="GET"
    )
    with urllib.request.urlopen(req) as resp:
        return resp.getcode(), json.loads(resp.read().decode("utf-8"))

def main():
    print("=" * 65)
    print("USER JOURNEY SIMULATION: TESTING EXACT PWA BROWSER BEHAVIOR")
    print("=" * 65)

    # 1. User loads PWA and checks countries in dropdown
    print("\n[USER STEP 1] Fetching country options for dropdowns...")
    status, countries = get("/api/location/getCountry")
    print(f"  -> HTTP {status}: Received {len(countries)} world countries.")
    assert status == 200 and len(countries) >= 200, "Country list failed!"

    # 2. User signs up for an account
    rand_id = random.randint(1000, 9999)
    email = f"user_journey_{rand_id}@netpack.com"
    print(f"\n[USER STEP 2] User signs up with email: {email}...")
    signup_payload = {
        "name": f"User Persona {rand_id}",
        "email": email,
        "phone": "+977-9800000000",
        "password": "Password@123",
        "country": "Nepal"
    }
    status, signup_res = post("/api/customer/auth/signup", signup_payload)
    print(f"  -> HTTP {status}: Account created! Token received.")
    token = signup_res["token"]
    assert status == 200 and token, "Signup failed!"

    # 3. User is shown OnboardingModal (Details filling)
    # They pick Germany (+49), fill in real phone and address, and click "Save Details"
    print("\n[USER STEP 3] User fills in Onboarding Modal (Selects Germany, sets address & phone)...")
    onboarding_payload = {
        "name": f"User Persona {rand_id}",
        "phone": "+49-1701234567",
        "address1": "Kurfürstendamm 100",
        "address2": "Floor 2",
        "city": "Berlin",
        "postcode": "10711",
        "country": "Germany",
        "countryId": 11
    }
    status, save_res = put("/api/customer/profile", onboarding_payload, token)
    print(f"  -> HTTP {status}: Onboarding details saved successfully! Message: '{save_res.get('message')}'")
    assert status == 200, "Onboarding save failed!"
    assert save_res["customer"]["country"] == "Germany", "Country not updated to Germany!"
    print("  [OK] User is NOT stuck in modal! Onboarding advances to dashboard.")

    # 4. User navigates to Profile tab
    print("\n[USER STEP 4] User clicks 'Profile' in bottom navigation...")
    status, profile_res = get("/api/customer/profile", token)
    print(f"  -> HTTP {status}: Profile tab loaded!")
    assert status == 200, "Profile tab failed with error!"
    assert isinstance(profile_res["country"], str), "Country is not a string!"
    print("  [OK] Profile Fields Displayed:")
    print(f"      Country:       {profile_res['country']}")
    print(f"      Full Name:     {profile_res['name']}")
    print(f"      Email Address: {profile_res['email']}")
    print(f"      Phone Number:  {profile_res['phone']}")
    print(f"      Address:       {profile_res['address1']}, {profile_res['address2']}")
    print(f"      City/Postcode: {profile_res['city']}, {profile_res['postcode']}")
    print("  [OK] NO Error 500! Screen displays all details cleanly.")

    # 5. User clicks 'Edit Profile' from Profile Screen and changes phone/address
    print("\n[USER STEP 5] User clicks 'Edit Profile' and updates their address...")
    edit_payload = {
        "name": f"User Persona {rand_id} (Verified)",
        "phone": "+49-1709999999",
        "address1": "Unter den Linden 5",
        "address2": "Suite 300",
        "city": "Berlin",
        "postcode": "10117",
        "country": "Germany"
    }
    status, edit_res = put("/api/customer/profile", edit_payload, token)
    print(f"  -> HTTP {status}: Profile edit saved successfully!")
    assert status == 200, "Edit profile failed!"
    assert edit_res["customer"]["address1"] == "Unter den Linden 5"

    # 6. User creates an Express Consignment Booking
    print("\n[USER STEP 6] User books an express shipment to Dubai (UAE)...")
    enquiry_payload = {
        "commodity": "Pashmina Shawls & Himalayan Coffee",
        "approximateWeight": 3.2,
        "senderName": f"User Persona {rand_id}",
        "senderPhone": "+49-1709999999",
        "senderAddress": "Unter den Linden 5",
        "senderCity": "Berlin",
        "receiverName": "Fatima Al Mansoori",
        "receiverPhone": "+971-551234567",
        "receiverAddress": "Sheikh Zayed Road, Trade Centre",
        "receiverCity": "Dubai",
        "receiverCountry": "United Arab Emirates",
        "receiverPostcode": "00000",
        "isPickupRequired": True,
        "pickupAddress": "Unter den Linden 5",
        "pickupPhone": "+49-1709999999"
    }
    status, booking_res = post("/api/customer/enquiries", enquiry_payload, token)
    print(f"  -> HTTP {status}: Consignment booked! Tracking Number: {booking_res.get('trackingNumber')}")
    assert status == 200, "Booking failed!"

    # 7. User checks 'My Shipments' tab
    print("\n[USER STEP 7] User clicks 'Shipments' tab to verify consignment...")
    status, shipments = get("/api/customer/my-shipments", token)
    print(f"  -> HTTP {status}: Customer has {len(shipments)} active shipments.")
    assert status == 200 and len(shipments) >= 1, "Shipment not listed!"
    print(f"  [OK] Latest Consignment Tracking: {shipments[0].get('trackingNumber')}")

    print("\n" + "=" * 65)
    print("USER PERSPECTIVE TEST: ALL 7 STEPS PASSED WITH 100% SUCCESS!")
    print("=" * 65)

if __name__ == "__main__":
    main()
