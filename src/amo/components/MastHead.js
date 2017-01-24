import React, { PropTypes } from 'react';

import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
import translate from 'core/i18n/translate';

import 'mozilla-tabzilla/css/_tabzilla.scss';
import './MastHead.scss';


export class MastHeadBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    isHomePage: PropTypes.bool.isRequired,
    i18n: PropTypes.object.isRequired,
    SearchFormComponent: PropTypes.node.isRequired,
    query: PropTypes.string,
  }

  static defaultPropTypes = {
    SearchFormComponent: SearchForm,
    isHomePage: false,
  }

  render() {
    const {
      SearchFormComponent, children, i18n, isHomePage, query,
    } = this.props;
    const headerLink = (
      <Link className="MastHead-title" to="/">
        {i18n.gettext('Firefox Add-ons')}
      </Link>
    );

    return (
      <div className="MastHead">
        <div id="tabzilla">
          <a href="https://www.mozilla.org">Mozilla</a>
        </div>
        {children}
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

export default translate({ withRef: true })(MastHeadBase);
