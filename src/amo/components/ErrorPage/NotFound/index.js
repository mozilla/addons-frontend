import React, { PropTypes } from 'react';
import { oneLine } from 'common-tags';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import SuggestedPages from 'amo/components/SuggestedPages';
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
      If you followed a link from somewhere, please
      <a href="%(url)s">file an issue</a>. Tell us where you came from and
      what you were looking for, and we'll do our best to fix it.`),
      { url: 'https://github.com/mozilla/addons-frontend/issues/new/' });


    /* eslint-disable react/no-danger */
    return (
      <NestedStatus code={404}>
        <Card className="ErrorPage NotFound"
          header={i18n.gettext('Page not found')}>
          <p>
            {i18n.gettext(oneLine`
              Sorry, but we can't find anything at the address you entered.
              If you followed a link to an add-on, it's possible that add-on
              has been removed by its author.`)}
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
)(NotFoundBase);
