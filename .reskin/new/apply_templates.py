"""Replace the four SFC templates with the Meridian Ledger templates.

The script section of every component is preserved byte-for-byte; only the
<template> block is swapped. Originals are kept under .reskin/original-templates/.
"""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(r"E:\workspace\chuangye\solana\702\website")
NEW = ROOT / ".reskin" / "new"
BACKUP = ROOT / ".reskin" / "original-templates"

TARGETS = {
    "src/App.vue": "App.template.html",
    "src/components/BriefIndex.vue": "BriefIndex.template.html",
    "src/components/BriefDossier.vue": "BriefDossier.template.html",
    "src/components/BriefGuide.vue": "BriefGuide.template.html",
}


def replace_template(path: Path, template: str) -> str:
    source = path.read_text(encoding="utf-8")
    start = source.index("<template>")
    end = source.rindex("</template>") + len("</template>")
    return source[:start] + template.strip() + "\n" + source[end:]


def main() -> int:
    BACKUP.mkdir(parents=True, exist_ok=True)
    for rel, template_name in TARGETS.items():
        target = ROOT / rel
        backup = BACKUP / rel.replace("/", "__")
        if not backup.exists():
            shutil.copy2(target, backup)
        template = (NEW / template_name).read_text(encoding="utf-8")
        updated = replace_template(target, template)
        target.write_text(updated, encoding="utf-8")
        print(f"rewrote {rel} template ({len(updated)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
