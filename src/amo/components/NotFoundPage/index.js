import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';

import './NotFoundPage.scss';

export class NotFoundPageBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    return (
      <div className="NotFoundPage">
        <h1>BREXIT PLANS</h1>

        <p>{i18n.gettext("Nobody can find what you're looking for.")}</p>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(NotFoundPageBase);
