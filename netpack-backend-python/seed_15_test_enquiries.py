import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models.enquiry import Enquiry, EnquiryItem, Box, BoxItem, PickupLocationEnquiry
from models.location import Country
from models.customer import Customer
from models.user import User

def round_box_cw(gw: float, vw: float) -> float:
    base = max(gw, vw)
    if base < 10.0:
        return round(base * 2.0) / 2.0
    return float(int(base) if base == int(base) else int(base) + 1)

def seed_enquiries():
    db = SessionLocal()
    print("[*] Starting seed of 15 realistic test enquiries...")

    # Fetch users & customers
    admin_user = db.query(User).filter(User.id == 1).first()
    rider1 = db.query(User).filter(User.id == 2).first()
    rider2 = db.query(User).filter(User.id == 3).first()

    customer_pooja = db.query(Customer).filter(Customer.id == 2).first()
    customer_bikash = db.query(Customer).filter(Customer.id == 3).first()
    customer_doko = db.query(Customer).filter(Customer.id == 5).first()

    # Destination Countries
    c_usa = db.query(Country).filter(Country.id == 196).first()
    c_uk = db.query(Country).filter(Country.id == 195).first()
    c_aus = db.query(Country).filter(Country.id == 9).first()
    c_can = db.query(Country).filter(Country.id == 32).first()
    c_ger = db.query(Country).filter(Country.id == 65).first()
    c_jap = db.query(Country).filter(Country.id == 86).first()
    c_uae = db.query(Country).filter(Country.id == 184).first()
    c_fra = db.query(Country).filter(Country.id == 61).first()

    now = datetime.utcnow()

    # 15 Enquiries Specification
    specs = [
        # 1. USA - Hand-knotted Rugs (WT_DIMENSION_VERIFIED)
        {
            "trackingNumber": "NP-TEST-1001",
            "customerId": customer_pooja.id,
            "destinationCountry": c_usa.id,
            "destinationLocation": "New York, NY",
            "pinCode": 10001,
            "status": "WT_DIMENSION_VERIFIED",
            "senderName": "Himalayan Living Crafts Exports",
            "senderAddressLine1": "Boudha-6, Near Stupa North Gate",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9841234567",
            "senderEmail": "exports@himalayanliving.com.np",
            "receiverName": "Manhattan Oriental Rugs Gallery",
            "receivercompanyName": "Manhattan Rugs LLC",
            "receiverAddressLine1": "452 Lexington Ave, Suite 800",
            "receiverCity": "New York",
            "receiverState": "NY",
            "receiverPostcode": "10017",
            "receiverCountry": "United States of America",
            "receiverTelephone": "+1-212-555-0199",
            "receiverEmail": "imports@manhattanrugs.com",
            "currency": "USD",
            "estimatedRate": 480.0,
            "finalRate": 480.0,
            "isPacked": True,
            "packedAt": now - timedelta(hours=4),
            "pickedUpAt": now - timedelta(hours=6),
            "pickedUpBy": rider1.id,
            "weightProofImageUrl": "/uploads/scale_proof_sample_1.jpg",
            "boxes": [
                {"length": 80, "breadth": 50, "height": 40, "weight": 18.5, "items": [
                    {"desc": "Hand-knotted Highland Tibetan Wool Carpet (6x4 ft)", "hs": "5701.10.00", "qty": 2, "price": 350.0, "wt": 18.5}
                ]},
                {"length": 70, "breadth": 45, "height": 35, "weight": 14.2, "items": [
                    {"desc": "Organic Wool Runner Carpet (8x2.5 ft)", "hs": "5701.10.00", "qty": 3, "price": 180.0, "wt": 14.2}
                ]}
            ]
        },
        # 2. Australia - Cashmere Shawls (WT_DIMENSION_VERIFIED - for Customs Manifest AUS hub!)
        {
            "trackingNumber": "NP-TEST-1002",
            "customerId": customer_doko.id,
            "destinationCountry": c_aus.id,
            "destinationLocation": "Sydney, NSW",
            "pinCode": 2000,
            "status": "WT_DIMENSION_VERIFIED",
            "senderName": "Doko Exports Global Pvt. Ltd.",
            "senderAddressLine1": "Thamel Marg, Block 3",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9801987654",
            "senderEmail": "dokoexports.global@gmail.com",
            "receiverName": "Sydney Luxury Cashmere Boutique",
            "receivercompanyName": "Aussie Cashmere Pty Ltd",
            "receiverAddressLine1": "Level 2, 188 George Street",
            "receiverCity": "Sydney",
            "receiverState": "NSW",
            "receiverPostcode": "2000",
            "receiverCountry": "Australia",
            "receiverTelephone": "+61-2-9876-5432",
            "receiverEmail": "orders@sydneycashmere.com.au",
            "currency": "USD",
            "estimatedRate": 320.0,
            "finalRate": 320.0,
            "isPacked": True,
            "packedAt": now - timedelta(hours=3),
            "pickedUpAt": now - timedelta(hours=5),
            "pickedUpBy": rider2.id,
            "weightProofImageUrl": "/uploads/scale_proof_sample_2.jpg",
            "boxes": [
                {"length": 45, "breadth": 35, "height": 25, "weight": 6.2, "items": [
                    {"desc": "100% Himalayan Cashmere Pashmina Stole", "hs": "6214.20.00", "qty": 30, "price": 45.0, "wt": 6.2}
                ]},
                {"length": 45, "breadth": 35, "height": 25, "weight": 6.4, "items": [
                    {"desc": "Silk-Cashmere Blend Jacquard Shawls", "hs": "6214.20.00", "qty": 25, "price": 55.0, "wt": 6.4}
                ]},
                {"length": 50, "breadth": 40, "height": 30, "weight": 8.8, "items": [
                    {"desc": "Diamond-weave Embroidered Cashmere Wraps", "hs": "6214.20.00", "qty": 20, "price": 70.0, "wt": 8.8}
                ]}
            ]
        },
        # 3. UK - Singing Bowls (WT_DIMENSION_VERIFIED - for UK LHR hub)
        {
            "trackingNumber": "NP-TEST-1003",
            "customerId": customer_bikash.id,
            "destinationCountry": c_uk.id,
            "destinationLocation": "London",
            "pinCode": 1001,
            "status": "WT_DIMENSION_VERIFIED",
            "senderName": "Bodhi Sound & Meditation Arts",
            "senderAddressLine1": "Patan Industrial Area, Gate 2",
            "senderCity": "Lalitpur",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9851098765",
            "senderEmail": "info@bodhisoundarts.com",
            "receiverName": "Holistic Healing Centre UK",
            "receivercompanyName": "Zen Wellness UK Ltd",
            "receiverAddressLine1": "14 Regent Street, Covent Garden",
            "receiverCity": "London",
            "receiverState": "Greater London",
            "receiverPostcode": "WC2N 5AP",
            "receiverCountry": "United Kingdom",
            "receiverTelephone": "+44-20-7946-0912",
            "receiverEmail": "purchasing@zenwellness.co.uk",
            "currency": "USD",
            "estimatedRate": 410.0,
            "finalRate": 410.0,
            "isPacked": True,
            "packedAt": now - timedelta(hours=2),
            "pickedUpAt": now - timedelta(hours=4),
            "pickedUpBy": rider1.id,
            "weightProofImageUrl": "/uploads/scale_proof_sample_3.jpg",
            "boxes": [
                {"length": 40, "breadth": 40, "height": 35, "weight": 24.5, "items": [
                    {"desc": "Hand-hammered 7-Metal Tibetan Singing Bowls (8-12 inch)", "hs": "9206.00.00", "qty": 12, "price": 65.0, "wt": 24.5}
                ]},
                {"length": 35, "breadth": 35, "height": 30, "weight": 18.0, "items": [
                    {"desc": "Tingsha Cymbals & Bronze Ritual Dorje Bells", "hs": "9206.00.00", "qty": 20, "price": 22.0, "wt": 18.0}
                ]}
            ]
        },
        # 4. Germany - Lokta Paper (WT_DIMENSION_VERIFIED)
        {
            "trackingNumber": "NP-TEST-1004",
            "customerId": customer_doko.id,
            "destinationCountry": c_ger.id,
            "destinationLocation": "Munich, Bavaria",
            "pinCode": 80331,
            "status": "WT_DIMENSION_VERIFIED",
            "senderName": "Himalayan Natural Lokta Crafts",
            "senderAddressLine1": "Paknajol, Thamel",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9818765432",
            "senderEmail": "crafts@loktanepal.com",
            "receiverName": "Bavarian Eco Stationery GmbH",
            "receivercompanyName": "EcoPapier Bayern",
            "receiverAddressLine1": "Sendlinger Str. 42",
            "receiverCity": "Munich",
            "receiverState": "Bavaria",
            "receiverPostcode": "80331",
            "receiverCountry": "Germany",
            "receiverTelephone": "+49-89-1234567",
            "receiverEmail": "einkauf@ecopapier.de",
            "currency": "USD",
            "estimatedRate": 165.0,
            "finalRate": 165.0,
            "isPacked": True,
            "packedAt": now - timedelta(hours=5),
            "pickedUpAt": now - timedelta(hours=7),
            "pickedUpBy": rider2.id,
            "weightProofImageUrl": "/uploads/scale_proof_sample_4.jpg",
            "boxes": [
                {"length": 50, "breadth": 38, "height": 28, "weight": 11.5, "items": [
                    {"desc": "Natural Botanical Lokta Hardcover Journals", "hs": "4802.10.00", "qty": 50, "price": 8.5, "wt": 7.0},
                    {"desc": "Screen-printed Lokta Gift Wrapping Sheets", "hs": "4802.10.00", "qty": 200, "price": 1.5, "wt": 4.5}
                ]}
            ]
        },
        # 5. Canada - Organic Himalayan Tea (ASSIGNED_FOR_PICKUP - Multi-Stop Station)
        {
            "trackingNumber": "NP-TEST-1005",
            "customerId": customer_pooja.id,
            "destinationCountry": c_can.id,
            "destinationLocation": "Toronto, ON",
            "pinCode": 5001,
            "status": "ASSIGNED_FOR_PICKUP",
            "senderName": "Everest Highland Tea Exporters",
            "senderAddressLine1": "New Baneshwor, Main Road",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9849876543",
            "senderEmail": "sales@everesttea.com.np",
            "receiverName": "Toronto Gourmet Tea Importers",
            "receivercompanyName": "Maple Leaf Specialty Foods",
            "receiverAddressLine1": "350 Bay Street, Suite 1200",
            "receiverCity": "Toronto",
            "receiverState": "ON",
            "receiverPostcode": "M5H 2S6",
            "receiverCountry": "Canada",
            "receiverTelephone": "+1-416-555-0144",
            "receiverEmail": "import@mapletea.ca",
            "currency": "USD",
            "estimatedRate": 290.0,
            "pickedUpBy": rider1.id,
            "pickupStops": [
                {"location": "Baneshwor Processing Hub, Kathmandu", "phone": "+977 9849876543", "note": "Station 1: 1 carton First Flush Black Tea", "isPickedUp": True},
                {"location": "Koteshwor Blending Unit, Kathmandu", "phone": "+977 9801234567", "note": "Station 2: 1 carton Golden Tip White Tea", "isPickedUp": False}
            ],
            "boxes": [
                {"length": 45, "breadth": 40, "height": 35, "weight": 8.5, "items": [
                    {"desc": "First Flush Ilam Orthodox Black Tea (Vacuum Pouch)", "hs": "0902.10.00", "qty": 40, "price": 14.0, "wt": 8.5}
                ]},
                {"length": 45, "breadth": 40, "height": 35, "weight": 8.2, "items": [
                    {"desc": "Organic Golden Tip Spring White Tea", "hs": "0902.10.00", "qty": 35, "price": 18.0, "wt": 8.2}
                ]}
            ]
        },
        # 6. UAE - Felt Wool Cat Caves (ASSIGNED_FOR_PICKUP - 5-Box Consignment for DXB Hub)
        {
            "trackingNumber": "NP-TEST-1006",
            "customerId": customer_bikash.id,
            "destinationCountry": c_uae.id,
            "destinationLocation": "Dubai",
            "pinCode": 3001,
            "status": "ASSIGNED_FOR_PICKUP",
            "senderName": "Nepal Eco Felt Creations",
            "senderAddressLine1": "Balaju Industrial Estate",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9861234567",
            "senderEmail": "orders@ecofeltnepal.com",
            "receiverName": "Emirates Pet Haven LLC",
            "receivercompanyName": "Pet Haven Trading LLC",
            "receiverAddressLine1": "Warehouse 12, Al Quoz Industrial 3",
            "receiverCity": "Dubai",
            "receiverState": "Dubai",
            "receiverPostcode": "00000",
            "receiverCountry": "United Arab Emirates",
            "receiverTelephone": "+971-4-321-9876",
            "receiverEmail": "supply@pethaven.ae",
            "currency": "USD",
            "estimatedRate": 850.0,
            "pickedUpBy": rider1.id,
            "pickupStops": [
                {"location": "Balaju Industrial Estate Block A", "phone": "+977 9861234567", "note": "Station 1: 3 large boxes Cat Caves", "isPickedUp": False},
                {"location": "Swayambhu Finishing Workshop", "phone": "+977 9851122334", "note": "Station 2: 2 boxes Trivets & Garlands", "isPickedUp": False}
            ],
            "boxes": [
                {"length": 60, "breadth": 50, "height": 45, "weight": 7.5, "items": [{"desc": "Handmade Merino Wool Cat Caves", "hs": "5702.31.00", "qty": 15, "price": 32.0, "wt": 7.5}]},
                {"length": 60, "breadth": 50, "height": 45, "weight": 7.5, "items": [{"desc": "Handmade Merino Wool Cat Caves", "hs": "5702.31.00", "qty": 15, "price": 32.0, "wt": 7.5}]},
                {"length": 50, "breadth": 45, "height": 40, "weight": 8.2, "items": [{"desc": "Felt Ball Trivets & Coasters Assorted", "hs": "5702.31.00", "qty": 80, "price": 5.5, "wt": 8.2}]},
                {"length": 50, "breadth": 45, "height": 40, "weight": 8.0, "items": [{"desc": "Felt Wool Animal Slippers", "hs": "5702.31.00", "qty": 40, "price": 16.0, "wt": 8.0}]},
                {"length": 55, "breadth": 45, "height": 40, "weight": 9.1, "items": [{"desc": "Felt Pom-Pom Garlands & Nursery Mobiles", "hs": "5702.31.00", "qty": 60, "price": 9.0, "wt": 9.1}]}
            ]
        },
        # 7. Japan - Mad Honey & Shilajit (ASSIGNED_FOR_PICKUP)
        {
            "trackingNumber": "NP-TEST-1007",
            "customerId": customer_doko.id,
            "destinationCountry": c_jap.id,
            "destinationLocation": "Tokyo",
            "pinCode": 1000001,
            "status": "ASSIGNED_FOR_PICKUP",
            "senderName": "Himalayan Forest Bio-Resources",
            "senderAddressLine1": "Maharajgunj, Embassy Road",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9803456789",
            "senderEmail": "bio@himalayanwild.com",
            "receiverName": "Tokyo Natural Health & Wellness Co.",
            "receivercompanyName": "Tokyo Wellness Imports KK",
            "receiverAddressLine1": "2-7-1 Ginza, Chuo-ku",
            "receiverCity": "Tokyo",
            "receiverState": "Tokyo",
            "receiverPostcode": "104-0061",
            "receiverCountry": "Japan",
            "receiverTelephone": "+81-3-5555-0182",
            "receiverEmail": "trade@tokyowellness.jp",
            "currency": "USD",
            "estimatedRate": 310.0,
            "pickedUpBy": rider2.id,
            "pickupStops": [
                {"location": "Maharajgunj Organic Cellar, Kathmandu", "phone": "+977 9803456789", "note": "Station 1: 1 wooden crate Wild Honey", "isPickedUp": False},
                {"location": "Dhapasi Ayurvedic Lab, Kathmandu", "phone": "+977 9811223344", "note": "Station 2: 1 carton Pure Shilajit Resin", "isPickedUp": False}
            ],
            "boxes": [
                {"length": 40, "breadth": 30, "height": 25, "weight": 12.0, "items": [{"desc": "Himalayan Cliff Mad Honey in Glass Jars (250g)", "hs": "0409.00.00", "qty": 30, "price": 28.0, "wt": 12.0}]},
                {"length": 40, "breadth": 30, "height": 25, "weight": 11.5, "items": [{"desc": "Pure Shilajit Resin Ayurvedic Grade (50g)", "hs": "3004.90.00", "qty": 50, "price": 22.0, "wt": 11.5}]}
            ]
        },
        # 8. France - Hemp Backpacks & Travel Gear (ASSIGNED_FOR_PICKUP)
        {
            "trackingNumber": "NP-TEST-1008",
            "customerId": customer_pooja.id,
            "destinationCountry": c_fra.id,
            "destinationLocation": "Paris",
            "pinCode": 75001,
            "status": "ASSIGNED_FOR_PICKUP",
            "senderName": "Everest Wild Hemp Industries",
            "senderAddressLine1": "Sundhara, Lalitpur",
            "senderCity": "Lalitpur",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9841567890",
            "senderEmail": "sales@everesthemp.com",
            "receiverName": "Paris Mode Écologique SAS",
            "receivercompanyName": "Mode Éco France",
            "receiverAddressLine1": "28 Rue du Faubourg Saint-Honoré",
            "receiverCity": "Paris",
            "receiverState": "Île-de-France",
            "receiverPostcode": "75008",
            "receiverCountry": "France",
            "receiverTelephone": "+33-1-4268-5500",
            "receiverEmail": "import@mode-ecologique.fr",
            "currency": "USD",
            "estimatedRate": 395.0,
            "pickedUpBy": rider2.id,
            "pickupStops": [
                {"location": "Sundhara Hemp Weaving Mill, Lalitpur", "phone": "+977 9841567890", "note": "Station 1: 1 carton Rucksacks", "isPickedUp": False},
                {"location": "Patan Durbar Stitching Unit, Lalitpur", "phone": "+977 9851998877", "note": "Station 2: 2 cartons Sling & Laptop Bags", "isPickedUp": False}
            ],
            "boxes": [
                {"length": 55, "breadth": 45, "height": 35, "weight": 10.2, "items": [{"desc": "Himalayan Hemp Vintage Rucksack", "hs": "4202.92.00", "qty": 20, "price": 26.0, "wt": 10.2}]},
                {"length": 50, "breadth": 40, "height": 30, "weight": 8.4, "items": [{"desc": "Hemp Crossbody Sling Bags", "hs": "4202.92.00", "qty": 35, "price": 14.0, "wt": 8.4}]},
                {"length": 50, "breadth": 40, "height": 30, "weight": 8.6, "items": [{"desc": "Padded Laptop Bags (15.6 inch) Eco Hemp", "hs": "4202.92.00", "qty": 25, "price": 21.0, "wt": 8.6}]}
            ]
        },
        # 9. USA - Thangka Paintings (PICKED_UP)
        {
            "trackingNumber": "NP-TEST-1009",
            "customerId": customer_doko.id,
            "destinationCountry": c_usa.id,
            "destinationLocation": "Los Angeles, CA",
            "pinCode": 90001,
            "status": "PICKED_UP",
            "senderName": "Mandala Fine Sacred Art Gallery",
            "senderAddressLine1": "Boudha Circle, Gate 1",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9841122334",
            "senderEmail": "gallery@mandalathangka.com",
            "receiverName": "Pacific Asian Art Museum Store",
            "receivercompanyName": "Pacific Asian Art LLC",
            "receiverAddressLine1": "46 N Los Robles Ave",
            "receiverCity": "Pasadena",
            "receiverState": "CA",
            "receiverPostcode": "91101",
            "receiverCountry": "United States of America",
            "receiverTelephone": "+1-626-449-2742",
            "receiverEmail": "store@pacificasianart.org",
            "currency": "USD",
            "estimatedRate": 145.0,
            "pickedUpAt": now - timedelta(hours=3),
            "pickedUpBy": rider1.id,
            "pickupNotes": "Carefully handled gold leaf scrolls in cylindrical PVC protectors inside box",
            "boxes": [
                {"length": 65, "breadth": 25, "height": 25, "weight": 5.8, "items": [
                    {"desc": "Master-painted Medicine Buddha Thangka (Brocade Silk Frame)", "hs": "9701.10.00", "qty": 4, "price": 380.0, "wt": 5.8}
                ]}
            ]
        },
        # 10. UK - Yak Wool Knitwear (PICKED_UP)
        {
            "trackingNumber": "NP-TEST-1010",
            "customerId": customer_bikash.id,
            "destinationCountry": c_uk.id,
            "destinationLocation": "Manchester",
            "pinCode": 2001,
            "status": "PICKED_UP",
            "senderName": "Langtang Yak Wool Artisans",
            "senderAddressLine1": "Samakhusi Town Planning",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9843344556",
            "senderEmail": "artisans@langtangwool.com",
            "receiverName": "Cotswolds Highland Knitwear Ltd",
            "receivercompanyName": "Cotswolds Woollen Co.",
            "receiverAddressLine1": "Unit 5, Northern Quarter Trading Park",
            "receiverCity": "Manchester",
            "receiverState": "Greater Manchester",
            "receiverPostcode": "M4 1LA",
            "receiverCountry": "United Kingdom",
            "receiverTelephone": "+44-161-832-1144",
            "receiverEmail": "merchandise@cotswoldswool.co.uk",
            "currency": "USD",
            "estimatedRate": 235.0,
            "pickedUpAt": now - timedelta(hours=2, minutes=30),
            "pickedUpBy": rider2.id,
            "pickupNotes": "Clean compressed packages ready for warehouse weighing",
            "boxes": [
                {"length": 50, "breadth": 40, "height": 30, "weight": 7.8, "items": [
                    {"desc": "Handmade Yak Wool Unisex Poncho", "hs": "6110.11.00", "qty": 15, "price": 42.0, "wt": 7.8}
                ]},
                {"length": 45, "breadth": 35, "height": 30, "weight": 6.5, "items": [
                    {"desc": "Yak Wool Cable Knit Cardigans", "hs": "6110.11.00", "qty": 12, "price": 48.0, "wt": 6.5}
                ]}
            ]
        },
        # 11. Australia - Lost-Wax Bronze Statues (PICKED_UP - for AUS Hub)
        {
            "trackingNumber": "NP-TEST-1011",
            "customerId": customer_pooja.id,
            "destinationCountry": c_aus.id,
            "destinationLocation": "Melbourne, VIC",
            "pinCode": 3000,
            "status": "PICKED_UP",
            "senderName": "Shakya Bronze Master Sculptors",
            "senderAddressLine1": "Oku Bahal, Patan",
            "senderCity": "Lalitpur",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9851087654",
            "senderEmail": "shakyabronze@gmail.com",
            "receiverName": "Melbourne Eastern Art Collection",
            "receivercompanyName": "Victoria Heritage Imports",
            "receiverAddressLine1": "88 Collins Street",
            "receiverCity": "Melbourne",
            "receiverState": "VIC",
            "receiverPostcode": "3000",
            "receiverCountry": "Australia",
            "receiverTelephone": "+61-3-9654-7890",
            "receiverEmail": "curator@melbourneart.com.au",
            "currency": "USD",
            "estimatedRate": 380.0,
            "pickedUpAt": now - timedelta(hours=1, minutes=45),
            "pickedUpBy": rider1.id,
            "pickupNotes": "Heavily padded wooden reinforced cartons",
            "boxes": [
                {"length": 45, "breadth": 35, "height": 35, "weight": 19.5, "items": [
                    {"desc": "Green Tara Cast Bronze Deity Statue (10 inch)", "hs": "7419.80.00", "qty": 6, "price": 110.0, "wt": 19.5}
                ]},
                {"length": 40, "breadth": 35, "height": 30, "weight": 16.2, "items": [
                    {"desc": "Manjushri Bronze Statue with Silver Inlay (8 inch)", "hs": "7419.80.00", "qty": 8, "price": 95.0, "wt": 16.2}
                ]}
            ]
        },
        # 12. USA - Silver Filigree Jewelry (ENQUIRY_GENERATED)
        {
            "trackingNumber": "NP-TEST-1012",
            "customerId": customer_doko.id,
            "destinationCountry": c_usa.id,
            "destinationLocation": "Chicago, IL",
            "pinCode": 60601,
            "status": "ENQUIRY_GENERATED",
            "senderName": "Newar Silver Arts Guild",
            "senderAddressLine1": "Asan Tole, Kathmandu",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9841889900",
            "senderEmail": "guild@newarsilver.com",
            "receiverName": "Windy City Fine Jewelry Boutique",
            "receivercompanyName": "Midwest Artisans Group",
            "receiverAddressLine1": "224 S Michigan Ave",
            "receiverCity": "Chicago",
            "receiverState": "IL",
            "receiverPostcode": "60604",
            "receiverCountry": "United States of America",
            "receiverTelephone": "+1-312-555-0188",
            "receiverEmail": "orders@windycityjewelry.com",
            "currency": "USD",
            "estimatedRate": 95.0,
            "boxes": [
                {"length": 30, "breadth": 25, "height": 20, "weight": 3.2, "items": [
                    {"desc": "925 Sterling Silver Turquoise Mandala Pendants", "hs": "7113.11.00", "qty": 50, "price": 35.0, "wt": 3.2}
                ]}
            ]
        },
        # 13. Canada - Carved Wooden Crafts (ENQUIRY_GENERATED)
        {
            "trackingNumber": "NP-TEST-1013",
            "customerId": customer_bikash.id,
            "destinationCountry": c_can.id,
            "destinationLocation": "Vancouver, BC",
            "pinCode": 6001,
            "status": "ENQUIRY_GENERATED",
            "senderName": "Kathmandu Valley Woodcarving Studio",
            "senderAddressLine1": "Bungamati Traditional Village",
            "senderCity": "Lalitpur",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9841998877",
            "senderEmail": "wood@bungamaticrafts.com",
            "receiverName": "Pacific Heritage Imports",
            "receivercompanyName": "Vancouver Pacific Trading",
            "receiverAddressLine1": "1055 W Georgia St, Suite 1500",
            "receiverCity": "Vancouver",
            "receiverState": "BC",
            "receiverPostcode": "V6E 3P3",
            "receiverCountry": "Canada",
            "receiverTelephone": "+1-604-555-0192",
            "receiverEmail": "purchasing@pacificcrafts.ca",
            "currency": "USD",
            "estimatedRate": 265.0,
            "boxes": [
                {"length": 50, "breadth": 40, "height": 30, "weight": 9.0, "items": [
                    {"desc": "Carved Teakwood Mahakala Protective Mask", "hs": "4420.10.00", "qty": 10, "price": 45.0, "wt": 9.0}
                ]},
                {"length": 50, "breadth": 40, "height": 30, "weight": 8.5, "items": [
                    {"desc": "Carved Wooden Garuda Wall Sculptures", "hs": "4420.10.00", "qty": 8, "price": 55.0, "wt": 8.5}
                ]}
            ]
        },
        # 14. Germany - Incense & Essential Oils (ENQUIRY_GENERATED)
        {
            "trackingNumber": "NP-TEST-1014",
            "customerId": customer_pooja.id,
            "destinationCountry": c_ger.id,
            "destinationLocation": "Berlin",
            "pinCode": 10115,
            "status": "ENQUIRY_GENERATED",
            "senderName": "Ayurvedic Aromas of the Himalayas",
            "senderAddressLine1": "Kapan Monastery Road",
            "senderCity": "Kathmandu",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9841334455",
            "senderEmail": "aromas@kapanherbs.com",
            "receiverName": "Berlin Naturkosmetik & Duftwelt",
            "receivercompanyName": "Duftwelt Berlin GmbH",
            "receiverAddressLine1": "Friedrichstraße 180",
            "receiverCity": "Berlin",
            "receiverState": "Berlin",
            "receiverPostcode": "10117",
            "receiverCountry": "Germany",
            "receiverTelephone": "+49-30-9876543",
            "receiverEmail": "kontakt@duftwelt-berlin.de",
            "currency": "USD",
            "estimatedRate": 330.0,
            "boxes": [
                {"length": 40, "breadth": 35, "height": 30, "weight": 10.5, "items": [
                    {"desc": "Natural Himalayan Rope Incense (Hand-rolled)", "hs": "3307.41.00", "qty": 120, "price": 3.0, "wt": 10.5}
                ]},
                {"length": 40, "breadth": 35, "height": 30, "weight": 10.2, "items": [
                    {"desc": "Tibetan Cedarwood & Juniper Incense Sticks", "hs": "3307.41.00", "qty": 100, "price": 3.5, "wt": 10.2}
                ]},
                {"length": 35, "breadth": 30, "height": 25, "weight": 7.8, "items": [
                    {"desc": "Organic Lemongrass & Wintergreen Essential Oil (100ml)", "hs": "3301.29.00", "qty": 60, "price": 8.0, "wt": 7.8}
                ]}
            ]
        },
        # 15. Japan - Meditation Cushions (ENQUIRY_GENERATED - 4-Box Consignment)
        {
            "trackingNumber": "NP-TEST-1015",
            "customerId": customer_doko.id,
            "destinationCountry": c_jap.id,
            "destinationLocation": "Osaka",
            "pinCode": 5300001,
            "status": "ENQUIRY_GENERATED",
            "senderName": "Doko Organic Living Crafts",
            "senderAddressLine1": "Sanepa Heights",
            "senderCity": "Lalitpur",
            "senderCountry": "Nepal",
            "senderPhone": "+977-9801122334",
            "senderEmail": "living@dokoexports.com",
            "receiverName": "Kansai Zen Living Studio",
            "receivercompanyName": "Kansai Wellness Imports",
            "receiverAddressLine1": "3-1-1 Umeda, Kita-ku",
            "receiverCity": "Osaka",
            "receiverState": "Osaka",
            "receiverPostcode": "530-0001",
            "receiverCountry": "Japan",
            "receiverTelephone": "+81-6-6345-0199",
            "receiverEmail": "support@kansaizen.jp",
            "currency": "USD",
            "estimatedRate": 580.0,
            "boxes": [
                {"length": 55, "breadth": 45, "height": 40, "weight": 8.0, "items": [{"desc": "Buckwheat Hull Zafu Meditation Cushions", "hs": "9404.90.00", "qty": 12, "price": 30.0, "wt": 8.0}]},
                {"length": 55, "breadth": 45, "height": 40, "weight": 8.0, "items": [{"desc": "Buckwheat Hull Zafu Meditation Cushions", "hs": "9404.90.00", "qty": 12, "price": 30.0, "wt": 8.0}]},
                {"length": 50, "breadth": 40, "height": 35, "weight": 7.5, "items": [{"desc": "Zabuton Meditation Mats (Organic Cotton Cover)", "hs": "9404.90.00", "qty": 8, "price": 42.0, "wt": 7.5}]},
                {"length": 50, "breadth": 40, "height": 35, "weight": 7.5, "items": [{"desc": "Zabuton Meditation Mats (Organic Cotton Cover)", "hs": "9404.90.00", "qty": 8, "price": 42.0, "wt": 7.5}]}
            ]
        }
    ]

    created_count = 0
    for s in specs:
        # Check if already exists to avoid duplicate tracking numbers
        existing = db.query(Enquiry).filter(Enquiry.trackingNumber == s["trackingNumber"]).first()
        if existing:
            print(f"[!] Enquiry {s['trackingNumber']} already exists, skipping...")
            continue

        # Calculate Consignment Totals
        boxes_data = s["boxes"]
        total_boxes = len(boxes_data)
        gross_weight = sum(b["weight"] for b in boxes_data)
        volumetric_weight = sum((b["length"] * b["breadth"] * b["height"]) / 5000.0 for b in boxes_data)
        chargeable_weight = sum(round_box_cw(b["weight"], (b["length"] * b["breadth"] * b["height"]) / 5000.0) for b in boxes_data)

        enquiry = Enquiry(
            trackingNumber=s["trackingNumber"],
            customerId=s["customerId"],
            destinationCountry=s["destinationCountry"],
            destinationLocation=s["destinationLocation"],
            pinCode=s.get("pinCode"),
            noOfBox=total_boxes,
            weight=round(gross_weight, 2),
            volumetricWeight=round(volumetric_weight, 2),
            chargeableWeight=round(chargeable_weight, 2),
            status=s["status"],
            senderName=s["senderName"],
            senderAddressLine1=s["senderAddressLine1"],
            senderCity=s["senderCity"],
            senderCountry=s["senderCountry"],
            senderPhone=s["senderPhone"],
            senderEmail=s["senderEmail"],
            receiverName=s["receiverName"],
            receivercompanyName=s.get("receivercompanyName"),
            receiverAddressLine1=s["receiverAddressLine1"],
            receiverCity=s["receiverCity"],
            receiverState=s.get("receiverState"),
            receiverPostcode=s.get("receiverPostcode"),
            receiverCountry=s["receiverCountry"],
            receiverTelephone=s.get("receiverTelephone"),
            receiverEmail=s.get("receiverEmail"),
            currency=s.get("currency", "USD"),
            estimatedRate=s.get("estimatedRate"),
            finalRate=s.get("finalRate"),
            isPacked=s.get("isPacked", False),
            packedAt=s.get("packedAt"),
            pickedUpAt=s.get("pickedUpAt"),
            pickedUpBy=s.get("pickedUpBy"),
            pickupNotes=s.get("pickupNotes"),
            weightProofImageUrl=s.get("weightProofImageUrl"),
            trackingMode="MANUAL",
            isFromCustomer=False,
            pickupRequired=True,
            createdBy=admin_user.id if admin_user else 1,
            createdAt=now - timedelta(days=1),
            updatedAt=now
        )
        db.add(enquiry)
        db.flush()

        # Add Pickup Stops if specified
        if "pickupStops" in s:
            for stop in s["pickupStops"]:
                db.add(PickupLocationEnquiry(
                    enquiryId=enquiry.id,
                    location=stop["location"],
                    phoneNumber=stop.get("phone"),
                    note=stop.get("note"),
                    isPickedUp=stop.get("isPickedUp", False),
                    pickedUpAt=now - timedelta(hours=1) if stop.get("isPickedUp") else None
                ))

        # Add Boxes, Items, and BoxItems
        for box_idx, b in enumerate(boxes_data, 1):
            box_tracking = f"{enquiry.trackingNumber}-B{box_idx}"
            box_val = sum(it["qty"] * it["price"] for it in b["items"])
            box = Box(
                trackingNumber=box_tracking,
                weight=b["weight"],
                length=b["length"],
                breadth=b["breadth"],
                height=b["height"],
                dimensions=f"{b['length']}x{b['breadth']}x{b['height']}",
                multiplier=1.0,
                quantity=1,
                value=box_val,
                enquiryId=enquiry.id
            )
            db.add(box)
            db.flush()

            for it in b["items"]:
                # Create EnquiryItem
                e_item = EnquiryItem(
                    description=it["desc"],
                    weight=it["wt"],
                    quantity=it["qty"],
                    unitPrice=it["price"],
                    totalValue=it["qty"] * it["price"],
                    value=it["qty"] * it["price"],
                    hsCode=it["hs"],
                    enquiryId=enquiry.id
                )
                db.add(e_item)
                db.flush()

                # Link Box and Item
                db.add(BoxItem(
                    boxId=box.id,
                    enquiryItemId=e_item.id,
                    quantity=it["qty"]
                ))

        created_count += 1
        print(f"[+] Created Enquiry {enquiry.trackingNumber} ({enquiry.status}) - {total_boxes} boxes, CW: {enquiry.chargeableWeight} kg -> {enquiry.receiverCountry}")

    db.commit()
    db.close()
    print(f"\n[DONE] Successfully seeded {created_count} test enquiries!")

if __name__ == "__main__":
    seed_enquiries()
