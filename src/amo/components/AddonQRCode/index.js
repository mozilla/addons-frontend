/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

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
import qrCode229918 from './img/229918.png';
import qrCode328839 from './img/328839.png';
import qrCode506646 from './img/506646.png';
import qrCode520576 from './img/520576.png';
import qrCode521554 from './img/521554.png';
import qrCode607454 from './img/607454.png';
import qrCode627490 from './img/627490.png';
import qrCode722 from './img/722.png';
import qrCode735894 from './img/735894.png';
import qrCode811592 from './img/811592.png';
import qrCode824288 from './img/824288.png';
import qrCode855413 from './img/855413.png';
import qrCode866226 from './img/866226.png';
import qrCode869140 from './img/869140.png';
import qrCode953945 from './img/953945.png';
import qrCode9609 from './img/9609.png';

export const qrCodeSrcs = {
  '229918': qrCode229918,
  '328839': qrCode328839,
  '506646': qrCode506646,
  '520576': qrCode520576,
  '521554': qrCode521554,
  '607454': qrCode607454,
  '627490': qrCode627490,
  '722': qrCode722,
  '735894': qrCode735894,
  '811592': qrCode811592,
  '824288': qrCode824288,
  '855413': qrCode855413,
  '866226': qrCode866226,
  '869140': qrCode869140,
  '953945': qrCode953945,
  '9609': qrCode9609,
};

export const ADDON_QRCODE_CAMPAIGN = 'addon-qr-code';
export const ADDON_QRCODE_CATEGORY = 'Addon QR Code';
export const ADDON_QRCODE_CLICK_ACTION = 'addon-qr-code-click';
export const ADDON_QRCODE_IMPRESSION_ACTION = 'addon-qr-code-impression';

type Props = {|
  addon: AddonType,
  onDismiss: (e: ElementEvent | null) => void,
|};

export type DeafultProps = {|
  _tracking: typeof tracking,
|};

export type InternalProps = {|
  ...Props,
  ...DeafultProps,
  i18n: I18nType,
|};

export class AddonQRCodeBase extends React.Component<InternalProps> {
  static defaultProps: DeafultProps = {
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
    const { addon, i18n, onDismiss } = this.props;

    const idAsString = String(addon.id);
    const imgSrc = qrCodeSrcs[idAsString];
    invariant(imgSrc, `Could not find a QR code for addonId: ${idAsString}`);

    let addonUrl = addQueryParams(getAddonURL(addon.slug), {
      utm_source: DEFAULT_UTM_SOURCE,
      utm_medium: DEFAULT_UTM_MEDIUM,
      utm_campaign: ADDON_QRCODE_CAMPAIGN,
      utm_content: String(idAsString),
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
          src={qrCodeSrcs[idAsString]}
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
