/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Button from 'amo/components/Button';
import Notice from 'amo/components/Notice';
import { DOWNLOAD_FIREFOX_BASE_URL } from 'amo/constants';
import tracking from 'amo/tracking';
import { makeQueryStringWithUTM } from 'amo/utils';
import { isFirefox } from 'amo/utils/compatibility';
import translate from 'amo/i18n/translate';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const GET_FIREFOX_BANNER_CLICK_ACTION = 'download-firefox-banner-click';
export const GET_FIREFOX_BANNER_CLICK_CATEGORY = 'AMO Download Firefox';
export const GET_FIREFOX_BANNER_UTM_CONTENT = 'banner-download-button';

export type Props = {||};

export type DeafultProps = {|
  _tracking: typeof tracking,
|};

type PropsFromState = {|
  userAgentInfo: UserAgentInfoType,
|};

type InternalProps = {|
  ...Props,
  ...DeafultProps,
  ...PropsFromState,
  i18n: I18nType,
|};

export const GetFirefoxBannerBase = ({
  _tracking = tracking,
  i18n,
  userAgentInfo,
}: InternalProps): null | React.Node => {
  const onButtonClick = () => {
    _tracking.sendEvent({
      action: GET_FIREFOX_BANNER_CLICK_ACTION,
      category: GET_FIREFOX_BANNER_CLICK_CATEGORY,
    });
  };

  if (isFirefox({ userAgentInfo })) {
    return null;
  }

  const bannerContent = replaceStringsWithJSX({
    text: i18n.gettext(
      `To use these add-ons, you'll need to %(linkStart)sdownload Firefox%(linkEnd)s`,
    ),
    replacements: [
      [
        'linkStart',
        'linkEnd',
        (text) => (
          <>
            <br />
            <Button
              buttonType="none"
              className="GetFirefoxBanner-button"
              href={`${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM({
                utm_content: GET_FIREFOX_BANNER_UTM_CONTENT,
              })}`}
              onClick={onButtonClick}
            >
              {text}
            </Button>
          </>
        ),
      ],
    ],
  });

  return (
    <Notice
      className="GetFirefoxBanner"
      dismissible
      id="GetFirefoxBanner-notice"
      type="warning"
    >
      <div className="GetFirefoxBanner-content">{bannerContent}</div>
    </Notice>
  );
};

function mapStateToProps(state: AppState): PropsFromState {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
}

const GetFirefoxBanner: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(GetFirefoxBannerBase);

export default GetFirefoxBanner;
