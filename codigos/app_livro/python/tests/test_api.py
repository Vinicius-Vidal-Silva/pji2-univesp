import json
import os
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[4]
load_dotenv(PROJECT_ROOT / "frontend-leitura" / ".env")
load_dotenv(PROJECT_ROOT / "codigos" / "app_livro" / "python" / ".env")
API_TESTS_ENABLED = os.getenv("RUN_API_TESTS") == "1"


@unittest.skipUnless(API_TESTS_ENABLED, "Defina RUN_API_TESTS=1 para acessar APIs externas.")
class ReadOnlyApiTests(unittest.TestCase):
    def test_supabase_rest_can_read_public_book_catalog(self):
        base_url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
        api_key = os.getenv("VITE_SUPABASE_KEY") or os.getenv("SUPABASE_KEY")
        if not base_url or not api_key:
            self.skipTest("Credenciais Supabase não configuradas.")

        query = urlencode({"select": "id,titulo,autor,status", "limit": "1"})
        request = Request(
            f"{base_url.rstrip('/')}/rest/v1/livros?{query}",
            headers={
                "apikey": api_key,
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
            },
        )
        with urlopen(request, timeout=20) as response:
            self.assertEqual(response.status, 200)
            books = json.load(response)

        self.assertIsInstance(books, list)
        if books:
            self.assertTrue({"id", "titulo", "autor", "status"}.issubset(books[0]))

    def test_google_books_returns_volume_for_known_title(self):
        query = {"q": "matilda"}
        api_key = os.getenv("VITE_GOOGLE_BOOKS_API_KEY")
        if api_key:
            query["key"] = api_key
        request = Request(
            f"https://www.googleapis.com/books/v1/volumes?{urlencode(query)}",
            headers={"Accept": "application/json"},
        )
        try:
            with urlopen(request, timeout=20) as response:
                self.assertEqual(response.status, 200)
                payload = json.load(response)
        except HTTPError as error:
            self.fail(f"Google Books respondeu HTTP {error.code}.")

        self.assertIsInstance(payload.get("items"), list)
        self.assertTrue(payload["items"])
        self.assertTrue(payload["items"][0].get("volumeInfo", {}).get("title"))


if __name__ == "__main__":
    unittest.main()