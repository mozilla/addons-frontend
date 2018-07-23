import querystring from 'querystring';

import config from 'config';
import * as React from 'react';

import SurveyNotice, { SurveyNoticeBase } from 'core/components/SurveyNotice';
import {
  SURVEY_ACTION_DISMISSED,
  SURVEY_ACTION_SHOWN,
  SURVEY_ACTION_VISITED,
  SURVEY_CATEGORY,
} from 'core/constants';
import { dismissSurvey } from 'core/reducers/survey';
import Notice from 'ui/components/Notice';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeTracking,
  fakeCookie,
  fakeI18n,
  fakeRouterLocation,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...customProps
  } = {}) => {
    const props = {
      _tracking: createFakeTracking(),
      _config: getFakeConfig({
        enableExperienceSurvey: true,
      }),
      i18n: fakeI18n(),
      location: fakeRouterLocation(),
      store,
      ...customProps,
    };
    return shallowUntilTarget(<SurveyNotice {...props} />, SurveyNoticeBase);
  };

  const getNoticeProp = (root, prop) => {
    const notice = root.find(Notice);
    expect(notice).toHaveProp(prop);
    return notice.props()[prop];
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
        enableExperienceSurvey: false,
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
    const location = fakeRouterLocation({ pathname: '/en-US/firefox/themes/' });
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
        enableExperienceSurvey: false,
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
      const _cookie = fakeCookie();
      const root = render({ _cookie });

      root.instance().dismissNotice();

      sinon.assert.calledWith(
        _cookie.save,
        config.get('dismissedExperienceSurveyCookieName'),
        '',
        { maxAge: sinon.match.any, path: '/' },
      );
    });
  });
});
