import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';

import 'amo/css/SearchBox.scss';


export class SearchBoxBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.shape({}).isRequired,
  }

  render() {
    const { i18n } = this.props;

    // This is just a placeholder.
    return (
      <div className="SearchBox">
        <span className="visually-hidden">{i18n.gettext('Search')}</span>
      </div>
    );
  }
}

export default translate({ withRef: true })(SearchBoxBase);
