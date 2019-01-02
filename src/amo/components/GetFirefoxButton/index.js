/* @flow */
import base64url from 'base64url';
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { DOWNLOAD_FIREFOX_BASE_URL } from 'amo/constants';
import { makeQueryStringWithUTM } from 'amo/utils';
import translate from 'core/i18n/translate';
import { isFirefox } from 'core/utils/compatibility';
import Button from 'ui/components/Button';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export const GET_FIREFOX_BUTTON_TYPE_ADDON: 'GET_FIREFOX_BUTTON_TYPE_ADDON' =
  'GET_FIREFOX_BUTTON_TYPE_ADDON';
export const GET_FIREFOX_BUTTON_TYPE_HEADER: 'GET_FIREFOX_BUTTON_TYPE_HEADER' =
  'GET_FIREFOX_BUTTON_TYPE_HEADER';
export const GET_FIREFOX_BUTTON_TYPE_NONE: 'GET_FIREFOX_BUTTON_TYPE_NONE' =
  'GET_FIREFOX_BUTTON_TYPE_NONE';

export type GetFirefoxButtonTypeType =
  | typeof GET_FIREFOX_BUTTON_TYPE_ADDON
  | typeof GET_FIREFOX_BUTTON_TYPE_HEADER
  | typeof GET_FIREFOX_BUTTON_TYPE_NONE;

export type Props = {|
  addon?: AddonType,
  buttonType: GetFirefoxButtonTypeType,
  className?: string,
|};

type InternalProps = {|
  ...Props,
  _base64url?: typeof base64url,
  i18n: I18nType,
  userAgentInfo: UserAgentInfoType,
|};

export const GetFirefoxButtonBase = (props: InternalProps) => {
  const { addon, buttonType, className, i18n, userAgentInfo } = props;
  const _base64url = props._base64url || base64url;

  if (
    buttonType === GET_FIREFOX_BUTTON_TYPE_NONE ||
    isFirefox({ userAgentInfo })
  ) {
    return null;
  }

  let buttonText;
  let micro = false;
  let puffy = false;
  let utmContent;

  switch (buttonType) {
    case GET_FIREFOX_BUTTON_TYPE_ADDON: {
      invariant(
        addon,
        `addon is required for buttonType ${GET_FIREFOX_BUTTON_TYPE_ADDON}`,
      );
      buttonText = i18n.gettext('Only with Firefox—Get Firefox Now');
      puffy = true;
      utmContent = addon.guid ? `rta:${_base64url.encode(addon.guid)}` : '';
      break;
    }
    case GET_FIREFOX_BUTTON_TYPE_HEADER: {
      buttonText = i18n.gettext('Download Firefox');
      micro = true;
      utmContent = 'header-download-button';
      break;
    }
    default:
      throw new Error(
        `Cannot pass ${buttonType} as the buttonType prop to GetFirefoxButton`,
      );
  }

  return (
    <Button
      buttonType="confirm"
      className={makeClassName('GetFirefoxButton', className)}
      href={`${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM({
        utm_content: utmContent,
      })}`}
      micro={micro}
      puffy={puffy}
    >
      {buttonText}
    </Button>
  );
};

export function mapStateToProps(state: AppState) {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
}

const GetFirefoxButton: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(GetFirefoxButtonBase);

export default GetFirefoxButton;
