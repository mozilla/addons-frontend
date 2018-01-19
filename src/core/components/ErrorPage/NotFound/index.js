import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import translate from 'core/i18n/translate';

// For the AMO-specific component see
// src/amo/components/ErrorPage/NotFound

export class NotFoundBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    status: PropTypes.number,
  }

  static defaultProps = {
    status: 404,
  }

  render() {
    const { i18n, status } = this.props;

    return (
      <NestedStatus code={status}>
        <div className="ErrorPage NotFound">
          <h1>{i18n.gettext('Page not found')}</h1>
          <p>
            {i18n.gettext("Sorry, but we can't find anything at the URL you entered.")}
          </p>

          <p>
            {i18n.sprintf(i18n.gettext('Error code: %(status)s.'), { status })}
          </p>
        </div>
      </NestedStatus>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(NotFoundBase);
