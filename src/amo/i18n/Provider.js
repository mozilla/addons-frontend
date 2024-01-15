import * as React from 'react';
import PropTypes from 'prop-types';
import { IntlProvider } from 'react-intl';
import config from 'config';
/*
 * This Provider expects to be passed an initialized
 * Jed i18n object,
 */

export default class I18nProvider extends React.Component {
  static propTypes = {
    locale: PropTypes.string,
    messages: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
  };

  static childContextTypes = {
    i18n: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.i18n = props.i18n;
  }

  getChildContext() {
    return { i18n: this.i18n };
  }

  render() {
    const { children, messages, locale } = this.props;
    return (
      <IntlProvider
        messages={messages}
        locale={locale}
        defaultLocale={config.get('defaultLang')}
      >
        {children}
      </IntlProvider>
    );
  }
}
