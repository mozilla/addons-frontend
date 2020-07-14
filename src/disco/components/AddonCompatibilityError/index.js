/* @flow */
import * as React from 'react';

import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_UNDER_MIN_VERSION,
} from 'core/constants';
import translate from 'core/i18n/translate';
import type { I18nType } from 'core/types/i18n';

import './style.scss';

type Props = {|
  reason: string | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

// Messages in the disco pane are a bit less specific as we don't care about
// non-Firefox clients and the copy space is limited.
export class AddonCompatibilityErrorBase extends React.Component<InternalProps> {
  render() {
    const { i18n, reason } = this.props;

    let message;
    if (reason === INCOMPATIBLE_FIREFOX_FOR_IOS) {
      message = i18n.gettext(
        'Firefox for iOS does not currently support add-ons.',
      );
    } else if (reason === INCOMPATIBLE_UNDER_MIN_VERSION) {
      message = i18n.gettext(
        'This add-on does not support your version of Firefox.',
      );
    } else {
      // Unknown reasons are fine on the Disco Pane because we don't
      // care about non-FF clients.
      message = i18n.gettext('This add-on does not support your browser.');
    }

    return <div className="AddonCompatibilityError">{message}</div>;
  }
}

const AddonCompatibilityError: React.ComponentType<Props> = translate()(
  AddonCompatibilityErrorBase,
);

export default AddonCompatibilityError;
