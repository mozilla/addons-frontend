import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';

import 'amo/css/Home.scss';

const CategoryLink = ({ name, slug, text, type }) => (
  <li className={classNames('HomePage-category-li', `HomePage-${name}`)}>
    <Link to={`/${type}/${slug}/`}>
      <span>{text}</span>
    </Link>
  </li>
);
CategoryLink.propTypes = {
  name: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
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
          <ExtensionLink name="block-ads" slug="security-privacy" text={i18n.gettext('Block ads')} />
          <ExtensionLink name="screenshot" slug="photos-media" text={i18n.gettext('Screenshot')} />
          <ExtensionLink name="news" slug="feeds-news-blogging" text={i18n.gettext('Find news')} />
          <ExtensionLink name="shop-online" slug="shopping" text={i18n.gettext('Shop online')} />
          <ExtensionLink name="be-social" slug="social-networking" text={i18n.gettext('Be social')} />
          <ExtensionLink name="play-games" slug="sports-games" text={i18n.gettext('Play games')} />
        </ul>
        <Link className="HomePage-extensions-link" to="/extensions/">
          {i18n.gettext('Browse all extensions')}
        </Link>

        <h2 className="HomePage-subheading">{i18n.gettext('How do you want Firefox to look?')}</h2>
        <ul className="HomePage-category-list">
          <ThemeLink name="wild" slug="nature" text={i18n.gettext('Wild')} />
          <ThemeLink name="abstract" slug="abstract" text={i18n.gettext('Abstract')} />
          <ThemeLink name="fashionable" slug="fashion" text={i18n.gettext('Fashionable')} />
          <ThemeLink name="scenic" slug="scenery" text={i18n.gettext('Scenic')} />
          <ThemeLink name="sporty" slug="sports" text={i18n.gettext('Sporty')} />
          <ThemeLink name="solid" slug="solid" text={i18n.gettext('Solid')} />
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
