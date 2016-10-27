import React, { PropTypes } from 'react';

import Link from 'amo/components/Link';
import SearchForm from 'amo/components/SearchForm';
import translate from 'core/i18n/translate';

import 'mozilla-tabzilla/css/_tabzilla.scss';
import './MastHead.scss';


export class MastHeadBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    i18n: PropTypes.object.isRequired,
    isHomePage: PropTypes.bool,
    SearchFormComponent: PropTypes.node.isRequired,
    query: PropTypes.string,
  }

  static defaultPropTypes = {
    isHomePage: false,
    SearchFormComponent: SearchForm,
  }

  render() {
    const {
      SearchFormComponent, children, i18n, isHomePage, query,
    } = this.props;
    const headerTitle = i18n.gettext('Firefox Add-ons');

    return (
      <div className="MastHead">
        <div id="tabzilla">
          <a href="https://www.mozilla.org">Mozilla</a>
        </div>
        {children}
        <header className="MastHead-header">
          {isHomePage
            ? <h1 ref={(ref) => { this.title = ref; }}
                className="MastHead-title MastHead-homepage">
              {headerTitle}
            </h1>
            : <Link ref={(ref) => { this.title = ref; }} to="/"
                className="MastHead-title">
              {headerTitle}
            </Link>}
        </header>
        <SearchFormComponent pathname="/search/" query={query} />
      </div>
    );
  }
}

export default translate({ withRef: true })(MastHeadBase);
