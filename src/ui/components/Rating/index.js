import React, { PropTypes } from 'react';
import classNames from 'classnames';

import log from 'core/logger';

import './styles.scss';


export default class Rating extends React.Component {
  static propTypes = {
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
    const { readOnly, rating } = this.props;

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
    const { readOnly, size } = this.props;
    const cls = classNames('Rating', {
      'Rating--editable': !readOnly,
      'Rating--small': size === 'small',
    });

    return (
      <div className={cls} ref={(ref) => { this.element = ref; }}>
        <span className="Rating-star-group">
          {this.renderRatings()}
        </span>
      </div>
    );
  }
}
