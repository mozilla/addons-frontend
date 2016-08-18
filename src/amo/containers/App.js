import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';

import 'core/fonts/fira.scss';
import 'amo/css/App.scss';
import translate from 'core/i18n/translate';


export class AppBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { children, i18n } = this.props;
    return (
      <div className="amo">
        <Helmet
          defaultTitle={i18n.gettext('Add-ons for Firefox')}
        />
        {children}
      </div>
    );
  }
}

export default translate({ withRef: true })(AppBase);
