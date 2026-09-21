import pandas as pd
import mysql.connector
import os
import re
import sys
from datetime import datetime
from typing import Optional

# =======================
# DATABASE CONFIG
# =======================
DB_CONFIG = {
    "host": "localhost",
    "database": "netpack",
    "user": "root",
    "password": "newpassword",
}

# =======================
# EXCEL FILE
# =======================
def find_excel_in_downloads(
    filename="UPS International AreaSurcharge 2024 - DUBAI CONNECTION.xlsx"
):
    path = os.path.join(os.path.expanduser("~"), "Downloads", filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Excel file not found: {path}")
    print(f"✓ Using Excel file: {path}")
    return path

# =======================
# HELPERS
# =======================
def clean_postal_code(code) -> Optional[str]:
    if pd.isna(code):
        return None
    value = str(code).strip()
    if value.lower() in ["", "na", "n/a", "nan", "no"]:
        return None
    value = re.sub(r"[^A-Za-z0-9\- ]", "", value)
    return value or None


def map_surcharge_type(origin, destination, country_code: str) -> str:
    o = str(origin).lower() if pd.notna(origin) else ""
    d = str(destination).lower() if pd.notna(destination) else ""

    if country_code == "QA":
        return "REMOTE_AREA"

    if country_code == "BR":
        if "pickup" in o:
            return "PICKUP_AREA"
        if "remote" in d:
            return "REMOTE_AREA"
        return "EXTENDED_AREA"

    if country_code in ["NG", "JM", "CL", "DO"]:
        if "remote" in o or "remote" in d:
            return "REMOTE_AREA"
        return "EXTENDED_AREA"

    if "remote" in o or "remote" in d:
        return "REMOTE_AREA"
    if "pickup" in o or "pickup" in d:
        return "PICKUP_AREA"

    return "EXTENDED_AREA"


# =======================
# COUNTRY HANDLER
# =======================
def ensure_country_exists(cursor, country_name: str) -> int:
    cursor.execute(
        "SELECT id FROM Country WHERE LOWER(name)=LOWER(%s) LIMIT 1",
        (country_name,),
    )
    row = cursor.fetchone()
    if row:
        return row[0]

    cursor.execute(
        """
        INSERT INTO Country (name, isActive)
        VALUES (%s, TRUE)
        """,
        (country_name,),
    )
    return cursor.lastrowid


# =======================
# MAIN IMPORT
# =======================
def process_excel_to_db(excel_path: str):
    connection = mysql.connector.connect(**DB_CONFIG)
    cursor = connection.cursor()
    print("✓ Connected to database")

    df = pd.read_excel(excel_path, header=None, engine="openpyxl")
    print(f"✓ Loaded {len(df)} rows")

    # Detect header
    header_row = None
    for i in range(25):
        if df.iloc[i].astype(str).str.lower().str.contains("country").any():
            header_row = i
            break
    if header_row is None:
        raise Exception("Header row not found")

    df.columns = df.iloc[header_row]
    df = df.iloc[header_row + 1 :].reset_index(drop=True)

    country_col = next(c for c in df.columns if "country" in str(c).lower())
    code_col = next(
        c for c in df.columns if "code" in str(c).lower() or "iata" in str(c).lower()
    )
    city_col = next(
        (c for c in df.columns if "city" in str(c).lower() or "location" in str(c).lower()),
        None,
    )
    low_col = next((c for c in df.columns if "low" in str(c).lower()), None)
    high_col = next((c for c in df.columns if "high" in str(c).lower()), None)
    origin_col = next((c for c in df.columns if "origin" in str(c).lower()), None)
    dest_col = next((c for c in df.columns if "destination" in str(c).lower()), None)

    country_cache = {}
    batch = []
    inserted = skipped = 0

    for _, row in df.iterrows():
        country_name = str(row[country_col]).strip()
        country_code = str(row[code_col]).strip().upper()

        if not country_name or country_name.lower() == "nan":
            skipped += 1
            continue

        postal_from = clean_postal_code(row[low_col]) if low_col else None
        postal_to = clean_postal_code(row[high_col]) if high_col else None
        location = (
            str(row[city_col]).strip()
            if city_col and pd.notna(row[city_col])
            else None
        )

        if not postal_from and not postal_to and not location:
            skipped += 1
            continue

        surcharge_type = map_surcharge_type(
            row[origin_col] if origin_col else "",
            row[dest_col] if dest_col else "",
            country_code,
        )

        if country_name not in country_cache:
            country_cache[country_name] = ensure_country_exists(cursor, country_name)

        batch.append(
            (
                country_cache[country_name],
                country_code,
                postal_from,
                postal_to,
                location,
                surcharge_type,
                True,
                datetime.now(),
                datetime.now(),
            )
        )
        inserted += 1

        if len(batch) == 500:
            cursor.executemany(
                """
                INSERT INTO area_surcharges
                (countryId, countryCode, postalCodeFrom, postalCodeTo,
                 locationName, surchargeType, isActive, createdAt, updatedAt)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                batch,
            )
            connection.commit()
            batch.clear()

    if batch:
        cursor.executemany(
            """
            INSERT INTO area_surcharges
            (countryId, countryCode, postalCodeFrom, postalCodeTo,
             locationName, surchargeType, isActive, createdAt, updatedAt)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            batch,
        )
        connection.commit()

    print("\n✓ IMPORT COMPLETE")
    print(f"✓ Inserted: {inserted}")
    print(f"✓ Skipped:  {skipped}")

    cursor.close()
    connection.close()
    print("✓ DB connection closed")


# =======================
# ENTRY POINT
# =======================
if __name__ == "__main__":
    print("\nUPS AREA SURCHARGE IMPORTER\n")

    excel_path = find_excel_in_downloads()
    confirm = input("Proceed with import? Type YES: ").strip().upper()

    if confirm == "YES":
        process_excel_to_db(excel_path)
    else:
        print("Import cancelled.")
