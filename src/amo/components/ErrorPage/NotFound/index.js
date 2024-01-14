import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import translate from 'amo/i18n/translate';

// For the AMO-specific component see
// src/amo/components/ErrorPage/NotFound

export class NotFoundBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    status: PropTypes.number,
  };

  static defaultProps = {
    status: 404,
  };

  render() {
    const { i18n, status } = this.props;

    return (
      <NestedStatus code={status}>
        <div className="ErrorPage NotFound">
          <h1>{i18n.t('Page not found')}</h1>
          <p>
            {i18n.t(
              "Sorry, but we can't find anything at the URL you entered.",
            )}
          </p>

          <p>{i18n.t('Error code: %(status)s.', { status })}</p>
        </div>
      </NestedStatus>
    );
  }
}

export default compose(translate())(NotFoundBase);
