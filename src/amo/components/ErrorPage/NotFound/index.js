import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import translate from 'amo/i18n/translate';

// For the AMO-specific component see
// src/amo/components/ErrorPage/NotFound

export class NotFoundBase extends React.Component {
  static propTypes = {
    jed: PropTypes.object.isRequired,
    status: PropTypes.number,
  };

  static defaultProps = {
    status: 404,
  };

  render() {
    const { jed, status } = this.props;

    return (
      <NestedStatus code={status}>
        <div className="ErrorPage NotFound">
          <h1>{jed.gettext('Page not found')}</h1>
          <p>
            {jed.gettext(
              "Sorry, but we can't find anything at the URL you entered.",
            )}
          </p>

          <p>
            {jed.sprintf(jed.gettext('Error code: %(status)s.'), { status })}
          </p>
        </div>
      </NestedStatus>
    );
  }
}

export default compose(translate())(NotFoundBase);
