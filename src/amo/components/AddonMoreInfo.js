import React, { PropTypes } from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';

import './AddonMoreInfo.scss';


export class AddonMoreInfoBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { addon, i18n } = this.props;

    let homepage = addon.homepage ? addon.homepage.trim() : null;
    if (homepage && !homepage.match(/^https?:\/\//)) {
      homepage = `http://${homepage}`;
    }

    return (
      <Card className="AddonMoreInfo" header={i18n.gettext('More information')}>
        <dl className="AddonMoreInfo-contents">
          {addon.homepage ? <dt>{i18n.gettext('Website')}</dt> : null}
          {homepage ? (
            <dd>
              <a href={homepage}
                ref={(ref) => { this.homepageLink = ref; }}>
                {homepage.replace(/^https?:\/\//, '')}
              </a>
            </dd>
          ) : null}
          <dt>{i18n.gettext('Version')}</dt>
          <dd ref={(ref) => { this.version = ref; }}>
            {addon.current_version.version}
          </dd>
          <dt>{i18n.gettext('Last updated')}</dt>
          <dd>
            {i18n.sprintf(
              // L10n: This will output, in English:
              // "2 months ago (Dec 12 2016)"
              i18n.gettext('%(timeFromNow)s (%(date)s)'), {
                timeFromNow: i18n.moment(addon.last_updated).fromNow(),
                date: i18n.moment(addon.last_updated).format('ll'),
              }
            )}
          </dd>
          {addon.current_version.license ? (
            <dt ref={(ref) => { this.licenseHeader = ref; }}>
              {i18n.gettext('License')}
            </dt>
          ) : null}
          {addon.current_version.license ? (
            <dd>
              <a href={addon.current_version.license.url}
                ref={(ref) => { this.licenseLink = ref; }}>
                {addon.current_version.license.name}</a>
            </dd>
          ) : null}
          {addon.has_privacy_policy ? (
            <dt>{i18n.gettext('Privacy Policy')}</dt>
          ) : null}
          {addon.has_privacy_policy ? (
            <dd>
              <a href={`/addon/${addon.slug}/privacy/`}
                ref={(ref) => { this.privacyPolicyLink = ref; }}>
                {i18n.gettext('Read the privacy policy for this add-on')}
              </a>
            </dd>
          ) : null}
        </dl>
      </Card>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(AddonMoreInfoBase);
