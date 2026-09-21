from datetime import datetime
from database import SessionLocal, engine, Base
import models
from models.user import Role, User
from models.location import Zone, Country, City
from models.rate import Rate, TIACharge, CustomCharge, PackingCharge
from models.mawb import Agent, ForwardingCompany, ForwardingService
from models.customer import Customer
from models.policy import TermsAndPolicy
from services.auth_service import get_password_hash

def seed_database():
    print("[*] Starting NetPack SQLite Database Seeding...")

    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Roles
        roles_to_seed = ["ADMIN", "OPERATION", "USER", "CUSTOMER", "PICKUP"]
        created_roles = {}
        for r_name in roles_to_seed:
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name)
                db.add(role)
                db.commit()
                db.refresh(role)
            created_roles[r_name] = role
        print("[OK] Roles seeded.")

        # 2. Seed Admin User
        admin_email = "admin@example.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                username="admin",
                password=get_password_hash("Admin@123"),
                fullName="System Administrator",
                phoneNumber="+977-9800000000",
                roleId=created_roles["ADMIN"].id,
                isActive=True
            )
            db.add(admin_user)
            db.commit()
            print(f"[OK] Default Admin created: {admin_email} / Admin@123")
        else:
            print(f"[OK] Admin user already exists: {admin_email}")

        # 2b. Seed Default Field Pickup Rider
        rider_email = "driver@netpack.com"
        rider_user = db.query(User).filter(User.email == rider_email).first()
        if not rider_user:
            rider_user = User(
                email=rider_email,
                username="rider-01",
                password=get_password_hash("Driver@123"),
                fullName="Ram Shrestha",
                phoneNumber="9841234567",
                roleId=created_roles["PICKUP"].id,
                isActive=True
            )
            db.add(rider_user)
            db.commit()
            print(f"[OK] Default Rider created: {rider_email} / Driver@123 (ID: rider-01)")
        else:
            print(f"[OK] Rider user already exists: {rider_email}")

        # 3. Seed Charges
        if not db.query(TIACharge).first():
            db.add(TIACharge(rate=50.0))
        if not db.query(CustomCharge).first():
            db.add(CustomCharge(rate=200.0))
        if not db.query(PackingCharge).first():
            db.add(PackingCharge(rate=150.0))
        db.commit()
        print("[OK] Baseline TIA, Custom & Packing charges seeded.")

        # 4. Seed Zones
        zones_data = [
            {"name": "Zone 1 - Middle East & Gulf", "description": "UAE, Qatar, Saudi Arabia, Kuwait", "weightLimit": 30.0},
            {"name": "Zone 2 - Europe & UK", "description": "United Kingdom, Germany, France", "weightLimit": 30.0},
            {"name": "Zone 3 - North America", "description": "USA, Canada", "weightLimit": 30.0},
            {"name": "Zone 4 - Asia Pacific", "description": "Australia, Japan, Singapore", "weightLimit": 25.0},
        ]
        created_zones = {}
        for z in zones_data:
            zone = db.query(Zone).filter(Zone.name == z["name"]).first()
            if not zone:
                zone = Zone(name=z["name"], description=z["description"], weightLimit=z["weightLimit"])
                db.add(zone)
                db.commit()
                db.refresh(zone)
            created_zones[z["name"]] = zone
        print("[OK] Shipping zones seeded.")

        # 5. Seed Countries
        countries_data = [
            {"name": "United Arab Emirates", "boxWeightLimit": 30.0, "zone": "Zone 1 - Middle East & Gulf"},
            {"name": "United States", "boxWeightLimit": 30.0, "zone": "Zone 3 - North America"},
            {"name": "United Kingdom", "boxWeightLimit": 30.0, "zone": "Zone 2 - Europe & UK"},
            {"name": "Australia", "boxWeightLimit": 25.0, "zone": "Zone 4 - Asia Pacific"},
            {"name": "India", "boxWeightLimit": 30.0, "zone": "Zone 1 - Middle East & Gulf"},
            {"name": "Qatar", "boxWeightLimit": 30.0, "zone": "Zone 1 - Middle East & Gulf"},
            {"name": "Canada", "boxWeightLimit": 30.0, "zone": "Zone 3 - North America"},
        ]
        created_countries = {}
        for c in countries_data:
            country = db.query(Country).filter(Country.name == c["name"]).first()
            if not country:
                country = Country(
                    name=c["name"],
                    boxWeightLimit=c["boxWeightLimit"],
                    zoneId=created_zones[c["zone"]].id,
                    isActive=True
                )
                db.add(country)
                db.commit()
                db.refresh(country)
            created_countries[c["name"]] = country
        print("[OK] Destination countries seeded.")

        # 6. Seed Overseas Agents
        agents_data = [
            {"name": "Dubai Cargo Clearing Agent", "code": "DXB", "country": "United Arab Emirates", "city": "Dubai"},
            {"name": "Heathrow Logistics Agent", "code": "LHR", "country": "United Kingdom", "city": "London"},
            {"name": "JFK Global Express Agent", "code": "JFK", "country": "United States", "city": "New York"},
        ]
        for a in agents_data:
            if not db.query(Agent).filter(Agent.code == a["code"]).first():
                agent = Agent(
                    name=a["name"],
                    code=a["code"],
                    country=a["country"],
                    city=a["city"],
                    email=f"{a['code'].lower()}@netpackagents.com",
                    phone="+971-50-000000",
                    isActive=True
                )
                db.add(agent)
        db.commit()
        print("[OK] Clearing agents seeded.")

        # 7. Seed Forwarding Companies & Services
        if not db.query(ForwardingCompany).first():
            ups = ForwardingCompany(
                name="UPS International Express",
                contactEmail="support@ups.com",
                contactPhone="+1-800-PICK-UPS",
                address="Atlanta, Georgia, USA"
            )
            db.add(ups)
            db.commit()
            db.refresh(ups)

            db.add(ForwardingService(name="UPS Express Saver", description="1-3 business days", companyId=ups.id))
            db.add(ForwardingService(name="UPS Expedited", description="3-5 business days", companyId=ups.id))

            dhl = ForwardingCompany(
                name="DHL Express",
                contactEmail="support@dhl.com",
                contactPhone="+1-800-CALL-DHL",
                address="Bonn, Germany"
            )
            db.add(dhl)
            db.commit()
            db.refresh(dhl)
            db.add(ForwardingService(name="DHL Express Worldwide", description="Door-to-door courier", companyId=dhl.id))
            db.commit()
            print("[OK] Forwarding companies & services seeded.")

        # 8. Seed Sample Rates
        if not db.query(Rate).first():
            uae_id = created_countries["United Arab Emirates"].id
            usa_id = created_countries["United States"].id

            # UAE Rates
            db.add(Rate(weightFrom=0.1, weightTo=1.0, rate=1500.0, isPerKg=False, countryId=uae_id))
            db.add(Rate(weightFrom=1.01, weightTo=5.0, rate=2800.0, isPerKg=False, countryId=uae_id))
            db.add(Rate(weightFrom=5.01, weightTo=10.0, rate=4800.0, isPerKg=False, countryId=uae_id))
            db.add(Rate(weightFrom=10.01, weightTo=100.0, rate=450.0, isPerKg=True, countryId=uae_id))

            # USA Rates
            db.add(Rate(weightFrom=0.1, weightTo=1.0, rate=2200.0, isPerKg=False, countryId=usa_id))
            db.add(Rate(weightFrom=1.01, weightTo=5.0, rate=4500.0, isPerKg=False, countryId=usa_id))
            db.add(Rate(weightFrom=5.01, weightTo=10.0, rate=7500.0, isPerKg=False, countryId=usa_id))
            db.add(Rate(weightFrom=10.01, weightTo=100.0, rate=700.0, isPerKg=True, countryId=usa_id))

            # Seed rates for each zone so every country has valid rates
            for z_name, z_obj in created_zones.items():
                db.add(Rate(weightFrom=0.1, weightTo=1.0, rate=1800.0, isPerKg=False, zoneId=z_obj.id))
                db.add(Rate(weightFrom=1.01, weightTo=5.0, rate=3500.0, isPerKg=False, zoneId=z_obj.id))
                db.add(Rate(weightFrom=5.01, weightTo=10.0, rate=6000.0, isPerKg=False, zoneId=z_obj.id))
                db.add(Rate(weightFrom=10.01, weightTo=100.0, rate=550.0, isPerKg=True, zoneId=z_obj.id))

            db.commit()
            print("[OK] Baseline tariff rate slabs seeded.")

        # Ensure zone rates exist
        for z_name, z_obj in created_zones.items():
            if not db.query(Rate).filter(Rate.zoneId == z_obj.id).first():
                db.add(Rate(weightFrom=0.1, weightTo=1.0, rate=1800.0, isPerKg=False, zoneId=z_obj.id))
                db.add(Rate(weightFrom=1.01, weightTo=5.0, rate=3500.0, isPerKg=False, zoneId=z_obj.id))
                db.add(Rate(weightFrom=5.01, weightTo=10.0, rate=6000.0, isPerKg=False, zoneId=z_obj.id))
                db.add(Rate(weightFrom=10.01, weightTo=100.0, rate=550.0, isPerKg=True, zoneId=z_obj.id))
        db.commit()

        # 9. Seed Sample Customer
        if not db.query(Customer).first():
            cust = Customer(
                name="Himalayan Handicrafts Export Pvt. Ltd.",
                phone="+977-9841234567",
                email="contact@himalayanhandicrafts.com",
                isOrganization=True,
                organizationName="Himalayan Handicrafts",
                address1="Thamel Marg, Ward 26",
                city="Kathmandu",
                countryId=created_countries["United Arab Emirates"].id,
                postcode="44600"
            )
            db.add(cust)
            db.commit()
            print("[OK] Sample customer seeded.")

        # 10. Seed Policies
        if not db.query(TermsAndPolicy).first():
            db.add(TermsAndPolicy(
                title="Terms and Conditions",
                slug="terms-and-conditions",
                content="<p>Welcome to NetPack Logistics. By booking cargo with us, you agree to our standard freight terms and international airway bill carriage regulations.</p>",
                isActive=True
            ))
            db.add(TermsAndPolicy(
                title="Privacy & Data Protection Policy",
                slug="privacy-policy",
                content="<p>NetPack Logistics respects customer confidentiality and secures shipper and consignee information.</p>",
                isActive=True
            ))
            db.commit()
            print("[OK] Terms and policies seeded.")

        print("\n[SUCCESS] Database seeded successfully!")
        print("Ready to run: python main.py")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
