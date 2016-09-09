import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';

import 'disco/css/App.scss';
import translate from 'core/i18n/translate';


export class AppBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    i18n: PropTypes.shape({}).isRequired,
  }

  render() {
    const { children, i18n } = this.props;
    return (
      <div className="disco-pane">
        <Helmet
          defaultTitle={i18n.gettext('Discover Add-ons')}
          meta={[
            { name: 'robots', content: 'noindex' },
          ]}
        />
        {children}
      </div>
    );
  }
}

export default translate({ withRef: true })(AppBase);
