import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';
import SearchBox from 'amo/components/SearchBox';

import 'mozilla-tabzilla/css/_tabzilla.scss';
import './MastHead.scss';


export class MastHeadBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    i18n: PropTypes.object.isRequired,
    isHomePage: PropTypes.bool,
  }

  static defaultPropTypes = {
    isHomePage: false,
  }

  render() {
    const { children, i18n, isHomePage } = this.props;
    const headerTitle = i18n.gettext('Firefox Add-ons');

    return (
      <div className="MastHead">
        <div id="tabzilla">
          <a href="https://www.mozilla.org">Mozilla</a>
        </div>
        {children}
        <header className="MastHead-header">
          { isHomePage ?
            <h1 ref={(ref) => { this.title = ref; }}
                className="MastHead-title MastHead-homepage">{ headerTitle }</h1> :
            <a ref={(ref) => { this.title = ref; }}
               href="/" className="MastHead-title">{ headerTitle }</a> }
        </header>
        <SearchBox />
      </div>
    );
  }
}

export default translate({ withRef: true })(MastHeadBase);
