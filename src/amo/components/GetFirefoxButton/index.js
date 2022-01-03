/* @flow */
import { encode } from 'universal-base64url';
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Button from 'amo/components/Button';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FIREFOX_BASE_URL,
  DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
  LINE,
  RECOMMENDED,
  SPONSORED,
  VERIFIED,
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

export const GET_FIREFOX_BUTTON_CLICK_ACTION = 'download-firefox-click';
export const GET_FIREFOX_BUTTON_CLICK_CATEGORY = 'AMO Download Firefox';

export type Props = {|
  addon: AddonType,
  className?: string,
  forIncompatibleAddon?: boolean,
  overrideQueryParams?: {| [name: string]: string | null |},
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

export const getDownloadCampaign = ({
  addonId,
}: {|
  addonId?: number,
|} = {}): string => {
  let campaign = DOWNLOAD_FIREFOX_UTM_CAMPAIGN;

  if (addonId) {
    campaign = `${campaign}-${addonId}`;
  }

  return campaign;
};

export type GetDownloadLinkParams = {|
  _encode?: typeof encode,
  _getDownloadCampaign?: typeof getDownloadCampaign,
  addon?: AddonType,
  overrideQueryParams?: {| [name: string]: string | null |},
  variant?: string | null,
|};

export const getDownloadLink = ({
  _encode = encode,
  _getDownloadCampaign = getDownloadCampaign,
  addon,
  overrideQueryParams = {},
}: GetDownloadLinkParams): string => {
  return `${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM({
    utm_campaign: _getDownloadCampaign({ addonId: addon && addon.id }),
    utm_content: addon && addon.guid ? `rta:${_encode(addon.guid)}` : '',
    // This is needed for the Firefox direct download.
    // See https://bedrock.readthedocs.io/en/latest/download-buttons.html#external-referrers
    s: 'direct',
    ...overrideQueryParams,
  })}`;
};

export const GetFirefoxButtonBase = ({
  _encode = encode,
  _getPromotedCategory = getPromotedCategory,
  _tracking = tracking,
  addon,
  className,
  clientApp,
  forIncompatibleAddon,
  i18n,
  overrideQueryParams = {},
  userAgentInfo,
}: InternalProps): null | React.Node => {
  if (isFirefox({ userAgentInfo }) && !forIncompatibleAddon) {
    return null;
  }

  const onButtonClick = () => {
    _tracking.sendEvent({
      action: GET_FIREFOX_BUTTON_CLICK_ACTION,
      category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
      label: addon.guid,
    });
  };

  const promotedCategory = _getPromotedCategory({
    addon,
    clientApp,
    forBadging: true,
  });

  const supportsRTAMO =
    [LINE, RECOMMENDED, SPONSORED, VERIFIED].includes(promotedCategory) &&
    clientApp === CLIENT_APP_FIREFOX;

  let downloadTextForRTAMO =
    addon.type === ADDON_TYPE_STATIC_THEME
      ? i18n.gettext('Download Firefox and get the theme')
      : i18n.gettext('Download Firefox and get the extension');
  if (forIncompatibleAddon) {
    downloadTextForRTAMO =
      addon.type === ADDON_TYPE_STATIC_THEME
        ? i18n.gettext('Download the new Firefox and get the theme')
        : i18n.gettext('Download the new Firefox and get the extension');
  }
  const buttonText = supportsRTAMO
    ? downloadTextForRTAMO
    : i18n.gettext('Download Firefox');
  let calloutText =
    addon.type === ADDON_TYPE_STATIC_THEME
      ? i18n.gettext(`You'll need Firefox to use this theme`)
      : i18n.gettext(`You'll need Firefox to use this extension`);
  if (forIncompatibleAddon) {
    calloutText =
      addon.type === ADDON_TYPE_STATIC_THEME
        ? i18n.gettext('You need an updated version of Firefox for this theme')
        : i18n.gettext(
            'You need an updated version of Firefox for this extension',
          );
  }

  const buttonContent = (
    <Button
      buttonType="action"
      className="GetFirefoxButton-button"
      href={getDownloadLink({ _encode, addon, overrideQueryParams })}
      onClick={onButtonClick}
      puffy
    >
      {buttonText}
    </Button>
  );

  return (
    <div className={makeClassName('GetFirefoxButton', className)}>
      <div className="GetFirefoxButton-callout">
        <div className="GetFirefoxButton-callout-icon" />
        <div className="GetFirefoxButton-callout-text">{calloutText}</div>
      </div>
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
