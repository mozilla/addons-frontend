/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Notice from 'ui/components/Notice';
import type { I18nType } from 'core/types/i18n';

type Props = {||};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const SurveyNoticeBase = (props: InternalProps) => {
  const { i18n } = props;
  return (
    <Notice
      actionHref="https://qsurvey.mozilla.com/s3/addons-mozilla-org-survey"
      actionText={i18n.gettext('Take short survey')}
      className="SurveyNotice"
      dismissible
      id="amo-experience-survey"
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
