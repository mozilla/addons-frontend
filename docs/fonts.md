# How to deal with fonts

# Overview

Our fonts are optimized for size. At the moment there are 2 different fonts:

- The "full" roman variable font, which contains a bunch of characters, but is already optimized from the "regular" Inter variable font: some characters and layout features that were unlikely to be used in our pages have been dropped.

- The "subset" roman variable font, which contains limited characters and layout features. It should be enough for most pages in our "main" locales (en, de, fr, ru, es, pt, pl & it). All pages preload this subset through a regexp on `ServerHtml` which finds the font by name using a regular expression.

The subset should be preloaded on all pages, and the full font should only be used if there are characters on the page supported by the full font and not the subset. That should be pretty rare: because we've specified the unicode-range explicitly in the CSS, in Chinese or Japanese for instance, most pages should only load the subset (useful for english language content) and then fall back to a system font for the rest, since our font doesn't cover Chinese or Japanese characters.

We no longer have an italic font: browsers synthetize one or display italic text (which should be pretty rare on AMO) as normal text.

# How to generate the full font

To add a new character or layout feature to the full font, download the web Inter roman web variable font from https://github.com/philipbelesky/inter-ui as original-Inter-roman.var.woff2 and run the following command:

```shell
pyftsubset original-Inter-roman.var.woff2 \
  --output-file=Inter-roman.var.woff2 \
  --flavor=woff2 \
  --layout-features=kern \
  --no-hinting \
  --unicodes="<unicode range>"
```

Where `<unicode-range>` is the full unicode range you want to support. To get the unicode code point value of a character, look it up on a character table tool or use `'<char>'.charCodeAt().toString(16)`. Don't forget the U+ prefix.

Note that this doesn't remove the extra weights present in the original file that we don't need, so then use https://github.com/source-foundry/Slice or similar to only keep weights 300 to 600 inclusive.

Finally, don't forget to update the CSS file with the new range you've chosen.

# How to generate the subset font

To generate the subset font with a different set of characters, use the same command as the full font, but start with our regular Roman font: run the following command:

```shell
pyftsubset Inter-roman.var.woff2 \
  --output-file=Inter-roman-subset-en_de_fr_ru_es_pt_pl_it.var.woff2 \
  --flavor=woff2 \
  --layout-features=kern \
  --no-hinting \
  --unicodes="<unicode range>"
```

See the full font instructions for how to generate `<unicode-range>`. Once again, don't forget to update the CSS with the new range you've chosen.

# How to build the right unicode-range of a font

Use https://github.com/zachleat/glyphhanger to check fonts used on our pages. Don't forget the `--family` argument, as the language dropdown on all our pages contain a bunch of extra characters that would otherwise be returned.

Good pages to use are the homepage, about page, review guide, first page of each category, as well as the detail page of a few popular add-ons.

You can also use https://character-table.netlify.app/ to check what characters are used by which language.

# How to check that it works locally

Use https://wakamaifondue.com/beta/ to check a particular font, ensuring that it has the correct layout features, characters and weights we want. You can compare the unicode-range supported by the font to the one in the CSS.

To test it, load the site locally, and check which fonts are downloaded.

Repeat with a prod build to ensure that it works in production mode (webpack configuration is slightly special in production to ensure the name of the font is kept, with a suffix for the content hash).
