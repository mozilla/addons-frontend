import React, { PropTypes } from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';

import './LanguagePicker.scss';


export class LanguagePickerBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    return (
      <div className="LanguagePicker">
        <h3 className="LanguagePicker-header">
          {i18n.gettext('Browse in your language')}
        </h3>
        <select className="LanguagePicker-selector"
          ref={(ref) => { this.selector = ref; }}>
          <option value="en-US">English (US)</option>
        </select>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(LanguagePickerBase);
