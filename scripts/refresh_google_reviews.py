#!/usr/bin/env python3
"""Optional scheduled Google Places snapshot, disabled by default.

IMPORTANT: Google Places API generally prohibits caching/rehosting review content.
Use only after confirming you have sufficient rights to store and redistribute
this data. The repository variable ENABLE_GOOGLE_REVIEW_CACHE gates its use.
"""

import datetime as dt
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

PLACE_ID = "ChIJWVfiXABzhkcRh_osv744VoU"
FILE = Path("static/data/google-reviews.json")
TTL = dt.timedelta(hours=23)
UTC = dt.timezone.utc


def utc_now():
    return dt.datetime.now(UTC)


def iso(time):
    return time.isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_iso(time):
    return dt.datetime.fromisoformat(time.replace("Z", "+00:00"))


def main():
    now = utc_now()
    existing = None
    if FILE.exists():
        try:
            existing = json.loads(FILE.read_text(encoding="utf-8"))
            expiry = parse_iso(existing["expiresAt"])
            if now < expiry:
                print(f"Current snapshot valid until {iso(expiry)}; no request needed")
                return 0
        except (ValueError, KeyError, TypeError):
            print("Existing snapshot is invalid or expired")

    key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not key:
        print("Missing GOOGLE_PLACES_API_KEY repository secret", file=sys.stderr)
        return 1

    req = Request(
        f"https://places.googleapis.com/v1/places/{PLACE_ID}",
        headers={
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews,googleMapsUri,attributions",
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(req, timeout=20) as response:
            place = json.load(response)
    except (HTTPError, URLError, TimeoutError) as exc:
        # Don't retain stale material if the refresh fails.
        if FILE.exists():
            FILE.unlink()
        print(f"::warning::Places refresh failed ({type(exc).__name__}); removed any expired snapshot")
        return 0

    reviews = place.get("reviews") or []
    if not reviews:
        # Google sometimes returns no review objects. Do not publish an empty
        # snapshot or continue serving an expired one.
        if FILE.exists():
            FILE.unlink()
        print("No review objects returned. Removed stale snapshot (if any).")
        return 0

    # For a separately authorized source, retain supplied author attributions.
    snapshot = {
        "source": "Google Places API (New)",
        "placeId": place.get("id", PLACE_ID),
        "fetchedAt": iso(now),
        "expiresAt": iso(now + TTL),
        "rating": place.get("rating"),
        "userRatingCount": place.get("userRatingCount"),
        "googleMapsURI": place.get("googleMapsUri"),
        "attributions": place.get("attributions") or [],
        "reviews": [
            {
                "rating": r.get("rating"),
                "text": r.get("text", {}).get("text", "") if isinstance(r.get("text"), dict) else r.get("text", ""),
                "googleMapsURI": r.get("googleMapsUri"),
                "authorAttribution": {
                    "displayName": (r.get("authorAttribution") or {}).get("displayName"),
                    "uri": (r.get("authorAttribution") or {}).get("uri"),
                    "photoURI": (r.get("authorAttribution") or {}).get("photoUri"),
                },
            }
            for r in reviews
        ],
    }
    FILE.parent.mkdir(parents=True, exist_ok=True)
    FILE.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Snapshot written with {len(reviews)} reviews, expires {snapshot['expiresAt']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
