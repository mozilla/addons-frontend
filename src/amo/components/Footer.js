import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { compose } from 'redux';

import LanguagePicker from 'amo/components/LanguagePicker';
import translate from 'core/i18n/translate';

import './Footer.scss';


export class FooterBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
  }

  render() {
    const { i18n, lang } = this.props;

    return (
      <footer className="Footer">
        <LanguagePicker lang={lang}
          ref={(ref) => { this.languagePicker = ref; }} />
        <ul className="Footer-links">
          <li>
            <Link to={`/${lang}/firefox/privacy`}
              className="Footer-link">
              {i18n.gettext('Privacy policy')}
            </Link>
          </li>
          <li>
            <Link to={`/${lang}/firefox/legal`} className="Footer-link">
              {i18n.gettext('Legal notices')}
            </Link>
          </li>
          <li>
            <a href="#desktop" className="Footer-link"
              ref={(ref) => { this.desktopLink = ref; }}>
              {i18n.gettext('View desktop site')}
            </a>
          </li>
        </ul>
      </footer>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(FooterBase);
