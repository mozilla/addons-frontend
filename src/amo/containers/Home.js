import React, { PropTypes } from 'react';
import { compose } from 'redux';

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
        <h2 className="HomePage-h2">{i18n.gettext('What do you want Firefox to do?')}</h2>
        <ul className="HomePage-cat-list">
          <li className="HomePage-block-ads"><a href="#block-ads"><span>{i18n.gettext('Block Ads')}</span></a></li>
          <li className="HomePage-screenshot"><a href="#screenshot"><span>{i18n.gettext('Screenshot')}</span></a></li>
          <li className="HomePage-save-stuff"><a href="#save-stuff"><span>{i18n.gettext('Save stuff')}</span></a></li>
          <li className="HomePage-shop-online"><a href="#shop-online"><span>{i18n.gettext('Shop online')}</span></a></li>
          <li className="HomePage-be-social"><a href="#share-stuff"><span>{i18n.gettext('Be social')}</span></a></li>
          <li className="HomePage-share-stuff"><a href="#share-stuff"><span>{i18n.gettext('Share stuff')}</span></a></li>
        </ul>
        <a className="HomePage-extensions-link" href="#thems">{i18n.gettext('Browse all extensions')}</a>

        <h2 className="HomePage-h2">{i18n.gettext('How do you want Firefox to look?')}</h2>
        <ul className="HomePage-cat-list">
          <li className="HomePage-wild"><a href="#wild"><span>{i18n.gettext('Wild')}</span></a></li>
          <li className="HomePage-abstract"><a href="#abstract"><span>{i18n.gettext('Abstract')}</span></a></li>
          <li className="HomePage-fashionable"><a href="#fashionable"><span>{i18n.gettext('Fashionable')}</span></a></li>
          <li className="HomePage-scenic"><a href="#scenic"><span>{i18n.gettext('Scenic')}</span></a></li>
          <li className="HomePage-sporty"><a href="#sporty"><span>{i18n.gettext('Sporty')}</span></a></li>
          <li className="HomePage-mystical"><a href="#mystical"><span>{i18n.gettext('Mystical')}</span></a></li>
        </ul>
        <a className="HomePage-themes-link" href="#thems">{i18n.gettext('Browse all themes')}</a>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(HomePageBase);
