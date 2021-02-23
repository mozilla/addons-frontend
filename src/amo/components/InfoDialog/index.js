/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import onClickOutside from 'react-onclickoutside';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { closeInfoDialog } from 'amo/reducers/infoDialog';
import translate from 'amo/i18n/translate';
import { sanitizeHTML } from 'amo/utils';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type Props = {||};

type InternalProps = {|
  ...Props,
  addonName: string | null,
  dispatch: DispatchFunc,
  i18n: I18nType,
  imageURL: string | null,
  show: boolean,
|};

export class InfoDialogBase extends React.Component<InternalProps> {
  closeInfoDialog: () => void = () => {
    this.props.dispatch(closeInfoDialog());
  };

  handleClickOutside: () => void = () => {
    this.closeInfoDialog();
  };

  render(): null | React.Element<'div'> {
    const { addonName, i18n, imageURL, show } = this.props;

    if (!show) {
      return null;
    }

    invariant(addonName, 'addonName is required when show=true');
    invariant(imageURL, 'imageURL is required when show=true');

    return (
      <div
        className="InfoDialog"
        role="dialog"
        aria-labelledby="InfoDialog-title"
        aria-describedby="InfoDialog-description"
      >
        <div className="InfoDialog-info">
          <div className="InfoDialog-logo">
            <img src={imageURL} alt={addonName} />
          </div>
          <div className="InfoDialog-copy">
            <p
              className="InfoDialog-title"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(
                    `%(strongStart)s%(name)s%(strongEnd)s has been added`,
                  ),
                  {
                    name: addonName,
                    strongEnd: '</strong>',
                    strongStart: '<strong>',
                  },
                ),
                ['strong'],
              )}
            />
            <p className="InfoDialog-description">
              {i18n.gettext(
                'Manage your add-ons by clicking Add-ons in the menu.',
              )}
            </p>
          </div>
        </div>
        <button
          className="InfoDialog-button"
          onClick={this.closeInfoDialog}
          type="button"
        >
          {i18n.gettext('OK')}
        </button>
      </div>
    );
  }
}

export const mapStateToProps = (
  state: AppState,
): {| addonName: string | null, imageURL: string | null, show: boolean |} => {
  const { data, show } = state.infoDialog;

  return {
    addonName: data ? data.addonName : null,
    imageURL: data ? data.imageURL : null,
    show,
  };
};

const InfoDialog: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  // This HOC must be positioned last.
  onClickOutside,
)(InfoDialogBase);

export default InfoDialog;
