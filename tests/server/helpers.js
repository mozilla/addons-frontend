import cheerio from 'cheerio';
import { assert } from 'chai';

export function checkSRI(res) {
  const $ = cheerio.load(res.text);
  const $stylesheets = $('link[rel=stylesheet]');
  assert.ok($stylesheets.length > 0, 'must be at least 1 stylesheet');
  $stylesheets.each((i, elem) => {
    assert.include($(elem).attr('integrity'), 'sha512', 'css should have integrity attr');
    assert.equal($(elem).attr('crossorigin'), 'anonymous', 'css should have crossorigin attr');
  });

  const $script = $('script[src]');
  assert.ok($script.length > 0, 'must be at least 1 script');
  $script.each((i, elem) => {
    assert.include($(elem).attr('integrity'),
      'sha512', 'script should have integrity attr');
    assert.equal($(elem).attr('crossorigin'),
      'anonymous', 'script should have crossorigin attr');
  });
}
