import PropTypes from 'prop-types';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';

import './styles.scss';

export class FooterBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  };

  render() {
    const { i18n } = this.props;

    return (
      <footer className="Footer">
        <a
          className="Footer-privacy-link"
          href="https://www.mozilla.org/privacy/websites/"
          rel="noopener noreferrer"
          target="_blank"
        >
          {i18n.gettext('Privacy Policy')}
        </a>
      </footer>
    );
  }
}

export default compose(translate())(FooterBase);
