import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import LanguagePicker from 'amo/components/LanguagePicker';
import translate from 'core/i18n/translate';

import './Footer.scss';


export class FooterBase extends React.Component {
  static propTypes = {
    handleViewDesktop: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
  }

  render() {
    const { handleViewDesktop, i18n, lang, location } = this.props;

    return (
      <footer className="Footer">
        <LanguagePicker location={location}
          ref={(ref) => { this.languagePicker = ref; }} />
        <ul className="Footer-links">
          <li>
            <a href={`https://www.mozilla.org/${lang}/privacy/websites/`}
              className="Footer-link Footer-privacy">
              {i18n.gettext('Privacy policy')}
            </a>
          </li>
          <li>
            <a href={`https://www.mozilla.org/${lang}/about/legal/`}
              className="Footer-link Footer-legal">
              {i18n.gettext('Legal notices')}
            </a>
          </li>
          <li>
            <a href={'https://developer.mozilla.org/Add-ons/AMO/Policy/Contact'}
              className="Footer-link Footer-fileissue">
              {i18n.gettext('Report a bug')}
            </a>
          </li>
          <li>
            <a href="#desktop" className="Footer-link Footer-desktop"
              onClick={handleViewDesktop}
              ref={(ref) => { this.desktopLink = ref; }}>
              {i18n.gettext('View desktop site')}
            </a>
          </li>
        </ul>
      </footer>
    );
  }
}

export function mapStateToProps(state) {
  return { lang: state.api.lang };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(FooterBase);
