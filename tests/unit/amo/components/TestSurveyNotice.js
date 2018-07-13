import * as React from 'react';

import SurveyNotice, { SurveyNoticeBase } from 'amo/components/SurveyNotice';
import Notice from 'ui/components/Notice';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (customProps = {}) => {
    const props = {
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
});
