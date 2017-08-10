import { shallow } from 'enzyme';
import React from 'react';

import { AboutBase } from 'amo/components/StaticPages/About';
import { ReviewGuideBase } from 'amo/components/StaticPages/ReviewGuide';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('About', () => {
  function render() {
    return shallow(
      <AboutBase i18n={getFakeI18nInst()} />
    );
  }

  it('outputs a about page', () => {
    const root = render();

    expect(root).toHaveClassName('AboutPage');
  });
});

describe('ReviewGuide', () => {
  function render() {
    return shallow(
      <ReviewGuideBase i18n={getFakeI18nInst()} />
    );
  }

  it('outputs a review_guide page', () => {
    const root = render();

    expect(root).toHaveClassName('ReviewGuidePage');
  });
});
