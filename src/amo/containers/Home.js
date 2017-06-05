import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { currentViewSet } from 'amo/actions/currentView';
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

export class HomeBase extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  componentWillMount() {
    const { dispatch } = this.props;

    dispatch(currentViewSet({ isExploring: true, isHomePage: true }));
  }

  render() {
    const { i18n } = this.props;
    return (
      <div className="HomePage">
        <div className="HomePage-welcome">
          <p className="HomePage-welcome-text">
            {i18n.gettext(`Extensions are special features you can add to Firefox.
            Themes let you change your browser's appearance.`)}
          </p>
          <div className="HomePage-welcome-links">
            <Link className="HomePage-extensions-link" to="/extensions/">
              {i18n.gettext('Extensions')}
            </Link>
            <Link className="HomePage-themes-link" to="/themes/">
              {i18n.gettext('Themes')}
            </Link>
          </div>
        </div>

        <h2 className="HomePage-subheading">{i18n.gettext('You can change how Firefox works…')}</h2>
        <ul className="HomePage-category-list">
          <ExtensionLink name="block-ads" slug="security-privacy">
            {i18n.gettext('Block ads')}
          </ExtensionLink>
          <ExtensionLink name="screenshot" slug="photos-media">
            {i18n.gettext('Screenshot')}
          </ExtensionLink>
          <ExtensionLink name="find-news" slug="feeds-news-blogging">
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

        <h2 className="HomePage-subheading">{i18n.gettext('…or what it looks like')}</h2>
        <ul className="HomePage-category-list">
          <ThemeLink name="wild" slug="nature">{i18n.gettext('Wild')}</ThemeLink>
          <ThemeLink name="abstract" slug="abstract">{i18n.gettext('Abstract')}</ThemeLink>
          <ThemeLink name="holiday" slug="holiday">{i18n.gettext('Holiday')}</ThemeLink>
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
  // This allows us to dispatch from our component.
  connect(),
  translate({ withRef: true }),
)(HomeBase);
