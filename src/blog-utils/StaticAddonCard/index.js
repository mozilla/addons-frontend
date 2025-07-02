/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import { ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import { getAddonIconUrl } from 'amo/imageUtils';
import AddonBadges from 'amo/components/AddonBadges';
import AddonTitle from 'amo/components/AddonTitle';
import GetFirefoxButton from 'amo/components/GetFirefoxButton';
import ThemeImage from 'amo/components/ThemeImage';
import type { AddonType } from 'amo/types/addons';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

export const StaticAddonCardBase = ({ addon }: Props): React.Node => {
  if (!addon) {
    return null;
  }

  const isTheme = addon.type === ADDON_TYPE_STATIC_THEME;

  return (
    <div
      className={makeClassName('StaticAddonCard', {
        'StaticAddonCard--is-theme': isTheme,
      })}
      data-addon-id={addon.id}
    >
      {isTheme ? (
        <div className="StaticAddonCard-theme-preview">
          <ThemeImage addon={addon} roundedCorners />
        </div>
      ) : (
        <div className="StaticAddonCard-icon">
          <div className="StaticAddonCard-icon-wrapper">
            <img
              className="StaticAddonCard-icon-image"
              src={getAddonIconUrl(addon)}
              alt=""
            />
          </div>
        </div>
      )}

      <AddonTitle addon={addon} linkToAddon />

      <AddonBadges addon={addon} />

      <div className="StaticAddonCard-summary">
        <p>{addon.summary}</p>
      </div>

      <div className="StaticAddonCard-firefox-button">
        <GetFirefoxButton
          addon={addon}
          overrideQueryParams={{
            utm_campaign: `amo-blog-fx-cta-${addon.id}`,
            experiment: null,
            variation: null,
          }}
        />
      </div>

      <div className="StaticAddonCard-error-overlay">
        <p>This extension is not currently available.</p>
      </div>
    </div>
  );
};

const StaticAddonCard: React.ComponentType<Props> = StaticAddonCardBase;
export default StaticAddonCard;
