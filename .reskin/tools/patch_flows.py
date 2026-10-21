"""Patch the flow test expectations for two state-specific checks."""
from pathlib import Path

path = Path(r"E:\workspace\chuangye\solana\702\website\.reskin\tools\flows.mjs")
text = path.read_text(encoding="utf-8")

old_dossier = """  await page.locator('.register-open').nth(2).click();
  await page.waitForTimeout(300);
  check((await page.locator('#dossier-title').innerText()).includes('liquidity'), 'opening a row shows its dossier');"""
new_dossier = """  await page.locator('.register-row', { hasText: 'liquidity' }).locator('.register-open').click();
  await page.waitForTimeout(300);
  check((await page.locator('#dossier-title').innerText()).includes('liquidity'), 'opening a row shows its dossier');"""

old_validation = """  await page.locator('.action-core.stretch[type="submit"]').click();
  await page.waitForTimeout(200);
  check((await page.locator('.field-error li').count()) >= 2, 'empty submission shows validation errors');
  await page.locator('#mission-title').fill('A focused research brief');
  await page.locator('#brief-uri').fill('https://example.org/research');
  await page.locator('#mission-reward').fill('0.05');"""
new_validation = """  await page.locator('#mission-title').fill('A focused research brief');
  await page.locator('#brief-uri').fill('not-a-url');
  await page.locator('#mission-reward').fill('0');
  const early = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  await page.locator('#mission-deadline').fill(early);
  await page.locator('.action-core.stretch[type="submit"]').click();
  await page.waitForTimeout(250);
  check((await page.locator('.field-error li').count()) >= 2, 'invalid draft shows validation errors');
  await page.locator('#brief-uri').fill('https://example.org/research');
  await page.locator('#mission-reward').fill('0.05');"""

if old_dossier not in text:
    raise SystemExit("dossier block not found")
if old_validation not in text:
    raise SystemExit("validation block not found")
text = text.replace(old_dossier, new_dossier).replace(old_validation, new_validation)
path.write_text(text, encoding="utf-8")
print("patched flows.mjs")
