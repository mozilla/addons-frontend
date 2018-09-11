import * as React from 'react';
import { shallow } from 'enzyme';

import {
  createFakeEvent,
  createFakeTracking,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import HomeHeroBanner, {
  AB_HOME_HERO_TEST_NAME,
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

  it('renders a carousel with random sections', () => {
    const root = shallowRender();
    const carousel = root.find(Hero);

    expect(carousel).toHaveLength(1);
    expect(carousel).toHaveProp('random', true);
  });

  it('calls tracking on home page view', () => {
    const fakeTracking = createFakeTracking();
    const root = shallowRender({ _tracking: fakeTracking });

    const { variant } = root.instance().props;

    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: `${AB_HOME_HERO_TEST_NAME} Page View`,
      category: `AMO ${AB_HOME_HERO_TEST_NAME}_EXPERIMENT: ${variant}`,
      label: '',
    });

    sinon.assert.calledOnce(fakeTracking.sendEvent);
  });

  it('calls tracking on hero click', () => {
    const fakeTracking = createFakeTracking();

    const root = shallowRender({
      _tracking: fakeTracking,
    });

    const { variant } = root.instance().props;

    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: `${AB_HOME_HERO_TEST_NAME} Page View`,
      category: `AMO ${AB_HOME_HERO_TEST_NAME}_EXPERIMENT: ${variant}`,
      label: '',
    });

    sinon.assert.calledOnce(fakeTracking.sendEvent);

    const heroBanner = root.find(Hero);

    // We'll use the first item in the home heroes array as an example.
    const heroItem = heroBanner.prop('sections')[0];
    const heroLink = shallow(heroItem).find('.HeroSection-link-wrapper');

    expect(heroLink).toHaveLength(1);

    heroLink.simulate('click', createFakeEvent());

    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: `${AB_HOME_HERO_TEST_NAME} Click`,
      category: `AMO ${AB_HOME_HERO_TEST_NAME}_EXPERIMENT: ${variant}`,
      label: heroItem.key,
    });

    sinon.assert.calledTwice(fakeTracking.sendEvent);
  });
});
