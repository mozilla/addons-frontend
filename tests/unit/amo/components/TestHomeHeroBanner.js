import * as React from 'react';
import { shallow } from 'enzyme';

import {
  createFakeEvent,
  createFakeTracking,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import HomeHeroBanner, {
  AB_HOME_HERO_EXPERIMENT_CATEGORY,
  AB_HOME_HERO_VARIANT_A,
  AB_HOME_HERO_VARIANT_B,
  HomeHeroBannerBase,
} from 'amo/components/HomeHeroBanner';
import Hero from 'ui/components/Hero';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const defaultProps = {
    i18n: fakeI18n(),
    store: dispatchClientMetadata().store,
  };

  function shallowRender(props) {
    return shallowUntilTarget(
      <HomeHeroBanner {...defaultProps} {...props} />,
      HomeHeroBannerBase,
    );
  }

  it('renders a HomeHeroBanner', () => {
    const root = shallowRender();

    expect(root).toHaveClassName('HomeHeroBanner');
  });

  it('renders with the "small" experiment classname', () => {
    const root = shallowRender({ variant: AB_HOME_HERO_VARIANT_A });
    expect(root).toHaveClassName('HomeHeroBanner--small');
  });

  it('renders without the "small" experiment classname', () => {
    const root = shallowRender({ variant: AB_HOME_HERO_VARIANT_B });
    expect(root).not.toHaveClassName('HomeHeroBanner--small');
  });

  it('renders a carousel with random sections', () => {
    const root = shallowRender();
    const carousel = root.find(Hero);

    expect(carousel).toHaveLength(1);
    expect(carousel).toHaveProp('random', true);
  });

  it('sends a tracking event when first rendered on the client', () => {
    const fakeTracking = createFakeTracking();
    const root = shallowRender({ _tracking: fakeTracking });

    const { variant } = root.instance().props;

    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: variant,
      category: `${AB_HOME_HERO_EXPERIMENT_CATEGORY} / Page View`,
    });

    sinon.assert.calledOnce(fakeTracking.sendEvent);
  });

  it('sends a tracking event on hero click', () => {
    const fakeTracking = createFakeTracking();

    const root = shallowRender({
      _tracking: fakeTracking,
    });

    const { variant } = root.instance().props;

    const hero = root.find(Hero);

    // We'll use the first item in the home heroes array as an example.
    const firstHeroItem = hero.prop('sections')[0];
    const firstHeroTitle = root.instance().getHeroes()[0].title;

    const firstHeroLink = shallow(firstHeroItem).find(
      '.HeroSection-link-wrapper',
    );

    expect(firstHeroLink).toHaveLength(1);

    firstHeroLink.simulate('click', createFakeEvent());

    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: variant,
      category: `${AB_HOME_HERO_EXPERIMENT_CATEGORY} / Click`,
      label: firstHeroTitle,
    });

    // This is called on render (page view) too.
    // This is why it is called more than once.
    sinon.assert.calledTwice(fakeTracking.sendEvent);
  });
});
