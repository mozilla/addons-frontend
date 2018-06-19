/* eslint-disable react/no-danger */
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_UNDER_MIN_VERSION,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { sanitizeHTMLWithExternalLinks } from 'disco/utils';

import './style.scss';

// Messages in the disco pane are a bit less specific as we don't care about
// non-Firefox clients and the copy space is limited.
export class AddonCompatibilityErrorBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    minVersion: PropTypes.string.isRequired,
    reason: PropTypes.string.isRequired,
  };

  render() {
    const { i18n, minVersion, reason } = this.props;
    let message;

    if (typeof reason === 'undefined') {
      throw new Error('AddonCompatibilityError requires a "reason" prop');
    }
    if (typeof minVersion === 'undefined') {
      throw new Error('minVersion is required; it cannot be undefined');
    }

    if (reason === INCOMPATIBLE_FIREFOX_FOR_IOS) {
      message = i18n.gettext(
        'Firefox for iOS does not currently support add-ons.',
      );
    } else if (reason === INCOMPATIBLE_UNDER_MIN_VERSION) {
      message = i18n.gettext(
        'This add-on does not support your version of Firefox.',
      );
    } else {
      // Unknown reasons are fine on the Disco Pane because we don't
      // care about non-FF clients.
      message = i18n.gettext('This add-on does not support your browser.');
    }

    return (
      <div
        className="AddonCompatibilityError"
        dangerouslySetInnerHTML={sanitizeHTMLWithExternalLinks(message, ['a'])}
      />
    );
  }
}

export function mapStateToProps(state) {
  return { lang: state.api.lang };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AddonCompatibilityErrorBase);
