/* global window */
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import languages from 'amo/languages';
import translate from 'amo/i18n/translate';
import { addQueryParams } from 'amo/utils/url';

import './styles.scss';

export function changeLocaleURL({ currentLocale, location, newLocale }) {
  const newPath = location.pathname.replace(
    new RegExp(`^/${currentLocale}/`),
    `/${newLocale}/`,
  );
  return addQueryParams(newPath, location.query);
}

export class LanguagePickerBase extends React.Component {
  static propTypes = {
    currentLocale: PropTypes.string.isRequired,
    jed: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    _window: PropTypes.object,
  };

  onChange = (event) => {
    event.preventDefault();
    this.changeLanguage(event.target.value);
  };

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
    const { currentLocale, jed } = this.props;

    return (
      <div className="LanguagePicker">
        <label htmlFor="lang-picker" className="LanguagePicker-header">
          {jed.gettext('Change language')}
        </label>
        <select
          className="LanguagePicker-selector"
          defaultValue={currentLocale}
          id="lang-picker"
          onChange={this.onChange}
        >
          {Object.keys(languages).map((locale) => (
            <option key={locale} value={locale}>
              {languages[locale].native}
            </option>
          ))}
        </select>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return { currentLocale: state.api.lang };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(LanguagePickerBase);
