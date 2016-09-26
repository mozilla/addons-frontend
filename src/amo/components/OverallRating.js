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

  onClickRating = (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    log.debug('Selected rating from form button:', button.value);
    this.props.createRating({
      rating: parseInt(button.value, 10),
      versionID: this.props.version.id,
      apiState: this.props.apiState,
      addonID: this.props.addonID,
    });
  }

  render() {
    const { i18n, addonName } = this.props;
    const prompt = i18n.sprintf(
      i18n.gettext('How are you enjoying your experience with %(addonName)s?'),
      { addonName });

    // TODO: Disable rating ability when not logged in
    // (when state.auth is empty)

    return (
      <div className="OverallRating">
        <form action="">
          <fieldset>
            <legend>{prompt}</legend>
            <div className="OverallRating-selectors">
              <label htmlFor="OverallRating-love-it">
                <button value={5} onClick={this.onClickRating} className="OverallRating-love-it" id="OverallRating-love-it">
                  {/* L10n: This should be a very short phrase for layout reasons, if possible. */}
                  {i18n.gettext('Love it!')}
                </button>
              </label>
              <label htmlFor="OverallRating-it-is-ok">
                <button value={3} onClick={this.onClickRating} className="OverallRating-it-is-ok" id="OverallRating-it-is-ok">
                  {/* L10n: This should be a very short phrase for layout reasons, if possible. */}
                  {i18n.gettext("It's OK")}
                </button>
              </label>
              <label htmlFor="OverallRating-huh">
                <button value={1} onClick={this.onClickRating} className="OverallRating-huh" id="OverallRating-huh">
                  {/* L10n: This should be a very short phrase for layout reasons, if possible. */}
                  {i18n.gettext('Huh?')}
                </button>
              </label>
            </div>
          </fieldset>
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
