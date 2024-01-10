/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import config from 'config';

import LanguagePicker from 'amo/components/LanguagePicker';
import Link from 'amo/components/Link';
import { makeQueryStringWithUTM, sanitizeHTML } from 'amo/utils';
import translate from 'amo/i18n/translate';
import Icon from 'amo/components/Icon';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  noLangPicker?: boolean,
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
  };

  renderCopyRightText(): React.Node {
    const { includeGoogleDisclaimer, i18n } = this.props;

    let copyRightText = i18n.t(
      'Except where otherwise %(startNotedLink)snoted%(endNotedLink)s, content on this site is licensed under the %(startLicenseLink)sCreative Commons Attribution Share-Alike License v3.0%(endLicenseLink)s or any later version.',
      {
        startNotedLink: '<a href="https://www.mozilla.org/en-US/about/legal/">',
        endNotedLink: '</a>',
        startLicenseLink:
          '<a href="https://creativecommons.org/licenses/by-sa/3.0/">',
        endLicenseLink: '</a>',
      },
    );

    if (includeGoogleDisclaimer) {
      copyRightText += ` ${i18n.t('Android is a trademark of Google LLC.')}`;
    }

    return (
      <p
        className="Footer-copyright"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={sanitizeHTML(copyRightText, ['a'])}
      />
    );
  }

  render(): React.Node {
    const { _config, i18n, noLangPicker } = this.props;
    const homepageText = i18n.t("Go to Mozilla's homepage");

    const copyRightText = this.renderCopyRightText();

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
              <Link href="/">{i18n.t('Add-ons')}</Link>
            </h4>
            <ul className="Footer-links">
              <li>
                <Link to="/about" prependClientApp={false}>
                  {i18n.t('About')}
                </Link>
              </li>
              <li>
                <a className="Footer-blog-link" href="/blog/">
                  {i18n.t('Firefox Add-ons Blog')}
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
                  {i18n.t('Extension Workshop')}
                </a>
              </li>
              <li>
                <Link href="/developers/" prependClientApp={false}>
                  {i18n.t('Developer Hub')}
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
                  {i18n.t('Developer Policies')}
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
                  {i18n.t('Community Blog')}
                </a>
              </li>
              <li>
                <a href="https://discourse.mozilla-community.org/c/add-ons">
                  {i18n.t('Forum')}
                </a>
              </li>
              <li>
                <a
                  className="Footer-bug-report-link"
                  href="https://developer.mozilla.org/docs/Mozilla/Add-ons/Contact_us"
                >
                  {i18n.t('Report a bug')}
                </a>
              </li>
              <li>
                <Link to="/review_guide" prependClientApp={false}>
                  {i18n.t('Review Guide')}
                </Link>
              </li>
            </ul>
          </section>

          <section className="Footer-browsers-links">
            <h4 className="Footer-links-header">{i18n.t('Browsers')}</h4>
            <ul className="Footer-links">
              <li>
                <a
                  className="Footer-desktop-link"
                  href={`https://www.mozilla.org/firefox/new/${makeQueryStringWithUTM(
                    {
                      utm_content: 'footer-link',
                      utm_campaign: null,
                    },
                  )}`}
                >
                  Desktop
                </a>
              </li>
              <li>
                <a
                  className="Footer-mobile-link"
                  href={`https://www.mozilla.org/firefox/mobile/${makeQueryStringWithUTM(
                    {
                      utm_content: 'footer-link',
                      utm_campaign: null,
                    },
                  )}`}
                >
                  Mobile
                </a>
              </li>
              <li>
                <a
                  className="Footer-enterprise-link"
                  href={`https://www.mozilla.org/firefox/enterprise/${makeQueryStringWithUTM(
                    {
                      utm_content: 'footer-link',
                      utm_campaign: null,
                    },
                  )}`}
                >
                  Enterprise
                </a>
              </li>
            </ul>
          </section>

          <section className="Footer-product-links">
            <h4 className="Footer-links-header">{i18n.t('Products')}</h4>
            <ul className="Footer-links">
              <li>
                <a
                  className="Footer-browsers-link"
                  href={`https://www.mozilla.org/firefox/browsers/${makeQueryStringWithUTM(
                    {
                      utm_content: 'footer-link',
                      utm_campaign: null,
                    },
                  )}`}
                >
                  Browsers
                </a>
              </li>
              <li>
                <a
                  className="Footer-vpn-link"
                  href={`https://www.mozilla.org/products/vpn/${makeQueryStringWithUTM(
                    {
                      utm_content: 'footer-link',
                      utm_campaign: null,
                    },
                  )}#pricing`}
                >
                  VPN
                </a>
              </li>
              <li>
                <a
                  className="Footer-relay-link"
                  href={`https://relay.firefox.com/${makeQueryStringWithUTM({
                    utm_content: 'footer-link',
                    utm_campaign: null,
                  })}`}
                >
                  Relay
                </a>
              </li>
              <li>
                <a
                  className="Footer-monitor-link"
                  href={`https://monitor.firefox.com/${makeQueryStringWithUTM({
                    utm_content: 'footer-link',
                    utm_campaign: null,
                  })}`}
                >
                  Monitor
                </a>
              </li>
              <li>
                <a
                  className="Footer-pocket-link"
                  href={`https://getpocket.com${makeQueryStringWithUTM({
                    utm_content: 'footer-link',
                    utm_campaign: null,
                  })}`}
                >
                  Pocket
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
                <a href="https://www.instagram.com/firefox/">
                  <Icon name="instagram" alt="Instagram (Firefox)" />
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
                {i18n.t('Privacy')}
              </a>
            </li>
            <li>
              <a
                className="Footer-cookies-link"
                href="https://www.mozilla.org/privacy/websites/"
              >
                {i18n.t('Cookies')}
              </a>
            </li>
            <li>
              <a
                className="Footer-legal-link"
                href="https://www.mozilla.org/about/legal/terms/mozilla/"
              >
                {i18n.t('Legal')}
              </a>
            </li>
          </ul>

          {copyRightText}

          {!noLangPicker && (
            <div className="Footer-language-picker">
              <LanguagePicker />
            </div>
          )}
        </div>
      </footer>
    );
  }
}

const Footer: React.ComponentType<Props> = compose(translate())(FooterBase);

export default Footer;
