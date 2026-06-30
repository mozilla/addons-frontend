/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import config from 'config';

import LanguagePicker from 'amo/components/LanguagePicker';
import Link from 'amo/components/Link';
import ThemePicker from 'amo/components/ThemePicker';
import { makeQueryStringWithUTM, sanitizeHTML } from 'amo/utils';
import translate from 'amo/i18n/translate';
import Icon from 'amo/components/Icon';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  noLangPicker?: boolean,
  noThemePicker?: boolean,
  includeGoogleDisclaimer?: boolean,
|};

type DefaultProps = {|
  _config: typeof config,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  i18n: I18nType,
|};

export class FooterBase extends React.Component<InternalProps> {
  static defaultProps: {| ...Props, ...DefaultProps |} = {
    _config: config,
    noLangPicker: false,
    noThemePicker: false,
  };

  render(): React.Node {
    const {
      _config,
      includeGoogleDisclaimer,
      i18n,
      noLangPicker,
      noThemePicker,
    } = this.props;
    const homepageText = i18n.gettext("Go to Mozilla's homepage");

    const footerLinkQueryString = makeQueryStringWithUTM({
      utm_content: 'footer-link',
      utm_campaign: null,
    });

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
          <section className="Footer-column Footer-amo-links">
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
                <a className="Footer-blog-link" href="/blog/">
                  {i18n.gettext('Firefox Add-ons Blog')}
                </a>
              </li>
              <li>
                <a
                  className="Footer-extension-workshop-link"
                  href={`${_config.get(
                    'extensionWorkshopUrl',
                  )}/${makeQueryStringWithUTM({
                    utm_content: 'footer-link',
                    utm_campaign: null,
                  })}`}
                >
                  {i18n.gettext('Extension Workshop')}
                </a>
              </li>
              <li>
                <Link href="/developers/" prependClientApp={false}>
                  {i18n.gettext('Developer Hub')}
                </Link>
              </li>
              <li>
                <a
                  className="Footer-developer-policies-link"
                  href={`${_config.get(
                    'extensionWorkshopUrl',
                  )}/documentation/publish/add-on-policies/${makeQueryStringWithUTM(
                    {
                      utm_medium: 'photon-footer',
                      utm_campaign: null,
                    },
                  )}`}
                >
                  {i18n.gettext('Developer Policies')}
                </a>
              </li>
              <li>
                <a
                  className="Footer-community-blog-link"
                  href={`https://blog.mozilla.com/addons${makeQueryStringWithUTM(
                    {
                      utm_campaign: null,
                      utm_content: 'footer-link',
                      utm_medium: 'referral',
                    },
                  )}`}
                >
                  {i18n.gettext('Community Blog')}
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
                  href="https://developer.mozilla.org/docs/Mozilla/Add-ons/Contact_us"
                >
                  {i18n.gettext('Report a bug')}
                </a>
              </li>
              <li>
                <Link to="/review_guide" prependClientApp={false}>
                  {i18n.gettext('Review Guide')}
                </Link>
              </li>
            </ul>
          </section>
          <section className="Footer-column Footer-download-links">
            <h4 className="Footer-links-header">{i18n.gettext('Download')}</h4>
            <ul className="Footer-links">
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.firefox.com/thanks/${footerLinkQueryString}`}
                >
                  Download Firefox
                </a>
              </li>
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.firefox.com/en-US/download/windows/${footerLinkQueryString}`}
                >
                  Windows
                </a>
              </li>
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.firefox.com/en-US/download/mac/${footerLinkQueryString}`}
                >
                  macOS
                </a>
              </li>
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.firefox.com/en-US/download/ios/${footerLinkQueryString}`}
                >
                  iOS
                </a>
              </li>
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.firefox.com/en-US/download/android/${footerLinkQueryString}`}
                >
                  Android
                </a>
              </li>
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.firefox.com/en-US/download/linux/${footerLinkQueryString}`}
                >
                  Linux
                </a>
              </li>
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.firefox.com/en-US/download/all/${footerLinkQueryString}`}
                >
                  All
                </a>
              </li>
            </ul>
          </section>

          <section className="Footer-column Footer-build-links">
            <section className="Footer-latest-links">
              <h4 className="Footer-links-header">
                {i18n.gettext('Latest Builds')}
              </h4>
              <ul className="Footer-links">
                <li>
                  <a
                    className="Footer-link"
                    href={`https://www.firefox.com/en-US/channel/desktop/#nightly${footerLinkQueryString}`}
                  >
                    Nightly
                  </a>
                </li>
                <li>
                  <a
                    className="Footer-link"
                    href={`https://www.firefox.com/en-US/channel/desktop/#beta${footerLinkQueryString}`}
                  >
                    Beta
                  </a>
                </li>
              </ul>
            </section>

            <section className="Footer-business-links">
              <h4 className="Footer-links-header">
                {i18n.gettext('Firefox for Business')}
              </h4>
              <ul className="Footer-links">
                <li>
                  <a
                    className="Footer-link"
                    href={`https://www.firefox.com/en-US/browsers/enterprise/${footerLinkQueryString}`}
                  >
                    Enterprise
                  </a>
                </li>
              </ul>
            </section>
          </section>

          <section className="Footer-column Footer-community-links">
            <h4 className="Footer-links-header">{i18n.gettext('Community')}</h4>
            <ul className="Footer-links">
              <li>
                <a
                  className="Footer-link"
                  href={`https://connect.mozilla.org/${footerLinkQueryString}`}
                >
                  Connect
                </a>
              </li>
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.mozilla.org/contribute/${footerLinkQueryString}`}
                >
                  Contribute
                </a>
              </li>
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.firefox.com/en-US/channel/desktop/developer/${footerLinkQueryString}`}
                >
                  Developer
                </a>
              </li>
            </ul>
          </section>

          <section className="Footer-column Footer-follow-links">
            <h4 className="Footer-links-header">{i18n.gettext('Follow')}</h4>
            <ul className="Footer-links">
              <li>
                <a
                  className="Footer-link"
                  href={`https://www.instagram.com/firefox`}
                >
                  Instagram
                </a>
              </li>

              <li>
                <a
                  className="Footer-link"
                  href={`https://www.youtube.com/user/firefoxchannel`}
                >
                  YouTube
                </a>
              </li>

              <li>
                <a
                  className="Footer-link"
                  href={`https://www.tiktok.com/@firefox`}
                >
                  TikTok
                </a>
              </li>

              <li>
                <a
                  className="Footer-link"
                  href={`https://bsky.app/profile/firefox.com`}
                >
                  Bluesky
                </a>
              </li>

              <li>
                <a
                  className="Footer-link-social"
                  href={`https://www.youtube.com/@firefox/podcasts`}
                >
                  Podcast
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
                href="https://www.mozilla.org/privacy/websites/"
              >
                {i18n.gettext('Cookies')}
              </a>
            </li>
            <li>
              <a
                className="Footer-legal-link"
                href="https://www.mozilla.org/about/legal/amo-policies/"
              >
                {i18n.gettext('Legal')}
              </a>
            </li>
          </ul>

          <p
            className="Footer-copyright"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeHTML(
              i18n.sprintf(
                includeGoogleDisclaimer
                  ? i18n.gettext(`Except where otherwise
                      %(startNotedLink)snoted%(endNotedLink)s, content on this
                      site is licensed under the %(startLicenseLink)sCreative
                      Commons Attribution Share-Alike License
                      v3.0%(endLicenseLink)s or any later version. Android is a
                      trademark of Google LLC.`)
                  : i18n.gettext(`Except where otherwise
                      %(startNotedLink)snoted%(endNotedLink)s, content on this
                      site is licensed under the %(startLicenseLink)sCreative
                      Commons Attribution Share-Alike License
                      v3.0%(endLicenseLink)s or any later version.`),
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

          <div className="Footer-setting-pickers">
            {!noLangPicker && <LanguagePicker />}
            {!noThemePicker && <ThemePicker />}
          </div>
        </div>
      </footer>
    );
  }
}

const Footer: React.ComponentType<Props> = compose(translate())(FooterBase);

export default Footer;
