#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Assemble website/blog/blog-i18n.js (window.TN_BLOG_I18N) from:
  - tools/blog_content_en.py            -> EN (source of truth + fallback)
  - tools/blog_locales/<loc>.py         -> per-locale dicts (LOC = {...})

Each locale file defines a module-level dict named LOC with the SAME keys
as EN. Missing keys fall back to EN at runtime (blog.js) AND here (we fill
gaps with EN so the file is self-contained / valid).

Output is pure JS:  window.TN_BLOG_I18N = { "en": {...}, "fr": {...}, ... };

Idempotent: run any time after editing content or locale files.
"""
import json
import os
import sys
import importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
LOCDIR = os.path.join(HERE, "blog_locales")
OUT = os.path.normpath(os.path.join(HERE, "..", "blog", "blog-i18n.js"))

# canonical locale order = the site's 34 locales (matches translations.js)
LOCALES = [
    "en", "fr", "de", "es", "it", "pt", "pt-BR", "nl", "pl", "ru", "uk",
    "cs", "ro", "hu", "sv", "nb", "da", "fi", "el", "tr", "ar", "he",
    "ja", "zh-Hans", "zh-Hant", "ko", "th", "vi", "id", "ms", "hi",
    "bn", "ur", "sw",
]


def load_module_dict(path, varname):
    spec = importlib.util.spec_from_file_location("m_" + os.path.basename(path), path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return getattr(mod, varname)


def main():
    en = load_module_dict(os.path.join(HERE, "blog_content_en.py"), "EN")
    keys = list(en.keys())

    bundle = {"en": dict(en)}
    missing_report = {}

    for loc in LOCALES:
        if loc == "en":
            continue
        path = os.path.join(LOCDIR, loc + ".py")
        if not os.path.exists(path):
            print("WARN: no translation file for %s -> using EN fallback" % loc, file=sys.stderr)
            bundle[loc] = dict(en)
            missing_report[loc] = "FILE MISSING"
            continue
        loc_dict = load_module_dict(path, "LOC")
        merged = {}
        miss = []
        for k in keys:
            if k in loc_dict and loc_dict[k] not in (None, ""):
                merged[k] = loc_dict[k]
            else:
                merged[k] = en[k]
                miss.append(k)
        bundle[loc] = merged
        if miss:
            missing_report[loc] = miss

    # emit in canonical order
    ordered = {loc: bundle[loc] for loc in LOCALES if loc in bundle}

    body = json.dumps(ordered, ensure_ascii=False, indent=2)
    js = (
        "/* ============================================================\n"
        "   2NIGHT — blog-i18n.js  (GENERATED — do not edit by hand)\n"
        "   Source: tools/blog_content_en.py + tools/blog_locales/*.py\n"
        "   Regenerate: python3 tools/gen_blog_i18n.py\n"
        "   Scoped namespace — NEVER touches the shared window.TN_I18N.\n"
        "   ============================================================ */\n"
        "window.TN_BLOG_I18N = " + body + ";\n"
    )
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)

    # report
    print("Wrote %s" % OUT)
    print("Locales: %d / %d" % (len(ordered), len(LOCALES)))
    full = [l for l in LOCALES if l != "en" and l not in missing_report]
    print("Complete (no gaps): en + %d -> %s" % (len(full), ", ".join(full)))
    if missing_report:
        for loc, miss in missing_report.items():
            if miss == "FILE MISSING":
                print("  %s: FILE MISSING (EN fallback)" % loc)
            else:
                print("  %s: %d key(s) fell back to EN: %s" % (loc, len(miss), ", ".join(miss[:6]) + ("…" if len(miss) > 6 else "")))
    # sanity: key count
    print("Keys per locale: %d" % len(keys))


if __name__ == "__main__":
    main()
