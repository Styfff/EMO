# Étalonne la photo du hall (raw/hall.jpg) au look du style : niveaux de gris → duotone encre/papier → assets/plate_hall.jpg
import os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHADOW, LIGHT = np.array([14, 16, 19], float), np.array([236, 231, 216], float)   # #0E1013 → #ECE7D8
def grade(im, black=8, white=232, gamma=1.05):
    g = np.asarray(im.convert('L'), float)
    lo, hi = np.percentile(g, 0.5), np.percentile(g, 99.6)
    g = np.clip((g - lo) / max(1, hi - lo), 0, 1) ** gamma
    g = g * g * (3 - 2 * g) * .35 + g * .65
    g = black / 255 + g * (white - black) / 255
    return Image.fromarray(np.clip(SHADOW + (LIGHT - SHADOW) * g[..., None], 0, 255).astype(np.uint8))
os.makedirs(os.path.join(HERE, 'assets'), exist_ok=True)
grade(Image.open(os.path.join(HERE, 'raw', 'hall.jpg')).convert('RGB')).save(os.path.join(HERE, 'assets', 'plate_hall.jpg'), quality=92)
print('assets/plate_hall.jpg')
