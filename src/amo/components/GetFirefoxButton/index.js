/* @flow */
import { encode } from 'universal-base64url';
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Button from 'amo/components/Button';
import {
  VARIANT_CURRENT,
  VARIANT_NEW,
} from 'amo/experiments/20210404_download_cta_experiment';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FIREFOX_BASE_URL,
  RECOMMENDED,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import tracking from 'amo/tracking';
import { makeQueryStringWithUTM } from 'amo/utils';
import { getPromotedCategory } from 'amo/utils/addons';
import { isFirefox } from 'amo/utils/compatibility';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const GET_FIREFOX_BUTTON_TYPE_ADDON: 'GET_FIREFOX_BUTTON_TYPE_ADDON' =
  'GET_FIREFOX_BUTTON_TYPE_ADDON';
export const GET_FIREFOX_BUTTON_TYPE_HEADER: 'GET_FIREFOX_BUTTON_TYPE_HEADER' =
  'GET_FIREFOX_BUTTON_TYPE_HEADER';
export const GET_FIREFOX_BUTTON_TYPE_NONE: 'GET_FIREFOX_BUTTON_TYPE_NONE' =
  'GET_FIREFOX_BUTTON_TYPE_NONE';
export const GET_FIREFOX_BUTTON_CLICK_ACTION = 'download-firefox-click';
export const GET_FIREFOX_BUTTON_CLICK_CATEGORY = 'AMO Download Firefox';

export type GetFirefoxButtonTypeType =
  | typeof GET_FIREFOX_BUTTON_TYPE_ADDON
  | typeof GET_FIREFOX_BUTTON_TYPE_HEADER
  | typeof GET_FIREFOX_BUTTON_TYPE_NONE;

export type Props = {|
  addon?: AddonType,
  buttonType: GetFirefoxButtonTypeType,
  className?: string,
  useNewVersion?: boolean,
|};

export type DefaultProps = {|
  _encode: typeof encode,
  _getPromotedCategory: typeof getPromotedCategory,
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
  i18n: I18nType,
|};

export const GetFirefoxButtonBase = ({
  _encode = encode,
  _getPromotedCategory = getPromotedCategory,
  _tracking = tracking,
  addon,
  buttonType,
  className,
  clientApp,
  i18n,
  useNewVersion = false,
  userAgentInfo,
}: InternalProps): null | React.Node => {
  if (
    buttonType === GET_FIREFOX_BUTTON_TYPE_NONE ||
    isFirefox({ userAgentInfo }) ||
    // Also hide the button if it's in the header but we're showing the new
    // version.
    (buttonType === GET_FIREFOX_BUTTON_TYPE_HEADER && useNewVersion)
  ) {
    return null;
  }

  const variant = useNewVersion ? VARIANT_NEW : VARIANT_CURRENT;

  const onButtonClick = () => {
    _tracking.sendEvent({
      action: GET_FIREFOX_BUTTON_CLICK_ACTION,
      category: `${GET_FIREFOX_BUTTON_CLICK_CATEGORY}-${variant}`,
      label: addon ? addon.guid : '',
    });
  };

  let buttonText;
  let calloutText;
  let micro = false;
  let puffy = false;
  let utmCampaign;
  let utmContent;

  switch (buttonType) {
    case GET_FIREFOX_BUTTON_TYPE_ADDON: {
      invariant(
        addon,
        `addon is required for buttonType ${GET_FIREFOX_BUTTON_TYPE_ADDON}`,
      );

      const promotedCategory = _getPromotedCategory({
        addon,
        clientApp,
        forBadging: true,
      });

      const supportsRTAMO =
        promotedCategory === RECOMMENDED && clientApp === CLIENT_APP_FIREFOX;

      if (!useNewVersion) {
        buttonText = i18n.gettext('Only with Firefox—Get Firefox Now');
      } else {
        const downloadTextForRTAMO =
          addon.type === ADDON_TYPE_STATIC_THEME
            ? i18n.gettext('Download Firefox and get the theme')
            : i18n.gettext('Download Firefox and get the extension');
        buttonText = supportsRTAMO
          ? downloadTextForRTAMO
          : i18n.gettext('Download Firefox');
        calloutText =
          addon.type === ADDON_TYPE_STATIC_THEME
            ? i18n.gettext(`You'll need Firefox to use this theme`)
            : i18n.gettext(`You'll need Firefox to use this extension`);
      }
      puffy = true;
      utmCampaign = `amo-fx-cta-${addon.id}-${variant}`;

      utmContent = addon.guid ? `rta:${_encode(addon.guid)}` : '';
      break;
    }
    case GET_FIREFOX_BUTTON_TYPE_HEADER: {
      buttonText = i18n.gettext('Download Firefox');
      micro = true;
      utmCampaign = `amo-fx-cta-${variant}`;
      utmContent = 'header-download-button';
      break;
    }
    default:
      throw new Error(
        `Cannot pass ${buttonType} as the buttonType prop to GetFirefoxButton`,
      );
  }

  const buttonContent = (
    <Button
      buttonType="action"
      className={makeClassName(
        'GetFirefoxButton-button',
        {
          'GetFirefoxButton': !useNewVersion,
          'GetFirefoxButton--current': !useNewVersion,
        },
        className,
      )}
      href={`${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM({
        utm_campaign: utmCampaign,
        utm_content: utmContent,
      })}`}
      micro={micro}
      onClick={onButtonClick}
      puffy={puffy}
    >
      {buttonText}
    </Button>
  );

  return !useNewVersion || buttonType === GET_FIREFOX_BUTTON_TYPE_HEADER ? (
    buttonContent
  ) : (
    <div className="GetFirefoxButton GetFirefoxButton--new">
      <div className="GetFirefoxButton-callout">{calloutText}</div>
      {buttonContent}
    </div>
  );
};

function mapStateToProps(state: AppState): PropsFromState {
  return {
    clientApp: state.api.clientApp,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const GetFirefoxButton: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(GetFirefoxButtonBase);

export default GetFirefoxButton;
