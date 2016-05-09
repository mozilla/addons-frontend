import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';

import { startLoginUrl } from 'core/api';
import { gettext as _ } from 'core/utils';

export default class LoginPage extends React.Component {
  static propTypes = {
    message: PropTypes.string,
  }

  render() {
    const title = _('Login Required');
    const { message } = this.props;
    return (
      <div>
        <Helmet title={title} />
        <h1>{title}</h1>
        <p className="login-message">
          {message || _('You must be logged in to access this page.')}
        </p>
        <p>
          <a className="button" href={startLoginUrl()}>
            {_('Login')}
          </a>
        </p>
      </div>
    );
  }
}
