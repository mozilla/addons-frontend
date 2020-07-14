import * as React from 'react';

import Footer, { FooterBase } from 'disco/components/Footer';
import { makeQueryStringWithUTM } from 'disco/utils';
import Button from 'ui/components/Button';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallowUntilTarget(
      <Footer i18n={fakeI18n()} {...props} />,
      FooterBase,
    );
  };

  it('renders a footer', () => {
    const root = render();

    expect(root.find('.Footer')).toHaveLength(1);
  });

  it('renders the privacy policy link', () => {
    const root = render();

    expect(root.find(Button)).toHaveClassName('Footer-privacy-link');
    expect(root.find(Button)).toHaveProp(
      'href',
      `https://www.mozilla.org/privacy/firefox/${makeQueryStringWithUTM({
        utm_content: 'privacy-policy-link',
      })}#addons`,
    );
    expect(root.find(Button).children()).toIncludeText('Privacy Policy');
  });

  it('renders opens the privacy policy in a new window', () => {
    const root = render();

    expect(root.find(Button)).toHaveProp('target', '_blank');
  });
});
