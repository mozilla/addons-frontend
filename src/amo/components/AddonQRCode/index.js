/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import config from 'config';

import {
  CLIENT_APP_ANDROID,
  DEFAULT_UTM_SOURCE,
  DEFAULT_UTM_MEDIUM,
} from 'amo/constants';
import Link from 'amo/components/Link';
import Button from 'amo/components/Button';
import IconXMark from 'amo/components/IconXMark';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import tracking from 'amo/tracking';
import { getAddonURL } from 'amo/utils';
import { addQueryParams } from 'amo/utils/url';
import translate from 'amo/i18n/translate';
import type { AddonType } from 'amo/types/addons';
import type { ElementEvent } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const ADDON_QRCODE_CAMPAIGN = 'addon-qr-code';
export const ADDON_QRCODE_CATEGORY = 'Addon QR Code';
export const ADDON_QRCODE_CLICK_ACTION = 'addon-qr-code-click';
export const ADDON_QRCODE_IMPRESSION_ACTION = 'addon-qr-code-impression';

type Props = {|
  addon: AddonType,
  onDismiss: (e: ElementEvent | null) => void,
|};

export type DeafultProps = {|
  _config: typeof config,
  _tracking: typeof tracking,
|};

export type InternalProps = {|
  ...Props,
  ...DeafultProps,
  i18n: I18nType,
|};

export class AddonQRCodeBase extends React.Component<InternalProps> {
  static defaultProps: DeafultProps = {
    _config: config,
    _tracking: tracking,
  };

  onInteract: (action: string) => void = (action) => {
    const { _tracking, addon } = this.props;

    _tracking.sendEvent({
      action,
      category: ADDON_QRCODE_CATEGORY,
      label: String(addon.id),
    });
  };

  onLinkClick: () => void = () => {
    this.onInteract(ADDON_QRCODE_CLICK_ACTION);
    this.props.onDismiss(null);
  };

  componentDidMount() {
    this.onInteract(ADDON_QRCODE_IMPRESSION_ACTION);
  }

  render(): React.Node {
    const { _config, addon, i18n, onDismiss } = this.props;

    invariant(
      _config.get('addonIdsWithQRCodes').includes(addon.id),
      `Could not find a QR code for addonId: ${addon.id}`,
    );

    let addonUrl = addQueryParams(getAddonURL(addon.slug), {
      utm_source: DEFAULT_UTM_SOURCE,
      utm_medium: DEFAULT_UTM_MEDIUM,
      utm_campaign: ADDON_QRCODE_CAMPAIGN,
      utm_content: String(addon.id),
    });
    addonUrl = `/${CLIENT_APP_ANDROID}${addonUrl}`;

    const labelText = i18n.sprintf(
      i18n.gettext(
        'To get %(addonName)s on Firefox for Android, point your device camera to the code above or copy %(linkStart)sthis link%(linkEnd)s',
      ),
      {
        addonName: addon.name,
        // Keep the link placeholders so that we can use them to inject a
        // `<Link />` using `replaceStringsWithJSX`.
        linkStart: '%(linkStart)s',
        linkEnd: '%(linkEnd)s',
      },
    );
    const altText = i18n.sprintf(
      i18n.gettext('Get %(addonName)s for Android'),
      {
        addonName: addon.name,
      },
    );

    const labelWithLink = replaceStringsWithJSX({
      text: labelText,
      replacements: [
        [
          'linkStart',
          'linkEnd',
          (text) => (
            <Link
              className="AddonQRCode-link"
              key={addon.slug}
              onClick={this.onLinkClick}
              prependClientApp={false}
              to={addonUrl}
            >
              {text}
            </Link>
          ),
        ],
      ],
    });

    return (
      <div className="AddonQRCode">
        <div className="AddonQRCode-dismisser">
          <Button className="AddonQRCode-dismisser-button" onClick={onDismiss}>
            <IconXMark
              className="AddonQRCode-dismisser-icon"
              alt={i18n.gettext('Dismiss this message')}
            />
          </Button>
        </div>
        <img
          alt={altText}
          className="AddonQRCode-img"
          src={`${config.get('staticPath')}${addon.id}.png?v=1`}
        />
        <div className="AddonQRCode-label">{labelWithLink}</div>
      </div>
    );
  }
}

const AddonQRCode: React.ComponentType<Props> = compose(translate())(
  AddonQRCodeBase,
);

export default AddonQRCode;
