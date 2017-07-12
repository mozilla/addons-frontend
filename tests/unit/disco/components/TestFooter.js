import { shallow } from 'enzyme';
import React from 'react';

import { FooterBase } from 'disco/components/Footer';
import { getFakeI18nInst } from 'tests/unit/helpers';


function shallowRender(props = {}) {
  return shallow(<FooterBase i18n={getFakeI18nInst()} {...props} />);
}

describe('Footer', () => {
  it('renders a footer', () => {
    const root = shallowRender();

    expect(root.find('.Footer')).toHaveLength(1);
  });

  it('renders the privacy policy link', () => {
    const root = shallowRender();

    expect(root.find('.Footer-privacy-link'))
      .toHaveProp('href', 'https://www.mozilla.org/privacy/websites/');
    expect(root.find('.Footer-privacy-link')).toIncludeText('Privacy Policy');
  });

  it('renders opens the privacy policy in a new window', () => {
    const root = shallowRender();

    expect(root.find('.Footer-privacy-link'))
      .toHaveProp('rel', 'noopener noreferrer');
    expect(root.find('.Footer-privacy-link')).toHaveProp('target', '_blank');
  });
});
