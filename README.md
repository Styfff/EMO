# Export Canva vers PPTX

Cette application automatise l'export d'un design Canva public en fichier **.pptx**.

## Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
```

## Utilisation

```bash
python canva_exporter.py "https://www.canva.com/design/DAG_uRJ4D4k/7josRBEDkBu9KS4VfrIhzw/view?utm_content=DAG_uRJ4D4k&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h5272fd92ea#7"
```

Le fichier sera enregistré dans `exports/`.

### Options utiles

- `--headed` : ouvre le navigateur en mode visible (utile si Canva demande une connexion).
- `-o <dossier>` : change le dossier de sortie.

Exemple:

```bash
python canva_exporter.py "<lien_canva>" --headed -o mes_exports
```

## Notes

- L'automatisation dépend de l'interface Canva (noms de boutons et disposition).
- Si Canva modifie l'UI ou impose une authentification stricte, exécutez avec `--headed` pour terminer manuellement la partie connexion puis laisser le script faire le téléchargement.
