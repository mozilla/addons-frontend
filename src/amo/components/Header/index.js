import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
import AuthenticateButton from 'core/components/AuthenticateButton';
import translate from 'core/i18n/translate';

import 'mozilla-tabzilla/css/_tabzilla.scss';
import './styles.scss';


export class HeaderBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    isHomePage: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    SearchFormComponent: PropTypes.node.isRequired,
    query: PropTypes.string,
  }

  static defaultPropTypes = {
    SearchFormComponent: SearchForm,
    isHomePage: false,
  }

  render() {
    const { SearchFormComponent, i18n, isHomePage, location, query } = this.props;
    const headerLink = (
      <Link className="Header-title" to="/">
        {i18n.gettext('Firefox Add-ons')}
      </Link>
    );

    return (
      <div className="Header">
        <div className="Header-top-row">
          <div id="tabzilla">
            <a href="https://www.mozilla.org">Mozilla</a>
          </div>
          <AuthenticateButton className="Header-auth-button" size="small" location={location} />
        </div>
        <header className="Header-header">
          {isHomePage
            ? <h1 className="Header-title-wrapper">{headerLink}</h1>
            : headerLink}
        </header>
        <SearchFormComponent pathname="/search/" query={query} />
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(HeaderBase);
