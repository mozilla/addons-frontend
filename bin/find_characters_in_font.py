#!/usr/bin/env python
import sys

from fontTools.ttLib import TTFont

ttf = TTFont(sys.argv[1])
cmap = ttf.getBestCmap()

chars = [format(y[0], 'x') for y in cmap.items()]
print (','.join(f'U+{char}' for char in chars))

ttf.close()
