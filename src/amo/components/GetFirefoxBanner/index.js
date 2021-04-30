/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Button from 'amo/components/Button';
import {
  getDownloadTerm,
  getDownloadCategory,
} from 'amo/components/GetFirefoxButton';
import Notice from 'amo/components/Notice';
import {
  DOWNLOAD_FIREFOX_BASE_URL,
  DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
} from 'amo/constants';
import {
  EXPERIMENT_CONFIG,
  VARIANT_NEW,
} from 'amo/experiments/20210404_download_cta_experiment';
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
export const GET_FIREFOX_BANNER_DISMISS_ACTION =
  'download-firefox-banner-dismiss';
export const GET_FIREFOX_BANNER_DISMISS_CATEGORY =
  'AMO Download Firefox Banner';
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
      category: getDownloadCategory(VARIANT_NEW),
    });
  };

  const onDismiss = () => {
    _tracking.sendEvent({
      action: GET_FIREFOX_BANNER_DISMISS_ACTION,
      category: GET_FIREFOX_BANNER_DISMISS_CATEGORY,
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
                experimentId: EXPERIMENT_CONFIG.id,
                utm_campaign: DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
                utm_content: GET_FIREFOX_BANNER_UTM_CONTENT,
                utm_term: getDownloadTerm({ variant: VARIANT_NEW }),
                variant: VARIANT_NEW,
              })}`}
              key="GetFirefoxBanner-button"
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
      onDismiss={onDismiss}
      type="warning"
    >
      <span className="GetFirefoxBanner-content">{bannerContent}</span>
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
