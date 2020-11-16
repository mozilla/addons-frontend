import { shallow } from 'enzyme';
import * as React from 'react';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import { UnavailableForLegalReasonsBase } from 'amo/components/Errors/UnavailableForLegalReasons';
import Link from 'amo/components/Link';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = () => {
    return shallow(<UnavailableForLegalReasonsBase i18n={fakeI18n()} />);
  };

  it('renders a not available error', () => {
    const root = render();

    expect(root.find(ErrorComponent)).toHaveProp('code', 451);
    expect(root.find(ErrorComponent)).toHaveProp(
      'header',
      'That page is not available in your region',
    );

    expect(root.find('p').at(0)).toIncludeText('not available in your region');

    // The last paragraph has two internal links...
    const landingLinks = root.find('.Errors-paragraph-with-links').find(Link);
    expect(landingLinks).toHaveLength(3);
    expect(landingLinks.at(0)).toHaveProp('to', '/extensions/');
    expect(landingLinks.at(1)).toHaveProp('to', '/themes/');
    // ...and an external link.
    expect(landingLinks.at(2)).toHaveProp(
      'href',
      expect.stringContaining('discourse'),
    );
  });
});
