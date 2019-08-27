import * as React from 'react';

import AddonTitle from 'amo/components/AddonTitle';
import HeroRecommendation, {
  HeroRecommendationBase,
} from 'amo/components/HeroRecommendation';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalHeroShelves } from 'amo/reducers/home';
import { makeQueryStringWithUTM } from 'amo/utils';
import {
  createHeroShelves,
  fakeAddon,
  fakeI18n,
  fakePrimaryHeroShelfExternal,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const createShelfData = (primaryProps = {}) => {
    return createInternalHeroShelves(createHeroShelves({ primaryProps }))
      .primary;
  };

  const render = (moreProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      shelfData: createShelfData(),
      ...moreProps,
    };
    return shallowUntilTarget(
      <HeroRecommendation {...props} />,
      HeroRecommendationBase,
    );
  };

  describe('for an addon', () => {
    it('renders a heading', () => {
      const addon = fakeAddon;
      const shelfData = createShelfData({ addon });

      const root = render({ shelfData });

      expect(root.find(AddonTitle)).toHaveProp(
        'addon',
        createInternalAddon(addon),
      );
    });

    it('renders a link', () => {
      const slug = 'some-addon-slug';
      const shelfData = createShelfData({ addon: { ...fakeAddon, slug } });

      const root = render({ shelfData });

      expect(root.find('.HeroRecommendation-link')).toHaveProp(
        'to',
        `/addon/${slug}/${makeQueryStringWithUTM({
          utm_content: 'homepage-primary-hero',
          utm_campaign: '',
        })}`,
      );
    });
  });

  describe('for an external item', () => {
    it('renders a heading', () => {
      const name = 'External Name';
      const shelfData = createShelfData({
        external: { ...fakePrimaryHeroShelfExternal, name },
      });

      const root = render({ shelfData });

      expect(root.find('.HeroRecommendation-heading')).toHaveText(name);
    });

    it('renders a link', () => {
      const homepage = 'https://somehomepage.com';
      const shelfData = createShelfData({
        external: { ...fakePrimaryHeroShelfExternal, homepage },
      });

      const root = render({ shelfData });

      expect(root.find('.HeroRecommendation-link')).toHaveProp(
        'href',
        homepage,
      );
    });
  });

  it('renders an image', () => {
    const featuredImage = 'https://mozilla.org/featured.png';
    const shelfData = createShelfData({ addon: fakeAddon, featuredImage });

    const root = render({ shelfData });

    expect(root.find('.HeroRecommendation-image')).toHaveProp(
      'src',
      featuredImage,
    );
  });

  it('renders a body', () => {
    const description = 'some body text';
    const shelfData = createShelfData({ addon: fakeAddon, description });

    const root = render({ shelfData });

    expect(root.find('.HeroRecommendation-body').html()).toContain(description);
  });

  it('allows some html tags in the body', () => {
    const description = '<blockquote><b>Some body text</b></blockquote>';
    const shelfData = createShelfData({ addon: fakeAddon, description });

    const root = render({ shelfData });

    expect(root.find('.HeroRecommendation-body').html()).toContain(description);
  });

  it('sanitizes html tags in the body', () => {
    const description = '<blockquote><b>Some body text</b></blockquote>';
    const scriptHtml = '<script>alert(document.cookie);</script>';
    const shelfData = createShelfData({
      addon: fakeAddon,
      description: `${description}${scriptHtml}`,
    });

    const root = render({ shelfData });

    expect(root.find('.HeroRecommendation-body').html()).toContain(description);
  });
});
