import { Children, Component } from 'react';
import PropTypes from 'prop-types';

/*
 * This Provider expects to be passed an initialized
 * Jed i18n object,
 */

export default class I18nProvider extends Component {
  static propTypes = {
    jed: PropTypes.object.isRequired,
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
    const { children } = this.props;
    return Children.only(children);
  }
}
