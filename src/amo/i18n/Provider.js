import React, { Children, Component } from 'react';
import PropTypes from 'prop-types';
import { I18nextProvider } from 'react-i18next';

/*
 * This Provider expects to be passed an initialized
 * Jed i18n object,
 */

export default class I18nProvider extends Component {
  static propTypes = {
    jed: PropTypes.object.isRequired,
    i18next: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
  };

  static childContextTypes = {
    jed: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.jed = props.jed;
  }

  getChildContext() {
    return { jed: this.jed };
  }

  render() {
    const { children, i18next } = this.props;
    return (
      <I18nextProvider i18next={i18next}>
        {Children.only(children)}
      </I18nextProvider>
    );
  }
}
