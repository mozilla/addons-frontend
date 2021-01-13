import querystring from 'querystring';

import config from 'config';
import * as React from 'react';

import SurveyNotice, { SurveyNoticeBase } from 'amo/components/SurveyNotice';
import {
  SURVEY_ACTION_DISMISSED,
  SURVEY_ACTION_SHOWN,
  SURVEY_ACTION_VISITED,
  SURVEY_CATEGORY,
} from 'amo/constants';
import { dismissSurvey } from 'amo/reducers/survey';
import Notice from 'amo/components/Notice';
import {
  createFakeTracking,
  dispatchClientMetadata,
  fakeCookies,
  fakeI18n,
  createFakeLocation,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

// Skip `withCookies` HOC since Enzyme does not support the React Context API.
// See: https://github.com/mozilla/addons-frontend/issues/6839
jest.mock('react-cookie', () => ({
  withCookies: (component) => component,
}));

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...customProps
  } = {}) => {
    const props = {
      _tracking: createFakeTracking(),
      _config: getFakeConfig({
        enableFeatureExperienceSurvey: true,
      }),
      cookies: fakeCookies(),
      i18n: fakeI18n(),
      location: createFakeLocation(),
      store,
      ...customProps,
    };

    return shallowUntilTarget(<SurveyNotice {...props} />, SurveyNoticeBase);
  };

  const getNoticeProp = (root, prop) => {
    const notice = root.find(Notice);
    expect(notice).toHaveProp(prop);
    return notice.prop(prop);
  };

  it('does not render a dismissed survey', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(dismissSurvey());
    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(0);
  });

  it('does not render a survey for unsupported langs', () => {
    // Browse the site in Hebrew.
    const { store } = dispatchClientMetadata({ lang: 'he' });
    // Only define German and English as survey languages.
    const root = render({ store, _supportedLangs: ['de', 'en-US'] });

    expect(root.find(Notice)).toHaveLength(0);
  });

  it('does not render a survey when it is disabled in the config', () => {
    const root = render({
      _config: getFakeConfig({
        enableFeatureExperienceSurvey: false,
      }),
    });

    expect(root.find(Notice)).toHaveLength(0);
  });

  it('configures Notice to call dismissNotice()', () => {
    const root = render();
    const dismissNotice = sinon.stub(root.instance(), 'dismissNotice');

    const onDismiss = getNoticeProp(root, 'onDismiss');

    // Simulate a dismissal
    onDismiss();

    sinon.assert.called(dismissNotice);
  });

  it('calls dismissNotice() when clicking through to the survey', () => {
    const root = render();
    const dismissNotice = sinon.stub(root.instance(), 'dismissNotice');

    const actionOnClick = getNoticeProp(root, 'actionOnClick');

    // Simulate clicking on the Take survey link.
    actionOnClick();
    sinon.assert.called(dismissNotice);
  });

  it('links to a survey with location source', () => {
    const location = createFakeLocation({ pathname: '/en-US/firefox/themes/' });
    const root = render({ location });

    const actionHref = getNoticeProp(root, 'actionHref');
    expect(actionHref).toContain(
      querystring.stringify({
        // The source should not include the /en-US/ part.
        source: 'firefox/themes/',
      }),
    );
  });

  it('tracks when the survey notice is shown', () => {
    const _tracking = createFakeTracking();
    render({ _tracking });

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: SURVEY_ACTION_SHOWN,
      category: SURVEY_CATEGORY,
    });
  });

  it('does not track shown event when the survey notice is disabled', () => {
    const _tracking = createFakeTracking();
    render({
      _config: getFakeConfig({
        enableFeatureExperienceSurvey: false,
      }),
      _tracking,
    });

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('tracks clicking on a survey notice', () => {
    const _tracking = createFakeTracking();
    const root = render({ _tracking });

    const actionOnClick = getNoticeProp(root, 'actionOnClick');

    // Simulate clicking on a notice.
    actionOnClick();

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: SURVEY_ACTION_VISITED,
      category: SURVEY_CATEGORY,
    });
  });

  it('tracks user dismissal', () => {
    const _tracking = createFakeTracking();
    const root = render({ _tracking });

    const onDismiss = getNoticeProp(root, 'onDismiss');

    // Simulate a dismissal
    onDismiss();

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: SURVEY_ACTION_DISMISSED,
      category: SURVEY_CATEGORY,
    });
  });

  describe('dismissNotice', () => {
    it('dispatches dismissal action', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = render({ store });

      root.instance().dismissNotice();

      sinon.assert.calledWith(dispatchSpy, dismissSurvey());
    });

    it('saves a cookie', () => {
      const cookies = fakeCookies();

      const root = render({ cookies });
      root.instance().dismissNotice();

      sinon.assert.calledWith(
        cookies.set,
        config.get('dismissedExperienceSurveyCookieName'),
        '',
        { maxAge: sinon.match.any, path: '/' },
      );
    });
  });
});
