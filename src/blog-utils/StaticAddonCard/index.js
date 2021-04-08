/* @flow */
import * as React from 'react';

import { getAddonIconUrl } from 'amo/imageUtils';
import { nl2br, sanitizeHTML } from 'amo/utils';
import AddonBadges from 'amo/components/AddonBadges';
import AddonTitle from 'amo/components/AddonTitle';
import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
} from 'amo/components/GetFirefoxButton';
import type { AddonType } from 'amo/types/addons';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

const StaticAddonCard = ({ addon }: Props): React.Node => {
  if (!addon) {
    return null;
  }

  const summary = addon.summary ? addon.summary : addon.description;

  return (
    <div className="StaticAddonCard" data-addon-id={addon.id}>
      <div className="AddonIcon">
        <div className="AddonIconWrapper">
          <img className="AddonIconImage" src={getAddonIconUrl(addon)} alt="" />
        </div>
      </div>

      <AddonTitle addon={addon} />

      <AddonBadges addon={addon} />

      <p
        className="AddonSummary"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={sanitizeHTML(nl2br(summary), ['a', 'br'])}
      />

      <GetFirefoxButton
        addon={addon}
        buttonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
        className="AddonFirefoxButton"
      />
    </div>
  );
};

export default StaticAddonCard;
