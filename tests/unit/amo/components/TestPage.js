import * as React from 'react';

import Page, { PageBase } from 'amo/components/Page';
import AppBanner from 'amo/components/AppBanner';
import Header from 'amo/components/Header';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'core/constants';
import {
  createContextWithFakeRouter,
  dispatchClientMetadata,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = {
      children: <div>Some content</div>,
      store: dispatchClientMetadata().store,
      ...props,
    };

    return shallowUntilTarget(<Page {...allProps} />, PageBase, {
      shallowOptions: createContextWithFakeRouter(),
    });
  };

  it('passes isHomePage to Header', () => {
    const isHomePage = true;

    const root = render({ isHomePage });

    expect(root.find(Header)).toHaveProp('isHomePage', isHomePage);
  });

  it('assigns a className to a page other than the home page', () => {
    const root = render({ isHomePage: false });

    expect(root.find('.Page-not-homepage')).toHaveLength(1);
  });

  it('does not assign an extra className to the home page', () => {
    const root = render({ isHomePage: true });

    expect(root.find('.Page-not-homepage')).toHaveLength(0);
  });

  it('assigns a className when there is no hero promo', () => {
    const root = render({
      _config: getFakeConfig({ enableFeatureHeroRecommendation: false }),
    });

    expect(root.find('.Page-no-hero-promo')).toHaveLength(1);
  });

  it('does not assign an extra className when there is a hero promo', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
    const root = render({
      _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
      store,
    });

    expect(root.find('.Page-no-hero-promo')).toHaveLength(0);
  });

  it('assigns a className when there is a hero promo and it is also the Android home page', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });

    const root = render({
      _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
      store,
    });

    expect(root.find('.Page-no-hero-promo')).toHaveLength(1);
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
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
    const root = render({
      _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
      isHomePage: true,
      store,
    });

    expect(root.find(AppBanner)).toHaveLength(0);
  });

  it('renders an AppBanner if it is the home page and enableFeatureHeroRecommendation is true on Android', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const root = render({
      _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
      isHomePage: true,
      store,
    });

    expect(root.find(AppBanner)).toHaveLength(1);
  });

  it('renders children', () => {
    const className = 'some-class-name';
    const children = <div className={className} />;
    const root = render({ children });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });
});
