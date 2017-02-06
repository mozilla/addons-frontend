import React, { PropTypes } from 'react';
import { oneLine } from 'common-tags';
import { connect } from 'react-redux';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import Link from 'amo/components/Link';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { sanitizeHTML, visibleAddonType } from 'core/utils';
import Card from 'ui/components/Card';

import './NotFoundPage.scss';


export class NotFoundPageBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    const fileAnIssueText = i18n.gettext(oneLine`
      If you followed a link from somewhere, please
      <a href="https://github.com/mozilla/addons-frontend/issues/new/">file an issue</a>.
      Tell us where you came from and what you were looking for, and
      we'll do our best to fix it.`);

    return (
      <NestedStatus code={404}>
        <Card className="NotFoundPage" header={i18n.gettext('Page not found')}>
          <p>
            {i18n.gettext(oneLine`
              Sorry, but we can't find anything at the address you entered.
              If you followed a link to an add-on, it's possible that add-on
              has been removed by its author.`)}
          </p>

          <h2>{i18n.gettext('Suggested Pages')}</h2>

          <ul>
            <li>
              <Link to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`}>
                {i18n.gettext('Browse all extensions')}
              </Link>
            </li>
            <li>
              <Link to={`/${visibleAddonType(ADDON_TYPE_THEME)}/featured/`}>
                {i18n.gettext('Browse all themes')}
              </Link>
            </li>
            <li>
              <Link to="/">
                {i18n.gettext('Add-ons Home Page')}
              </Link>
            </li>
          </ul>

          <p dangerouslySetInnerHTML={sanitizeHTML(fileAnIssueText, ['a'])} />
        </Card>
      </NestedStatus>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(NotFoundPageBase);
