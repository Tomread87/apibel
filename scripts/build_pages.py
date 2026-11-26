#!/usr/bin/env python3
"""Generate all localized Apibel pages from templates/index.html and static/data/translations.json."""
from __future__ import annotations
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "templates" / "index.html"
TRANSLATIONS = ROOT / "static" / "data" / "translations.json"
CONFIG = {
    "it": {"filename": "index.html", "canonical_url": "https://apibel.it/", "og_locale": "it_IT", "flag_src": "./static/assets/it.svg"},
    "en": {"filename": "index-en.html", "canonical_url": "https://apibel.it/index-en.html", "og_locale": "en_GB", "flag_src": "./static/assets/uk.svg"},
    "fr": {"filename": "index-fr.html", "canonical_url": "https://apibel.it/index-fr.html", "og_locale": "fr_FR", "flag_src": "./static/assets/fr.svg"},
    "de": {"filename": "index-de.html", "canonical_url": "https://apibel.it/index-de.html", "og_locale": "de_DE", "flag_src": "./static/assets/de.svg"},
}
TOKEN = re.compile(r"\{\{\s*(text|attr|raw):([a-z0-9_.-]+)\s*\}\}")

def generate(template: str, translations: dict, lang: str) -> str:
    def sub(m: re.Match[str]) -> str:
        mode, key = m.groups()
        if mode == "raw":
            if not key.startswith("active.") or key.removeprefix("active.") not in CONFIG:
                raise ValueError(f"Invalid template directive: {key}")
            return 'class="active" aria-current="page"' if key.removeprefix("active.") == lang else ""
        if key == "lang": value = lang
        elif key in ("canonical_url", "og_locale", "flag_src"): value = CONFIG[lang][key]
        else:
            if key not in translations or lang not in translations[key] or not translations[key][lang]:
                raise ValueError(f"Missing translation: {key} / {lang}")
            value = translations[key][lang]
        return html.escape(str(value), quote=(mode == "attr"))
    output = TOKEN.sub(sub, template)
    if "{{" in output or "}}" in output: raise ValueError(f"Unresolved placeholder in {lang}")
    return output

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--check", action="store_true", help="Check the generated pages are committed and up to date")
    args = p.parse_args()
    template = TEMPLATE.read_text(encoding="utf-8")
    translations = json.loads(TRANSLATIONS.read_text(encoding="utf-8"))
    used = {key for mode,key in TOKEN.findall(template) if mode != "raw" and key not in ("lang", "canonical_url", "og_locale", "flag_src")}
    unused = set(translations) - used
    if unused: raise ValueError(f"Unused translation keys: {sorted(unused)}")
    failed = []
    for lang, config in CONFIG.items():
        page = generate(template, translations, lang)
        path = ROOT / config["filename"]
        if args.check:
            if not path.is_file() or path.read_text(encoding="utf-8") != page:
                failed.append(config["filename"])
        else:
            path.write_text(page, encoding="utf-8")
        print(f"{config['filename']}: {'checked' if args.check else 'generated'}")
    if failed:
        print("Stale pages: " + ", ".join(failed), file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__": raise SystemExit(main())
