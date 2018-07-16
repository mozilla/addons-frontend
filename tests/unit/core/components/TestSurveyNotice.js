import config from 'config';
import * as React from 'react';

import SurveyNotice, { SurveyNoticeBase } from 'core/components/SurveyNotice';
import { dismissSurvey } from 'core/reducers/survey';
import Notice from 'ui/components/Notice';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  fakeCookie,
  fakeI18n,
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
      store,
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
