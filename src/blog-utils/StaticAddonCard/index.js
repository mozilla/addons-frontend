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

type PublicProps = {|
  addon: AddonType,
|};

type Props = {|
  ...PublicProps,
  i18n: I18nType,
|};

export const StaticAddonCardBase = ({ addon, i18n }: Props): React.Node => {
  if (!addon) {
    return null;
  }

  const summary = addon.summary ? addon.summary : addon.description;
  const averageRating = addon.ratings ? addon.ratings.average : null;
  const averageDailyUsers = addon.average_daily_users || null;

  return (
    <div className="StaticAddonCard" data-addon-id={addon.id}>
      <div className="AddonIcon">
        <div className="AddonIconWrapper">
          <img className="AddonIconImage" src={getAddonIconUrl(addon)} alt="" />
        </div>
      </div>

      <AddonTitle addon={addon} />

      <AddonBadges addon={addon} />

      <div className="AddonSummary">
        <p
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={sanitizeHTML(nl2br(summary), ['a', 'br'])}
        />
      </div>

      <div className="AddonMetadata">
        {averageRating && (
          <Rating rating={averageRating} readOnly styleSize="small" />
        )}

        {averageDailyUsers && (
          <p className="AddonMetadata-adu">
            Users: {i18n.formatNumber(averageDailyUsers)}
          </p>
        )}
      </div>

      <div className="AddonFirefoxButton">
        <GetFirefoxButton
          addon={addon}
          buttonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
        />
      </div>
    </div>
  );
};

const StaticAddonCard: React.ComponentType<PublicProps> = translate()(
  StaticAddonCardBase,
);

export default StaticAddonCard;
