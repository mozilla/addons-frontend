/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Button from 'amo/components/Button';
import {
  GET_FIREFOX_BUTTON_CLICK_CATEGORY,
  getDownloadLink,
} from 'amo/components/GetFirefoxButton';
import Notice from 'amo/components/Notice';
import { EXPERIMENT_CONFIG } from 'amo/experiments/20210531_amo_download_funnel_experiment';
import tracking from 'amo/tracking';
import { isFirefox } from 'amo/utils/compatibility';
import translate from 'amo/i18n/translate';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import { withExperiment } from 'amo/withExperiment';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type { WithExperimentInjectedProps } from 'amo/withExperiment';

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
  ...WithExperimentInjectedProps,
  i18n: I18nType,
|};

export const GetFirefoxBannerBase = ({
  _tracking = tracking,
  experimentId,
  i18n,
  userAgentInfo,
  variant,
}: InternalProps): null | React.Node => {
  const onButtonClick = () => {
    _tracking.sendEvent({
      action: GET_FIREFOX_BANNER_CLICK_ACTION,
      category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
      sendSecondEventWithOverrides: variant && {
        category: `${GET_FIREFOX_BUTTON_CLICK_CATEGORY}-${variant}`,
      },
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

  // Add query params specific to the experiment.
  if (variant) {
    overrideQueryParams = {
      ...overrideQueryParams,
      experiment: experimentId,
      variation: variant,
    };
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
              href={getDownloadLink({ overrideQueryParams, variant })}
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
  withExperiment({ experimentConfig: EXPERIMENT_CONFIG }),
)(GetFirefoxBannerBase);

export default GetFirefoxBanner;
