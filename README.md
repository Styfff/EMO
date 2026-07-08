# EMOM Timer

Application web statique pour lancer une séance **EMOM** (Every Minute On the Minute).

## Fonctionnalités

- choix de la durée totale de la séquence en minutes ;
- démarrage, pause/reprise et réinitialisation du minuteur ;
- sonnerie au démarrage, à chaque nouvelle minute et à la fin ;
- changement automatique de couleur à chaque minute, synchronisé avec la sonnerie ;
- interface responsive utilisable sur ordinateur et mobile.

## Utilisation locale

Ouvrez directement `index.html` dans un navigateur moderne, ou servez le dossier avec un serveur statique :

```bash
python3 -m http.server 8000
```

Puis rendez-vous sur <http://127.0.0.1:8000>.
