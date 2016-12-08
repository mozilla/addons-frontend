import React, { PropTypes } from 'react';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';

import './LandingPage.scss';


export class LandingPageBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string.isRequired,
    featuredAddons: PropTypes.array,
    highlyRatedAddons: PropTypes.array,
    popularAddons: PropTypes.array,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const {
      addonType, featuredAddons, highlyRatedAddons, popularAddons, i18n,
    } = this.props;

    const contentForTypes = {
      extension: {
        featuredHeader: i18n.gettext('Featured extensions'),
        featuredFooter: (
          <Link to="test">{i18n.gettext('More featured extensions')}</Link>
        ),
        popularHeader: i18n.gettext('Most popular extensions'),
        popularFooter: (
          <Link to="test">{i18n.gettext('More popular extensions')}</Link>
        ),
        highlyRatedHeader: i18n.gettext('Top rated extensions'),
        highlyRatedFooter: (
          <Link to="test">{i18n.gettext('More highly rated extensions')}</Link>
        ),
      },
      theme: {
        featuredHeader: i18n.gettext('Featured themes'),
        featuredFooter: (
          <Link to="test">{i18n.gettext('More featured themes')}</Link>
        ),
        popularHeader: i18n.gettext('Most popular themes'),
        popularFooter: (
          <Link to="test">{i18n.gettext('More popular themes')}</Link>
        ),
        highlyRatedHeader: i18n.gettext('Top rated themes'),
        highlyRatedFooter: (
          <Link to="test">{i18n.gettext('More highly rated themes')}</Link>
        ),
      },
    };

    const html = contentForTypes[addonType];

    return (
      <div className={`LandingPage LandingPage-${addonType}`}>
        <AddonsCard addons={featuredAddons} className="FeaturedAddons"
          header={html.featuredHeader} footer={html.featuredFooter} />

        <AddonsCard addons={popularAddons} className="PopularAddons"
          header={html.popuarHeader} footer={html.popuarFooter} />

        <AddonsCard addons={highlyRatedAddons} className="HighlyRatedAddons"
          header={html.highlyRatedHeader} footer={html.highlyRatedFooter} />
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(LandingPageBase);
