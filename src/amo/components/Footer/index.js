import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import LanguagePicker from 'amo/components/LanguagePicker';
import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';
import { sanitizeHTML } from 'core/utils';

import './styles.scss';

export class FooterBase extends React.Component {
  static propTypes = {
    handleViewDesktop: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
  };

  render() {
    const { handleViewDesktop, i18n, location } = this.props;
    const homepageText = i18n.gettext("Go to Mozilla's homepage");

    return (
      <footer className="Footer">
        <div className="Footer-wrapper">
          <div className="Footer-mozilla-link-wrapper">
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
          </div>

          <section className="Footer-amo-links">
            <h4 className="Footer-links-header">
              <Link href="/">{i18n.gettext('Add-ons')}</Link>
            </h4>
            <ul className="Footer-links">
              <li>
                <Link to="/about" prependClientApp={false}>
                  {i18n.gettext('About')}
                </Link>
              </li>
              <li>
                <a href="https://blog.mozilla.com/addons">
                  {i18n.gettext('Blog')}
                </a>
              </li>
              <li>
                <Link href="/developers/" prependClientApp={false}>
                  {i18n.gettext('Developer Hub')}
                </Link>
              </li>
              <li>
                <a href="https://developer.mozilla.org/docs/Mozilla/Add-ons/AMO/Policy">
                  {i18n.gettext('Developer Policies')}
                </a>
              </li>
              <li>
                <a href="https://discourse.mozilla-community.org/c/add-ons">
                  {i18n.gettext('Forum')}
                </a>
              </li>
              <li>
                <a
                  className="Footer-bug-report-link"
                  href="https://developer.mozilla.org/Add-ons/AMO/Policy/Contact"
                >
                  {i18n.gettext('Report a bug')}
                </a>
              </li>
              <li>
                <Link to="/review_guide" prependClientApp={false}>
                  {i18n.gettext('Review Guide')}
                </Link>
              </li>
              <li>
                <a href="https://status.mozilla.org/">
                  {i18n.gettext('Site Status')}
                </a>
              </li>
              <li>
                <a
                  href="#desktop"
                  className="Footer-link Footer-desktop"
                  onClick={handleViewDesktop}
                  ref={(ref) => {
                    this.desktopLink = ref;
                  }}
                >
                  {i18n.gettext('View classic desktop site')}
                </a>
              </li>
            </ul>
          </section>

          <section className="Footer-firefox-links">
            <h4 className="Footer-links-header">
              <a href="https://www.mozilla.org/firefox/">Firefox</a>
            </h4>
            <ul className="Footer-links">
              <li>
                <a href="https://www.mozilla.org/firefox/new/?utm_source=addons.mozilla.org&utm_campaign=footer&utm_medium=referral">
                  {i18n.gettext('Download Firefox')}
                </a>
              </li>
              <li>
                <a href="https://www.mozilla.org/firefox/android/?utm_source=addons.mozilla.org&utm_campaign=footer&utm_medium=referral">
                  {i18n.gettext('Android Browser')}
                </a>
              </li>
              <li>
                <a href="https://www.mozilla.org/firefox/ios/?utm_source=addons.mozilla.org&utm_campaign=footer&utm_medium=referral">
                  {i18n.gettext('iOS Browser')}
                </a>
              </li>
              <li>
                <a href="https://www.mozilla.org/firefox/focus/?utm_source=addons.mozilla.org&utm_campaign=footer&utm_medium=referral">
                  {i18n.gettext('Focus Browser')}
                </a>
              </li>
              <li>
                <a href="https://www.mozilla.org/firefox/desktop/?utm_source=addons.mozilla.org&utm_campaign=footer&utm_medium=referral">
                  {i18n.gettext('Desktop Browser')}
                </a>
              </li>
              <li>
                <a href="https://www.mozilla.org/firefox/channel/desktop/?utm_source=addons.mozilla.org&utm_campaign=footer&utm_medium=referral">
                  {i18n.gettext('Beta, Nightly, Developer Edition')}
                </a>
              </li>
            </ul>
            <ul className="Footer-links Footer-links-social">
              <li className="Footer-link-social">
                <a href="https://twitter.com/firefox">
                  <Icon name="twitter" alt="Twitter (@firefox)" />
                </a>
              </li>
              <li className="Footer-link-social">
                <a href="https://www.facebook.com/Firefox">
                  <Icon name="facebook" alt="Facebook (Firefox)" />
                </a>
              </li>
              <li className="Footer-link-social">
                <a href="https://www.youtube.com/firefoxchannel">
                  <Icon name="youtube" alt="YouTube (firefoxchannel)" />
                </a>
              </li>
            </ul>
          </section>

          <ul className="Footer-legal-links">
            <li>
              <a
                className="Footer-privacy-link"
                href="https://www.mozilla.org/privacy/websites/"
              >
                {i18n.gettext('Privacy')}
              </a>
            </li>
            <li>
              <a
                className="Footer-cookies-link"
                href="https://www.mozilla.org/privacy/websites/#cookies"
              >
                {i18n.gettext('Cookies')}
              </a>
            </li>
            <li>
              <a
                className="Footer-legal-link"
                href="https://www.mozilla.org/about/legal/"
              >
                {i18n.gettext('Legal')}
              </a>
            </li>
            <li>
              <a
                className="Footer-trademark-abuse-link"
                href="https://www.mozilla.org/about/legal/fraud-report/"
              >
                {i18n.gettext('Report Trademark Abuse')}
              </a>
            </li>
          </ul>

          <p
            className="Footer-copyright"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeHTML(
              i18n.sprintf(
                i18n.gettext(`Except where otherwise %(startNotedLink)snoted%(endNotedLink)s,
                  content on this site is licensed under the %(startLicenseLink)sCreative Commons
                  Attribution Share-Alike License v3.0%(endLicenseLink)s or any later version.`),
                {
                  startNotedLink:
                    '<a href="https://www.mozilla.org/en-US/about/legal/">',
                  endNotedLink: '</a>',
                  startLicenseLink:
                    '<a href="https://creativecommons.org/licenses/by-sa/3.0/">',
                  endLicenseLink: '</a>',
                },
              ),
              ['a'],
            )}
          />

          <div className="Footer-language-picker">
            <LanguagePicker
              location={location}
              ref={(ref) => {
                this.languagePicker = ref;
              }}
            />
          </div>
        </div>
      </footer>
    );
  }
}

export default compose(translate())(FooterBase);
