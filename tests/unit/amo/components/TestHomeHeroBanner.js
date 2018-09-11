import * as React from 'react';

import {
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

  it('calls tracking on component page view', () => {
    const fakeTracking = createFakeTracking();
    const root = shallowRender({ _tracking: fakeTracking });

    const { variant } = root.instance().props;

    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: `${AB_HOME_HERO_TEST_NAME} Page View`,
      category: `AMO ${variant}`,
      label: '',
    });

    sinon.assert.calledOnce(fakeTracking.sendEvent);
  });

  it('calls tracking on click', () => {
    const fakeTracking = createFakeTracking();

    const root = shallowRender({
      _tracking: fakeTracking,
    });

    const { variant } = root.instance().props;

    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: `${AB_HOME_HERO_TEST_NAME} Page View`,
      category: `AMO ${variant}`,
      label: '',
    });

    sinon.assert.calledOnce(fakeTracking.sendEvent);

    const heroBanner = root.find(Hero);

    expect(heroBanner).toHaveLength(1);
    const firstItem = heroBanner.prop('sections')[0];

    firstItem.props.onClick();

    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: `${AB_HOME_HERO_TEST_NAME} Click`,
      category: `AMO ${variant}`,
      label: `${firstItem.key}`,
    });

    sinon.assert.calledTwice(fakeTracking.sendEvent);
  });
});
