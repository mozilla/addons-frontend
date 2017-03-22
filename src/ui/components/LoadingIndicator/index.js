import React, { PropTypes } from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';

import './LoadingIndicator.scss';


export class LoadingIndicatorBase extends React.Component {
  static propTypes = {
    altText: PropTypes.node,
    i18n: PropTypes.object.isRequired,
  }

  static defaultProps = {
    altText: undefined,
  }

  render() {
    const { i18n } = this.props;

    // We have to do this because we can't use `i18n.gettext` in the static
    // defaultProps declaration.
    let { altText } = this.props;
    if (typeof altText === 'undefined') {
      altText = i18n.gettext('Loading…');
    }

    return (
      <Icon className="LoadingIndicator" name="fox"
        ref={(ref) => { this.loadingIcon = ref; }}>
        {altText ? <span className="visually-hidden">{altText}</span> : null}
      </Icon>
    );
  }
}

export default compose(
  translate(),
)(LoadingIndicatorBase);
