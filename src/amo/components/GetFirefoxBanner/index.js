/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import {
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  GET_FIREFOX_BANNER_UTM_CONTENT,
} from 'amo/constants';
import Button from 'amo/components/Button';
import {
  GET_FIREFOX_BUTTON_CLICK_CATEGORY,
  getDownloadLink,
} from 'amo/components/GetFirefoxButton';
import Notice from 'amo/components/Notice';
import Link from 'amo/components/Link';
import tracking from 'amo/tracking';
import { isFirefox } from 'amo/utils/compatibility';
import translate from 'amo/i18n/translate';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

export const GET_FIREFOX_BANNER_CLICK_ACTION = 'download-firefox-banner-click';
export const GET_FIREFOX_BANNER_DISMISS_ACTION =
  'download-firefox-banner-dismiss';
export const GET_FIREFOX_BANNER_DISMISS_CATEGORY =
  'AMO Download Firefox Banner';

export type Props = {||};

export type DefaultProps = {|
  _tracking: typeof tracking,
|};

type PropsFromState = {|
  clientApp: string,
  userAgentInfo: UserAgentInfoType,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  ...PropsFromState,
  jed: I18nType,
  location: ReactRouterLocationType,
|};

export const GetFirefoxBannerBase = ({
  _tracking = tracking,
  clientApp,
  jed,
  location,
  userAgentInfo,
}: InternalProps): null | React.Node => {
  const onButtonClick = () => {
    _tracking.sendEvent({
      action: GET_FIREFOX_BANNER_CLICK_ACTION,
      category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
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

  let overrideQueryParams = { utm_content: GET_FIREFOX_BANNER_UTM_CONTENT };
  if (clientApp === CLIENT_APP_ANDROID) {
    overrideQueryParams = {
      ...overrideQueryParams,
      // If there is a UTM campaign set on the visited AMO URL, pass it to
      // the Play Store link. Otherwise, we use the fallback value.
      utm_campaign: location.query.utm_campaign || undefined,
    };
  }

  const replacements = [
    [
      'downloadLinkStart',
      'downloadLinkEnd',
      (text) => (
        <Button
          buttonType="none"
          className="GetFirefoxBanner-button"
          href={getDownloadLink({ clientApp, overrideQueryParams })}
          key="GetFirefoxBanner-button"
          onClick={onButtonClick}
        >
          {text}
        </Button>
      ),
    ],
  ];

  if (clientApp === CLIENT_APP_ANDROID) {
    replacements.push([
      'linkStart',
      'linkEnd',
      (text) => (
        <Link to={`/${CLIENT_APP_FIREFOX}/`} prependClientApp={false}>
          {text}
        </Link>
      ),
    ]);
  }

  const bannerContent = replaceStringsWithJSX({
    text:
      clientApp === CLIENT_APP_FIREFOX
        ? jed.gettext(`To use these add-ons, you'll need to
            %(downloadLinkStart)sdownload Firefox%(downloadLinkEnd)s.`)
        : jed.gettext(`To use Android extensions, you'll need
            %(downloadLinkStart)sFirefox for Android%(downloadLinkEnd)s. To
            explore Firefox for desktop add-ons, please %(linkStart)svisit our
            desktop site%(linkEnd)s.`),
    replacements,
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
    clientApp: state.api.clientApp,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const GetFirefoxBanner: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(GetFirefoxBannerBase);

export default GetFirefoxBanner;
