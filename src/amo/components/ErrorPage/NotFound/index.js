/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import SuggestedPages from 'amo/components/SuggestedPages';
import {
  ERROR_ADDON_DISABLED_BY_ADMIN,
  ERROR_ADDON_DISABLED_BY_DEV,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Card from 'ui/components/Card';
import type { I18nType } from 'core/types/i18n';

import '../styles.scss';

type Props = {|
  errorCode?: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class NotFoundBase extends React.Component<InternalProps> {
  render() {
    const { errorCode, i18n } = this.props;

    const fileAnIssueText = i18n.sprintf(
      i18n.gettext(`
      If you followed a link from somewhere, please
      <a href="%(url)s">file an issue</a>. Tell us where you came from and
      what you were looking for, and we'll do our best to fix it.`),
      { url: 'https://github.com/mozilla/addons-frontend/issues/new/' },
    );

    let explanation;
    if (errorCode === ERROR_ADDON_DISABLED_BY_DEV) {
      explanation = i18n.gettext('This add-on has been removed by its author.');
    } else if (errorCode === ERROR_ADDON_DISABLED_BY_ADMIN) {
      explanation = i18n.gettext(
        'This add-on has been disabled by an administrator.',
      );
    } else {
      explanation = i18n.gettext(
        `Sorry, but we can't find anything at the address you entered.`,
      );
    }

    /* eslint-disable react/no-danger */
    return (
      <NestedStatus code={404}>
        <Card
          className="ErrorPage NotFound"
          header={i18n.gettext('Page not found')}
        >
          <p className="NotFound-explanation">{explanation}</p>

          <SuggestedPages />

          <p
            className="NotFound-fileAnIssueText"
            dangerouslySetInnerHTML={sanitizeHTML(fileAnIssueText, ['a'])}
          />
        </Card>
      </NestedStatus>
    );
    /* eslint-enable react/no-danger */
  }
}

const NotFound: React.ComponentType<Props> = compose(
  translate({ withRef: true }),
)(NotFoundBase);

export default NotFound;
