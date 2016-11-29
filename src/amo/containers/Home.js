import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';

import 'amo/css/Home.scss';

export class HomePageBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;
    return (
      <div className="HomePage">
        <h2 className="HomePage-subheading">{i18n.gettext('What do you want Firefox to do?')}</h2>
        <ul className="HomePage-cat-list">
          <li className="HomePage-block-ads"><Link to="#block-ads"><span>{i18n.gettext('Block ads')}</span></Link></li>
          <li className="HomePage-screenshot"><Link to="#screenshot"><span>{i18n.gettext('Screenshot')}</span></Link></li>
          <li className="HomePage-save-stuff"><Link to="#save-stuff"><span>{i18n.gettext('Save stuff')}</span></Link></li>
          <li className="HomePage-shop-online"><Link to="#shop-online"><span>{i18n.gettext('Shop online')}</span></Link></li>
          <li className="HomePage-be-social"><Link to="#share-stuff"><span>{i18n.gettext('Be social')}</span></Link></li>
          <li className="HomePage-share-stuff"><Link to="#share-stuff"><span>{i18n.gettext('Share stuff')}</span></Link></li>
        </ul>
        <Link className="HomePage-extensions-link" to="/extensions/">
          {i18n.gettext('Browse all extensions')}
        </Link>

        <h2 className="HomePage-subheading">{i18n.gettext('How do you want Firefox to look?')}</h2>
        <ul className="HomePage-cat-list">
          <li className="HomePage-wild"><Link to="#wild"><span>{i18n.gettext('Wild')}</span></Link></li>
          <li className="HomePage-abstract"><Link to="#abstract"><span>{i18n.gettext('Abstract')}</span></Link></li>
          <li className="HomePage-fashionable"><Link to="#fashionable"><span>{i18n.gettext('Fashionable')}</span></Link></li>
          <li className="HomePage-scenic"><Link to="#scenic"><span>{i18n.gettext('Scenic')}</span></Link></li>
          <li className="HomePage-sporty"><Link to="#sporty"><span>{i18n.gettext('Sporty')}</span></Link></li>
          <li className="HomePage-mystical"><Link to="#mystical"><span>{i18n.gettext('Mystical')}</span></Link></li>
        </ul>
        <Link className="HomePage-themes-link" to="/themes/">
          {i18n.gettext('Browse all themes')}
        </Link>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(HomePageBase);
