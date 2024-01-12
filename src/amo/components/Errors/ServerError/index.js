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
  jed: I18nType,
|};

export class ServerErrorBase extends React.Component<InternalProps> {
  render(): React.Node {
    const { jed } = this.props;

    const fileAnIssueText = jed.gettext(`
      If you have additional information that would help us you can
      <a href="https://github.com/mozilla/addons-frontend/issues/new/">file an
      issue</a>. Tell us what steps you took that lead to the error and we'll
      do our best to fix it.`);

    /* eslint-disable react/no-danger */
    return (
      <ErrorComponent code={500} header={jed.gettext('Server Error')}>
        <p>
          {jed.gettext(`
            Sorry, but there was an error with our server and we couldn't
            complete your request. We have logged this error and will
            investigate it.`)}
        </p>

        <SuggestedPages />

        <p dangerouslySetInnerHTML={sanitizeHTML(fileAnIssueText, ['a'])} />
      </ErrorComponent>
    );
    /* eslint-enable react/no-danger */
  }
}

const ServerError: React.ComponentType<Props> = compose(translate())(
  ServerErrorBase,
);

export default ServerError;
