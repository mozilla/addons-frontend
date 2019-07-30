import * as React from 'react';

import HeroRecommendation, {
  HeroRecommendationBase,
} from 'amo/components/HeroRecommendation';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (moreProps = {}) => {
    const props = {
      body: 'Example of a promo description',
      heading: 'Promo Title Example',
      i18n: fakeI18n(),
      linkText: 'Get It Now',
      linkHref: 'https://promo-site.com/',
      ...moreProps,
    };
    return shallowUntilTarget(
      <HeroRecommendation {...props} />,
      HeroRecommendationBase,
    );
  };

  it('renders a heading', () => {
    const heading = 'Forest Preserve Nougat (beta)';
    const root = render({ heading });

    expect(root.find('.HeroRecommendation-heading')).toHaveText(heading);
  });

  it('renders a body', () => {
    const body = 'Change the way you shop with Forest Preserve Nougat.';
    const root = render({ body });

    expect(root.find('.HeroRecommendation-body')).toHaveText(body);
  });

  it('renders a link', () => {
    const linkText = 'Shop For Mall Music Now';
    const linkHref = 'https://internet-mall-music.com/';
    const root = render({ linkText, linkHref });

    const link = root.find('.HeroRecommendation-link');
    expect(link).toHaveProp('href', linkHref);
    expect(link).toHaveText(linkText);
  });
});
