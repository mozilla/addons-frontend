import querystring from 'querystring';

import config from 'config';
import * as React from 'react';

import SurveyNotice, { SurveyNoticeBase } from 'core/components/SurveyNotice';
import { dismissSurvey } from 'core/reducers/survey';
import Notice from 'ui/components/Notice';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
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

  it('saves a cookie on dismissal', () => {
    const _cookie = fakeCookie();
    const root = render({ _cookie });

    const notice = root.find(Notice);
    expect(notice).toHaveProp('onDismiss');
    const { onDismiss } = notice.props();

    // Simulate a dismissal
    onDismiss();

    sinon.assert.calledWith(
      _cookie.save,
      config.get('dismissedExperienceSurveyCookieName'),
      '',
      { maxAge: sinon.match.any, path: '/' },
    );
  });

  it('also saves a cookie on action click', () => {
    const _cookie = fakeCookie();
    const root = render({ _cookie });

    const notice = root.find(Notice);
    expect(notice).toHaveProp('actionOnClick');
    const { actionOnClick } = notice.props();

    // Simulate a click
    actionOnClick();

    sinon.assert.called(_cookie.save);
  });

  it('dispatches action on dismissal', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ store });

    const notice = root.find(Notice);
    expect(notice).toHaveProp('onDismiss');
    const { onDismiss } = notice.props();

    // Simulate a dismissal
    onDismiss();

    sinon.assert.calledWith(dispatchSpy, dismissSurvey());
  });

  it('also dispatches an action on click', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ store });

    const notice = root.find(Notice);
    expect(notice).toHaveProp('actionOnClick');
    const { actionOnClick } = notice.props();

    // Simulate a click
    actionOnClick();

    sinon.assert.calledWith(dispatchSpy, dismissSurvey());
  });

  it('links to a survey with location source', () => {
    const location = fakeRouterLocation({ pathname: '/en-US/firefox/themes/' });
    const root = render({ location });

    const notice = root.find(Notice);
    expect(notice).toHaveProp('actionHref');
    expect(notice.props().actionHref).toContain(
      querystring.stringify({
        // The source should not include the /en-US/ part.
        source: 'firefox/themes/',
      }),
    );
  });
});
