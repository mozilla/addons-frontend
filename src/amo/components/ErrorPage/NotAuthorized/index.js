/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import Page from 'amo/components/Page';
import SuggestedPages from 'amo/components/SuggestedPages';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import type { I18nType } from 'core/types/i18n';

import '../styles.scss';

type Props = {|
  i18n: I18nType,
|};

export class NotAuthorizedBase extends React.Component<Props> {
  render() {
    const { i18n } = this.props;

    const fileAnIssueText = i18n.sprintf(
      i18n.gettext(`
      If you are signed in and think this message is an error, please
      <a href="%(url)s">file an issue</a>. Tell us where you came from
      and what you were trying to access, and we'll fix the issue.`),
      { url: 'https://github.com/mozilla/addons-frontend/issues/new/' },
    );

    // TODO: Check for signed in state and offer different messages.
    // TODO: Offer a sign in link/button inside the error page.
    /* eslint-disable react/no-danger */
    return (
      <NestedStatus code={401}>
        <Page
          className="ErrorPage NotAuthorized"
          componentProps={{ header: i18n.gettext('Not Authorized') }}
          ComponentType="Card"
        >
          <p>
            {i18n.gettext(`
              Sorry, but you aren't authorized to access this page. If you
              aren't signed in, try signing in using the link at the top
              of the page.`)}
          </p>

          <SuggestedPages />

          <p dangerouslySetInnerHTML={sanitizeHTML(fileAnIssueText, ['a'])} />
        </Page>
      </NestedStatus>
    );
    /* eslint-enable react/no-danger */
  }
}

const NotAuthorized: React.ComponentType<Props> = compose(translate())(
  NotAuthorizedBase,
);

export default NotAuthorized;
