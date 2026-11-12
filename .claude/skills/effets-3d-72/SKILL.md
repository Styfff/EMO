---
name: effets-3d-72
description: 72 effets de motion design caméra × objets 3D (lettres qui rebondissent, ferrofluide, feu d'artifice, nuée d'oiseaux, néon sous la pluie…) rendus en vidéo MP4 à partir d'un mot, en local, sans génération par IA. Déclencher pour : effet 3D sur un mot, anime mon mot, effet n° 12, « fais-moi l'effet nuée d'oiseaux avec le mot X », titre animé 3D, logo animé en lettres 3D, catalogue des 72 effets, effets-3d-72.
---

# 72 effets caméra × objets 3D

Chaque effet dure 6 s : un mouvement de caméra, un geste d'objet 3D, un style graphique, une palette et une police. Le moteur est du code (Three.js), rendu image par image par HyperFrames : sortie MP4 1080 × 1350 (format 4:5), 30 images/s. Aucune génération payante, aucun appel à un modèle d'image ou de vidéo.

Créé par Alexis Choron : formateur IA depuis 2023, promptographe, responsable de la communication de l'Association Nationale de l'Intelligence Artificielle (ANIA).

## Contenu

- `kit/` : le projet à copier puis rendre (ne jamais modifier l'original dans le dossier de la skill).
- `catalogue.pdf` : les 72 effets avec une vignette et une description. Les vignettes ont été rendues avec d'autres polices ; le kit utilise des polices libres proches (liste dans `kit/polices/`).
- `LISEZMOI.md` : le même mode d'emploi, pour une personne sans Claude.

## Prérequis (à vérifier avant le premier rendu)

1. Node.js (testé avec la v24.14.1) : `node -v`.
2. Python 3 : `python3 --version`.
3. Une connexion internet : HyperFrames s'installe via `npx` au premier lancement et télécharge son propre navigateur ; Three.js et GSAP viennent d'un CDN (jsdelivr).

Testé sur macOS uniquement. Windows et Linux : non testés.

## Déroulé

1. **Comprendre la demande** : quel(s) effet(s) (numéro ou nom, voir le tableau ci-dessous) et quel mot. Si l'utilisateur ne donne pas de numéro, proposer 3 effets adaptés à son mot et à son ton, avec le numéro.
2. **Vérifier le mot** contre les contraintes de l'effet (colonne « Mot »). Le mot est passé en MAJUSCULES ; lettres A-Z, accents français, chiffres et ponctuation simple. Les autres caractères sont ignorés.
3. **Copier le kit** dans un dossier de travail, par exemple :
   `cp -R "<dossier de la skill>/kit" ~/Documents/effets-3d-<mot>` puis `cd ~/Documents/effets-3d-<mot>`
4. **Configurer** :
   `python3 tools/configurer.py --effets 20 42 --mot "BONJOUR"`
   Options : `--sans-entete` pour une image sans titre ni légende ; `--tous` pour les 72 effets. Le script règle aussi la durée de la vidéo (6 s × nombre d'effets).
5. **Brouillon** (rapide) : `npx --yes hyperframes@0.8.98 render --quality draft --output brouillon.mp4`
   Contrôler quelques images : `npx --yes hyperframes@0.8.98 snapshot . --at 1,3,5.5 --no-end`
6. **Rendu final** : `npx --yes hyperframes@0.8.98 render --quality high --output <mot>-effet-<n>.mp4`
7. **Vérifier** avant d'annoncer : la durée doit valoir 6 s × nombre d'effets (`ffprobe` si disponible), et le mot doit se lire sur la dernière seconde de chaque effet.

## Pièges connus

- Sur Mac, un rendu long peut échouer si l'ordinateur se met en veille : préfixer la commande par `caffeinate -dims`.
- « Failed to download CDN script » : coupure réseau passagère ; relancer.
- Ne pas éditer `assets/glyphs.js` à la main : il est généré par `python3 tools/glyphes.py` (demande `pip install fonttools`).
- Le titre, le style et la police affichés en haut de l'image décrivent l'effet d'origine, même avec un autre mot ; `--sans-entete` les retire.
- Un mot très long (plus de 10 lettres) rapetisse dans les effets cadrés sur le mot entier.

## Les 72 effets

| N° | Effet | Mot |
|---|---|---|
| 1 | Plat → profondeur | un mot, court conseillé |
| 2 | Vague de bascule (tableau des départs) | 14 caractères au plus |
| 3 | Chute et rebond | libre |
| 4 | Ferrofluide | court conseillé |
| 5 | Rassemblement en orbite | libre |
| 6 | Gel orbital (bullet time) | court conseillé |
| 7 | Prisme à mots | trois mots « A\|B\|C » (un seul mot remplace le dernier) |
| 8 | Extrusion qui pousse | libre |
| 9 | Tunnel typographique | le mot d'arrivée |
| 10 | Sable qui s'écoule | court conseillé |
| 11 | Torsion et courbure | libre |
| 12 | Mur de tuiles (pixel art) | deux mots de 5 lettres au plus « A\|B » |
| 13 | Tranches glissantes | libre |
| 14 | Pendules en vague | libre |
| 15 | Écran d'épingles | une à trois lignes « A\|B\|C » |
| 16 | Voxels au vent | deux mots « A\|B » (un seul remplace le second) |
| 17 | Rouleaux à lettres | sans espace, 4 à 9 lettres conseillé |
| 18 | Vortex | libre |
| 19 | Sortie de l'eau | libre |
| 20 | Feu d'artifice | un bouquet par lettre, 8 lettres au plus conseillé |
| 21 | Impression couche par couche | libre |
| 22 | Page qui tourne | libre |
| 23 | Tube qui écrit | 7 lettres au plus (une lettre tracée après l'autre) |
| 24 | Monolithes vus du ciel | 8 lettres au plus conseillé |
| 25 | Chaîne de dominos | libre |
| 26 | Mise en abyme | doit contenir un O, sinon le mot ZOOM est gardé |
| 27 | Zootrope | la première lettre saute, le mot sert d'étiquette |
| 28 | Fraiseuse CNC | libre |
| 29 | Portail | 8 lettres au plus conseillé |
| 30 | Nuage LiDAR | libre |
| 31 | Lumière à travers le pochoir | libre |
| 32 | Défroissage | titre du journal |
| 33 | Caustiques | libre |
| 34 | Miroirs infinis | court conseillé |
| 35 | Lettres en feu | libre |
| 36 | Fonte et coulure | court conseillé |
| 37 | Accordéon | libre |
| 38 | Rebonds qui posent les lettres | 8 lettres au plus (une lettre après l'autre) |
| 39 | Phyllotaxie | court conseillé |
| 40 | Ville qui pousse | court conseillé |
| 41 | Ruban de Möbius | libre |
| 42 | Néon qui s'allume | libre |
| 43 | Puzzle qui s'assemble | titre de l'affiche |
| 44 | Mer de nuages | libre |
| 45 | Arcs électriques | libre |
| 46 | Faille de lave | libre |
| 47 | Éventail de cartes | une carte par lettre, 12 au plus conseillé |
| 48 | Cube N × N × N | 2 à 6 lettres (cube de N cases de côté) |
| 49 | Écriture dans le ciel | un avion par lettre, 6 au plus conseillé |
| 50 | Spectacle laser | libre |
| 51 | Remplissage | libre |
| 52 | Pluie de météores | libre |
| 53 | Kaléidoscope | court conseillé |
| 54 | Tornade de lettres | libre |
| 55 | Projection mapping | court conseillé |
| 56 | Spectacle de drones | deux mots « A\|B » (un seul remplace le second) |
| 57 | Bulles qui éclatent | 8 lettres au plus conseillé |
| 58 | Drapeaux au vent | un drapeau par lettre, 8 au plus conseillé |
| 59 | Saut en hyperespace | 8 lettres au plus conseillé |
| 60 | Lampe torche | 6 lettres visitées par la lampe, au-delà simplement éclairées |
| 61 | Bibliothèque | 11 lettres au plus |
| 62 | Projecteur de cinéma | court conseillé |
| 63 | Casse au billard | exactement 7 boules : complété ou coupé à 7 caractères |
| 64 | Tampon encreur | court conseillé |
| 65 | Rideau d'eau | court conseillé |
| 66 | Ballons qui se gonflent | 6 lettres au plus conseillé |
| 67 | Briques à tenons | court conseillé |
| 68 | Ticket qui s'imprime | court conseillé |
| 69 | Lever de rideau | 8 lettres au plus conseillé |
| 70 | Nuée d'oiseaux | court conseillé |
| 71 | Jour et nuit en accéléré | libre |
| 72 | Coulée en fonderie | 7 lettres au plus (une lettre remplie après l'autre) |
