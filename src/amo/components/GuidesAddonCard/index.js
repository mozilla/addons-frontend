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
import InstallWarning from 'amo/components/InstallWarning';
import { INSTALL_SOURCE_GUIDES_PAGE } from 'core/constants';
import { getAddonIconUrl } from 'core/imageUtils';
import Card from 'ui/components/Card';
import PromotedBadge from 'ui/components/PromotedBadge';
import type { AddonType } from 'core/types/addons';
import type { AppState } from 'amo/store';

import './styles.scss';

type Props = {
  addon: AddonType | null | void,
  addonCustomText: string,
};

type InternalProps = {
  ...Props,
  installError: string | null,
};

export class GuidesAddonCardBase extends React.Component<InternalProps> {
  render() {
    const { addon } = this.props;

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
                  {addon && addon.is_recommended && (
                    <PromotedBadge category="recommended" size="small" />
                  )}
                </div>
              </div>
              <div className="GuidesAddonCard-content-description-button">
                <p className="GuidesAddonCard-content-description">
                  {this.props.addonCustomText}
                </p>
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
          </div>
          {addon && <InstallWarning addon={addon} />}
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
)(GuidesAddonCardBase);

export default GuidesAddonCard;
