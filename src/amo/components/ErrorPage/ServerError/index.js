import React, { PropTypes } from 'react';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import SuggestedPages from 'amo/components/SuggestedPages';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Card from 'ui/components/Card';

import 'amo/components/ErrorPage/ErrorPage.scss';


export class ServerErrorBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    const fileAnIssueText = i18n.gettext(`
      If you have additional information that would help us you can
      <a href="https://github.com/mozilla/addons-frontend/issues/new/">file an
      issue</a>. Tell us what steps you took that lead to the error and we'll
      do our best to fix it.`);

    /* eslint-disable react/no-danger */
    return (
      <NestedStatus code={500}>
        <Card className="ErrorPage ServerError"
          header={i18n.gettext('Server Error')}>
          <p>
            {i18n.gettext(`
              Sorry, but there was an error with our server and we couldn't
              complete your request. We have logged this error and will
              investigate it.`)}
          </p>

          <SuggestedPages />

          <p dangerouslySetInnerHTML={sanitizeHTML(fileAnIssueText, ['a'])} />
        </Card>
      </NestedStatus>
    );
    /* eslint-enable react/no-danger */
  }
}

export default compose(
  translate({ withRef: true }),
)(ServerErrorBase);
