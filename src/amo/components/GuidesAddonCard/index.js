/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import makeClassName from 'classnames';

import AddonTitle from 'amo/components/AddonTitle';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import { GET_FIREFOX_BUTTON_TYPE_ADDON } from 'amo/components/GetFirefoxButton';
import AddonInstallError from 'amo/components/AddonInstallError';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import { INSTALL_SOURCE_GUIDES_PAGE } from 'core/constants';
import { getAddonIconUrl } from 'core/imageUtils';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import type { AddonType } from 'core/types/addons';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {
  addon: AddonType | null | void,
  addonCustomText: string,
  staffPick?: boolean,
};

type InternalProps = {
  ...Props,
  installError: string | null,
  i18n: I18nType,
};

export class GuidesAddonCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    staffPick: true,
  };

  render() {
    const { addon, i18n, staffPick } = this.props;

    return addon !== null ? (
      <Card>
        <AddonInstallError error={this.props.installError} />
        <div className="GuidesAddonCard">
          {addon && <AddonCompatibilityError addon={addon} />}
          <div className="GuidesAddonCard-content">
            {addon && (
              <img
                className="GuidesAddonCard-content-icon"
                src={getAddonIconUrl(addon)}
                alt={addon.name}
              />
            )}
            <div className="GuidesAddonCard-content-text">
              <div className="GuidesAddonCard-content-header">
                <div
                  className={makeClassName(
                    'GuidesAddonCard-content-header-title',
                    {
                      'GuidesAddonCard-content-header-title--loading':
                        addon === undefined,
                    },
                  )}
                >
                  <span className="GuidesAddonCard-content-header-authors">
                    <AddonTitle
                      addon={addon === undefined ? null : addon}
                      as="span"
                      linkToAddon
                    />
                  </span>
                  {staffPick && (
                    <span className="GuidesAddonCard-content-header-staff-pick">
                      <Icon name="trophy" />
                      <span>{i18n.gettext('Staff Pick')}</span>
                    </span>
                  )}
                </div>
              </div>
              <p className="GuidesAddonCard-content-description">
                {this.props.addonCustomText}
              </p>
            </div>
            {addon && (
              <InstallButtonWrapper
                addon={addon}
                defaultInstallSource={INSTALL_SOURCE_GUIDES_PAGE}
                getFirefoxButtonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
                puffy={false}
              />
            )}
          </div>
        </div>
      </Card>
    ) : null;
  }
}

export const mapStateToProps = (
  state: AppState,
  ownProps: Props,
): $Shape<InternalProps> => {
  const { addon } = ownProps;

  let installedAddon = {};

  if (addon) {
    installedAddon = state.installations[addon.guid];
  }

  return {
    installError:
      installedAddon && installedAddon.error ? installedAddon.error : null,
  };
};

const GuidesAddonCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(GuidesAddonCardBase);

export default GuidesAddonCard;
