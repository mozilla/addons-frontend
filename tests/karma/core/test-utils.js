import { camelCaseProps } from 'core/utils';

describe('camelCaseProps', () => {
  const input = {
    underscore_delimited: 'underscore',
    'hyphen-delimited': 'hyphen',
    'period.delimited': 'period',
  };

  const result = camelCaseProps(input);

  it('deals with hyphenated props', () => {
    assert.equal(result.hyphenDelimited, 'hyphen');
  });

  it('deals with underscore delimited props', () => {
    assert.equal(result.underscoreDelimited, 'underscore');
  });

  it('deals with period delimited props', () => {
    assert.equal(result.periodDelimited, 'period');
  });
});
