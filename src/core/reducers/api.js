/* @flow */
import UAParser from 'ua-parser-js';

import {
  LOG_OUT_USER,
  SET_AUTH_TOKEN,
  SET_LANG,
  SET_CLIENT_APP,
  SET_USER_AGENT,
} from 'core/constants';
import type {
  SetAuthTokenAction,
  LogOutUserAction,
  SetClientAppAction,
  SetLangAction,
  SetUserAgentAction,
} from 'core/actions/index';
import type { Exact } from 'core/types/util';

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
  },
|};

export type ApiStateType = {
  clientApp: ?string,
  lang: ?string,
  token: ?string,
  userAgent: ?string,
  userAgentInfo: UserAgentInfoType,
};

export const initialApiState: ApiStateType = {
  clientApp: null,
  lang: null,
  token: null,
  userAgent: null,
  userAgentInfo: { browser: {}, os: {} },
};

export default function api(
  state: Exact<ApiStateType> = initialApiState,
  action: SetAuthTokenAction
    & SetLangAction
    & SetClientAppAction
    & SetUserAgentAction
    & LogOutUserAction
): Exact<ApiStateType> {
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
    case SET_USER_AGENT:
    {
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
