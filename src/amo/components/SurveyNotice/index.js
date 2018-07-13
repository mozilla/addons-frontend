/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Notice from 'ui/components/Notice';
import type { I18nType } from 'core/types/i18n';

// TODO: implement the logic and layout/placement for this component.
// See https://github.com/mozilla/addons-frontend/issues/5438
//
// This is just a placeholder to get an early start on the localizations needed.

type Props = {};

type InternalProps = {
  ...Props,
  i18n: I18nType,
};

const SurveyNoticeBase = (props: InternalProps) => {
  const { i18n } = props;
  return (
    <Notice
      actionHref="https://qsurvey.mozilla.com/s3/addons-mozilla-org-survey"
      actionText={i18n.gettext('Take short survey')}
      dismissible
      type="generic"
    >
      {i18n.gettext(
        'Thanks for visiting this site! Please take a minute or two to tell Firefox about your experience.',
      )}
    </Notice>
  );
};

const SurveyNotice: React.ComponentType<Props> = compose(translate())(
  SurveyNoticeBase,
);

export default SurveyNotice;
