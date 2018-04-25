import * as React from 'react';

import AddonRecommendations, {
  AddonRecommendationsBase,
  TAAR_IMPRESSION_CATEGORY,
  TAAR_COHORT_COOKIE_NAME,
  TAAR_COHORT_INCLUDED,
  TAAR_COHORT_EXCLUDED,
} from 'amo/components/AddonRecommendations';
import {
  fetchRecommendations,
  loadRecommendations,
} from 'amo/reducers/recommendations';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeRecommendations,
} from 'tests/unit/amo/helpers';
import {
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';


const fakeCookie = (returnValue) => {
  return {
    load: sinon.stub().returns(returnValue),
    save: sinon.spy(),
  };
};

const fakeRandomizer = (expectedRecommendedValue) => {
  return sinon.stub().returns(expectedRecommendedValue ? 0.51 : 0.5);
};

describe(__filename, () => {
  let fakeTracking;
  let store;

  beforeEach(() => {
    fakeTracking = {
      sendEvent: sinon.spy(),
    };
    store = dispatchClientMetadata().store;
  });

  function doFetchRecommendations({
    guid = fakeAddon.guid,
    recommended = true,
  }) {
    const errorHandler = createStubErrorHandler();
    return fetchRecommendations({
      errorHandlerId: errorHandler.id,
      guid,
      recommended,
    });
  }

  function doLoadRecommendations({
    addon = createInternalAddon(fakeAddon),
    ...props
  }) {
    return loadRecommendations({
      guid: addon.guid,
      ...fakeRecommendations,
      ...props,
    });
  }

  function render({
    addon = createInternalAddon(fakeAddon),
    cookie = fakeCookie(),
    randomizer = fakeRandomizer(true),
    ...props
  } = {}) {
    const errorHandler = createStubErrorHandler();

    return shallowUntilTarget(
      <AddonRecommendations
        addon={addon}
        i18n={fakeI18n()}
        cookie={cookie}
        errorHandler={errorHandler}
        randomizer={randomizer}
        store={store}
        tracking={fakeTracking}
        {...props}
      />,
      AddonRecommendationsBase
    );
  }

  it('renders nothing without an addon', () => {
    const root = render({ addon: null });
    expect(root).not.toHaveClassName('AddonRecommendations');
  });

  it('renders an AddonCard when recommendations are loaded', () => {
    const addons = [createInternalAddon(fakeAddon)];
    store.dispatch(doLoadRecommendations({ addons }));

    const root = render({});
    expect(root).toHaveClassName('AddonRecommendations');
    expect(root).toHaveProp('addons', addons);
    expect(root).toHaveProp('header', 'You might also like...');
    expect(root).toHaveProp('loading', false);
    expect(root).toHaveProp('placeholderCount', 4);
    expect(root).toHaveProp('showMetadata', true);
    expect(root).toHaveProp('showSummary', false);
    expect(root).toHaveProp('type', 'horizontal');
  });

  it('renders an AddonCard when recommendations are loading', () => {
    store.dispatch(doFetchRecommendations({}));

    const root = render({});
    expect(root).toHaveClassName('AddonRecommendations');
    expect(root).toHaveProp('addons', null);
    expect(root).toHaveProp('loading', true);
  });

  it('uses the randomizer to set the cohort and cookie when a cookie does not exist', () => {
    const checkWithRandomizerValue =
      (expectedRecommendedValue, expectedCohort) => {
        const cookie = fakeCookie(undefined);
        const randomizer = fakeRandomizer(expectedRecommendedValue);
        render({ cookie, randomizer });
        sinon.assert.calledWith(cookie.save,
          TAAR_COHORT_COOKIE_NAME, expectedCohort, { path: '/' });
      };

    checkWithRandomizerValue(true, TAAR_COHORT_INCLUDED);
    checkWithRandomizerValue(false, TAAR_COHORT_EXCLUDED);
  });

  it('should dispatch a fetch action if no recommendations exist', () => {
    const addon = createInternalAddon(fakeAddon);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const randomizer = fakeRandomizer(true);

    render({ addon, errorHandler, randomizer });

    sinon.assert.calledWith(dispatchSpy, fetchRecommendations({
      errorHandlerId: errorHandler.id,
      guid: addon.guid,
      recommended: true,
    }));
  });

  it('should not dispatch a fetch action if addon is null', () => {
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ addon: null });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should dispatch a fetch action if the addon is updated', () => {
    const addon = createInternalAddon(fakeAddon);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const randomizer = fakeRandomizer(true);

    const root = render({ addon, errorHandler, randomizer });

    dispatchSpy.reset();

    const newAddon = createInternalAddon({
      ...fakeAddon,
      guid: 'new-guid',
    });

    root.setProps({ addon: newAddon });

    sinon.assert.calledWith(dispatchSpy, fetchRecommendations({
      errorHandlerId: errorHandler.id,
      guid: newAddon.guid,
      recommended: true,
    }));
  });

  it('should not dispatch a fetch if the addon is updated but not changed', () => {
    const addon = createInternalAddon(fakeAddon);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ addon });

    dispatchSpy.reset();

    root.setProps({ addon });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should not dispatch a fetch if the addon is updated to null', () => {
    const addon = createInternalAddon(fakeAddon);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ addon });

    dispatchSpy.reset();

    root.setProps({ addon: null });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should send a GA ping when recommendations are loaded', () => {
    const { fallbackReason, outcome } = fakeRecommendations;
    const root = render({ tracking: fakeTracking });

    root.setProps({ recommendations: fakeRecommendations });

    sinon.assert.calledOnce(fakeTracking.sendEvent);
    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: `outcome: ${outcome} | fallbackReason: ${fallbackReason}`,
      category: TAAR_IMPRESSION_CATEGORY,
      label: fakeAddon.name,
    });
  });
});
