#!/usr/bin/env python3
"""Interface web pour déclencher l'export Canva -> PPTX."""

from __future__ import annotations

import argparse
import html
import subprocess
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent
EXPORTER = APP_ROOT / "canva_exporter"


class MissingDependencyError(RuntimeError):
    """Raised when optional runtime dependency is missing."""


def build_app():
    try:
        from flask import Flask, Response, request
    except ModuleNotFoundError as exc:
        raise MissingDependencyError(
            "La dépendance 'flask' est absente. Installez-la avec:\n"
            "  pip install -r requirements.txt"
        ) from exc

    app = Flask(__name__)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/")
    def index() -> Response:
        return Response(
            """
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Canva → PPTX</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 760px; margin: 2rem auto; line-height: 1.4; }
    input, button { padding: .6rem; font-size: 1rem; }
    input[type='text'] { width: 100%; }
    .row { margin-bottom: 1rem; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; }
  </style>
</head>
<body>
  <h1>Export Canva vers PPTX</h1>
  <div class="card">
    <form method="post" action="/run">
      <div class="row">
        <label for="url">Lien Canva</label><br />
        <input id="url" name="url" type="text" required placeholder="https://www.canva.com/design/..." />
      </div>
      <div class="row">
        <label for="output">Dossier de sortie</label><br />
        <input id="output" name="output" type="text" value="exports" />
      </div>
      <div class="row">
        <label><input type="checkbox" name="headed" value="1" /> Mode visible (--headed)</label>
      </div>
      <button type="submit">Exécuter l'export</button>
    </form>
  </div>
  <p>API santé: <a href="/health">/health</a></p>
</body>
</html>
            """.strip(),
            mimetype="text/html",
        )

    @app.post("/run")
    def run_export() -> Response:
        url = request.form.get("url", "").strip()
        output = request.form.get("output", "exports").strip() or "exports"
        headed = bool(request.form.get("headed"))

        if not url:
            return Response("URL Canva manquante.", status=400, mimetype="text/plain")

        cmd = [str(EXPORTER), url, "-o", output]
        if headed:
            cmd.append("--headed")

        try:
            completed = subprocess.run(  # noqa: S603
                cmd,
                cwd=str(APP_ROOT),
                capture_output=True,
                text=True,
                timeout=240,
                check=False,
            )
        except subprocess.TimeoutExpired:
            return Response("Temps dépassé (240s).", status=504, mimetype="text/plain")

        safe_stdout = html.escape(completed.stdout)
        safe_stderr = html.escape(completed.stderr)

        body = f"""
<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Résultat export</title></head>
<body>
  <h2>Résultat</h2>
  <p><strong>Commande:</strong> <code>{html.escape(' '.join(cmd))}</code></p>
  <p><strong>Code de sortie:</strong> {completed.returncode}</p>
  <h3>stdout</h3>
  <pre>{safe_stdout}</pre>
  <h3>stderr</h3>
  <pre>{safe_stderr}</pre>
  <p><a href="/">← Retour</a></p>
</body>
</html>
        """.strip()

        status = 200 if completed.returncode == 0 else 500
        return Response(body, status=status, mimetype="text/html")

    return app


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serveur web pour canva_exporter")
    parser.add_argument("--host", default="0.0.0.0", help="Host HTTP (défaut: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8080, help="Port HTTP (défaut: 8080)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        app = build_app()
    except MissingDependencyError as exc:
        print(f"Erreur: {exc}", file=sys.stderr)
        return 3

    app.run(host=args.host, port=args.port, debug=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
