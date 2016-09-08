import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';

import 'amo/css/OverallRating.scss';


export class OverallRatingBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object,
    addonName: PropTypes.string,
  }

  render() {
    const { i18n, addonName } = this.props;
    const prompt = i18n.sprintf(
      i18n.gettext('How are you enjoying your experience with %(addonName)s?'),
      { addonName });

    return (
      <div className="OverallRating">
        <p>{prompt}</p>
        <form action="">
          <input id="love-it" value="love-it" name="overall-rating" type="radio" />
          <label htmlFor="love-it" className="love-it">
            {i18n.gettext('Love it!')}
          </label>
          <input id="it-is-ok" value="it-is-ok" name="overall-rating" type="radio" />
          <label htmlFor="it-is-ok" className="it-is-ok">
            {i18n.gettext("It's OK")}
          </label>
          <input id="huh" value="huh" name="overall-rating" type="radio" />
          <label htmlFor="huh" className="huh">
            {i18n.gettext('Huh?')}
          </label>
        </form>
      </div>
    );
  }
}

export default translate({ withRef: true })(OverallRatingBase);
