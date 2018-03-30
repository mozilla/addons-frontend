/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { makeQueryStringWithUTM } from 'amo/utils';
import translate from 'core/i18n/translate';
import type { ApiStateType, UserAgentInfoType } from 'core/reducers/api';
import Button from 'ui/components/Button';
import type { I18nType } from 'core/types/i18n';

type Props = {|
  className?: string,
  i18n: I18nType,
  userAgentInfo: UserAgentInfoType,
|};

export const DownloadFirefoxButtonBase = ({
  className,
  i18n,
  userAgentInfo,
}: Props = {}) => {
  if (userAgentInfo.browser.name === 'Firefox') {
    return null;
  }

  const queryString = makeQueryStringWithUTM({
    utm_content: 'header-download-button',
  });

  return (
    <Button
      buttonType="confirm"
      className={makeClassName('DownloadFirefoxButton', className)}
      href={`https://www.mozilla.org/firefox/new/${queryString}`}
      micro
    >
      {i18n.gettext('Download Firefox')}
    </Button>
  );
};

type StateType = {|
  api: ApiStateType,
|}

export function mapStateToProps(state: StateType) {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(DownloadFirefoxButtonBase);
