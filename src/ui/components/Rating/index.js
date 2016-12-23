import React, { PropTypes } from 'react';
import classNames from 'classnames';

import log from 'core/logger';

import './styles.scss';


export default class Rating extends React.Component {
  static propTypes = {
    rating: PropTypes.number,
    readOnly: PropTypes.boolean,
    onSelectRating: PropTypes.func,
  }

  static defaultProps = {
    readOnly: false,
  }

  constructor(props) {
    super(props);
    this.ratingButtons = {};
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
    return [1, 2, 3, 4, 5].map((thisRating) =>
      <button
        className={classNames('Rating-choice', {
          'Rating-selected-star': rating && thisRating <= rating,
        })}
        disabled={readOnly}
        ref={(ref) => { this.ratingButtons[thisRating] = ref; }}
        value={thisRating}
        onClick={readOnly ? null : this.onSelectRating}
        id={`Rating-rating-${thisRating}`}
      />
    );
  }

  render() {
    const { readOnly } = this.props;
    const cls = classNames('Rating', {
      'Rating--editable': !readOnly,
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
