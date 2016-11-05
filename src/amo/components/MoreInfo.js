import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';

import './MoreInfo.scss';


export class MoreInfoBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    versionDetails: PropTypes.object,
  }

  render() {
    const { addon, i18n, versionDetails } = this.props;
    const license = versionDetails ? versionDetails.license : null;

    if (versionDetails && versionDetails.loading) {
      return (
        <section className="MoreInfo">
          <h2 className="MoreInfo-header">{i18n.gettext('More information')}</h2>
          <div className="MoreInfo-contents">Loading...</div>
        </section>
      );
    }

    // TODO: Use the addonType for the privacy text, so it reads
    // "for this extension", "for this theme", etc.
    return (
      <section className="MoreInfo">
        <h2 className="MoreInfo-header">{i18n.gettext('More information')}</h2>

        <dl className="MoreInfo-contents">
          {addon.homepage ? <dt>{i18n.gettext('Website')}</dt> : null}
          {addon.homepage ? (
            <dd>
              <a href={addon.homepage}
                ref={(ref) => { this.homepageLink = ref; }}>{addon.homepage}</a>
            </dd>
          ) : null}
          <dt>{i18n.gettext('Version')}</dt>
          <dd>{addon.current_version.version}</dd>
          <dt>{i18n.gettext('Last updated')}</dt>
          <dd>{addon.last_updated}</dd>
          {license ? (
            <dt ref={(ref) => { this.licenseHeader = ref; }}>
              {i18n.gettext('License')}
            </dt>
          ) : null}
          {license ? (
            <dd>
              <a href={license.url}
                ref={(ref) => { this.licenseLink = ref; }}>{license.name}</a>
            </dd>
          ) : null}
          {addon.has_privacy_policy ?
            <dt>{i18n.gettext('Privacy Policy')}</dt> : null}
          {addon.has_privacy_policy ?
            (
              <dd>
                <Link to={`/addons/addon/${addon.slug}/privacy-policy/`}
                  ref={(ref) => { this.privacyPolicyLink = ref; }}>
                  {i18n.gettext('Read the privacy policy for this add-on')}
                </Link>
              </dd>
            ) : null
          }
          {versionDetails && versionDetails.error ? 'VersionLoad failed' : null}
        </dl>
      </section>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(MoreInfoBase);
