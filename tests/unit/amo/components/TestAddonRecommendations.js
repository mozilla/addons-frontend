import * as React from 'react';

import AddonRecommendations, {
  AddonRecommendationsBase,
  TAAR_IMPRESSION_CATEGORY,
  TAAR_COHORT_COOKIE_NAME,
  TAAR_COHORT_INCLUDED,
  TAAR_COHORT_EXCLUDED,
} from 'amo/components/AddonRecommendations';
import { createInternalAddon } from 'core/reducers/addons';
import {
  fakeAddon,
} from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


const fakeCookie = (returnValue) => {
  return {
    load: sinon.stub().returns(returnValue),
    save: sinon.spy(),
  };
};

const fakeRandomizer = (returnValue) => {
  return sinon.stub().returns(returnValue);
};

describe(__filename, () => {
  let fakeTracking;

  beforeEach(() => {
    fakeTracking = {
      sendEvent: sinon.spy(),
    };
  });

  function render({
    addon = createInternalAddon(fakeAddon),
    _cookie = fakeCookie(),
    _randomizer = fakeRandomizer(0),
    ...props
  } = {}) {
    return shallowUntilTarget(
      <AddonRecommendations
        addon={addon}
        i18n={fakeI18n()}
        _cookie={_cookie}
        _randomizer={_randomizer}
        _tracking={fakeTracking}
        {...props}
      />,
      AddonRecommendationsBase
    );
  }

  it('renders nothing without an addon', () => {
    const root = render({ addon: null });
    expect(root).not.toHaveClassName('AddonRecommendations');
  });

  it('uses an existing cookie to determine the variant', () => {
    const cohort = TAAR_COHORT_INCLUDED;
    const _cookie = fakeCookie(cohort);
    const root = render({ _cookie });
    expect(root).toHaveClassName('AddonRecommendations');
    expect(root.render().find('h1').hasClass(cohort)).toEqual(true);
  });

  it('uses the randomizer to set the cohort and cookie when a cookie does not exist', () => {
    const checkWithRandomizer = (randomNumber, expectedCohort) => {
      const _cookie = fakeCookie(undefined);
      const _randomizer = fakeRandomizer(randomNumber);
      const root = render({ _cookie, _randomizer });
      expect(root).toHaveClassName('AddonRecommendations');
      expect(root.render().find('h1').hasClass(expectedCohort)).toEqual(true);
      sinon.assert.calledWith(_cookie.save,
        TAAR_COHORT_COOKIE_NAME, expectedCohort, { path: '/' });
    };

    checkWithRandomizer(0.5, TAAR_COHORT_EXCLUDED);
    checkWithRandomizer(0.51, TAAR_COHORT_INCLUDED);
  });

  it('tracks impressions', () => {
    const cohort = TAAR_COHORT_INCLUDED;
    const _cookie = fakeCookie(cohort);
    const root = render({ _cookie });
    expect(root).toHaveClassName('AddonRecommendations');
    // The component must be rendered in order to trigger the onChoice call.
    root.render();
    sinon.assert.calledOnce(fakeTracking.sendEvent);
    sinon.assert.calledWith(fakeTracking.sendEvent, {
      action: cohort,
      category: TAAR_IMPRESSION_CATEGORY,
      label: fakeAddon.name,
    });
  });
});
