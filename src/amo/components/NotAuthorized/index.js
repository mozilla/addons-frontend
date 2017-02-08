import React, { PropTypes } from 'react';
import { oneLine } from 'common-tags';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Card from 'ui/components/Card';

import 'amo/components/ErrorPage/ErrorPage.scss';


export class NotFoundBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    const fileAnIssueText = i18n.sprintf(i18n.gettext(oneLine`
      If you are signed in and think this message is an error, please
      <a href="%(url)s">file an issue</a>. Tell us where you came from
      and what you were trying to access, and we'll fix the issue.`),
      { url: 'https://github.com/mozilla/addons-frontend/issues/new/' });

    // TODO: Check for signed in state and offer different messages.
    // TODO: Offer a sign in link/button inside the error page.
    /* eslint-disable react/no-danger */
    return (
      <NestedStatus code={401}>
        <Card className="ErrorPage NotAuthorized"
          header={i18n.gettext('Not Authorized')}>
          <p>
            {i18n.gettext(oneLine`
              Sorry, but you aren't authorized to access this page. If you
              aren't signed in, try signing in using the link at the top
              of the page.`)}
          </p>

          <p dangerouslySetInnerHTML={sanitizeHTML(fileAnIssueText, ['a'])} />
        </Card>
      </NestedStatus>
    );
    /* eslint-enable react/no-danger */
  }
}

export default compose(
  translate({ withRef: true }),
)(NotFoundBase);
