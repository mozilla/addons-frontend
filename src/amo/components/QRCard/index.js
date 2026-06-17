/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import QRCode from 'react-qr-code';

import type { AddonType } from 'amo/types/addons';
import type { AppState } from 'amo/store';
import { getAddonListingURL } from 'amo/utils';
import translate from 'amo/i18n/translate';
import type { I18nType } from 'amo/types/i18n';
import { CLIENT_APP_ANDROID, QR_CODE_UTM_CAMPAIGN } from 'amo/constants';

import './styles.scss';
import KitQR from './img/kit-qr.svg';

export type Props = {|
  addon: AddonType,
|};

type PropsFromState = {|
  lang: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
|};

export class QRCardBase extends React.Component<InternalProps> {
  render(): React.Node {
    const { addon, i18n, lang } = this.props;
    const downloadLink = getAddonListingURL({
      addon,
      clientApp: CLIENT_APP_ANDROID,
      lang,
      utmCampaign: QR_CODE_UTM_CAMPAIGN,
      utmContent: addon.slug,
    });
    return (
      <div className="qr-card">
        <div className="qr-label">
          {i18n.gettext(
            'Scan the QR code to open this extension in Firefox for Android',
          )}
        </div>
        <div className="kit-qr-wrapper">
          <div className="kit-wrapper">
            <img className="qr-kit-svg" src={KitQR} alt="" />
          </div>
          <div className="qr-wrapper">
            <QRCode
              className="qr-code"
              href={downloadLink}
              value={downloadLink}
            />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: AppState): PropsFromState {
  return {
    lang: state.api.lang,
  };
}

const QRCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(QRCardBase);

export default QRCard;
