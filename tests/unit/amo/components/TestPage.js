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
    const className = 'a-component-className';
    const root = render({ className });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });

  it('renders a div by default', () => {
    const className = 'a-component-className';
    const root = render({ className });

    expect(root.find(`div.${className}`)).toHaveLength(1);
  });

  it('can render a different top level component', () => {
    const className = 'a-component-className';
    const ComponentType = 'span';
    const root = render({ className, ComponentType });

    expect(root.find(`${ComponentType}.${className}`)).toHaveLength(1);
  });

  it('passes componentProps into the rendered component', () => {
    const className = 'a-component-className';
    const header = 'header text';
    const componentProps = { header };
    const root = render({ className, componentProps });

    expect(root.find(`.${className}`)).toHaveProp('header', header);
  });

  it('renders children', () => {
    const className = 'some-class-name';
    const children = <div className={className} />;
    const root = render({ children });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });
});
