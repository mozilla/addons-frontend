import React from 'react';

import { gettext as _ } from 'core/utils';

import 'disco/css/InstallButton.scss';


export default class InstallButton extends React.Component {
  render() {
    return (
      <div className="switch">
        <input type="checkbox" className="visually-hidden" />
        <label>
          <span className="visually-hidden">{_('Install')}</span>
        </label>
      </div>
    );
  }
}
