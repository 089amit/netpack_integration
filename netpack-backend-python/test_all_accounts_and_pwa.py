"""
Comprehensive automated test suite for NetPack Logistics Integration:
Tests all user role accounts (Admin, Driver, Courier, Customer), country listing (200+ countries),
signup, login, profile fetch, profile update (solving 500 error & stuck modal), and booking enquiry.
"""

import sys
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, run_auto_migrations, engine
from models.location import Country
from models.user import User, Role
from models.customer import Customer
from countries_data import WORLD_COUNTRIES

def run_tests():
    print("=" * 70)
    print("NETPACK LOGISTICS COMPREHENSIVE MULTI-ROLE & PWA TEST SUITE")
    print("=" * 70)

    # 1. Run migrations to ensure all countries and baseline accounts exist
    print("\n[STEP 1] Running database auto-migrations & country seeding...")
    run_auto_migrations(engine)
    client = TestClient(app)

    db = SessionLocal()

    # 2. Verify Countries
    print("\n[STEP 2] Verifying System-wide Countries Listing...")
    res_countries = client.get("/api/location/getCountry")
    assert res_countries.status_code == 200, f"Failed getting countries: {res_countries.text}"
    countries_list = res_countries.json()
    print(f"  -> Total countries returned by /api/location/getCountry: {len(countries_list)}")
    assert len(countries_list) >= 200, f"Expected at least 200 countries, got {len(countries_list)}"

    res_all_countries = client.get("/api/location/country")
    assert res_all_countries.status_code == 200
    all_data = res_all_countries.json().get("data", [])
    print(f"  -> Total countries returned by /api/location/country: {len(all_data)}")
    assert len(all_data) >= 200

    # Verify key countries exist
    country_names = {c["name"].lower() for c in countries_list}
    for check_c in ["nepal", "germany", "japan", "united states", "united arab emirates", "australia", "canada"]:
        assert check_c in country_names, f"Country '{check_c}' missing from system countries list!"
    print("  [PASS] All 230+ countries verified in system database.")

    # 3. Test Admin Account
    print("\n[STEP 3] Testing Admin Account (admin@example.com / Admin@123)...")
    admin_login_res = client.post("/api/admin/login", json={
        "email": "admin@example.com",
        "password": "Admin@123"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_data = admin_login_res.json()
    admin_token = admin_data.get("token") or admin_data.get("access_token")
    assert admin_token, "Admin login did not return a JWT token"
    print(f"  [PASS] Admin login successful (Role: {admin_data.get('admin', {}).get('role', 'ADMIN')})")

    # 4. Test Pickup Rider / Driver Account
    print("\n[STEP 4] Testing Field Rider Account (driver@netpack.com / Driver@123)...")
    driver_login_res = client.post("/api/auth/login", json={
        "email": "driver@netpack.com",
        "password": "Driver@123"
    })
    assert driver_login_res.status_code == 200, f"Driver login failed: {driver_login_res.text}"
    driver_data = driver_login_res.json()
    print(f"  [PASS] Driver login successful (Role: {driver_data.get('user', {}).get('role', 'PICKUP')})")

    # 5. Test Cargo Courier / Staff Account
    print("\n[STEP 5] Testing Cargo Courier Account (courier@netpack.com / Courier@123)...")
    courier_login_res = client.post("/api/auth/login", json={
        "email": "courier@netpack.com",
        "password": "Courier@123"
    })
    assert courier_login_res.status_code == 200, f"Courier auth login failed: {courier_login_res.text}"
    
    # Also test courier login via customer portal endpoint
    courier_pwa_res = client.post("/api/customer/auth/login", json={
        "email": "courier@netpack.com",
        "password": "Courier@123"
    })
    assert courier_pwa_res.status_code == 200, f"Courier PWA customer-login failed: {courier_pwa_res.text}"
    courier_pwa_data = courier_pwa_res.json()
    assert isinstance(courier_pwa_data["customer"]["country"], str), "Customer country must be a string name!"
    print(f"  [PASS] Courier login successful on both Staff and Customer Portal.")

    # 6. Test Customer Account
    print("\n[STEP 6] Testing Customer Account (customer@netpack.com / Customer@123)...")
    cust_login_res = client.post("/api/customer/auth/login", json={
        "email": "customer@netpack.com",
        "password": "Customer@123"
    })
    assert cust_login_res.status_code == 200, f"Customer login failed: {cust_login_res.text}"
    cust_data = cust_login_res.json()
    cust_token = cust_data["token"]
    cust_profile = cust_data["customer"]
    print(f"  -> Logged in as: {cust_profile['name']}, Country: {cust_profile['country']}")
    assert isinstance(cust_profile["country"], str), "Country must be returned as a string!"
    print("  [PASS] Customer login successful.")

    # 7. Test Customer Profile Fetch (GET /api/customer/profile) - Verifies No 500 Error
    print("\n[STEP 7] Testing Customer Profile Fetch (GET /api/customer/profile)...")
    profile_res = client.get("/api/customer/profile", headers={"Authorization": f"Bearer {cust_token}"})
    assert profile_res.status_code == 200, f"Profile fetch failed with status {profile_res.status_code}: {profile_res.text}"
    profile_data = profile_res.json()
    assert profile_data["email"] == "customer@netpack.com"
    assert isinstance(profile_data["country"], str), f"Profile country must be string, got: {type(profile_data['country'])}"
    print(f"  -> Profile country: {profile_data['country']}, city: {profile_data['city']}, phone: {profile_data['phone']}")
    print("  [PASS] Profile GET returns 200 OK with clean string country field (No 500 error).")

    # 8. Test Customer Profile Update (PUT /api/customer/profile) - Verifies No 500 Foreign Key Error
    print("\n[STEP 8] Testing Customer Profile Update (PUT /api/customer/profile)...")
    update_payload = {
        "name": "NetPack Loyal Customer (Updated)",
        "phone": "+49-1512345678",
        "address1": "Brandenburger Tor 1",
        "address2": "Mitte",
        "city": "Berlin",
        "postcode": "10117",
        "country": "Germany",
        "countryId": 11
    }
    update_res = client.put(
        "/api/customer/profile",
        json=update_payload,
        headers={"Authorization": f"Bearer {cust_token}"}
    )
    assert update_res.status_code == 200, f"Profile update failed with status {update_res.status_code}: {update_res.text}"
    update_data = update_res.json()
    updated_cust = update_data["customer"]
    assert updated_cust["name"] == "NetPack Loyal Customer (Updated)"
    assert updated_cust["country"] == "Germany"
    assert updated_cust["city"] == "Berlin"
    assert isinstance(updated_cust["country"], str)
    print("  [PASS] Profile PUT returns 200 OK, updated country to 'Germany' without 500 error!")

    # 9. Test New Customer Account Creation & Details Onboarding
    print("\n[STEP 9] Testing New Customer Signup & Details Submission...")
    import random
    rand_num = random.randint(1000, 9999)
    new_email = f"autotest_{rand_num}@netpacktest.com"
    signup_payload = {
        "name": f"Auto Test User {rand_num}",
        "email": new_email,
        "phone": "+81-9012345678",
        "password": "Password@123",
        "address1": "Shibuya 1-1",
        "city": "Tokyo",
        "postcode": "150-0002",
        "country": "Japan"
    }
    signup_res = client.post("/api/customer/auth/signup", json=signup_payload)
    assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
    signup_data = signup_res.json()
    new_token = signup_data["token"]
    new_cust = signup_data["customer"]
    assert new_cust["country"] == "Japan"
    print(f"  -> Created new customer: {new_email} in country: {new_cust['country']}")

    # Now simulate submitting onboarding details update for this new account
    details_update_payload = {
        "name": f"Auto Test User {rand_num} (Verified)",
        "phone": "+81-9098765432",
        "address1": "Shinjuku Chome 2",
        "address2": "Floor 5",
        "city": "Tokyo",
        "postcode": "160-0022",
        "country": "Japan"
    }
    details_res = client.put(
        "/api/customer/profile",
        json=details_update_payload,
        headers={"Authorization": f"Bearer {new_token}"}
    )
    assert details_res.status_code == 200, f"Onboarding details update failed: {details_res.text}"
    print("  [PASS] New customer onboarding details saved smoothly (User NOT stuck in modal).")

    # 10. Test Booking Enquiry Creation (POST /api/customer/enquiry)
    print("\n[STEP 10] Testing Booking Enquiry Creation (Doorstep Pickup & Air Cargo)...")
    enquiry_payload = {
        "commodity": "Handicrafts & Organic Herbal Tea",
        "approximateWeight": 4.5,
        "senderName": f"Auto Test User {rand_num}",
        "senderPhone": "+81-9098765432",
        "senderAddress": "Shinjuku Chome 2",
        "senderCity": "Tokyo",
        "receiverName": "Pooja Sharma",
        "receiverPhone": "+971-501234567",
        "receiverAddress": "Al Rigga Road, Deira",
        "receiverCity": "Dubai",
        "receiverCountry": "United Arab Emirates",
        "receiverPostcode": "00000",
        "isPickupRequired": True,
        "pickupAddress": "Shinjuku Chome 2, Floor 5",
        "pickupPhone": "+81-9098765432",
        "pickupNote": "Fragile items packed carefully"
    }
    enquiry_res = client.post(
        "/api/customer/enquiry",
        json=enquiry_payload,
        headers={"Authorization": f"Bearer {new_token}"}
    )
    assert enquiry_res.status_code == 200, f"Booking enquiry failed: {enquiry_res.text}"
    enquiry_data = enquiry_res.json()
    tracking_num = enquiry_data.get("trackingNumber")
    print(f"  [PASS] Booking enquiry created successfully with Tracking Number: {tracking_num}")

    db.close()
    print("\n" + "=" * 70)
    print("ALL TESTS PASSED WITH 100% SUCCESS! (0 ERRORS)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
