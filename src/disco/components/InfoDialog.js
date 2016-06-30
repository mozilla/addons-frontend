import React, { PropTypes } from 'react';
import translate from 'core/i18n/translate';

import 'disco/css/InfoDialog.scss';

export class InfoDialog extends React.Component {
  static propTypes = {
    addonName: PropTypes.string.isRequired,
    closeAction: PropTypes.func.isRequired,
    imageURL: PropTypes.string.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { addonName, closeAction, i18n, imageURL } = this.props;
    return (
      <div className="show-info" role="dialog"
           aria-labelledby="show-info-title" aria-describedby="show-info-description">
        <div className="info">
          <div className="logo">
            <img src={imageURL} alt="" />
          </div>
          <div className="copy">
            <h3 id="show-info-title">{i18n.gettext('Your add-on is ready')}</h3>
            <p id="show-info-description">{i18n.sprintf(
              i18n.gettext('Now you can access %(name)s from the toolbar.'),
              { name: addonName })}</p>
          </div>
        </div>
        <button ref={(button) => { if (button != null) { button.focus(); } }}
          onClick={closeAction}>{i18n.gettext('OK!')}</button>
      </div>
    );
  }
}

export default translate()(InfoDialog);
