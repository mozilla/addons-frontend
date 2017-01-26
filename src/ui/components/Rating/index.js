import { compose } from 'redux';
import React, { PropTypes } from 'react';
import classNames from 'classnames';

import log from 'core/logger';
import translate from 'core/i18n/translate';

import './styles.scss';


export class RatingBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    onSelectRating: PropTypes.func,
    rating: PropTypes.number,
    readOnly: PropTypes.boolean,
    size: PropTypes.oneOf(['small', 'large']),
  }

  static defaultProps = {
    readOnly: false,
    size: 'large',
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
        className: classNames('Rating-choice', {
          'Rating-selected-star': rating && thisRating <= rating,
        }),
        id: `Rating-rating-${thisRating}`,
        ref: (ref) => {
          this.ratingElements[thisRating] = ref;
        },
      };

      if (readOnly) {
        return <div {...props} />;
      }
      return (
        <button
          onClick={this.onSelectRating}
          value={thisRating}
          {...props}
        />
      );
    });
  }

  render() {
    const { i18n, rating, readOnly, size } = this.props;
    const sizeValues = ['small', 'large'];
    if (!sizeValues.includes(size)) {
      throw new Error(
        `size=${size} is not a valid value; ` +
        `possible values: ${sizeValues.join(', ')}`);
    }
    let description;
    if (rating) {
      description = i18n.sprintf(
        // L10n: This is for showing the star rating of an add-on.
        i18n.ngettext('Rated %(starCount)s star',
                      'Rated %(starCount)s stars',
                      rating),
        { starCount: rating }
      );
    } else {
      description = i18n.gettext('No ratings');
    }

    const className = classNames('Rating', {
      'Rating--editable': !readOnly,
      'Rating--small': size === 'small',
    });
    return (
      <div className={className} ref={(ref) => { this.element = ref; }}>
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
