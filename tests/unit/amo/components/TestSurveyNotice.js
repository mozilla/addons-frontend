import config from 'config';
import * as React from 'react';

import SurveyNotice, { SurveyNoticeBase } from 'amo/components/SurveyNotice';
import { dismissSurvey } from 'amo/reducers/survey';
import Notice from 'ui/components/Notice';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { fakeCookie, fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...customProps
  } = {}) => {
    const props = {
      store,
      i18n: fakeI18n(),
      ...customProps,
    };
    return shallowUntilTarget(<SurveyNotice {...props} />, SurveyNoticeBase);
  };

  it('configures a Notice', () => {
    const root = render();

    const notice = root.find(Notice);
    expect(notice).toHaveProp('type', 'generic');
    expect(notice).toHaveProp('dismissible', true);
  });

  it('does not render a dismissed survey', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(dismissSurvey());
    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(0);
  });

  it('does not render when a dimissal cookie is present', () => {
    // Simulate the presence of a cookie with an empty string value.
    const _cookie = fakeCookie({ load: sinon.spy(() => '') });
    const root = render({ _cookie });

    expect(root.find(Notice)).toHaveLength(0);
    sinon.assert.calledWith(
      _cookie.load,
      config.get('dismissedExperienceSurveyCookieName'),
    );
  });

  it('renders when dismissal cookie is not present', () => {
    const _cookie = fakeCookie({ load: sinon.spy(() => undefined) });
    const root = render({ _cookie });

    expect(root.find(Notice)).toHaveLength(1);
    sinon.assert.called(_cookie.load);
  });

  it('saves a cookie on dismissal', () => {
    const _cookie = fakeCookie();
    const root = render({ _cookie });

    const notice = root.find(Notice);
    expect(notice).toHaveProp('onDismiss');
    const onDismiss = notice.props().onDismiss;

    // Simulate a dismissal
    onDismiss();

    sinon.assert.calledWith(
      _cookie.save,
      config.get('dismissedExperienceSurveyCookieName'),
      '',
      { path: '/' },
    );
  });
});
