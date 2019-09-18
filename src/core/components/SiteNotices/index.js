/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { sanitizeHTML, nl2br } from 'core/utils';
import translate from 'core/i18n/translate';
import Notice from 'ui/components/Notice';
import type { I18nType } from 'core/types/i18n';
import type { AppState } from 'amo/store';

import './styles.scss';

type Props = {||};

type MappedProps = {|
  siteIsReadOnly: boolean,
  siteNotice: string | null,
|};

type InternalProps = {|
  ...Props,
  ...MappedProps,
  i18n: I18nType,
|};

// This is needed because of https://github.com/mozilla/addons-frontend/issues/8616
//
// We cannot use `sanitizeUserHTML()` on a `<span />`, which is required to
// avoid the UI glitch so we configure our own sanitize function to make sure
// it is safe to use `<span />`.
const sanitizeNoticeHTML = (text: string): string => {
  return sanitizeHTML(nl2br(text), ['a', 'b', 'br', 'em', 'i', 'strong']);
};

export class SiteNoticesBase extends React.Component<InternalProps> {
  render() {
    const { i18n, siteIsReadOnly, siteNotice } = this.props;

    const notices = [];

    if (siteNotice) {
      notices.push(
        <Notice className="SiteNotices" id="amo-site-notice" type="warning">
          <span
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeNoticeHTML(siteNotice)}
          />
        </Notice>,
      );
    }

    if (siteIsReadOnly) {
      notices.push(
        <Notice className="SiteNotices" id="amo-site-read-only" type="warning">
          {i18n.gettext(`Some features are temporarily disabled while we
            perform website maintenance. We'll be back to full capacity
            shortly.`)}
        </Notice>,
      );
    }

    return notices;
  }
}

const mapStateToProps = (state: AppState): MappedProps => {
  return {
    siteIsReadOnly: state.site.readOnly,
    siteNotice: state.site.notice,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(SiteNoticesBase);
