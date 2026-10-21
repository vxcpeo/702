"""Replace the two stale 'paper edition' comments left in shipped source."""
from pathlib import Path

app = Path(r"E:\workspace\chuangye\solana\702\website\src\App.vue")
icon = Path(r"E:\workspace\chuangye\solana\702\website\src\components\UiIcon.vue")

text = app.read_text(encoding="utf-8")
start = text.index("/* The paper edition has four pages and two overlays")
end = text.index("*/", start) + 2
text = text[:start] + (
    "/* The documentary ledger has four pages and two overlays: the registry, a\n"
    "   saved list, a wallet activity list, a field guide, the draft sheet and the\n"
    "   rewards ledger. A selected brief replaces the registry in the document flow\n"
    "   rather than opening a side pane or a dialog. */"
) + text[end:]
app.write_text(text, encoding="utf-8")

text = icon.read_text(encoding="utf-8")
start = text.index(" * A softer, hand-set icon family for the paper edition")
end = text.index("\n", text.index("accessible name.", start)) + 1
text = text[:start] + (
    " * A fine-line icon family for the documentary ledger: rounded caps, a 1.7\n"
    " * stroke on a 24-unit grid, and no glyph borrowed from an earlier edition.\n"
    " * Decorative only; every control carries its own text or accessible name.\n"
) + text[end:]
icon.write_text(text, encoding="utf-8")
print("patched comments")
