# How to deal with fonts

# Overview

Our fonts are optimized for size. At the moment there are 2 different fonts:

- The "full" roman variable font, which contains a bunch of characters, but is already optimized from the "regular" Inter variable font: some characters and layout features that were unlikely to be used in our pages have been dropped.

- The "subset" roman variable font, which contains limited characters and layout features. It should be enough for most pages in our "main" locales (en, de, fr, ru, es, pt, pl & it). All pages preload this subset through a regexp on `ServerHtml` which finds the font by name using a regular expression.

The subset should be preloaded on all pages, and the full font should only be used if there are characters on the page supported by the full font and not the subset. That should be pretty rare: because we've specified the unicode-range explicitly in the CSS, in Chinese or Japanese for instance, most pages should only load the subset (useful for english language content) and then fall back to a system font for the rest, since our font doesn't cover Chinese or Japanese characters.

Both fonts should only contain weights from 300 to 600 and only the "roman" font. We no longer have an italic font: browsers synthetize one or display italic text (which should be pretty rare on AMO) as normal text.

# Prerequisites

To use the commands below, install https://github.com/fonttools/fonttools. This should give you a `pyftsubset` command and some python libraries we need.

# How to generate the full font

Run the following command:

```shell
./bin/regenerate_font.js "src/fonts/woff2/Inter-roman.var.woff2" "<unicode-range>"
```

Where `<unicode-range>` is the full unicode range you want to support.

Under the hood, `regenerate_font.js` will call `pyftsubset` and save the new font to `src/fonts/woff2/Inter-roman.var.woff2`, then regenerate the `src/fonts/inter.scss` file as well as `src/fonts/Inter-roman.var.html` file used to list all characters in the font.

# How to generate the subset font

run the following command:

```shell
./bin/regenerate_font.js "src/fonts/woff2/Inter-roman-subset-en_de_fr_ru_es_pt_pl_it.var.woff2" "<unicode-range>"
```

Where `<unicode-range>` is the full unicode range you want to support.

Under the hood, `regenerate_font.js` will call `pyftsubset` and save the new font to `src/fonts/woff2/Inter-roman-subset-en_de_fr_ru_es_pt_pl_it.var.woff2`, then regenerate the `src/fonts/inter-subset.scss` file as well as `Inter-roman-subset-en_de_fr_ru_es_pt_pl_it.var.html` file used to list all characters in the font.

# How to update the base font used by `regenerate_font.js`

Download the latest `Inter-roman.var.woff2` from https://github.com/philipbelesky/inter-ui/tree/main/Inter%20(web), use something like https://github.com/source-foundry/Slice to only keep weights from 300 to 600 and save it as src/fonts/woff2/Inter-roman-reduced-weights.var.woff2

# How to select the right unicode-range of a font

Finding the right unicode-range to use is a manual process using different tools:

- Use https://github.com/zachleat/glyphhanger to check fonts used on our pages. Don't forget the `--family` argument, as the language dropdown on all our pages contain a bunch of extra characters that would otherwise be returned. Good pages to use are the homepage, about page, review guide, first page of each category, as well as the detail page of a few popular add-ons.

- Use https://character-table.netlify.app/ to check what characters are used by which language.

- Use our `bin/find_characters_in_font.py` command to find the full unicode range supported by a font (It doesn't bother simplifying the range like `regenerate_font.js` does however)

A quick way to get the unicode code point value of a character is to look it up on a character table tool or use `'<char>'.charCodeAt().toString(16)`. Don't forget the `U+` prefix when specifying the range though!

# How to check that it works locally

Use https://wakamaifondue.com/beta/ to check a particular font, ensuring that it has the correct layout features, characters and weights we want. You can compare the `unicode-range` supported by the font to the one in the CSS, they should be the same. You can also check out the `.html` file corresponding to each font (which `regenerate_font.js` regenerates when it's called) to ensure the list of characters present match your expectations.

To test it, load the site locally, and check which fonts are downloaded. Repeat with a prod build to ensure that it works in production mode (webpack configuration is slightly special in production to ensure the name of the font is kept, with a suffix for the content hash).
