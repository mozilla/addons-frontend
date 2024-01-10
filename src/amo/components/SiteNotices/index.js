/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { sanitizeHTML, nl2br } from 'amo/utils';
import translate from 'amo/i18n/translate';
import Notice from 'amo/components/Notice';
import type { I18nType } from 'amo/types/i18n';
import type { AppState } from 'amo/store';

import './styles.scss';

type Props = {||};

type PropsFromState = {|
  siteIsReadOnly: boolean,
  siteNotice: string | null,
  currentUserWasLoggedOut: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
|};

// This is needed because of https://github.com/mozilla/addons-frontend/issues/8616
//
// We cannot use `sanitizeUserHTML()` on a `<span />`, which is required to
// avoid the UI glitch so we configure our own sanitize function to make sure
// it is safe to use `<span />`.
const sanitizeNoticeHTML = (text: string) => {
  return sanitizeHTML(nl2br(text), ['a', 'b', 'br', 'em', 'i', 'strong']);
};

export class SiteNoticesBase extends React.Component<InternalProps> {
  render(): Array<React.Node> {
    const { i18n, siteIsReadOnly, siteNotice, currentUserWasLoggedOut } =
      this.props;

    const notices = [];

    if (siteNotice) {
      notices.push(
        <Notice
          className="SiteNotices"
          id="amo-site-notice"
          type="warning"
          key="amo-site-notice"
        >
          <span
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeNoticeHTML(siteNotice)}
          />
        </Notice>,
      );
    }

    if (siteIsReadOnly) {
      notices.push(
        <Notice
          className="SiteNotices"
          id="amo-site-read-only"
          type="warning"
          key="amo-site-read-only"
        >
          {i18n.t(
            "Some features are temporarily disabled while we perform website maintenance. We'll be back to full capacity shortly.",
          )}
        </Notice>,
      );
    }

    if (currentUserWasLoggedOut) {
      notices.push(
        <Notice
          className="SiteNotices"
          id="user-was-logged-out"
          type="warning"
          key="user-was-logged-out"
        >
          {i18n.t('You have been logged out.')}
        </Notice>,
      );
    }

    return notices;
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    siteIsReadOnly: state.site.readOnly,
    siteNotice: state.site.notice,
    currentUserWasLoggedOut: state.users.currentUserWasLoggedOut,
  };
};

export default (compose(
  connect(mapStateToProps),
  translate(),
)(SiteNoticesBase): React.ComponentType<Props>);
