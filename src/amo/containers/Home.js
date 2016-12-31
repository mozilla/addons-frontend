import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';

import 'amo/css/Home.scss';

const CategoryLink = ({ children, name, slug, type }) => (
  <li className={classNames('HomePage-category-li', `HomePage-${name}`)}>
    <Link to={`/${type}/${slug}/`} className="HomePage-category-link">
      <span>{children}</span>
    </Link>
  </li>
);
CategoryLink.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

const ExtensionLink = (props) => <CategoryLink type="extensions" {...props} />;

const ThemeLink = (props) => <CategoryLink type="themes" {...props} />;

export class HomePageBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;
    return (
      <div className="HomePage">
        <h2 className="HomePage-subheading">{i18n.gettext('What do you want Firefox to do?')}</h2>
        <ul className="HomePage-category-list">
          <ExtensionLink name="block-ads" slug="security-privacy">
            {i18n.gettext('Block ads')}
          </ExtensionLink>
          <ExtensionLink name="screenshot" slug="photos-media">
            {i18n.gettext('Screenshot')}
          </ExtensionLink>
          <ExtensionLink name="news" slug="feeds-news-blogging">
            {i18n.gettext('Find news')}
          </ExtensionLink>
          <ExtensionLink name="shop-online" slug="shopping">
            {i18n.gettext('Shop online')}
          </ExtensionLink>
          <ExtensionLink name="be-social" slug="social-networking">
            {i18n.gettext('Be social')}
          </ExtensionLink>
          <ExtensionLink name="play-games" slug="sports-games">
            {i18n.gettext('Play games')}
          </ExtensionLink>
        </ul>
        <Link className="HomePage-extensions-link" to="/extensions/">
          {i18n.gettext('Browse all extensions')}
        </Link>

        <h2 className="HomePage-subheading">{i18n.gettext('How do you want Firefox to look?')}</h2>
        <ul className="HomePage-category-list">
          <ThemeLink name="wild" slug="nature">{i18n.gettext('Wild')}</ThemeLink>
          <ThemeLink name="abstract" slug="abstract">{i18n.gettext('Abstract')}</ThemeLink>
          <ThemeLink name="fashionable" slug="fashion">{i18n.gettext('Fashionable')}</ThemeLink>
          <ThemeLink name="scenic" slug="scenery">{i18n.gettext('Scenic')}</ThemeLink>
          <ThemeLink name="sporty" slug="sports">{i18n.gettext('Sporty')}</ThemeLink>
          <ThemeLink name="solid" slug="solid">{i18n.gettext('Solid')}</ThemeLink>
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
