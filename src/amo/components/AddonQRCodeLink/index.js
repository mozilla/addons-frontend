/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import { CLIENT_APP_ANDROID } from 'amo/constants';
import AddonQRCode from 'amo/components/AddonQRCode';
import Button from 'amo/components/Button';
import OverlayCard from 'amo/components/OverlayCard';
import translate from 'amo/i18n/translate';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

export type DeafultProps = {|
  _config: typeof config,
|};

type PropsFromState = {|
  clientApp: string,
|};

export type InternalProps = {|
  ...Props,
  ...DeafultProps,
  ...PropsFromState,
  i18n: I18nType,
|};

type State = {|
  showQRCode: boolean,
|};

export class AddonQRCodeLinkBase extends React.Component<InternalProps, State> {
  static defaultProps: DeafultProps = {
    _config: config,
  };

  constructor(props: InternalProps) {
    super(props);

    this.state = {
      showQRCode: false,
    };
  }

  onShowQRCode: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    this.setState({ showQRCode: true });
  };

  onHideQRCode: () => void = () => {
    this.setState({ showQRCode: false });
  };

  render(): React.Node | null {
    const { _config, addon, clientApp, i18n } = this.props;

    if (
      !_config.get('addonIdsWithQRCodes').includes(addon.id) ||
      clientApp === CLIENT_APP_ANDROID ||
      !_config.get('enableFeatureAddonQRCode')
    ) {
      return null;
    }

    const overlayClassName = 'AddonQRCodeLink-modal';

    return (
      <div className="AddonQRCodeLink">
        <Button
          buttonType="none"
          className="AddonQRCodeLink-button"
          onClick={this.onShowQRCode}
          type="button"
        >
          {i18n.gettext('Also available on Firefox for Android')}
        </Button>
        {this.state.showQRCode && (
          <OverlayCard
            onEscapeOverlay={this.onHideQRCode}
            className={overlayClassName}
            id={overlayClassName}
            visibleOnLoad
          >
            <AddonQRCode addon={addon} onDismiss={this.onHideQRCode} />
          </OverlayCard>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    clientApp: state.api.clientApp,
  };
};

const AddonQRCodeLink: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonQRCodeLinkBase);

export default AddonQRCodeLink;
