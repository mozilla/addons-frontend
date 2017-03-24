import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
import AuthenticateButton from 'core/components/AuthenticateButton';
import translate from 'core/i18n/translate';

import 'mozilla-tabzilla/css/_tabzilla.scss';
import './MastHead.scss';


export class MastHeadBase extends React.Component {
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
      <Link className="MastHead-title" to="/">
        {i18n.gettext('Firefox Add-ons')}
      </Link>
    );

    return (
      <div className="MastHead">
        <div className="MastHead-top-row">
          <div id="tabzilla">
            <a href="https://www.mozilla.org">Mozilla</a>
          </div>
          <AuthenticateButton className="MastHead-auth-button" size="small" location={location} />
        </div>
        <header className="MastHead-header">
          {isHomePage
            ? <h1 className="MastHead-title-wrapper">{headerLink}</h1>
            : headerLink}
        </header>
        <SearchFormComponent pathname="/search/" query={query} />
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(MastHeadBase);
