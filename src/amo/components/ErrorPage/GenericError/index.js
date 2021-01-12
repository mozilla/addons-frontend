import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import translate from 'amo/i18n/translate';

export class GenericErrorBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    status: PropTypes.number,
  };

  static defaultProps = {
    status: 500,
  };

  render() {
    const { i18n, status } = this.props;

    return (
      <NestedStatus code={status}>
        <div className="ErrorPage GenericError">
          <h1>{i18n.gettext('Server Error')}</h1>

          <p>
            {i18n.gettext(`
              Sorry, but there was an error and we couldn't complete your
              request. We have logged this error and will investigate it.`)}
          </p>

          <p>
            {i18n.sprintf(i18n.gettext('Error code: %(status)s.'), { status })}
          </p>
        </div>
      </NestedStatus>
    );
  }
}

export default compose(translate())(GenericErrorBase);
