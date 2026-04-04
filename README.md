# Export Canva vers PPTX

Application pour exporter un design Canva public en fichier **.pptx**, avec:
- un exécutable CLI `./canva_exporter`
- un lien web local via `./start_web`

## 1) Lancer en mode web (lien demandé)

```bash
./start_web --host 0.0.0.0 --port 8080
```

Puis ouvrir:
- `http://localhost:8080` (depuis la même machine)
- ou `http://<IP_MACHINE>:8080` (depuis le réseau)

La page web permet d'entrer un lien Canva puis d'exécuter l'export.

## 2) Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
```

## 3) Utilisation CLI

```bash
./canva_exporter "https://www.canva.com/design/DAG_uRJ4D4k/7josRBEDkBu9KS4VfrIhzw/view?utm_content=DAG_uRJ4D4k&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h5272fd92ea#7"
```

Le fichier sera enregistré dans `exports/`.

### Options utiles

- `--headed` : ouvre le navigateur en mode visible.
- `-o <dossier>` : change le dossier de sortie.

## Notes

- Si `playwright` n'est pas disponible, l'application renvoie un message d'installation explicite.
- L'automatisation dépend de l'interface Canva (peut nécessiter des ajustements si l'UI change).
