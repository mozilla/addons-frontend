import React from 'react';

import { gettext as _ } from 'core/utils';


export default class AppView extends React.Component {
  render() {
    return (
      <div id="app-view">
        <h1>{_('HELLO DISCO WORLD')}</h1>
      </div>
    );
  }
}
