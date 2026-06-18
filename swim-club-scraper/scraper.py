"""
FTN Natation → MongoDB  (single-file, full edition)
────────────────────────────────────────────────────
Scrapes http://ftnatation.tn (WordPress REST API with HTML fallback),
then downloads every linked PDF and extracts:
  • full text  • structured tables  • embedded images (base64 PNG)
  • PDF-header metadata

All data lands in a local MongoDB instance.

Collections
───────────
  posts          – news articles
  pages          – static WP pages
  sections       – section landing pages (results, rankings, …)
  categories     – WP taxonomies
  clubs          – affiliated clubs
  staff          – technical staff
  media          – WP media library
  pdf_documents  – extracted PDF content (full schema below)
  scrape_log     – one doc per run

pdf_documents schema
────────────────────
{
  source_url, filename, origin_page, title,
  file_size_bytes, sha256, scraped_at,
  metadata: { title, author, subject, creator, producer,
              creation_date, mod_date },
  extract_method, page_count,
  total_chars, total_tables, total_images,
  full_text,
  pages: [
    {
      page_number, width, height, text, char_count,
      tables: [{ table_index, headers, rows, raw }],
      images: [{ image_index, width, height, colorspace,
                 bits, data_base64, mime_type }]
    }
  ]
}

Usage
─────
  pip install cloudscraper beautifulsoup4 pymongo pdfplumber Pillow

  python scraper.py                                   # API or HTML auto-detect
  python scraper.py --skip-pdfs                       # skip PDF step
  python scraper.py --ocr                             # OCR scanned PDFs
  python scraper.py --mongo-uri mongodb://host:27017  # remote Mongo
"""

# ══════════════════════════════════════════════════════════════════════════════
# Imports
# ══════════════════════════════════════════════════════════════════════════════

import io
import re
import sys
import time
import base64
import hashlib
import logging
from datetime import datetime
from urllib.parse import urljoin, urlparse

import cloudscraper
from bs4 import BeautifulSoup
from pymongo import MongoClient, UpdateOne, ASCENDING
from pymongo.errors import BulkWriteError
import pdfplumber
from PIL import Image as PILImage

# ══════════════════════════════════════════════════════════════════════════════
# Logging
# ══════════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════════════════════════
# Config
# ══════════════════════════════════════════════════════════════════════════════

BASE_URL     = "http://ftnatation.tn"
WP_API       = f"{BASE_URL}/wp-json/wp/v2"
DELAY        = 1.2          # seconds between web requests
PDF_DELAY    = 1.5          # seconds between PDF downloads
MAX_PDF_SIZE = 50 * 1024 * 1024   # 50 MB — skip larger files
OCR_ENABLED  = False        # enable via --ocr flag

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept":                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language":         "fr-FR,fr;q=0.9,ar;q=0.8,en;q=0.7",
    "Connection":              "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer":                 BASE_URL + "/",
}

SESSION = cloudscraper.create_scraper(
    browser={"browser": "chrome", "platform": "windows", "mobile": False}
)
SESSION.headers.update(HEADERS)

# Section pages to always scrape in HTML mode
SECTION_PAGES = {
    "natation_results":         f"{BASE_URL}/natation-resultats/",
    "natation_rankings":        f"{BASE_URL}/natation-classement-des-competitions/",
    "natation_schedule":        f"{BASE_URL}/natation-echeances/",
    "natation_national_team":   f"{BASE_URL}/natation-liste-des-equipes-nationales/",
    "natation_calendar":        f"{BASE_URL}/natation-calendrier-national/",
    "eau_libre_results":        f"{BASE_URL}/eau-libre-resultats/",
    "eau_libre_rankings":       f"{BASE_URL}/eau-libre-classement-des-competitions/",
    "eau_libre_schedule":       f"{BASE_URL}/eau-libre-echeances/",
    "eau_libre_national_team":  f"{BASE_URL}/eau-libre-liste-des-equipes-nationales/",
    "eau_libre_calendar":       f"{BASE_URL}/eau-libre-calendrier-national/",
    "water_polo_results":       f"{BASE_URL}/water-polo-resultats/",
    "water_polo_rankings":      f"{BASE_URL}/water-polo-classement-des-competitions/",
    "water_polo_schedule":      f"{BASE_URL}/water-polo-echeances/",
    "water_polo_national_team": f"{BASE_URL}/water-polo-liste-des-equipes-nationales/",
    "water_polo_calendar":      f"{BASE_URL}/water-polo-calendrier-national/",
    "academy_program":          f"{BASE_URL}/academie-programme/",
    "academy_news":             f"{BASE_URL}/academie-actualites/",
    "licenses":                 f"{BASE_URL}/licences-2021-2022/",
    "press":                    f"{BASE_URL}/coin-presse/",
    "regulations":              f"{BASE_URL}/reglement-generaux-et-statut/",
    "org_chart":                f"{BASE_URL}/organigramme-de-la-ftn/",
}

# Section pages also crawled for PDF links in HTML fallback mode
PDF_SECTION_URLS = list(SECTION_PAGES.values())


# ══════════════════════════════════════════════════════════════════════════════
# HTTP helpers
# ══════════════════════════════════════════════════════════════════════════════

def fetch_html(url, retries=3):
    for attempt in range(1, retries + 1):
        try:
            r = SESSION.get(url, timeout=20)
            r.raise_for_status()
            return BeautifulSoup(r.text, "html.parser")
        except Exception as e:
            log.warning(f"Attempt {attempt}/{retries} failed [{url}]: {e}")
            if attempt < retries:
                time.sleep(3 * attempt)
    log.error(f"All retries exhausted: {url}")
    return None


def fetch_json(url, retries=3):
    for attempt in range(1, retries + 1):
        try:
            r = SESSION.get(url, timeout=20)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            log.warning(f"JSON attempt {attempt}/{retries} failed [{url}]: {e}")
            if attempt < retries:
                time.sleep(3 * attempt)
    return None


# ══════════════════════════════════════════════════════════════════════════════
# MongoDB helpers
# ══════════════════════════════════════════════════════════════════════════════

def get_db(mongo_uri, db_name):
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=8000)
    client.server_info()
    return client[db_name]


def ensure_indexes(db):
    """Unique indexes on every collection — prevents all duplication at DB level."""
    specs = {
        "posts":         [("url",        ASCENDING)],
        "pages":         [("url",        ASCENDING)],
        "sections":      [("url",        ASCENDING)],
        "media":         [("url",        ASCENDING)],
        "categories":    [("wp_id",      ASCENDING)],
        "clubs":         [("name",       ASCENDING)],
        "staff":         [("name",       ASCENDING)],
        "pdf_documents": [("source_url", ASCENDING)],
    }
    for coll_name, index_fields in specs.items():
        try:
            db[coll_name].create_index(index_fields, unique=True, background=True)
        except Exception as e:
            log.warning(f"  Index warning [{coll_name}]: {e}")
    log.info("  Indexes ensured.")


def safe_upsert(collection, docs, key_field="url"):
    """
    Bulk-upsert with UpdateOne($set).  Re-running never creates duplicates.
    Falls back to individual upserts for docs missing the key field.
    """
    if not docs:
        return

    has_key = [d for d in docs if d.get(key_field)]
    no_key  = [d for d in docs if not d.get(key_field)]
    inserted = updated = 0

    if has_key:
        ops = [
            UpdateOne({key_field: doc[key_field]}, {"$set": doc}, upsert=True)
            for doc in has_key
        ]
        try:
            res      = collection.bulk_write(ops, ordered=False)
            inserted += res.upserted_count
            updated  += res.modified_count
        except BulkWriteError as bwe:
            dup = sum(1 for e in bwe.details.get("writeErrors", []) if e.get("code") == 11000)
            log.warning(f"  {collection.name}: {dup} duplicates ignored")
            inserted += bwe.details.get("nUpserted", 0)
            updated  += bwe.details.get("nModified", 0)

    for doc in no_key:
        ident = doc.get("name") or doc.get("title") or doc.get("slug")
        if not ident:
            continue
        try:
            collection.update_one(
                {"$or": [{"name": ident}, {"title": ident}, {"slug": ident}]},
                {"$setOnInsert": doc},
                upsert=True,
            )
            inserted += 1
        except Exception:
            pass

    log.info(f"    ✓ {collection.name}: {inserted} new, {updated} updated")


# ══════════════════════════════════════════════════════════════════════════════
# WordPress REST API scrapers
# ══════════════════════════════════════════════════════════════════════════════

def api_available():
    return fetch_json(f"{WP_API}/?_fields=description") is not None


def api_scrape_posts(per_page=100):
    posts, page = [], 1
    while True:
        url  = (f"{WP_API}/posts?per_page={per_page}&page={page}"
                f"&_fields=id,date,title,link,excerpt,content,categories,tags,author")
        log.info(f"  API posts page {page}...")
        data = fetch_json(url)
        if not data or not isinstance(data, list) or len(data) == 0:
            break
        for item in data:
            raw_html = item.get("content", {}).get("rendered", "")
            posts.append({
                "wp_id":        item.get("id"),
                "title":        item.get("title", {}).get("rendered", ""),
                "url":          item.get("link", ""),
                "date":         item.get("date", ""),
                "excerpt":      BeautifulSoup(item.get("excerpt", {}).get("rendered", ""), "html.parser").get_text(strip=True),
                "content":      BeautifulSoup(raw_html, "html.parser").get_text(separator="\n", strip=True),
                "content_html": raw_html,   # kept for PDF link mining
                "category_ids": item.get("categories", []),
                "tag_ids":      item.get("tags", []),
                "author_id":    item.get("author"),
                "scraped_at":   datetime.utcnow(),
            })
        log.info(f"    → {len(data)} posts")
        if len(data) < per_page:
            break
        page += 1
        time.sleep(DELAY)
    return posts


def api_scrape_categories():
    data = fetch_json(f"{WP_API}/categories?per_page=100")
    if not data:
        return []
    return [
        {"wp_id": c["id"], "name": c["name"], "slug": c["slug"],
         "count": c["count"], "scraped_at": datetime.utcnow()}
        for c in data
    ]


def api_scrape_pages():
    data = fetch_json(f"{WP_API}/pages?per_page=100&_fields=id,date,title,link,content,slug")
    if not data:
        return []
    result = []
    for item in data:
        raw_html = item.get("content", {}).get("rendered", "")
        result.append({
            "wp_id":        item.get("id"),
            "slug":         item.get("slug", ""),
            "title":        item.get("title", {}).get("rendered", ""),
            "url":          item.get("link", ""),
            "date":         item.get("date", ""),
            "content":      BeautifulSoup(raw_html, "html.parser").get_text(separator="\n", strip=True),
            "content_html": raw_html,   # kept for PDF link mining
            "scraped_at":   datetime.utcnow(),
        })
    return result


def api_scrape_media(per_page=100):
    media, page = [], 1
    while True:
        data = fetch_json(
            f"{WP_API}/media?per_page={per_page}&page={page}"
            f"&_fields=id,date,title,source_url,media_type,mime_type"
        )
        if not data or not isinstance(data, list) or len(data) == 0:
            break
        for item in data:
            media.append({
                "wp_id":      item.get("id"),
                "title":      item.get("title", {}).get("rendered", ""),
                "url":        item.get("source_url", ""),
                "media_type": item.get("media_type", ""),
                "mime_type":  item.get("mime_type", ""),
                "date":       item.get("date", ""),
                "scraped_at": datetime.utcnow(),
            })
        if len(data) < per_page:
            break
        page += 1
        time.sleep(DELAY)
    return media


# ══════════════════════════════════════════════════════════════════════════════
# HTML fallback scrapers
# ══════════════════════════════════════════════════════════════════════════════

def html_scrape_posts(max_pages=None):
    posts, seen, page = [], set(), 1
    while True:
        url  = BASE_URL + "/" if page == 1 else f"{BASE_URL}/pages/{page}/"
        log.info(f"  HTML posts page {page}: {url}")
        soup = fetch_html(url)
        if not soup:
            break
        found = 0
        for a in soup.select("a[href]"):
            href = a["href"]
            if re.search(r'/20\d{2}/\d{2}/\d{2}/', href) and href not in seen:
                title = a.get_text(strip=True)
                if not title or len(title) < 3:
                    continue
                parent   = a.find_parent(["article", "div", "li"])
                date_tag = parent.find("time") if parent else None
                cat_tag  = parent.find("a", href=re.compile(r'/category/')) if parent else None
                posts.append({
                    "title":      title,
                    "url":        href,
                    "date":       (date_tag.get("datetime") or date_tag.get_text(strip=True)) if date_tag else "",
                    "category":   cat_tag.get_text(strip=True) if cat_tag else "",
                    "scraped_at": datetime.utcnow(),
                })
                seen.add(href)
                found += 1
        log.info(f"    → {found} posts on page {page}")
        if found == 0:
            break
        nums     = [int(m.group(1)) for a in soup.select("a.page-numbers[href]")
                    if (m := re.search(r'/pages/(\d+)/', a["href"]))]
        max_page = max(nums) if nums else page
        if (max_pages and page >= max_pages) or page >= max_page:
            break
        page += 1
        time.sleep(DELAY)
    return posts


def html_scrape_static_page(url, name):
    log.info(f"  HTML page [{name}]: {url}")
    soup = fetch_html(url)
    if not soup:
        return None
    title   = soup.select_one("h1.entry-title, h1.page-title, h1")
    content = soup.select_one(".entry-content, .page-content, main, article")
    tables, images, attachments = [], [], []
    if content:
        for table in content.select("table"):
            rows = [
                [td.get_text(strip=True) for td in tr.select("td, th")]
                for tr in table.select("tr")
            ]
            rows = [r for r in rows if any(r)]
            if rows:
                tables.append(rows)
        images = [
            img["src"] for img in content.select("img[src]")
            if not img["src"].startswith("data:")
        ]
        for a in content.select("a[href]"):
            if any(a["href"].lower().endswith(ext) for ext in [".pdf", ".doc", ".docx", ".xlsx"]):
                attachments.append({"label": a.get_text(strip=True), "url": a["href"]})
    return {
        "page_name":   name,
        "url":         url,
        "title":       title.get_text(strip=True) if title else name,
        "content":     content.get_text(separator="\n", strip=True) if content else "",
        "tables":      tables,
        "images":      images,
        "attachments": attachments,
        "scraped_at":  datetime.utcnow(),
    }


def html_scrape_clubs():
    soup    = fetch_html(f"{BASE_URL}/club-affilies/")
    if not soup:
        return []
    content = soup.select_one(".entry-content, .page-content, main")
    clubs, seen = [], set()
    if content:
        for li in content.select("li"):
            t = li.get_text(strip=True)
            if t and t not in seen:
                clubs.append({"name": t, "scraped_at": datetime.utcnow()})
                seen.add(t)
        if not clubs:
            for tr in content.select("table tr"):
                cells = [td.get_text(strip=True) for td in tr.select("td, th")]
                if cells and cells[0] and cells[0] not in seen:
                    clubs.append({"name": cells[0], "details": cells[1:], "scraped_at": datetime.utcnow()})
                    seen.add(cells[0])
    return clubs


def html_scrape_staff():
    soup    = fetch_html(f"{BASE_URL}/staff-technique/")
    if not soup:
        return []
    content = soup.select_one(".entry-content, .page-content, main")
    staff, seen = [], set()
    if content:
        for tr in content.select("table tr"):
            cells = [td.get_text(strip=True) for td in tr.select("td, th")]
            if cells and cells[0] and cells[0] not in seen:
                staff.append({
                    "name":       cells[0],
                    "role":       cells[1] if len(cells) > 1 else "",
                    "extra":      cells[2:],
                    "scraped_at": datetime.utcnow(),
                })
                seen.add(cells[0])
        if not staff:
            for li in content.select("li"):
                t = li.get_text(strip=True)
                if t and t not in seen:
                    staff.append({"name": t, "role": "", "scraped_at": datetime.utcnow()})
                    seen.add(t)
    return staff


# ══════════════════════════════════════════════════════════════════════════════
# PDF extraction helpers
# ══════════════════════════════════════════════════════════════════════════════

def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _image_to_base64(img_obj: dict) -> dict | None:
    """
    Convert a pdfplumber image object into a base64-encoded PNG dict.
    Returns None if the image can't be decoded.
    """
    try:
        raw = img_obj.get("stream")
        if raw is None:
            return None

        raw_bytes  = raw.get_data() if hasattr(raw, "get_data") else bytes(raw)
        colorspace = img_obj.get("colorspace", "")
        bits       = img_obj.get("bits", 8)
        width      = img_obj.get("width", 0)
        height     = img_obj.get("height", 0)

        try:
            mode = "RGB" if "RGB" in str(colorspace) else "L"
            pil  = PILImage.frombytes(mode, (width, height), raw_bytes)
        except Exception:
            pil = PILImage.open(io.BytesIO(raw_bytes))

        buf = io.BytesIO()
        pil.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")

        return {
            "width":       width,
            "height":      height,
            "colorspace":  str(colorspace),
            "bits":        bits,
            "data_base64": b64,
            "mime_type":   "image/png",
        }
    except Exception as e:
        log.debug(f"    Image conversion skipped: {e}")
        return None


def _table_to_structured(raw_table: list[list]) -> dict:
    """
    Convert a raw pdfplumber table (list-of-lists) into:
      headers  – list of column names  (first row if it looks like a header)
      rows     – list of dicts  {header: value, …}
      raw      – original list-of-lists (always kept)
    """
    # Clean None → ""
    cleaned = [
        [cell if cell is not None else "" for cell in row]
        for row in raw_table
        if any(cell for cell in row if cell)
    ]
    if not cleaned:
        return {"headers": [], "rows": [], "raw": []}

    first = cleaned[0]
    # Heuristic: first row is a header if no cell is a pure number
    looks_like_header = all(
        cell == "" or not cell.replace(".", "").replace(",", "").replace("-", "").isdigit()
        for cell in first
    )

    if looks_like_header and len(cleaned) > 1:
        headers   = first
        data_rows = cleaned[1:]
    else:
        headers   = [f"col_{i}" for i in range(len(first))]
        data_rows = cleaned

    rows = []
    for row in data_rows:
        padded = row + [""] * (len(headers) - len(row))
        rows.append(dict(zip(headers, padded[: len(headers)])))

    return {"headers": headers, "rows": rows, "raw": cleaned}


def _extract_with_pdfplumber(pdf_bytes: bytes) -> dict:
    """Extract text, tables, images, and metadata from PDF bytes."""
    pages_data = []
    all_text   = []

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        # ── Document-level metadata ───────────────────────────────────────────
        raw_meta = pdf.metadata or {}
        metadata = {
            "title":         raw_meta.get("Title",        ""),
            "author":        raw_meta.get("Author",       ""),
            "subject":       raw_meta.get("Subject",      ""),
            "creator":       raw_meta.get("Creator",      ""),
            "producer":      raw_meta.get("Producer",     ""),
            "creation_date": str(raw_meta.get("CreationDate", "")),
            "mod_date":      str(raw_meta.get("ModDate",      "")),
        }
        metadata = {k: v for k, v in metadata.items() if v}   # drop empty fields

        # ── Per-page extraction ───────────────────────────────────────────────
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ""

            # Tables
            tables = []
            try:
                for t_idx, raw_tbl in enumerate(page.extract_tables() or []):
                    structured = _table_to_structured(raw_tbl)
                    if structured["raw"]:
                        structured["table_index"] = t_idx
                        tables.append(structured)
            except Exception as e:
                log.debug(f"    Table extraction error p{i+1}: {e}")

            # Images
            images = []
            for img_idx, img_obj in enumerate(page.images or []):
                img_dict = _image_to_base64(img_obj)
                if img_dict:
                    img_dict["image_index"] = img_idx
                    images.append(img_dict)

            pages_data.append({
                "page_number": i + 1,
                "width":       float(page.width),
                "height":      float(page.height),
                "text":        page_text,
                "char_count":  len(page_text),
                "tables":      tables,
                "images":      images,
            })
            all_text.append(page_text)

    full_text    = "\n\n".join(all_text).strip()
    total_tables = sum(len(p["tables"]) for p in pages_data)
    total_images = sum(len(p["images"]) for p in pages_data)

    return {
        "metadata":       metadata,
        "full_text":      full_text,
        "pages":          pages_data,
        "page_count":     len(pages_data),
        "total_chars":    len(full_text),
        "total_tables":   total_tables,
        "total_images":   total_images,
        "extract_method": "pdfplumber",
    }


def _extract_with_ocr(pdf_bytes: bytes) -> dict | None:
    """
    OCR fallback for image-only / scanned PDFs.
    Requires: pip install pytesseract pdf2image  (+ poppler system package)
    """
    try:
        import pytesseract
        from pdf2image import convert_from_bytes
    except ImportError:
        log.warning("  pytesseract/pdf2image not installed — OCR unavailable")
        return None

    images_pil = convert_from_bytes(pdf_bytes, dpi=200)
    pages_data, all_text = [], []

    for i, img in enumerate(images_pil):
        text = pytesseract.image_to_string(img, lang="fra+ara+eng")

        # Store the full-page render as a base64 PNG
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")

        pages_data.append({
            "page_number": i + 1,
            "width":       float(img.width),
            "height":      float(img.height),
            "text":        text,
            "char_count":  len(text),
            "tables":      [],
            "images": [{
                "image_index": 0,
                "width":       img.width,
                "height":      img.height,
                "colorspace":  img.mode,
                "bits":        8,
                "data_base64": b64,
                "mime_type":   "image/png",
                "note":        "full-page render (OCR mode)",
            }],
        })
        all_text.append(text)

    full_text = "\n\n".join(all_text).strip()
    return {
        "metadata":       {},
        "full_text":      full_text,
        "pages":          pages_data,
        "page_count":     len(pages_data),
        "total_chars":    len(full_text),
        "total_tables":   0,
        "total_images":   len(pages_data),
        "extract_method": "ocr_pytesseract",
    }


def extract_pdf(pdf_bytes: bytes) -> dict:
    """
    Try pdfplumber first.
    If text yield is very low (scanned PDF) and OCR_ENABLED, retry with OCR.
    """
    result = _extract_with_pdfplumber(pdf_bytes)
    if result["total_chars"] < 100 and OCR_ENABLED:
        log.info("    Low text yield — attempting OCR...")
        ocr = _extract_with_ocr(pdf_bytes)
        if ocr:
            return ocr
    return result


# ══════════════════════════════════════════════════════════════════════════════
# PDF discovery
# ══════════════════════════════════════════════════════════════════════════════

def collect_pdf_urls_from_db(db) -> list[dict]:
    """
    Mine PDF URLs from collections already in MongoDB:
      posts / pages  – regex scan of content + content_html
      sections       – structured attachments list
      media          – mime_type == application/pdf
    """
    pdf_set    = {}
    pdf_re     = re.compile(r'https?://[^\s"\'<>]+\.pdf', re.IGNORECASE)

    def add(url, source, title=""):
        if url and url not in pdf_set:
            if url.startswith("/"):
                url = BASE_URL.rstrip("/") + url
            if not url.lower().startswith("http"):
                url = urljoin(BASE_URL + "/", url)
            pdf_set[url] = {"url": url, "source": source, "title": title}

    for coll_name in ("posts", "pages"):
        for doc in db[coll_name].find({}, {"url": 1, "title": 1, "content": 1, "content_html": 1}):
            for field in ("content", "content_html"):
                for m in pdf_re.finditer(doc.get(field, "")):
                    add(m.group(), source=f"{coll_name}:{doc.get('url','')}", title=doc.get("title", ""))

    for doc in db["sections"].find({}, {"url": 1, "page_name": 1, "attachments": 1}):
        for att in doc.get("attachments", []):
            if att.get("url", "").lower().endswith(".pdf"):
                add(att["url"],
                    source=f"sections:{doc.get('url','')}",
                    title=att.get("label", doc.get("page_name", "")))

    for doc in db["media"].find({"mime_type": "application/pdf"}, {"url": 1, "title": 1}):
        add(doc.get("url", ""), source="media", title=doc.get("title", ""))

    log.info(f"  Discovered {len(pdf_set)} unique PDF URLs from MongoDB")
    return list(pdf_set.values())


def collect_pdf_urls_from_html() -> list[dict]:
    """
    HTML fallback: crawl known section pages to find PDF links.
    Used when MongoDB collections are empty (very first run in HTML mode).
    """
    pdf_set = {}
    pdf_re  = re.compile(r'\.pdf($|\?)', re.IGNORECASE)

    for section_url in PDF_SECTION_URLS:
        try:
            r = SESSION.get(section_url, timeout=20)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if pdf_re.search(href):
                    full = urljoin(section_url, href)
                    if full not in pdf_set:
                        pdf_set[full] = {
                            "url":    full,
                            "source": section_url,
                            "title":  a.get_text(strip=True),
                        }
            time.sleep(PDF_DELAY)
        except Exception as e:
            log.warning(f"  HTML PDF discovery failed [{section_url}]: {e}")

    log.info(f"  HTML fallback: discovered {len(pdf_set)} PDF URLs")
    return list(pdf_set.values())


# ══════════════════════════════════════════════════════════════════════════════
# PDF download + store
# ══════════════════════════════════════════════════════════════════════════════

def download_and_store_pdf(db, pdf_meta: dict) -> bool:
    """
    Download one PDF, extract everything, upsert into pdf_documents.
    Returns True on success (or already stored).
    """
    url  = pdf_meta["url"]
    coll = db["pdf_documents"]

    # Idempotent — skip if already in DB
    if coll.find_one({"source_url": url}, {"_id": 1}):
        log.debug(f"    Already in DB, skipping: {url}")
        return True

    try:
        log.info(f"  Downloading: {url}")
        r = SESSION.get(url, timeout=60, stream=True)
        r.raise_for_status()

        ct = r.headers.get("Content-Type", "")
        if "pdf" not in ct.lower() and not url.lower().endswith(".pdf"):
            log.warning(f"    Not a PDF (Content-Type: {ct}), skipping")
            return False

        content_length = int(r.headers.get("Content-Length", 0))
        if content_length > MAX_PDF_SIZE:
            log.warning(f"    Too large ({content_length/1024/1024:.1f} MB), skipping")
            return False

        pdf_bytes = r.content
        if len(pdf_bytes) > MAX_PDF_SIZE:
            log.warning("    Downloaded size too large, skipping")
            return False

        filename = urlparse(url).path.split("/")[-1] or "unknown.pdf"
        log.info(f"    Extracting: {filename} ({len(pdf_bytes)/1024:.1f} KB)...")

        extraction = extract_pdf(pdf_bytes)

        doc = {
            # ── Identity ──────────────────────────────────────────────────────
            "source_url":      url,
            "filename":        filename,
            "origin_page":     pdf_meta.get("source", ""),
            "title":           (pdf_meta.get("title")
                                or extraction["metadata"].get("title")
                                or filename),

            # ── File info ─────────────────────────────────────────────────────
            "file_size_bytes": len(pdf_bytes),
            "sha256":          _sha256(pdf_bytes),
            "scraped_at":      datetime.utcnow(),

            # ── PDF-level metadata ─────────────────────────────────────────────
            "metadata":        extraction["metadata"],

            # ── Extraction summary ─────────────────────────────────────────────
            "extract_method":  extraction["extract_method"],
            "page_count":      extraction["page_count"],
            "total_chars":     extraction["total_chars"],
            "total_tables":    extraction["total_tables"],
            "total_images":    extraction["total_images"],

            # ── Full text + per-page breakdown ─────────────────────────────────
            "full_text":       extraction["full_text"],
            "pages":           extraction["pages"],
            # pages[n] = {
            #   page_number, width, height, text, char_count,
            #   tables: [{ table_index, headers, rows, raw }],
            #   images: [{ image_index, width, height, colorspace,
            #              bits, data_base64, mime_type }]
            # }
        }

        coll.update_one({"source_url": url}, {"$set": doc}, upsert=True)
        log.info(
            f"    ✓ {filename}: {extraction['page_count']} pages, "
            f"{extraction['total_chars']} chars, "
            f"{extraction['total_tables']} tables, "
            f"{extraction['total_images']} images"
        )
        return True

    except Exception as e:
        log.error(f"    ✗ Failed [{url}]: {e}")
        # Store a failure stub — prevents endless retries on re-runs
        try:
            coll.update_one(
                {"source_url": url},
                {"$set": {
                    "source_url":  url,
                    "title":       pdf_meta.get("title", ""),
                    "origin_page": pdf_meta.get("source", ""),
                    "error":       str(e),
                    "scraped_at":  datetime.utcnow(),
                }},
                upsert=True,
            )
        except Exception:
            pass
        return False


def run_pdf_extraction(db):
    """Discover, download, and store all PDFs found on the site."""
    log.info("\n[PDF] Collecting PDF URLs from MongoDB...")
    pdf_list = collect_pdf_urls_from_db(db)

    if not pdf_list:
        log.info("[PDF] Nothing found in DB — trying HTML discovery...")
        pdf_list = collect_pdf_urls_from_html()

    if not pdf_list:
        log.warning("[PDF] No PDFs discovered — nothing to download.")
        return

    log.info(f"\n[PDF] Processing {len(pdf_list)} PDFs...")
    ok = fail = skip = 0

    for i, pdf_meta in enumerate(pdf_list, 1):
        log.info(f"  [{i}/{len(pdf_list)}] {pdf_meta['url']}")

        if db["pdf_documents"].find_one({"source_url": pdf_meta["url"]}, {"_id": 1}):
            log.info("    → already in DB, skipping")
            skip += 1
            continue

        if download_and_store_pdf(db, pdf_meta):
            ok += 1
        else:
            fail += 1

        time.sleep(PDF_DELAY)

    total = db["pdf_documents"].count_documents({})
    log.info(f"\n[PDF] Done — {ok} stored, {fail} failed, {skip} skipped")
    log.info(f"[PDF] pdf_documents total: {total} documents")


# ══════════════════════════════════════════════════════════════════════════════
# Main orchestrator
# ══════════════════════════════════════════════════════════════════════════════

def run(mongo_uri="mongodb://localhost:27017", db_name="ftn_natation",
        max_post_pages=None, skip_pdfs=False, ocr=False):

    global OCR_ENABLED
    if ocr:
        OCR_ENABLED = True

    log.info("=" * 60)
    log.info("FTN Natation Scraper  —  full edition")
    log.info("=" * 60)

    log.info("\nConnecting to MongoDB...")
    db = get_db(mongo_uri, db_name)
    log.info(f"✓ Connected → database: {db.name}")

    log.info("\nEnsuring unique indexes...")
    ensure_indexes(db)

    log.info("\nProbing WordPress REST API...")
    use_api  = api_available()
    strategy = "WordPress REST API" if use_api else "HTML scraping"
    log.info(f"Strategy: {strategy}")

    posts = []

    # ── Step 1-4: Scrape site content ─────────────────────────────────────────
    if use_api:
        log.info("\n[1/5] Posts via API...")
        posts = api_scrape_posts()
        log.info(f"  Total: {len(posts)}")
        safe_upsert(db["posts"], posts, key_field="url")

        log.info("\n[2/5] Categories...")
        cats = api_scrape_categories()
        log.info(f"  Total: {len(cats)}")
        safe_upsert(db["categories"], cats, key_field="wp_id")

        log.info("\n[3/5] Static pages...")
        pages = api_scrape_pages()
        log.info(f"  Total: {len(pages)}")
        safe_upsert(db["pages"], pages, key_field="url")

        log.info("\n[4/5] Media library...")
        media = api_scrape_media()
        log.info(f"  Total: {len(media)}")
        safe_upsert(db["media"], media, key_field="url")

    else:
        log.info("\n[1/5] Posts (HTML)...")
        posts = html_scrape_posts(max_pages=max_post_pages)
        log.info(f"  Total: {len(posts)}")
        safe_upsert(db["posts"], posts, key_field="url")

        log.info("\n[2/5] Clubs & staff...")
        clubs = html_scrape_clubs()
        log.info(f"  Clubs: {len(clubs)}")
        safe_upsert(db["clubs"], clubs, key_field="name")

        staff = html_scrape_staff()
        log.info(f"  Staff: {len(staff)}")
        safe_upsert(db["staff"], staff, key_field="name")

        log.info(f"\n[3/5] Section pages ({len(SECTION_PAGES)})...")
        sections = []
        for name, url in SECTION_PAGES.items():
            data = html_scrape_static_page(url, name)
            if data:
                sections.append(data)
            time.sleep(DELAY)
        safe_upsert(db["sections"], sections, key_field="url")

        log.info("\n[4/5] Media skipped (HTML mode).")

    # ── Step 5: PDF extraction ─────────────────────────────────────────────────
    if not skip_pdfs:
        log.info("\n[5/5] PDF extraction...")
        run_pdf_extraction(db)
    else:
        log.info("\n[5/5] PDF extraction skipped (--skip-pdfs).")

    # ── Final log entry ────────────────────────────────────────────────────────
    db["scrape_log"].insert_one({
        "scraped_at":  datetime.utcnow(),
        "base_url":    BASE_URL,
        "strategy":    strategy,
        "posts_found": len(posts),
        "ocr_enabled": OCR_ENABLED,
    })

    log.info("\n" + "=" * 60)
    log.info("✅  Scrape complete! MongoDB collections:")
    for name in sorted(db.list_collection_names()):
        count = db[name].count_documents({})
        log.info(f"   {name:35s} → {count:>5} documents")
    log.info("=" * 60)


# ══════════════════════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="FTN Natation → MongoDB scraper (full edition)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scraper.py
  python scraper.py --mongo-uri mongodb://192.168.1.10:27017
  python scraper.py --skip-pdfs
  python scraper.py --ocr
  python scraper.py --max-pages 5   # limit HTML post pages
        """,
    )
    parser.add_argument("--mongo-uri",  default="mongodb://localhost:27017",
                        help="MongoDB connection URI (default: mongodb://localhost:27017)")
    parser.add_argument("--db",         default="ftn_natation",
                        help="Database name (default: ftn_natation)")
    parser.add_argument("--max-pages",  type=int, default=None,
                        help="Max HTML post pages to scrape (HTML mode only)")
    parser.add_argument("--skip-pdfs",  action="store_true",
                        help="Skip PDF downloading and extraction")
    parser.add_argument("--ocr",        action="store_true",
                        help="Enable OCR fallback for scanned PDFs "
                             "(requires: pip install pytesseract pdf2image + poppler)")
    args = parser.parse_args()

    run(
        mongo_uri=args.mongo_uri,
        db_name=args.db,
        max_post_pages=args.max_pages,
        skip_pdfs=args.skip_pdfs,
        ocr=args.ocr,
    )
