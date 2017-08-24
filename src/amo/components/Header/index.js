import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import DownloadFirefoxButton from 'amo/components/DownloadFirefoxButton';
import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
import SectionLinks from 'amo/components/SectionLinks';
import AuthenticateButton from 'core/components/AuthenticateButton';
import { VIEW_CONTEXT_HOME } from 'core/constants';
import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';

import './styles.scss';


export class HeaderBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    isHomePage: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    query: PropTypes.string,
  }

  static defaultPropTypes = {
    isHomePage: false,
  }

  render() {
    const { i18n, isHomePage, location, query } = this.props;
    const headerLink = (
      <Link className="Header-title" to="/">
        <Icon className="Header-addons-icon" name="fox" />
        {
          // translators: "Firefox" should not be translated. :-)
          i18n.gettext('Firefox Add-ons')
        }
      </Link>
    );

    return (
      <header className="Header">
        <div className="Header-content">
          {isHomePage
            ? <h1 className="Header-title-wrapper">{headerLink}</h1>
            : headerLink}
        </div>

        <SectionLinks className="Header-SectionLinks" location={location} />

        <div className="Header-user-and-external-links">
          <Link
            className="Header-developer-hub-link"
            href="/developers/"
            external
            prependClientApp={false}
          >
            {i18n.gettext('Developer Hub')}
          </Link>
          <DownloadFirefoxButton className="Header-download-button" />
          <AuthenticateButton
            className="Header-authenticate-button Button--action
              Button--outline-only Button--small"
            location={location}
            noIcon
          />
        </div>

        <SearchForm
          className="Header-search-form"
          pathname="/search/"
          query={query}
        />
      </header>
    );
  }
}

export function mapStateToProps(state) {
  return { isHomePage: state.viewContext.context === VIEW_CONTEXT_HOME };
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(HeaderBase);
