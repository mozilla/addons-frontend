import * as React from 'react';

import Page, { PageBase } from 'amo/components/Page';
import AppBanner from 'amo/components/AppBanner';
import Header from 'amo/components/Header';
import {
  createContextWithFakeRouter,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = { children: '', ...props };

    return shallowUntilTarget(<Page {...allProps} />, PageBase, {
      shallowOptions: createContextWithFakeRouter(),
    });
  };

  it('passes isHomePage to Header', () => {
    const isHomePage = true;

    const root = render({ isHomePage });

    expect(root.find(Header)).toHaveProp('isHomePage', isHomePage);
  });

  it('uses the expected className for a page other than the home page', () => {
    const root = render({ isHomePage: false });

    expect(root.find('.Page')).toHaveLength(1);
    expect(root.find('.Page-homepage')).toHaveLength(0);
  });

  it('uses the expected className for the home page', () => {
    const root = render({ isHomePage: true });

    expect(root.find('.Page')).toHaveLength(0);
    expect(root.find('.Page-homepage')).toHaveLength(1);
  });

  it('renders an AppBanner if it is not the home page', () => {
    const root = render({ isHomePage: false });

    expect(root.find(AppBanner)).toHaveLength(1);
  });

  it('renders an AppBanner if enableFeatureHeroRecommendation is false', () => {
    const root = render({
      _config: getFakeConfig({ enableFeatureHeroRecommendation: false }),
      isHomePage: true,
    });

    expect(root.find(AppBanner)).toHaveLength(1);
  });

  it('does not render an AppBanner if it is the home page and enableFeatureHeroRecommendation is true', () => {
    const root = render({
      _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
      isHomePage: true,
    });

    expect(root.find(AppBanner)).toHaveLength(0);
  });

  it('renders children', () => {
    const className = 'some-class-name';
    const children = <div className={className} />;
    const root = render({ children });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });
});
