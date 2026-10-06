import urllib.request
import json
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter

router = APIRouter(prefix="/api/forex", tags=["Forex"])

# In-memory cache for daily NRB rates
_FOREX_CACHE: Dict[str, Any] = {
    "timestamp": None,
    "data": None
}

DEFAULT_FALLBACK_RATES: Dict[str, float] = {
    "USD": 1.0,
    "NPR": 0.006521,
    "INR": 0.010439,
    "EUR": 1.136,
    "GBP": 1.328,
    "AUD": 0.697,
    "CAD": 0.705,
    "SGD": 0.783,
    "JPY": 0.00637,
    "CNY": 0.149,
    "AED": 0.272,
    "SAR": 0.266,
    "QAR": 0.274,
    "MYR": 0.245,
    "THB": 0.0298,
}


def fetch_nrb_daily_rates() -> Dict[str, Any]:
    """
    Fetches the latest published foreign exchange rates from Nepal Rastra Bank (NRB) official API.
    Uses a 5-day window to gracefully handle weekends and public holidays.
    """
    global _FOREX_CACHE

    now = datetime.utcnow()
    # Cache valid for 1 hour (3600 seconds)
    if _FOREX_CACHE["timestamp"] and _FOREX_CACHE["data"]:
        elapsed = (now - _FOREX_CACHE["timestamp"]).total_seconds()
        if elapsed < 3600:
            return _FOREX_CACHE["data"]

    today = date.today()
    start_date = (today - timedelta(days=5)).strftime("%Y-%m-%d")
    end_date = today.strftime("%Y-%m-%d")

    url = f"https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=1&from={start_date}&to={end_date}"

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "NetPackLogistics-ForexClient/1.0 (Integration; info@netpacklogistic.com)",
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_json = json.loads(response.read().decode("utf-8"))

        payload_list = res_json.get("data", {}).get("payload", [])
        if not payload_list:
            raise ValueError("No payload returned from NRB API")

        latest = payload_list[0]
        date_str = latest.get("date", end_date)
        published_on = latest.get("published_on", date_str)
        rates_list = latest.get("rates", [])

        # Find USD rate to calculate cross-rates relative to USD
        usd_item = next((r for r in rates_list if r.get("currency", {}).get("iso3") == "USD"), None)
        if not usd_item:
            raise ValueError("USD rate missing in NRB response")

        usd_unit = float(usd_item["currency"].get("unit", 1))
        usd_buy = float(usd_item.get("buy", 0))
        usd_sell = float(usd_item.get("sell", 0))
        usd_mid_npr = (usd_buy + usd_sell) / (2.0 * usd_unit)

        rates_to_usd: Dict[str, float] = {
            "USD": 1.0,
            "NPR": round(1.0 / usd_mid_npr, 6)
        }

        for r in rates_list:
            iso = r.get("currency", {}).get("iso3")
            unit = float(r.get("currency", {}).get("unit", 1))
            buy = float(r.get("buy", 0))
            sell = float(r.get("sell", 0))
            if iso and unit > 0 and usd_mid_npr > 0:
                mid_npr = (buy + sell) / (2.0 * unit)
                rates_to_usd[iso] = round(mid_npr / usd_mid_npr, 6)

        result = {
            "source": "Nepal Rastra Bank (NRB)",
            "date": date_str,
            "publishedOn": published_on,
            "usdNprRate": round(usd_mid_npr, 2),
            "ratesToUsd": rates_to_usd,
            "isLive": True
        }

        _FOREX_CACHE["timestamp"] = now
        _FOREX_CACHE["data"] = result
        return result

    except Exception as e:
        print(f"[Forex] Warning: Failed to fetch live rates from NRB: {e}. Using cached/fallback rates.")
        if _FOREX_CACHE["data"]:
            return _FOREX_CACHE["data"]

        return {
            "source": "Nepal Rastra Bank (Estimated)",
            "date": today.strftime("%Y-%m-%d"),
            "publishedOn": today.strftime("%Y-%m-%d"),
            "usdNprRate": 153.38,
            "ratesToUsd": DEFAULT_FALLBACK_RATES,
            "isLive": False,
            "error": str(e)
        }


@router.get("/rates")
def get_forex_rates():
    """
    Returns latest daily forex rates from Nepal Rastra Bank (NRB)
    with cross-currency conversion factors to USD.
    """
    return fetch_nrb_daily_rates()
