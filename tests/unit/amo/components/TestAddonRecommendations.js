import * as React from 'react';

import AddonRecommendations, {
  TAAR_IMPRESSION_CATEGORY,
  TAAR_COHORT_DIMENSION,
  TAAR_COHORT_INCLUDED,
  TAAR_EXPERIMENT_PARTICIPANT,
  TAAR_EXPERIMENT_PARTICIPANT_DIMENSION,
  AddonRecommendationsBase,
} from 'amo/components/AddonRecommendations';
import AddonsCard from 'amo/components/AddonsCard';
import {
  OUTCOME_CURATED,
  OUTCOME_RECOMMENDED,
  OUTCOME_RECOMMENDED_FALLBACK,
  fetchRecommendations,
  loadRecommendations,
} from 'amo/reducers/recommendations';
import {
  createFakeTracking,
  createInternalAddonWithLang,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakeRecommendations,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { ErrorHandler } from 'amo/errorHandler';
import LoadingText from 'amo/components/LoadingText';

describe(__filename, () => {
  let fakeTracking;
  let store;

  beforeEach(() => {
    fakeTracking = createFakeTracking();
    store = dispatchClientMetadata().store;
  });

  function doFetchRecommendations({ guid = fakeAddon.guid }) {
    const errorHandler = createStubErrorHandler();
    return fetchRecommendations({
      errorHandlerId: errorHandler.id,
      guid,
    });
  }

  function doLoadRecommendations({
    addon = createInternalAddonWithLang(fakeAddon),
    ...props
  }) {
    return loadRecommendations({
      guid: addon.guid,
      ...fakeRecommendations,
      ...props,
    });
  }

  function render({
    addon = createInternalAddonWithLang(fakeAddon),
    ...props
  } = {}) {
    const errorHandler = createStubErrorHandler();

    return shallowUntilTarget(
      <AddonRecommendations
        addon={addon}
        i18n={fakeI18n()}
        errorHandler={errorHandler}
        store={store}
        tracking={fakeTracking}
        {...props}
      />,
      AddonRecommendationsBase,
    );
  }

  it('renders nothing without an addon', () => {
    const root = render({ addon: null });
    expect(root).not.toHaveClassName('AddonRecommendations');
  });

  it('renders nothing if there is an error', () => {
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('some unexpected error'));
    store.dispatch(doLoadRecommendations({}));

    const root = render({ errorHandler });
    expect(root).not.toHaveClassName('AddonRecommendations');
  });

  it('renders an AddonCard when recommendations are loaded', () => {
    const apiAddons = [fakeAddon];
    const addons = [createInternalAddonWithLang(fakeAddon)];
    const outcome = OUTCOME_RECOMMENDED;
    store.dispatch(
      doLoadRecommendations({
        addons: apiAddons,
        outcome,
      }),
    );

    const root = render({}).find(AddonsCard);
    expect(root).toHaveClassName('AddonRecommendations');
    expect(root).toHaveProp('addonInstallSource', outcome);
    expect(root).toHaveProp('addons', addons);
    expect(root).toHaveProp(
      'header',
      'Other users with this extension also installed',
    );
    expect(root).toHaveProp('loading', false);
    expect(root).toHaveProp('placeholderCount', 4);
    expect(root).toHaveProp('showMetadata', true);
    expect(root).toHaveProp('showSummary', false);
    expect(root).toHaveProp('type', 'horizontal');
  });

  it('renders an AddonCard when recommendations are loading', () => {
    store.dispatch(doFetchRecommendations({}));

    const root = render({}).find(AddonsCard);
    expect(root).toHaveClassName('AddonRecommendations');
    expect(root).toHaveProp('addons', null);
    expect(root).toHaveProp('header', <LoadingText width={100} />);
    expect(root).toHaveProp('loading', true);
  });

  it('renders the expected header and source for the curated outcome', () => {
    const outcome = OUTCOME_CURATED;
    store.dispatch(
      doLoadRecommendations({
        outcome,
      }),
    );

    const root = render({});
    expect(root).toHaveProp('addonInstallSource', outcome);
    expect(root).toHaveProp('header', 'Other popular extensions');
  });

  it('renders the expected header and source for the recommended_fallback outcome', () => {
    const outcome = OUTCOME_RECOMMENDED_FALLBACK;
    store.dispatch(
      doLoadRecommendations({
        outcome,
      }),
    );

    const root = render({});
    expect(root).toHaveProp('addonInstallSource', outcome);
    expect(root).toHaveProp('header', 'Other popular extensions');
  });

  it('should dispatch a fetch action if no recommendations exist', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    render({ addon, errorHandler });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchRecommendations({
        errorHandlerId: errorHandler.id,
        guid: addon.guid,
      }),
    );
  });

  it('should not dispatch a fetch action if addon is null', () => {
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ addon: null });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should dispatch a fetch action if the addon is updated', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = render({ addon, errorHandler });

    dispatchSpy.resetHistory();

    const newAddon = createInternalAddonWithLang({
      ...fakeAddon,
      guid: 'new-guid',
    });

    root.setProps({ addon: newAddon });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchRecommendations({
        errorHandlerId: errorHandler.id,
        guid: newAddon.guid,
      }),
    );
  });

  it('should not dispatch a fetch if the addon is updated but not changed', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ addon });

    dispatchSpy.resetHistory();

    root.setProps({ addon: { ...addon } });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should not dispatch a fetch if the addon is updated to null', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ addon });

    dispatchSpy.resetHistory();

    root.setProps({ addon: null });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should send a GA ping when recommendations are loaded', () => {
    const fallbackReason = 'timeout';
    const outcome = OUTCOME_RECOMMENDED_FALLBACK;
    const root = render({ tracking: fakeTracking });

    root.setProps({
      recommendations: {
        ...fakeRecommendations,
        outcome,
        fallbackReason,
      },
    });

    sinon.assert.calledOnce(fakeTracking.sendEvent);
    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: `${outcome}-${fallbackReason}`,
      category: TAAR_IMPRESSION_CATEGORY,
      label: fakeAddon.guid,
    });
  });

  it('should set GA custom dimensions', () => {
    render({ tracking: fakeTracking });

    sinon.assert.calledTwice(fakeTracking.setDimension);
    sinon.assert.calledWith(fakeTracking.setDimension, {
      dimension: TAAR_COHORT_DIMENSION,
      value: TAAR_COHORT_INCLUDED,
    });
    sinon.assert.calledWith(fakeTracking.setDimension, {
      dimension: TAAR_EXPERIMENT_PARTICIPANT_DIMENSION,
      value: TAAR_EXPERIMENT_PARTICIPANT,
    });
  });

  it('should send a GA ping without a fallback', () => {
    const fallbackReason = null;
    const outcome = OUTCOME_RECOMMENDED;
    const root = render({ tracking: fakeTracking });

    root.setProps({
      recommendations: {
        ...fakeRecommendations,
        outcome,
        fallbackReason,
      },
    });

    sinon.assert.calledOnce(fakeTracking.sendEvent);
    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: outcome,
      category: TAAR_IMPRESSION_CATEGORY,
      label: fakeAddon.guid,
    });
  });

  it('should not send a GA ping when recommendations are loading', () => {
    const root = render({ tracking: fakeTracking });

    root.setProps({
      recommendations: {
        ...fakeRecommendations,
        loading: true,
      },
    });

    sinon.assert.notCalled(fakeTracking.sendEvent);
  });

  it('should not send a GA ping when there an error', () => {
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('some unexpected error'));
    const root = render({ tracking: fakeTracking });

    root.setProps({ errorHandler });

    sinon.assert.notCalled(fakeTracking.sendEvent);
  });
});
