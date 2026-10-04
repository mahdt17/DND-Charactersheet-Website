"""Source-faithful prerequisite recovery for truncated prestige pages."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import enrich_dndtools as d35


def page(name, book, requirements, historical=False):
    identity = f"({book} variant, p. 1)" if historical else f"Prestige Class {book} (EX), p. 1"
    return (f"<h1>{name}</h1><p>{identity}</p><div>Hit Die</div><div>d8</div>"
            "<div>Skill Points</div><div>4 + Int</div>"
            f"<h2>Requirements</h2>{requirements}"
            "<h2>Class Skills</h2><p>Hide, Move Silently</p>"
            "<h2>Advancement</h2><table><tr><th>Level</th><th>BAB</th><th>Special</th></tr>"
            "<tr><td>1st</td><td>+1</td><td>Source-specific feature</td></tr></table>"
            "<h2>Class Features</h2><p>Source-specific feature: Grants the benefits described for this source only.</p>")


class SourceIsolation(unittest.TestCase):
    def parse(self, entry, html):
        parser = d35.DetailParser()
        parser.feed(html)
        parser.close()
        return d35.parse_class(parser, entry)

    def test_same_name_other_book_cannot_supply_entry_gate(self):
        old = {"id": "classes/test-old", "name": "Test", "sourceBook": "Prestige Class Old Book", "url": "https://new.dndtools.org/classes/test-old"}
        new = {"id": "classes/test-new", "name": "Test", "sourceBook": "Prestige Class New Book", "url": "https://new.dndtools.org/classes/test-new"}
        primary = page("Test", "Old Book", "")
        sibling = page("Test", "New Book", "<p>Feats: Later Edition Feat</p>")
        historical = page("Test", "Old Book", "<p>Base Attack Bonus: +9</p><p>Feats: Original Feat</p>", True)
        with patch.object(d35, "class_catalog_rows", return_value=[old, new]), patch.object(d35, "fetch", return_value=sibling), patch.object(d35, "fetch_allowed", return_value=historical):
            result = self.parse(old, primary)
        text = " ".join(p["text"] for p in result["prerequisites"])
        self.assertIn("Original Feat", text)
        self.assertNotIn("Later Edition Feat", text)

    def test_historical_name_match_is_not_book_identity(self):
        entry = {"id": "classes/test-old", "name": "Test", "sourceBook": "Prestige Class Old Book", "url": "https://new.dndtools.org/classes/test-old"}
        historical = page("Test", "New Book", "<p>Feats: Wrong Book Feat</p>", True)
        with patch.object(d35, "fetch_allowed", return_value=historical):
            with self.assertRaisesRegex(ValueError, "source.*mismatch|book.*mismatch"):
                d35.legacy_class_fallback(entry)

    def test_partial_language_gate_recovers_missing_categories(self):
        entry = {"id": "classes/test-only", "name": "Test", "sourceBook": "Prestige Class Exact Book", "url": "https://new.dndtools.org/classes/test-only"}
        primary = page("Test", "Exact Book", "<p>Language: Giant.</p>")
        historical = page("Test", "Exact Book", "<p>Race: Gnome</p><p>Skills: Tumble 3 ranks</p><p>Feats: Dodge</p><p>Language: Wrong language.</p>", True)
        with patch.object(d35, "class_catalog_rows", return_value=[entry]), patch.object(d35, "fetch_allowed", return_value=historical):
            result = self.parse(entry, primary)
        text = " | ".join(p["text"] for p in result["prerequisites"])
        self.assertIn("Gnome", text)
        self.assertIn("Tumble 3 ranks", text)
        self.assertIn("Dodge", text)
        self.assertIn("Giant", text)
        self.assertNotIn("Wrong language", text)

    def test_follows_only_published_same_class_source_alternatives(self):
        entry = {"id": "classes/test-old", "name": "Test", "sourceBook": "Prestige Class Old Book", "url": "https://new.dndtools.org/classes/test-123"}
        wrong = page("Test", "New Book", "<p>Feats: Wrong Book Feat</p>", True)
        wrong += '<a href="/classes/old-book--44/test/">Old Book</a><a href="https://untrusted.invalid/classes/old-book--44/test/">External</a>'
        correct = page("Test", "Old Book", "<p>Feats: Original Feat</p>", True)
        def fetch(url, hosts, delay):
            return {"https://dndtools.net/classes/test/": wrong,
                    "https://dndtools.net/classes/old-book--44/test/": correct}[url]
        with patch.object(d35, "fetch_allowed", side_effect=fetch):
            result = d35.legacy_class_fallback(entry)
        self.assertEqual(result["fallbackSourceUrl"], "https://dndtools.net/classes/old-book--44/test/")
        self.assertEqual(result["prerequisites"][0]["text"], "Original Feat")

    def test_accent_spelling_does_not_erase_edition(self):
        self.assertEqual(d35.class_book_key("Prestige Class Races of Faerûn"), d35.class_book_key("Races of Faerun"))
        self.assertNotEqual(d35.class_book_key("The Mind's Eye [Web 3.0]"), d35.class_book_key("The Mind's Eye [Web 3.5]"))

    def test_invalid_alternative_does_not_hide_later_matching_book(self):
        entry = {"name": "Test", "sourceBook": "Prestige Class Old Book", "url": "https://new.dndtools.org/classes/test-123"}
        initial = page("Test", "New Book", "", True)
        initial += '<a href="/classes/broken--1/test/">Broken</a><a href="/classes/wrong--2/test/">Wrong</a><a href="/classes/old--3/test/">Old</a>'
        responses = [initial, OSError("unavailable"), page("Other", "Old Book", "", True), page("Test", "Old Book", "<p>Feats: Original Feat</p>", True)]
        with patch.object(d35, "fetch_allowed", side_effect=responses):
            result = d35.legacy_class_fallback(entry)
        self.assertEqual(result["fallbackSourceUrl"], "https://dndtools.net/classes/old--3/test/")


if __name__ == "__main__":
    unittest.main()
