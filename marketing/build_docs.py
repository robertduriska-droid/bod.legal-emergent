# Builds the legal document pages of the bod.legal marketing site.
#
# Input:  docs.json, an array of {key, title, markdown} produced by the
#         drafting-and-verification workflow (each document was written by one
#         agent and challenged by three adversarial reviewers before landing
#         here).
# Output: one HTML page per document, wrapped in the shared site chrome so the
#         documents look like part of the site, not like pasted Word files.
#
# Regeneration: edit docs.json (or re-run the workflow), then
#   python build_docs.py
#
# Requires: pip install markdown

import io
import json
import os
import markdown

PAGES = {
    "vop": ("vop.html", "Všeobecné obchodné podmienky"),
    "gdpr": ("ochrana-osobnych-udajov.html", "Ochrana osobných údajov"),
    "cookies": ("cookies.html", "Zásady používania cookies"),
    "ai": ("transparentnost-ai.html", "Transparentnosť používania umelej inteligencie"),
}

EFFECTIVE_DATE = "16. júla 2026"

HEADER = """<header class="site-header">
  <div class="wrap">
    <a class="logo" href="index.html">bod<span class="dot">.</span>legal</a>
    <nav>
      <ul class="nav-links">
        <li><a href="index.html#ako">Ako to funguje</a></li>
        <li><a href="index.html#dovera">Overenie advokátom</a></li>
        <li><a href="index.html#faq">Časté otázky</a></li>
        <li><a class="btn btn-primary btn-sm" href="https://app.bod.legal/">Nahrať zmluvu</a></li>
      </ul>
    </nav>
  </div>
</header>"""

FOOTER = """<footer class="site-footer">
  <div class="wrap">
    <div class="cols">
      <div>
        <a class="logo" href="index.html">bod<span class="dot">.</span>legal</a>
        <p style="margin-top:12px; max-width:26em;">Kontrola zmlúv s pomocou umelej inteligencie a overením advokátskou kanceláriou alebo advokátom. Prevádzkuje advokátska kancelária KILIAN LEGAL s. r. o.</p>
      </div>
      <div>
        <h4>Produkt</h4>
        <ul>
          <li><a href="https://app.bod.legal/">Nahrať zmluvu</a></li>
          <li><a href="index.html#ako">Ako to funguje</a></li>
          <li><a href="index.html#faq">Časté otázky</a></li>
        </ul>
      </div>
      <div>
        <h4>Právne dokumenty</h4>
        <ul>
          <li><a href="vop.html">Obchodné podmienky</a></li>
          <li><a href="ochrana-osobnych-udajov.html">Ochrana osobných údajov</a></li>
          <li><a href="cookies.html">Cookies</a></li>
          <li><a href="transparentnost-ai.html">Transparentnosť AI</a></li>
        </ul>
      </div>
      <div>
        <h4>Kontakt</h4>
        <ul>
          <li><a href="mailto:info@bod.legal">info@bod.legal</a></li>
          <li><a href="tel:+421917333692">+421 917 333 692</a></li>
          <li>KILIAN LEGAL s. r. o.</li>
          <li>IČO: 53 957 008</li>
        </ul>
      </div>
    </div>
    <div class="fine">© 2026 KILIAN LEGAL s. r. o. Všetky práva vyhradené.</div>
  </div>
</footer>"""


def page(title: str, body_html: str) -> str:
    return f"""<!doctype html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} | bod.legal</title>
  <meta name="description" content="{title} služby bod.legal, ktorú prevádzkuje advokátska kancelária KILIAN LEGAL s. r. o.">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <!-- Pisma servujeme sami: ziadna IP navstevnika neodchadza do Google. -->
  <link rel="stylesheet" href="fonts/fonts.css?v=5">
  <link rel="stylesheet" href="styles.css?v=5">
</head>
<body>
{HEADER}
<div class="doc-hero">
  <div class="wrap">
    <h1>{title}</h1>
    <p class="doc-meta">Účinné od {EFFECTIVE_DATE} · KILIAN LEGAL s. r. o.</p>
  </div>
</div>
<main class="wrap doc">
{body_html}
</main>
{FOOTER}
</body>
</html>
"""


def convert(md_text: str) -> str:
    html = markdown.markdown(md_text, extensions=["tables"])
    # The first H1 duplicates the page hero title; drop it.
    lines = html.split("\n")
    if lines and lines[0].startswith("<h1"):
        lines = lines[1:]
    html = "\n".join(lines)
    # Tables must scroll inside their own container on small screens.
    html = html.replace("<table>", '<div class="table-scroll"><table>').replace(
        "</table>", "</table></div>"
    )
    return html


def convert_inapp(md_text: str) -> str:
    """Same verified markdown->HTML pipeline as the marketing pages, but also
    drops the two lead lines (Poskytovateľ / Účinné od) because the in-app
    React page renders the document title and effective date in its own header
    chrome. Keeps the app and the marketing site on ONE source of truth."""
    html = convert(md_text)
    lines = html.split("\n")
    while lines and (
        lines[0].strip() == ""
        or lines[0].startswith("<p>Poskytovate")
        or lines[0].startswith("<p>Účinn")
    ):
        lines.pop(0)
    return "\n".join(lines)


def main() -> None:
    docs = json.load(io.open("docs.json", encoding="utf-8"))
    inapp: dict = {}
    for doc in docs:
        key = doc["key"]
        if key not in PAGES:
            continue
        filename, title = PAGES[key]
        io.open(filename, "w", encoding="utf-8", newline="\n").write(
            page(title, convert(doc["markdown"]))
        )
        inapp[key] = {"title": title, "html": convert_inapp(doc["markdown"])}
        print(f"{filename} <- {key} ({len(doc['markdown'])} znakov markdownu)")

    # Emit the module the in-app React legal pages import, so app.bod.legal and
    # bod.legal render the SAME verified text and can never drift apart again.
    ts_path = os.path.join("..", "client", "src", "generated", "legal-docs.ts")
    os.makedirs(os.path.dirname(ts_path), exist_ok=True)
    body = json.dumps(inapp, ensure_ascii=False, indent=2)
    ts = (
        "// AUTO-GENERATED from marketing/docs.json by marketing/build_docs.py.\n"
        "// Do not edit by hand. Regenerate: cd marketing && python build_docs.py\n"
        f'export const LEGAL_EFFECTIVE_DATE = "{EFFECTIVE_DATE}";\n'
        'export type LegalDocKey = "vop" | "gdpr" | "cookies" | "ai";\n'
        "export interface LegalDoc { title: string; html: string; }\n"
        f"export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {body};\n"
    )
    io.open(ts_path, "w", encoding="utf-8", newline="\n").write(ts)
    print(f"{ts_path} <- {len(inapp)} docs (in-app module)")


if __name__ == "__main__":
    main()
