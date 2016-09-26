import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setUserRating } from 'amo/actions/ratings';
import { postRating } from 'amo/api';
import translate from 'core/i18n/translate';
import log from 'core/logger';

import 'amo/css/OverallRating.scss';


export class OverallRatingBase extends React.Component {
  static propTypes = {
    addonName: PropTypes.string.isRequired,
    addonID: PropTypes.number.isRequired,
    apiState: PropTypes.object,
    version: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    createRating: PropTypes.func.isRequired,
  }

  onChange = ({ currentTarget: form }) => {
    const input = form.querySelector('input:checked');
    if (!input) {
      // I don't think any user input would cause a form change like
      // this. I'm not sure what would cause this at all but it's probably
      // better not to throw an exception.
      log.error('The form changed but no input was selected');
    } else {
      log.debug('Selected rating from form input:', input.value);
      this.props.createRating({
        rating: parseInt(input.value, 10),
        versionID: this.props.version.id,
        apiState: this.props.apiState,
        addonID: this.props.addonID,
      });
    }
  }

  render() {
    const { i18n, addonName, version } = this.props;
    const prompt = i18n.sprintf(
      i18n.gettext(
        'How are you enjoying your experience with ' +
        '%(addonName)s %(version)s?'),
      { addonName, version: version.version });

    // TODO: Disable rating ability when not logged in
    // (when state.auth is empty)

    return (
      <div className="OverallRating">
        <p>{prompt}</p>
        <form action="" onChange={this.onChange}>
          <input id="OverallRating-love-it" value={5} name="overall-rating" type="radio" />
          <label htmlFor="OverallRating-love-it" className="OverallRating-love-it">
            {/* L10n: This should be a very short phrase for layout reasons, if possible. */}
            {i18n.gettext('Love it!')}
          </label>
          <input id="OverallRating-it-is-ok" value={3} name="overall-rating" type="radio" />
          <label htmlFor="OverallRating-it-is-ok" className="OverallRating-it-is-ok">
            {/* L10n: This should be a very short phrase for layout reasons, if possible. */}
            {i18n.gettext("It's OK")}
          </label>
          <input id="OverallRating-huh" value={1} name="overall-rating" type="radio" />
          <label htmlFor="OverallRating-huh" className="OverallRating-huh">
            {/* L10n: This should be a very short phrase for layout reasons, if possible. */}
            {i18n.gettext('Huh?')}
          </label>
        </form>
      </div>
    );
  }
}

export const mapStateToProps = (state) => ({
  apiState: state.api,
});

export const mapDispatchToProps = (dispatch) => ({
  createRating({ addonID, ...params }) {
    return postRating({ addonID, ...params })
      .then((userRating) => {
        dispatch(setUserRating({ addonID, userRating }));
      });
  },
});

export const OverallRatingWithI18n = compose(
  translate({ withRef: true }),
)(OverallRatingBase);

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(OverallRatingWithI18n);
