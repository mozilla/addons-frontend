import * as React from 'react';

import Page, { PageBase } from 'amo/components/Page';
import AppBanner from 'amo/components/AppBanner';
import Header from 'amo/components/Header';
import Card from 'ui/components/Card';
import {
  createContextWithFakeRouter,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = { children: <div>Some content</div>, ...props };

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

  it('can assign a className to the rendered component', () => {
    const contentClassName = 'a-component-className';
    const root = render({ contentClassName });

    expect(root.find(`.${contentClassName}`)).toHaveLength(1);
  });

  it('renders a div by default', () => {
    const contentClassName = 'a-component-className';
    const root = render({ contentClassName });

    expect(root.find(`div.${contentClassName}`)).toHaveLength(1);
  });

  it('can render a different component type', () => {
    const contentClassName = 'a-component-className';
    const root = render({ contentClassName, ComponentType: Card });

    expect(root.find(Card)).toHaveClassName(contentClassName);
  });

  it('passes contentProps into the rendered component', () => {
    const contentClassName = 'a-component-className';
    const header = 'header text';
    const contentProps = { header };
    const root = render({ contentClassName, contentProps });

    expect(root.find(`.${contentClassName}`)).toHaveProp('header', header);
  });

  it('renders children', () => {
    const className = 'some-class-name';
    const children = <div className={className} />;
    const root = render({ children });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });
});
