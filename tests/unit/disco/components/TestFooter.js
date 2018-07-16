import * as React from 'react';

import Footer, { FooterBase } from 'disco/components/Footer';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

function render(props = {}) {
  return shallowUntilTarget(
    <Footer i18n={fakeI18n()} {...props} />,
    FooterBase,
  );
}

describe(__filename, () => {
  it('renders a footer', () => {
    const root = render();

    expect(root.find('.Footer')).toHaveLength(1);
  });

  it('renders the privacy policy link', () => {
    const root = render();

    expect(root.find('.Footer-privacy-link')).toHaveProp(
      'href',
      'https://www.mozilla.org/privacy/websites/',
    );
    expect(root.find('.Footer-privacy-link')).toIncludeText('Privacy Policy');
  });

  it('renders opens the privacy policy in a new window', () => {
    const root = render();

    expect(root.find('.Footer-privacy-link')).toHaveProp(
      'rel',
      'noopener noreferrer',
    );
    expect(root.find('.Footer-privacy-link')).toHaveProp('target', '_blank');
  });
});
