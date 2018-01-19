import React from 'react';
import PropTypes from 'prop-types';
import onClickOutside from 'react-onclickoutside';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import './InfoDialog.scss';

class InfoDialogRaw extends React.Component {
  static propTypes = {
    addonName: PropTypes.string.isRequired,
    closeAction: PropTypes.func.isRequired,
    imageURL: PropTypes.string.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  handleClickOutside = () => {
    this.props.closeAction();
  }

  render() {
    const { addonName, closeAction, i18n, imageURL } = this.props;
    return (
      <div
        className="show-info"
        role="dialog"
        aria-labelledby="show-info-title"
        aria-describedby="show-info-description"
      >
        <div className="info">
          <div className="logo">
            <img src={imageURL} alt="" />
          </div>
          <div className="copy">
            <h3 id="show-info-title">{i18n.gettext('Your add-on is ready')}</h3>
            <p id="show-info-description">{i18n.sprintf(
              i18n.gettext('Now you can access %(name)s from the toolbar.'),
              { name: addonName })}
            </p>
          </div>
        </div>
        <button
          ref={(button) => { if (button != null) { button.focus(); } }}
          onClick={closeAction}
        >
          {i18n.gettext('OK!')}
        </button>
      </div>
    );
  }
}

export const InfoDialogBase = compose(
  translate(),
  onClickOutside,
)(InfoDialogRaw);

export const ShowInfoDialog = ({ data, show }) => (
  show ? <InfoDialogBase {...data} /> : null
);
ShowInfoDialog.propTypes = {
  data: PropTypes.object.isRequired,
  show: PropTypes.bool.isRequired,
};

export const mapStateToProps = (state) => state.infoDialog;

export default compose(
  connect(mapStateToProps),
)(ShowInfoDialog);
