# 72 effets caméra × objets 3D

Créé par Alexis Choron : formateur IA depuis 2023, promptographe, responsable de la communication de l'Association Nationale de l'Intelligence Artificielle (ANIA).

72 effets de motion design de 6 secondes, rendus en vidéo MP4 (1080 × 1350, 30 images/s) à partir du mot de votre choix. Tout est du code, rendu sur votre ordinateur : aucune génération d'image ou de vidéo par IA, aucun abonnement.

`catalogue.pdf` montre les 72 effets avec leur numéro. Ses vignettes ont été rendues avec d'autres polices ; le kit utilise 21 polices libres proches.

## Avec Claude Code (le plus simple)

1. Dézippez le dossier `effets-3d-72` dans `~/.claude/skills/` (créez le dossier `skills` s'il n'existe pas).
2. Ouvrez une nouvelle session Claude Code et demandez par exemple :
   « Fais-moi l'effet 70 (nuée d'oiseaux) avec le mot BONJOUR » ou « Propose-moi trois effets pour le mot LANCEMENT ».

Claude copie le kit, règle votre mot, fait un brouillon, le vérifie puis rend la vidéo.

## Sans Claude

Il faut Node.js (testé avec la version 24) et Python 3, plus une connexion internet au premier rendu.

```
cp -R effets-3d-72/kit ~/Documents/mon-effet
cd ~/Documents/mon-effet
python3 tools/configurer.py --effets 20 42 --mot "BONJOUR"
npx --yes hyperframes@0.8.98 render --quality high --output ma-video.mp4
```

- `--effets` : un ou plusieurs numéros (1 à 72), enchaînés dans l'ordre ; 6 s chacun.
- `--mot` : votre mot en MAJUSCULES (accents français et chiffres acceptés). Effets à deux ou trois mots (7, 12, 15, 16, 56) : `"AVANT|APRES"`.
- `--sans-entete` : retire le titre et la légende en haut de l'image.
- `--quality draft` à la place de `high` : rendu plus rapide pour vérifier.

Les contraintes de longueur par effet sont dans le tableau de `SKILL.md`.

## Problèmes fréquents

- Sur Mac, si l'ordinateur se met en veille pendant un long rendu, celui-ci échoue : lancez `caffeinate -dims npx --yes hyperframes@0.8.98 render …`.
- « Failed to download CDN script » : coupure réseau passagère, relancez.

## Crédits techniques

Three.js et GSAP (chargés depuis jsdelivr), HyperFrames 0.8.98 (via npx). Polices libres de Google Fonts sous licence SIL Open Font License, sauf Permanent Marker sous Apache 2.0 ; les fichiers et leurs licences sont dans `kit/polices/`.
