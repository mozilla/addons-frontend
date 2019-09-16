/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Notice from 'ui/components/Notice';
import type { I18nType } from 'core/types/i18n';
import type { AppState } from 'amo/store';

import './styles.scss';

type Props = {|
  i18n: I18nType,
  siteIsReadOnly: boolean,
  siteNotice: string | null,
|};

export class SiteNoticeBase extends React.Component<Props> {
  render() {
    const { i18n, siteIsReadOnly, siteNotice } = this.props;

    const notices = [];

    if (siteNotice) {
      notices.push(
        <Notice className="SiteNotice" id="amo-site-notice" type="warning">
          {sanitizeHTML(siteNotice).__html}
        </Notice>,
      );
    }

    if (siteIsReadOnly) {
      notices.push(
        <Notice className="SiteNotice" id="amo-site-read-only" type="warning">
          {i18n.gettext(`Some features are temporarily disabled while we
            perform website maintenance. We'll be back to full capacity
            shortly.`)}
        </Notice>,
      );
    }

    return notices;
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    siteIsReadOnly: state.site.readOnly,
    siteNotice: state.site.notice,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(SiteNoticeBase);
