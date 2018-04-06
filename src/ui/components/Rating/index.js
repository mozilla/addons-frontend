import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import log from 'core/logger';
import translate from 'core/i18n/translate';

import './styles.scss';


export const RATING_STYLE_SIZE_TYPES = { small: '', large: '' };
const RATING_STYLE_SIZES = Object.keys(RATING_STYLE_SIZE_TYPES);

export class RatingBase extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    isOwner: PropTypes.bool,
    onSelectRating: PropTypes.func,
    rating: PropTypes.number,
    readOnly: PropTypes.bool,
    styleSize: PropTypes.oneOf(RATING_STYLE_SIZES),
  }

  static defaultProps = {
    className: '',
    readOnly: false,
    styleSize: 'large',
    isOwner: false,
  }

  constructor(props) {
    super(props);
    this.ratingElements = {};
  }

  onSelectRating = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget;
    const rating = parseInt(button.value, 10);
    log.debug('Selected rating from form button:', rating);

    if (!this.props.onSelectRating) {
      throw new Error(
        'onSelectRating was empty. Did you mean to set readOnly=true?');
    }
    this.props.onSelectRating(rating);
  }

  renderRatings() {
    const { i18n, readOnly } = this.props;
    // Accept falsey values as if they are zeroes.
    const rating = this.props.rating || 0;

    return [1, 2, 3, 4, 5].map((thisRating) => {
      const props = {
        className: makeClassName('Rating-choice', {
          'Rating-selected-star': thisRating - rating <= 0.25,
          'Rating-half-star': thisRating - rating > 0.25 &&
            thisRating - rating <= 0.75,
        }),
        id: `Rating-rating-${thisRating}`,
        key: `rating-${thisRating}`,
        ref: (ref) => { this.ratingElements[thisRating] = ref; },
        title: (rating && !readOnly) ? i18n.sprintf(i18n.gettext(`Update your rating to %(thisRating)s out of 5.`), { thisRating }) :
          i18n.sprintf(i18n.gettext(`Rate this add-on %(thisRating)s out of 5.`), { thisRating }),
      };

      if (readOnly) {
        props.title = null;
        return <div {...props} />;
      }

      return (
        // eslint-disable-next-line react/jsx-key
        <button
          onClick={this.onSelectRating}
          value={thisRating}
          {...props}
        />
      );
    });
  }

  render() {
    const { className, i18n, isOwner, rating, readOnly, styleSize } = this.props;
    if (!RATING_STYLE_SIZES.includes(styleSize)) {
      throw new Error(
        `styleSize=${styleSize} is not a valid value; ` +
        `possible values: ${RATING_STYLE_SIZES.join(', ')}`);
    }

    let description = null;
    if (rating && readOnly) {
      description = i18n.sprintf(i18n.gettext('Rated %(rating)s out of 5.'), { rating: i18n.formatNumber(parseFloat(rating).toFixed(1)) });
    } else {
      description = i18n.gettext('This add-on has not been rated yet.');
    }

    const allClassNames = makeClassName(
      'Rating', `Rating--${styleSize}`, className, {
        'Rating--editable': !readOnly, 'Rating--by-owner': isOwner,
      }
    );

    return (
      <div
        className={allClassNames}
        ref={(ref) => { this.element = ref; }}
        title={description}
      >
        <span className="Rating-star-group">
          {this.renderRatings()}
          <span className="visually-hidden">{description}</span>
        </span>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(RatingBase);
