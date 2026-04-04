#!/usr/bin/env python3
"""Exporter une présentation Canva publique en fichier PPTX."""

from __future__ import annotations

import argparse
import re
import sys
import time
from pathlib import Path


class MissingDependencyError(RuntimeError):
    """Raised when optional runtime dependency is missing."""


def slug_from_url(url: str) -> str:
    match = re.search(r"/design/([^/]+)/", url)
    if match:
        return match.group(1)
    return f"canva-export-{int(time.time())}"


def _load_playwright():
    try:
        from playwright.sync_api import Error, TimeoutError, sync_playwright
    except ModuleNotFoundError as exc:
        raise MissingDependencyError(
            "La dépendance 'playwright' est absente. Installez-la avec:\n"
            "  pip install -r requirements.txt\n"
            "  python -m playwright install chromium"
        ) from exc
    return Error, TimeoutError, sync_playwright


def click_if_visible(page, selectors: list[str], Error, timeout_ms: int = 2_000) -> bool:
    for selector in selectors:
        locator = page.locator(selector)
        try:
            if locator.first.is_visible(timeout=timeout_ms):
                locator.first.click(timeout=timeout_ms)
                return True
        except Error:
            continue
    return False


def click_by_text(page, texts: list[str], Error, timeout_ms: int = 2_000) -> bool:
    for text in texts:
        locator = page.get_by_text(text, exact=False)
        try:
            if locator.first.is_visible(timeout=timeout_ms):
                locator.first.click(timeout=timeout_ms)
                return True
        except Error:
            continue
    return False


def export_canva_to_pptx(url: str, output_dir: Path, headless: bool) -> Path:
    Error, _, sync_playwright = _load_playwright()

    output_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(accept_downloads=True, locale="fr-FR")
        page = context.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=120_000)

        click_by_text(page, ["Accepter", "Accept all", "Tout accepter"], Error, timeout_ms=1_500)
        click_by_text(page, ["Ignorer", "Fermer", "Close"], Error, timeout_ms=1_500)

        opened_menu = (
            click_by_text(page, ["Partager", "Share"], Error)
            or click_if_visible(page, ["button[aria-label*='Share']", "button[aria-label*='Partager']"], Error)
            or click_if_visible(page, ["button[aria-label*='Plus']", "button[aria-label*='More']"], Error)
        )

        if not opened_menu:
            click_by_text(page, ["Télécharger", "Download"], Error, timeout_ms=2_500)

        if not click_by_text(page, ["Télécharger", "Download"], Error, timeout_ms=4_000):
            browser.close()
            raise RuntimeError(
                "Impossible de trouver le bouton de téléchargement automatiquement. "
                "Relancez avec --headed pour vous connecter à Canva si nécessaire."
            )

        click_if_visible(
            page,
            ["button:has-text('Type de fichier')", "button:has-text('File type')"],
            Error,
            timeout_ms=4_000,
        )
        if not click_by_text(page, ["Microsoft PowerPoint", "PPTX"], Error, timeout_ms=4_000):
            browser.close()
            raise RuntimeError("Impossible de sélectionner le format Microsoft PowerPoint (PPTX).")

        filename = f"{slug_from_url(url)}.pptx"
        dest = output_dir / filename

        with page.expect_download(timeout=120_000) as download_info:
            if not click_by_text(page, ["Télécharger", "Download"], Error, timeout_ms=4_000):
                browser.close()
                raise RuntimeError("Le bouton de confirmation du téléchargement est introuvable.")

        download = download_info.value
        download.save_as(str(dest))
        browser.close()
        return dest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Automatise l'export d'un design Canva public au format PPTX.",
    )
    parser.add_argument("url", help="Lien Canva de partage/view")
    parser.add_argument(
        "-o",
        "--output-dir",
        default="exports",
        help="Dossier où enregistrer le fichier .pptx (défaut: exports)",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Lance le navigateur avec interface (utile si une connexion Canva est requise)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        destination = export_canva_to_pptx(
            url=args.url,
            output_dir=Path(args.output_dir),
            headless=not args.headed,
        )
    except MissingDependencyError as exc:
        print(f"Échec de l'export: {exc}", file=sys.stderr)
        return 3
    except Exception as exc:  # noqa: BLE001
        if exc.__class__.__name__ == "TimeoutError":
            print("Temps dépassé pendant l'automatisation Canva.", file=sys.stderr)
            return 2
        print(f"Échec de l'export: {exc}", file=sys.stderr)
        return 1

    print(f"Export réussi: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
