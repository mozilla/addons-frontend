import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { postRating } from 'amo/api';
import translate from 'core/i18n/translate';
import log from 'core/logger';

import 'amo/css/AddonReview.scss';


export class AddonReviewBase extends React.Component {
  static propTypes = {
  }

  render() {
    const { i18n } = this.props;

    return (
      <div className="AddonReview">
        <h2>{i18n.gettext('Write a review')}</h2>
        <p>
          {i18n.gettext(
            'Tell the world why you think this extension is fantastic!'
          )}
        </p>
        <form action="">
          <textarea
            placeholder={i18n.gettext(
              'Tell us what you love about this extension. ' +
              'Be specific and concise.')}>
          </textarea>
          <div className="AddonReview-button-row">
            <button className="AddonReview-button AddonReview-back-button">
              &#12296; {i18n.gettext('Back')}
            </button>
            <input
              className="AddonReview-button AddonReview-submit-button"
              type="submit" value={i18n.gettext('Submit')}
            />
          </div>
        </form>
      </div>
    );
  }
}

export const mapStateToProps = (state) => {
  log.info('state', state);
  return {};
};

export const mapDispatchToProps = (dispatch) => ({
});

export default compose(
  translate({ withRef: true }),
  connect(mapStateToProps, mapDispatchToProps),
)(AddonReviewBase);
