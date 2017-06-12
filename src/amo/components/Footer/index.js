import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import LanguagePicker from 'amo/components/LanguagePicker';
import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';

import './styles.scss';


export class FooterBase extends React.Component {
  static propTypes = {
    handleViewDesktop: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
  }

  render() {
    const { handleViewDesktop, i18n, location } = this.props;
    const homepageText = i18n.gettext("Go to Mozilla's homepage");

    return (
      <footer className="Footer">
        <div className="Footer-language-and-links">
          <LanguagePicker location={location}
            ref={(ref) => { this.languagePicker = ref; }} />
          <ul className="Footer-links">
            <li>
              <a href="https://www.mozilla.org/privacy/websites/"
                className="Footer-link Footer-privacy">
                {i18n.gettext('Privacy policy')}
              </a>
            </li>
            <li>
              <a href="https://www.mozilla.org/about/legal/"
                className="Footer-link Footer-legal">
                {i18n.gettext('Legal notices')}
              </a>
            </li>
            <li>
              <a href="https://developer.mozilla.org/Add-ons/AMO/Policy/Contact"
                className="Footer-link Footer-fileissue">
                {i18n.gettext('Report a bug')}
              </a>
            </li>
            <li>
              <a href="#desktop" className="Footer-link Footer-desktop"
                onClick={handleViewDesktop}
                ref={(ref) => { this.desktopLink = ref; }}>
                {i18n.gettext('View classic desktop site')}
              </a>
            </li>
          </ul>
        </div>

        <a
          className="Footer-mozilla-link"
          href="https://mozilla.org/"
          title={homepageText}
        >
          <Icon
            alt={homepageText}
            className="Footer-mozilla-logo"
            name="mozilla"
          />
        </a>
      </footer>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(FooterBase);
