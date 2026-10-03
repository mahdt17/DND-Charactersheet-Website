"""Source-block parsing and alternate-source validation without network access."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from export_class_feature_review import feature_blocks, validate_reviewed_features


class FeatureReviewTests(unittest.TestCase):
    def test_heading_levels_and_section_boundary(self):
        for heading in ('h2', 'h3', 'h4'):
            with self.subTest(heading=heading):
                blocks = feature_blocks(
                    f'<{heading}>Class Features</{heading}>'
                    '<p><strong>First (Ex):</strong> First rule.</p><p>Continuation.</p>'
                    '<p><strong>Second:</strong> Second rule.</p>'
                    f'<{heading}>Ex-Class</{heading}><p>Separate restrictions.</p>')
                self.assertEqual([b['name'] for b in blocks], ['First (Ex)', 'Second'])
                self.assertIn('Continuation.', blocks[0]['sourceText'])
                self.assertNotIn('Separate restrictions', blocks[1]['sourceText'])

    def test_nested_headings_do_not_end_class_features(self):
        blocks = feature_blocks(
            '<h2>Class Features</h2>'
            '<p><strong>First:</strong> First rule.</p>'
            '<h4>FIRST FEATURE OPTIONS</h4><table><tr><td>Option</td></tr></table>'
            '<p><strong>Second:</strong> Second rule.</p>'
            '<h2>Advancement</h2><p><strong>Not a feature:</strong> Ignore.</p>'
        )
        self.assertEqual([b['name'] for b in blocks], ['First', 'Second'])

    def test_alternate_sources_fail_closed(self):
        primary = feature_blocks('<h2>Class Features</h2><p><strong>Feature:</strong> Broken.</p>')
        alternate = feature_blocks('<h4>Class Features</h4><p><strong>Feature:</strong> Complete.</p>')
        entry = {'id': 'test-class', 'url': 'https://primary.invalid'}
        url = 'https://alternate.invalid'
        row = {'name': 'Feature', 'sourceUrl': url, 'sourceSha256': alternate[0]['sourceSha256']}
        reviews = {'test-class': [row]}
        validate_reviewed_features(entry, primary, reviews, {url: alternate})
        with self.assertRaisesRegex(ValueError, 'requires source'):
            validate_reviewed_features(entry, primary, reviews)
        with self.assertRaisesRegex(ValueError, 'digest changed'):
            validate_reviewed_features(entry, primary, reviews, {url: primary})
        with self.assertRaisesRegex(ValueError, 'resolved to 2'):
            validate_reviewed_features(entry, primary, reviews, {url: alternate * 2})
        with self.assertRaisesRegex(ValueError, 'resolved to 0'):
            validate_reviewed_features(entry, primary, reviews, {url: []})
        row.pop('sourceUrl')
        row['sourceSha256'] = primary[0]['sourceSha256']
        validate_reviewed_features(entry, primary, reviews)


if __name__ == '__main__':
    unittest.main()
