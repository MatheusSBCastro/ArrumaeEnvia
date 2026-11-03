import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from pypdf import PdfReader

RAIZ = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("gerar_pdf", RAIZ / "scripts" / "gerar_pdf.py")
modulo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(modulo)


class TestPDF(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="arruma-envia-")
        self.pasta = Path(self.temp.name)
        subprocess.run(["node", str(RAIZ / "scripts/arruma-envia.mjs"), "curriculo",
                        str(RAIZ / "exemplos/perfil.ficticio.json"), "--saida", str(self.pasta)],
                       check=True, capture_output=True)
        self.blocos = json.loads((self.pasta / "curriculo.blocos.json").read_text(encoding="utf-8"))

    def tearDown(self):
        self.temp.cleanup()

    def test_texto_selecionavel_e_conteudo_confirmado(self):
        pdf = modulo.gerar(self.blocos, self.pasta / "curriculo.pdf")
        reader = PdfReader(pdf)
        texto = "\n".join(p.extract_text() for p in reader.pages)
        self.assertIn("Joana Ribeiro", texto)
        self.assertIn("Formação", texto)
        self.assertIn("Node.js", texto)
        self.assertNotIn("Kubernetes", texto)
        self.assertNotIn("10000", texto)
        self.assertLessEqual(len(reader.pages), 2)
        self.assertTrue(all(len(p.extract_text().strip()) > 0 for p in reader.pages))

    def test_curriculo_longo_pagina_sem_perder_conteudo(self):
        blocos = self.blocos + [{"tipo": "item", "texto": f"Realização comprovada {i}: integração e automação de processos com dados."} for i in range(100)]
        reader = PdfReader(modulo.gerar(blocos, self.pasta / "longo.pdf"))
        texto = "\n".join(p.extract_text() for p in reader.pages)
        self.assertGreater(len(reader.pages), 2)
        self.assertIn("Realização comprovada 99", texto)

    def test_nao_interpreta_texto_como_markup(self):
        blocos = self.blocos + [{"tipo": "texto", "texto": "Experiência com <script> & dados"}]
        reader = PdfReader(modulo.gerar(blocos, self.pasta / "escape.pdf"))
        self.assertIn("<script> & dados", "\n".join(p.extract_text() for p in reader.pages))

    def test_rejeita_links_com_credenciais_ou_esquema_inseguro(self):
        with self.assertRaises(ValueError):
            modulo.gerar(self.blocos + [{"tipo": "link", "texto": "javascript:alert(1)"}], self.pasta / "invalido.pdf")


if __name__ == "__main__":
    unittest.main()
