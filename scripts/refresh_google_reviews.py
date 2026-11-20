#!/usr/bin/env python3
"""Create four-language Apibel Places snapshots, when storage rights permit.

WARNING: Google's standard Places API terms generally prohibit caching,
rehosting, and redistributing review content. Keep the GitHub Actions
ENABLE_GOOGLE_REVIEW_CACHE gate disabled unless authorized to store it.

The Google API key is read only from the GOOGLE_PLACES_API_KEY environment
variable (GitHub Actions repository secret); never commit an actual key.
"""

import datetime as dt
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

PLACE_ID = "ChIJWVfiXABzhkcRh_osv744VoU"
LANGUAGES = ("it", "en", "de", "fr")
FILE = Path("static/data/google-reviews.json")
TTL = dt.timedelta(hours=1)  # Preserve the current one-hour testing interval.
UTC = dt.timezone.utc
FIELD_MASK = "id,rating,userRatingCount,reviews,googleMapsUri,attributions"


def utc_now():
    return dt.datetime.now(UTC)


def iso(time):
    return time.isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_iso(time):
    return dt.datetime.fromisoformat(time.replace("Z", "+00:00"))


def localized_text(value):
    if isinstance(value, dict):
        return value.get("text") or "", value.get("languageCode")
    return value if isinstance(value, str) else "", None


def normalized_review(review):
    localized, localized_lang = localized_text(review.get("text"))
    original, original_lang = localized_text(review.get("originalText"))
    author = review.get("authorAttribution") or {}
    actual_text = localized or original

    return {
        "rating": review.get("rating"),
        "text": actual_text,
        "textLanguageCode": localized_lang or original_lang,
        "originalText": original,
        "originalLanguageCode": original_lang,
        "translated": bool(localized and original and localized != original),
        "googleMapsURI": review.get("googleMapsUri"),
        "authorAttribution": {
            "displayName": author.get("displayName"),
            "uri": author.get("uri"),
            "photoURI": author.get("photoUri"),
        },
    }


def fetch_place(key, language):
    query = urlencode({"languageCode": language})
    request = Request(
        f"https://places.googleapis.com/v1/places/{PLACE_ID}?{query}",
        headers={
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": FIELD_MASK,
            "Accept": "application/json",
        },
    )
    with urlopen(request, timeout=20) as response:
        return json.load(response)


def main():
    now = utc_now()

    if FILE.exists():
        try:
            previous = json.loads(FILE.read_text(encoding="utf-8"))
            expiry = parse_iso(previous["expiresAt"])
            # Old single-language snapshots are intentionally refreshed.
            languages = previous.get("languages") or {}
            if now < expiry and all(
                isinstance(languages.get(lang), dict) for lang in LANGUAGES
            ):
                print(f"Four-language snapshot valid until {iso(expiry)}; no request needed")
                return 0
        except (ValueError, KeyError, TypeError) as exc:
            print(f"Snapshot invalid; will refresh ({type(exc).__name__})")

    key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not key:
        print("Missing GOOGLE_PLACES_API_KEY repository secret", file=sys.stderr)
        return 1

    localized_places = {}
    try:
        for lang in LANGUAGES:
            place = fetch_place(key, lang)
            reviews = [normalized_review(r) for r in (place.get("reviews") or [])]
            localized_places[lang] = {
                "rating": place.get("rating"),
                "userRatingCount": place.get("userRatingCount"),
                "googleMapsURI": place.get("googleMapsUri"),
                "attributions": place.get("attributions") or [],
                "reviews": reviews,
            }
            print(f"{lang}: Google returned {len(reviews)} review(s)")
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        # Never publish partially refreshed translations or delete last good data.
        print(f"::error::Google Places request failed ({type(exc).__name__})", file=sys.stderr)
        return 1

    if not any(localized_places[lang]["reviews"] for lang in LANGUAGES):
        print("::error::All four languages returned zero reviews. Previous snapshot unchanged.", file=sys.stderr)
        return 1

    italian = localized_places["it"]
    snapshot = {
        "source": "Google Places API (New)",
        "placeId": PLACE_ID,
        "fetchedAt": iso(now),
        "expiresAt": iso(now + TTL),
        # Keep the original top-level format for existing consumers.
        "rating": italian["rating"],
        "userRatingCount": italian["userRatingCount"],
        "googleMapsURI": italian["googleMapsURI"],
        "attributions": italian["attributions"],
        "reviews": italian["reviews"],
        "languages": localized_places,
    }

    FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_file = FILE.with_suffix(".json.tmp")
    temp_file.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp_file.replace(FILE)
    print(f"Four-language snapshot written; expires {snapshot['expiresAt']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
