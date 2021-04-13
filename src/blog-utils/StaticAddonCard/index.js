/* @flow */
import * as React from 'react';

import { getAddonIconUrl } from 'amo/imageUtils';
import { nl2br, sanitizeHTML } from 'amo/utils';
import AddonBadges from 'amo/components/AddonBadges';
import AddonTitle from 'amo/components/AddonTitle';
import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
} from 'amo/components/GetFirefoxButton';
import Rating from 'amo/components/Rating';
import translate from 'amo/i18n/translate';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const StaticAddonCardBase = ({
  addon,
  i18n,
}: InternalProps): React.Node => {
  if (!addon) {
    return null;
  }

  const summary = addon.summary ? addon.summary : addon.description;
  const averageRating = addon.ratings ? addon.ratings.average : null;
  const averageDailyUsers = addon.average_daily_users || null;

  return (
    <div className="StaticAddonCard" data-addon-id={addon.id}>
      <div className="StaticAddonCard-icon">
        <div className="StaticAddonCard-icon-wrapper">
          <img
            className="StaticAddonCard-icon-image"
            src={getAddonIconUrl(addon)}
            alt=""
          />
        </div>
      </div>

      <AddonTitle addon={addon} />

      <AddonBadges addon={addon} />

      <div className="StaticAddonCard-summary">
        <p
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={sanitizeHTML(nl2br(summary), ['a', 'br'])}
        />
      </div>

      <div className="StaticAddonCard-metadata">
        {averageRating && (
          <Rating rating={averageRating} readOnly styleSize="small" />
        )}

        {averageDailyUsers && (
          <p className="StaticAddonCard-metadata-adu">
            Users: {i18n.formatNumber(averageDailyUsers)}
          </p>
        )}
      </div>

      <div className="StaticAddonCard-firefox-button">
        <GetFirefoxButton
          addon={addon}
          buttonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
          useNewVersion
        />
      </div>
    </div>
  );
};

const StaticAddonCard: React.ComponentType<Props> = translate()(
  StaticAddonCardBase,
);

export default StaticAddonCard;
