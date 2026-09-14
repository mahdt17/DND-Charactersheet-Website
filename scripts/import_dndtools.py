"""Build a complete name-and-source-link reference index from public category lists."""
import json
import math
import re
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

BASE = "https://new.dndtools.org"
CATEGORIES = ["spells", "feats", "classes", "races", "monsters", "templates", "skills",
              "equipment", "items", "deities", "domains", "psionics", "rules", "rulebooks"]
OUTPUT = Path("public/catalogs/dndtools")
AGENT = "AdventurersLedger-ReferenceIndexer/1.0 (+https://github.com/mahdt17/DND-Charactersheet-Website)"


class Listing(HTMLParser):
    def __init__(self, category):
        super().__init__(convert_charrefs=True)
        self.category = category
        self.links = {}
        self.text = []
        self.capture = None
        self.label = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        if tag == "a":
            href = dict(attrs).get("href", "")
            url = urlparse(urljoin(BASE, href))
            if url.netloc == urlparse(BASE).netloc and url.path.startswith("/" + self.category + "/") and not url.query:
                self.capture = BASE + url.path.rstrip("/")
                self.label = []

    def handle_data(self, data):
        if not self.skip:
            self.text.append(data)
            if self.capture:
                self.label.append(data)

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        if tag == "a" and self.capture:
            name = " ".join(" ".join(self.label).split())
            if name:
                self.links[self.capture] = name
            self.capture = None
            self.label = []

    @property
    def total(self):
        match = re.search(r"([\d,]+)\s+results\b", " ".join(self.text), re.I)
        if not match:
            raise ValueError("Missing result count for " + self.category)
        return int(match.group(1).replace(",", ""))


def read_listing(category, page):
    url = BASE + "/" + category + ("?page=" + str(page) if page > 1 else "")
    for attempt in range(3):
        try:
            time.sleep(1)
            with urlopen(Request(url, headers={"User-Agent": AGENT}), timeout=45) as response:
                if urlparse(response.url).netloc != urlparse(BASE).netloc:
                    raise ValueError("Unexpected redirect: " + response.url)
                html = response.read().decode("utf-8")
            listing = Listing(category)
            listing.feed(html)
            return listing
        except HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            time.sleep(min(60, 5 * (attempt + 1)))
        except (URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(5 * (attempt + 1))


def main():
    # Stage everything in memory. A failed category never publishes a "complete" manifest.
    datasets = {}
    manifest = {"source": BASE, "kind": "name-and-source-link-index", "complete": True,
                "fetchedAt": datetime.now(timezone.utc).isoformat(), "categories": []}
    for category in CATEGORIES:
        first = read_listing(category, 1)
        expected = first.total
        found = dict(first.links)
        if expected and not found:
            raise ValueError("No entry links found for " + category)
        page_size = len(found)
        pages = math.ceil(expected / page_size) if page_size else 1
        for page in range(2, pages + 1):
            listing = read_listing(category, page)
            if listing.total != expected:
                raise ValueError("Result count changed during import: " + category)
            before = len(found)
            found.update(listing.links)
            if len(found) == before:
                raise ValueError("Pagination repeated or returned no entries: " + category)
        if len(found) != expected:
            raise ValueError(f"{category}: expected {expected}, imported {len(found)}")
        entries = [{"id": url.removeprefix(BASE + "/"), "name": name, "url": url,
                    "category": category, "edition": "3.5-reference"} for url, name in found.items()]
        entries.sort(key=lambda entry: (entry["name"].casefold(), entry["id"]))
        datasets[category] = entries
        manifest["categories"].append({"id": category, "count": len(entries), "sourceCount": expected})
        print(f"Verified {category}: {len(entries)} / {expected}", flush=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for category, entries in datasets.items():
        (OUTPUT / (category + ".json")).write_text(json.dumps(entries, ensure_ascii=False) + "\n", encoding="utf-8")
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Verified total:", sum(len(entries) for entries in datasets.values()), flush=True)


if __name__ == "__main__":
    main()
