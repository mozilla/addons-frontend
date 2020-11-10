/* @flow */
import UAParser from 'ua-parser-js';

import { LOG_OUT_USER } from 'amo/reducers/users';
import {
  SET_AUTH_TOKEN,
  SET_LANG,
  SET_CLIENT_APP,
  SET_REGION_CODE,
  SET_REQUEST_ID,
  SET_USER_AGENT,
} from 'core/constants';
import type { LogOutUserAction } from 'amo/reducers/users';
import type {
  SetAuthTokenAction,
  SetClientAppAction,
  SetLangAction,
  SetRequestIdAction,
  SetUserAgentAction,
} from 'core/actions/index';
import type { Exact } from 'core/types/util';

export const USER_AGENT_BROWSER_FIREFOX = 'Firefox';
export const USER_AGENT_OS_ANDROID: 'Android' = 'Android';
export const USER_AGENT_OS_BSD_DRAGONFLY: 'DragonFly' = 'DragonFly';
export const USER_AGENT_OS_BSD_FREEBSD: 'FreeBSD' = 'FreeBSD';
export const USER_AGENT_OS_BSD_NETBSD: 'NetBSD' = 'NetBSD';
export const USER_AGENT_OS_BSD_OPENBSD: 'OpenBSD' = 'OpenBSD';
export const USER_AGENT_OS_BSD_PC: 'PC-BSD' = 'PC-BSD';
export const USER_AGENT_OS_IOS: 'iOS' = 'iOS';
export const USER_AGENT_OS_LINUX: 'Linux' = 'Linux';
export const USER_AGENT_OS_LINUX_ARCH: 'Arch' = 'Arch';
export const USER_AGENT_OS_LINUX_CENTOS: 'CentOS' = 'CentOS';
export const USER_AGENT_OS_LINUX_DEBIAN: 'Debian' = 'Debian';
export const USER_AGENT_OS_LINUX_FEDORA: 'Fedora' = 'Fedora';
export const USER_AGENT_OS_LINUX_GENTOO: 'Gentoo' = 'Gentoo';
export const USER_AGENT_OS_LINUX_GNU: 'GNU' = 'GNU';
export const USER_AGENT_OS_LINUX_LINPUS: 'Linpus' = 'Linpus';
export const USER_AGENT_OS_LINUX_PC: 'PCLinuxOS' = 'PCLinuxOS';
export const USER_AGENT_OS_LINUX_REDHAT: 'RedHat' = 'RedHat';
export const USER_AGENT_OS_LINUX_SLACKWARE: 'Slackware' = 'Slackware';
export const USER_AGENT_OS_LINUX_SUSE: 'SUSE' = 'SUSE';
export const USER_AGENT_OS_LINUX_UBUNTU: 'Ubuntu' = 'Ubuntu';
export const USER_AGENT_OS_LINUX_VECTOR: 'VectorLinux' = 'VectorLinux';
export const USER_AGENT_OS_LINUX_ZENWALK: 'Zenwalk' = 'Zenwalk';
export const USER_AGENT_OS_MAC: 'Mac OS' = 'Mac OS';
export const USER_AGENT_OS_UNIX: 'UNIX' = 'UNIX';
export const USER_AGENT_OS_WINDOWS: 'Windows' = 'Windows';

// For details, see https://github.com/faisalman/ua-parser-js
export type UserAgentInfoType = {|
  browser: {
    major?: string,
    name?: string,
    version?: string,
  },
  os: {
    // This is not a complete enumeration. They're just the ones
    // we tend to deal with.
    name?:
      | typeof USER_AGENT_OS_ANDROID
      | typeof USER_AGENT_OS_IOS
      | typeof USER_AGENT_OS_LINUX
      | typeof USER_AGENT_OS_MAC
      | typeof USER_AGENT_OS_WINDOWS,
    version?: string,
  },
|};

export type ApiState = {
  clientApp: ?string,
  // See config.get('langs') for all possible values.
  lang: ?string,
  regionCode: ?string,
  requestId: string | null,
  token: ?string,
  userAgent: ?string,
  userAgentInfo: UserAgentInfoType,
};

export const initialApiState: ApiState = {
  clientApp: null,
  lang: null,
  regionCode: null,
  requestId: null,
  token: null,
  userAgent: null,
  userAgentInfo: { browser: {}, os: {} },
};

type Action =
  | SetAuthTokenAction
  | SetLangAction
  | SetClientAppAction
  | SetRequestIdAction
  | SetUserAgentAction
  | LogOutUserAction;

export default function api(
  state: Exact<ApiState> = initialApiState,
  action: Action,
): Exact<ApiState> {
  switch (action.type) {
    case SET_AUTH_TOKEN:
      return {
        ...state,
        token: action.payload.token,
      };
    case SET_LANG:
      return { ...state, lang: action.payload.lang };
    case SET_CLIENT_APP:
      return { ...state, clientApp: action.payload.clientApp };
    case SET_REGION_CODE:
      return { ...state, regionCode: action.payload.regionCode };
    case SET_REQUEST_ID:
      return { ...state, requestId: action.payload.requestId };
    case SET_USER_AGENT: {
      const { browser, os } = UAParser(action.payload.userAgent);

      return {
        ...state,
        userAgent: action.payload.userAgent,
        userAgentInfo: { browser, os },
      };
    }
    case LOG_OUT_USER:
      return { ...state, token: null };
    default:
      return state;
  }
}
