import PropTypes from 'prop-types';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { makeQueryStringWithUTM } from 'disco/utils';
import Button from 'ui/components/Button';

import './styles.scss';

export class FooterBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  };

  render() {
    const { i18n } = this.props;

    return (
      <footer className="Footer">
        <Button
          className="Footer-privacy-link"
          href={`https://www.mozilla.org/privacy/firefox/${makeQueryStringWithUTM(
            {
              utm_content: 'privacy-policy-link',
            },
          )}#addons`}
          target="_blank"
        >
          {i18n.gettext('Privacy Policy')}
        </Button>
      </footer>
    );
  }
}

export default compose(translate())(FooterBase);
