/* global window */
import config from 'config';
import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { setLang } from 'core/actions';
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
    dispatch: PropTypes.func.isRequired,
  }

  onChange = (event) => {
    event.preventDefault();
    this.changeLanguage(event.target.value);
  }

  changeLanguage(newLocale) {
    const { currentLocale } = this.props;

    if (currentLocale !== newLocale) {
      const appName = config.get('appName');
      // eslint-disable-next-line max-len, global-require, import/no-dynamic-require
      require(`bundle?name=[name]-i18n-[folder]!../../locale/${newLocale}/${appName}.js`)((i18nData) => {
        this.props.dispatch(setLang(newLocale));
        this.props.dispatch({ type: 'SET_I18N', payload: i18nData });
      });
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
