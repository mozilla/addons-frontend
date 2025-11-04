/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import SuggestedPages from 'amo/components/SuggestedPages';
import translate from 'amo/i18n/translate';
import { sanitizeHTML } from 'amo/utils';
import type { I18nType } from 'amo/types/i18n';

type Props = {||};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class NotAuthorizedBase extends React.Component<InternalProps> {
  render(): React.Node {
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
      <ErrorComponent code={401} header={i18n.gettext('Not Authorized')}>
        <p>
          {i18n.gettext(`
            Sorry, but you aren't authorized to access this page. If you
            aren't signed in, try signing in using the link at the top
            of the page.`)}
        </p>

        <SuggestedPages />

        <p dangerouslySetInnerHTML={sanitizeHTML(fileAnIssueText, ['a'])} />
      </ErrorComponent>
    );
    /* eslint-enable react/no-danger */
  }
}

const NotAuthorized: React.ComponentType<Props> =
  compose(translate())(NotAuthorizedBase);

export default NotAuthorized;
