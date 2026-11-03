"""Gera PDF de texto selecionável a partir dos blocos exportados pelo CLI Node."""
import argparse
import json
import os
from pathlib import Path
from urllib.parse import urlparse
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph


def fontes(regular=None, bold=None):
    if bool(regular) != bool(bold):
        raise ValueError("Informe --fonte e --fonte-negrito juntas.")
    windows_fonts = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    candidatas = [(Path(regular), Path(bold))] if regular else [
        (windows_fonts / "arial.ttf", windows_fonts / "arialbd.ttf"),
        (Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")),
        (Path("/System/Library/Fonts/Supplemental/Arial.ttf"), Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")),
    ]
    for normal, forte in candidatas:
        if normal.is_file() and forte.is_file():
            pdfmetrics.registerFont(TTFont("Curriculo", str(normal)))
            pdfmetrics.registerFont(TTFont("CurriculoBold", str(forte)))
            return "Curriculo", "CurriculoBold"
    if regular:
        raise ValueError("Não foi possível localizar as duas fontes TTF informadas.")
    return "Helvetica", "Helvetica-Bold"


def gerar(blocos, saida, regular=None, bold=None):
    if not isinstance(blocos, list) or not blocos or blocos[0].get("tipo") != "nome":
        raise ValueError("Esperada uma lista de blocos de currículo, começando por nome.")
    normal, forte = fontes(regular, bold)
    estilos = {}
    base = dict(fontName=normal, fontSize=10, leading=14, textColor=colors.HexColor("#1b2734"),
                alignment=TA_LEFT, spaceAfter=4, splitLongWords=True)
    ajustes = {
        "nome": dict(fontName=forte, fontSize=25, leading=28, spaceAfter=9, textColor=colors.HexColor("#123742"), keepWithNext=True),
        "titulo": dict(fontName=forte, fontSize=10, leading=14, spaceAfter=6, keepWithNext=True),
        "contato": dict(fontSize=9, leading=12, textColor=colors.HexColor("#465864")),
        "link": dict(fontSize=8.5, leading=11, textColor=colors.HexColor("#465864")),
        "secao": dict(fontName=forte, fontSize=11, leading=14, spaceBefore=15, spaceAfter=7, textColor=colors.HexColor("#155361"), keepWithNext=True),
        "subtitulo": dict(fontName=forte, spaceBefore=7, keepWithNext=True),
        "meta": dict(fontSize=9, leading=12, textColor=colors.HexColor("#465864"), keepWithNext=True),
        "item": dict(leftIndent=10, firstLineIndent=-10),
        "texto": {},
    }
    for tipo, extras in ajustes.items():
        estilos[tipo] = ParagraphStyle(tipo, **(base | extras))
    historia = []
    for bloco in blocos:
        tipo, texto = bloco.get("tipo"), bloco.get("texto")
        if tipo not in estilos or not isinstance(texto, str):
            raise ValueError("Bloco inválido: tipo ou texto não reconhecido.")
        if normal == "Helvetica":
            try:
                texto.encode("cp1252")
            except UnicodeEncodeError as exc:
                raise ValueError("Este texto precisa de fontes Unicode. Informe duas fontes TTF com --fonte e --fonte-negrito.") from exc
        conteudo = escape(texto)
        if tipo == "item":
            conteudo = "- " + conteudo
        if tipo == "link":
            url = urlparse(texto)
            if url.scheme != "https" or not url.hostname or url.username or url.password:
                raise ValueError("Link inválido; use HTTPS sem credenciais.")
            conteudo = '<link href="' + escape(texto, {'"': '&quot;'}) + '">' + conteudo + '</link>'
        historia.append(Paragraph(conteudo, estilos[tipo]))
    destino = Path(saida)
    destino.parent.mkdir(parents=True, exist_ok=True)
    documento = SimpleDocTemplate(str(destino), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
                                 topMargin=16 * mm, bottomMargin=16 * mm,
                                 title="Currículo - " + blocos[0]["texto"], author=blocos[0]["texto"])
    documento.build(historia)
    return destino


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blocos", help="curriculo.blocos.json gerado pelo comando curriculo")
    parser.add_argument("--saida", default=".local/saidas/curriculo.pdf")
    parser.add_argument("--fonte", help="Arquivo TTF regular, opcional")
    parser.add_argument("--fonte-negrito", help="Arquivo TTF negrito, opcional")
    args = parser.parse_args()
    try:
        blocos = json.loads(Path(args.blocos).read_text(encoding="utf-8-sig"))
        destino = gerar(blocos, args.saida, args.fonte, args.fonte_negrito)
    except (ValueError, OSError, KeyError) as exc:
        parser.exit(1, f"Erro: {exc}\n")
    print(f"PDF gerado: {destino.resolve()}")


if __name__ == "__main__":
    main()
