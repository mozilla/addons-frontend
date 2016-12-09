/* global window */
import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import languages from 'core/languages';
import translate from 'core/i18n/translate';
import { addQueryParams } from 'core/utils';

import './LanguagePicker.scss';


export function changeLocaleURL({ currentLocale, location, newLocale }) {
  const newPath = location.pathname.replace(new RegExp(`^/${currentLocale}/`),
    `/${newLocale}/`);
  return addQueryParams(newPath, location.query);
}

export class LanguagePickerBase extends React.Component {
  static propTypes = {
    currentLocale: PropTypes.string.isRequired,
    i18n: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    _window: PropTypes.object,
  }

  onChange = (event) => {
    event.preventDefault();
    this.changeLanguage(event.target.value);
  }

  changeLanguage(newLocale) {
    const { currentLocale, location, _window } = this.props;

    if (currentLocale !== newLocale) {
      const newURL = changeLocaleURL({ currentLocale, location, newLocale });
      // We change location because a locale change requires a full page
      // reload to get the new translations, etc.
      (_window || window).location = newURL;
    }
  }

  render() {
    const { currentLocale, i18n } = this.props;

    return (
      <div className="LanguagePicker">
        <h3 className="LanguagePicker-header">
          {i18n.gettext('Browse in your language')}
        </h3>
        <select className="LanguagePicker-selector" defaultValue={currentLocale}
          ref={(ref) => { this.selector = ref; }} onChange={this.onChange}>
          {Object.keys(languages).map((locale) => (
            <option value={locale}>{languages[locale].native}</option>
          ))}
        </select>
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return { currentLocale: state.api.lang };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(LanguagePickerBase);
