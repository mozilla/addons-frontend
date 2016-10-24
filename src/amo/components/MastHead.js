import React, { PropTypes } from 'react';

import SearchForm from 'amo/components/SearchForm';
import translate from 'core/i18n/translate';

import 'mozilla-tabzilla/css/_tabzilla.scss';
import './MastHead.scss';


export class MastHeadBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    i18n: PropTypes.object.isRequired,
    isHomePage: PropTypes.bool,
    lang: PropTypes.string.isRequired,
    SearchFormComponent: PropTypes.node.isRequired,
    query: PropTypes.string,
  }

  static defaultPropTypes = {
    isHomePage: false,
    SearchFormComponent: SearchForm,
  }

  render() {
    const { SearchFormComponent, children, i18n, isHomePage, lang,
            query } = this.props;
    const headerTitle = i18n.gettext('Firefox Add-ons');
    const pathname = `/${lang}/firefox/search/`;

    return (
      <div className="MastHead">
        <div id="tabzilla">
          <a href="https://www.mozilla.org">Mozilla</a>
        </div>
        {children}
        <header className="MastHead-header">
          {isHomePage
            ? <h1 ref={(ref) => { this.title = ref; }} className="MastHead-title MastHead-homepage">
              {headerTitle}
            </h1>
            : <a ref={(ref) => { this.title = ref; }} href="/" className="MastHead-title">
              {headerTitle}
            </a>}
        </header>
        <SearchFormComponent pathname={pathname} query={query} />
      </div>
    );
  }
}

export default translate({ withRef: true })(MastHeadBase);
