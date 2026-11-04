import os
import shutil
import socket
import subprocess
import time
import unittest
from pathlib import Path
from urllib.request import urlopen

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[4]
FRONTEND_ROOT = PROJECT_ROOT / "frontend-leitura"
load_dotenv(FRONTEND_ROOT / ".env")
TEST_EMAIL = os.getenv("EMAIL_TESTE")
TEST_PASSWORD = os.getenv("SENHA_TESTE")
NODE = shutil.which("node")

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None


@unittest.skipUnless(sync_playwright and NODE, "Playwright e Node.js são necessários para GUI.")
class FrontendGuiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        vite_entry = FRONTEND_ROOT / "node_modules" / "vite" / "bin" / "vite.js"
        if not vite_entry.exists():
            raise unittest.SkipTest("Instale as dependências do frontend antes dos testes GUI.")

        cls.playwright = sync_playwright().start()
        try:
            cls.browser = cls.playwright.chromium.launch()
        except Exception as error:
            cls.playwright.stop()
            raise unittest.SkipTest(
                "Chromium do Playwright indisponível; execute python -m playwright install chromium."
            ) from error

        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            cls.port = listener.getsockname()[1]

        cls.base_url = f"http://127.0.0.1:{cls.port}"
        cls.server = subprocess.Popen(
            [
                NODE,
                str(vite_entry),
                "--host",
                "127.0.0.1",
                "--port",
                str(cls.port),
                "--strictPort",
            ],
            cwd=FRONTEND_ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT,
        )

        for _ in range(100):
            if cls.server.poll() is not None:
                cls.browser.close()
                cls.playwright.stop()
                raise RuntimeError("O servidor Vite encerrou antes de ficar disponível.")
            try:
                with urlopen(cls.base_url, timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                time.sleep(0.1)
        else:
            cls.server.terminate()
            cls.browser.close()
            cls.playwright.stop()
            raise RuntimeError("Tempo esgotado aguardando o servidor Vite.")

    @classmethod
    def tearDownClass(cls):
        if getattr(cls, "server", None) and cls.server.poll() is None:
            cls.server.terminate()
            try:
                cls.server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                cls.server.kill()
        if getattr(cls, "browser", None):
            cls.browser.close()
        if getattr(cls, "playwright", None):
            cls.playwright.stop()

    def setUp(self):
        self.page = self.browser.new_page(viewport={"width": 1280, "height": 800})
        self.page.goto(self.base_url, wait_until="networkidle")

    def tearDown(self):
        self.page.close()

    def test_landing_page_has_no_horizontal_overflow_on_mobile(self):
        for width in (320, 375, 640):
            self.page.set_viewport_size({"width": width, "height": 800})
            dimensions = self.page.evaluate(
                "() => ({viewport: document.documentElement.clientWidth, "
                "document: document.documentElement.scrollWidth})"
            )
            self.assertEqual(dimensions["document"], dimensions["viewport"])

        self.page.get_by_role("heading", name="TrocaLivros").wait_for()
        self.page.get_by_role("button", name="Começar a Trocar").wait_for()

    def test_auth_screen_switches_between_login_and_signup(self):
        self.page.get_by_role("button", name="Entrar / Cadastrar").click()
        self.page.get_by_role("heading", name="Entrar na Plataforma").wait_for()
        self.page.get_by_role("button", name="Cadastrar", exact=True).click()
        self.page.get_by_role("heading", name="Criar sua conta").wait_for()
        self.page.get_by_label("Nome Completo").wait_for()
        self.page.get_by_label("Confirme a Senha").wait_for()

    @unittest.skipUnless(TEST_EMAIL and TEST_PASSWORD, "Configure EMAIL_TESTE e SENHA_TESTE em frontend-leitura/.env.")
    def test_login_uses_configured_test_account(self):
        self.page.get_by_role("button", name="Entrar / Cadastrar").click()
        self.page.get_by_label("E-mail").fill(TEST_EMAIL)
        self.page.get_by_label("Senha").fill(TEST_PASSWORD)
        self.page.locator("form").get_by_role("button", name="Entrar", exact=True).click()
        self.page.get_by_role("button", name="Sair", exact=True).wait_for(timeout=20000)

    def test_theme_toggle_updates_document(self):
        self.page.get_by_role("button", name="Ativar modo escuro").click()

        is_dark = self.page.locator("html").evaluate(
            "element => element.classList.contains('dark')"
        )
        self.assertTrue(is_dark)


if __name__ == "__main__":
    unittest.main()