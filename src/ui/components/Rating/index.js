import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getCurrentUser } from 'amo/reducers/users';
import log from 'core/logger';
import translate from 'core/i18n/translate';

import './styles.scss';


const RATING_STYLE_SIZES = ['small', 'large'];

export class RatingBase extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    onSelectRating: PropTypes.func,
    rating: PropTypes.number,
    readOnly: PropTypes.bool,
    styleSize: PropTypes.oneOf(RATING_STYLE_SIZES),
    review: PropTypes.object,
    isOwner: PropTypes.bool,
  }

  static defaultProps = {
    className: '',
    readOnly: false,
    styleSize: 'large',
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
    const { readOnly } = this.props;
    // Accept falsey values as if they are zeroes.
    const rating = this.props.rating || 0;

    return [1, 2, 3, 4, 5].map((thisRating) => {
      const props = {
        className: makeClassName('Rating-choice', {
          'Rating-selected-star': rating && thisRating <= rating,
          // Half stars are the result of averages rounded to the nearest
          // 0.5 place. The API should not return floats for your own review
          // so effectively this only appears in readOnly for now, but there's
          // nothing stopping the API from supporting half-stars later.
          'Rating-half-star': (rating && thisRating > rating &&
            thisRating - 0.5 <= rating),
        }),
        id: `Rating-rating-${thisRating}`,
        key: `rating-${thisRating}`,
        ref: (ref) => { this.ratingElements[thisRating] = ref; },
      };

      if (readOnly) {
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
    const { className, i18n, rating, readOnly, styleSize, isOwner } = this.props;
    if (!RATING_STYLE_SIZES.includes(styleSize)) {
      throw new Error(
        `styleSize=${styleSize} is not a valid value; ` +
        `possible values: ${RATING_STYLE_SIZES.join(', ')}`);
    }
    let description;
    if (rating) {
      description = i18n.sprintf(i18n.gettext('Rated %(rating)s out of 5'),
        { rating: i18n.formatNumber(parseFloat(rating.toFixed(1))) });
    } else {
      description = i18n.gettext('No ratings');
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

export function mapStateToProps(state, ownProps) {
  const { review } = ownProps;
  const siteUser = getCurrentUser(state.users);
  const isOwner = siteUser && review && review.userId === siteUser.id;
  return { isOwner };
}

const Rating = compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(RatingBase);

export default Rating;
