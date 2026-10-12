import json
import shutil
import subprocess
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[4]
GOOGLE_BOOKS_MODULE = PROJECT_ROOT / "frontend-leitura" / "src" / "googleBooks.js"
NODE = shutil.which("node")


@unittest.skipUnless(NODE, "Node.js é necessário para testar o módulo usado pelo frontend.")
class GoogleBooksUnitTests(unittest.TestCase):
    def run_module(self, expression):
        module_url = json.dumps(GOOGLE_BOOKS_MODULE.as_uri())
        script = (
            "import { buildGoogleBooksQueries, buildGoogleBooksUrl, isIsbn13, "
            "mapGoogleBooksVolume, normalizeIsbn, searchGoogleBooks } "
            f"from {module_url};\n"
            f"console.log(JSON.stringify({expression}));"
        )
        result = subprocess.run(
            [NODE, "--input-type=module", "-e", script],
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        return json.loads(result.stdout)

    def test_normalizes_isbn_by_removing_spaces_and_hyphens(self):
        result = self.run_module("normalizeIsbn('978-85 3591-4849')")

        self.assertEqual(result, "9788535914849")

    def test_detects_only_isbn13_after_removing_separators(self):
        result = self.run_module(
            "[isIsbn13('978-85 3591.4849'), isIsbn13('ISBN 9788535914849'), "
            "isIsbn13('978853591484')]"
        )

        self.assertEqual(result, [True, False, False])

    def test_builds_one_isbn_query_or_title_and_author_queries(self):
        result = self.run_module(
            "[buildGoogleBooksQueries({searchTerm: '978-85 3591-4849', author: 'Autor'}), "
            "buildGoogleBooksQueries({searchTerm: 'Duna', author: 'Frank Herbert'})]"
        )

        self.assertEqual(
            result,
            [
                [{"type": "ISBN", "query": "isbn:9788535914849"}],
                [
                    {"type": "Título", "query": "intitle:Duna"},
                    {"type": "Autor", "query": "inauthor:Frank Herbert"},
                ],
            ],
        )

    def test_builds_encoded_google_books_url_and_optional_key(self):
        result = self.run_module(
            "buildGoogleBooksUrl('isbn:9788535914849', 'key&value')"
        )

        self.assertEqual(
            result,
            "https://www.googleapis.com/books/v1/volumes?"
            "q=isbn%3A9788535914849&key=key%26value",
        )

    def test_maps_book_metadata_and_upgrades_cover_to_https(self):
        result = self.run_module(
            "mapGoogleBooksVolume({title: 'Livro', authors: ['Ana', 'Bia'], "
            "language: 'pt', imageLinks: {smallThumbnail: 'http://img.test/capa'}, "
            "industryIdentifiers: [{type: 'ISBN_13', identifier: '978-85-3591-4849'}]})"
        )

        self.assertEqual(
            result,
            {
                "isbn": "9788535914849",
                "titulo": "Livro",
                "autor": "Ana, Bia",
                "idioma": "Português",
                "foto_capa_url": "https://img.test/capa",
            },
        )

    def test_maps_missing_metadata_to_safe_defaults(self):
        result = self.run_module("mapGoogleBooksVolume({})")

        self.assertEqual(
            result,
            {"isbn": "", "titulo": "", "autor": "", "idioma": "Português", "foto_capa_url": ""},
        )

    def test_search_uses_at_most_two_requests_and_filters_and_deduplicates_isbn(self):
        result = self.run_module(
            "await (async () => { const urls = []; "
            "const results = await searchGoogleBooks({searchTerm: 'Duna', author: 'Frank Herbert'}, '', "
            "async url => { urls.push(url); const query = new URL(url).searchParams.get('q'); "
            "const first = {title: 'Duna', authors: ['Frank Herbert'], industryIdentifiers: "
            "[{type: 'ISBN_13', identifier: '9780000000001'}]}; "
            "const second = {title: 'Outro', authors: ['Frank Herbert'], industryIdentifiers: "
            "[{type: 'ISBN_13', identifier: '9780000000002'}]}; "
            "return {ok: true, json: async () => ({items: query.startsWith('intitle:') "
            "? [{volumeInfo: first}, {volumeInfo: {title: 'Sem ISBN'}}] "
            ": [{volumeInfo: first}, {volumeInfo: second}]})}; }); "
            "return {queries: urls.map(url => new URL(url).searchParams.get('q')), results}; })()"
        )

        self.assertEqual(result["queries"], ["intitle:Duna", "inauthor:Frank Herbert"])
        self.assertEqual([book["isbn"] for book in result["results"]], ["9780000000001", "9780000000002"])
        self.assertEqual(result["results"][0]["matches"], ["Título", "Autor"])

    def test_search_uses_one_request_for_isbn(self):
        result = self.run_module(
            "await (async () => { const urls = []; await searchGoogleBooks(" 
            "{searchTerm: '978-85-3591-4849', author: 'Frank Herbert'}, '', "
            "async url => { urls.push(url); return {ok: true, json: async () => ({items: []})}; }); "
            "return urls.map(url => new URL(url).searchParams.get('q')); })()"
        )

        self.assertEqual(result, ["isbn:9788535914849"])


if __name__ == "__main__":
    unittest.main()