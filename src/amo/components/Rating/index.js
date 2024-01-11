/* @flow */
import { oneLine } from 'common-tags';
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import { type I18nType } from 'amo/types/i18n';

import './styles.scss';

export const RATING_STYLE_SIZE_TYPES = { small: '', large: '' };
const RATING_STYLE_SIZES = Object.keys(RATING_STYLE_SIZE_TYPES);

type StateType = {|
  hoveringOverStar: number | null,
|};

export type DefaultProps = {|
  className?: string,
  readOnly?: boolean,
  styleSize?: $Keys<typeof RATING_STYLE_SIZE_TYPES>,
  yellowStars?: boolean,
|};

export type Props = {|
  ...DefaultProps,
  onSelectRating?: (rating: number) => void,
  rating?: number | null,
|};

type InternalProps = {|
  ...Props,
  _setState?: ($Shape<StateType>) => void,
  i18n: I18nType,
|};

export class RatingBase extends React.Component<InternalProps, StateType> {
  static defaultProps: DefaultProps = {
    className: '',
    readOnly: false,
    styleSize: 'large',
    yellowStars: false,
  };

  constructor(props: InternalProps) {
    super(props);
    this.state = { hoveringOverStar: null };
  }

  _setState(newState: $Shape<StateType>): void {
    // $FlowFixMe: Deal with method-unbinding error.
    const setState = this.props._setState || this.setState.bind(this);
    return setState(newState);
  }

  onSelectRating: (event: SyntheticEvent<HTMLButtonElement>) => void = (
    event: SyntheticEvent<HTMLButtonElement>,
  ) => {
    const { onSelectRating } = this.props;
    invariant(
      onSelectRating,
      'onSelectRating was empty. Did you mean to set readOnly=true?',
    );

    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget;
    const rating = parseInt(button.value, 10);
    log.debug(`Selected rating from form button: ${rating}`);
    onSelectRating(rating);
  };

  // Helper function used to render title attributes
  // for each individual star, as well as the wrapper
  // that surrounds the read-only set of stars.
  renderTitle: (
    rating: ?number,
    readOnly: boolean | void,
    starRating: number | null,
  ) => string = (
    rating: ?number,
    readOnly: boolean | void,
    starRating: number | null,
  ) => {
    const { i18n } = this.props;

    if (readOnly) {
      if (rating) {
        return i18n.sprintf(i18n.gettext('Rated %(rating)s out of 5'), {
          rating: i18n.formatNumber(parseFloat(rating).toFixed(1)),
        });
      }
      return i18n.gettext('There are no ratings yet');
    }

    invariant(starRating, 'starRating is required when readOnly=false');

    if (rating) {
      if (starRating === rating) {
        return i18n.sprintf(i18n.gettext('Rated %(rating)s out of 5'), {
          rating: i18n.formatNumber(parseFloat(rating).toFixed(1)),
        });
      }

      return i18n.sprintf(
        i18n.gettext('Update your rating to %(starRating)s out of 5'),
        { starRating },
      );
    }

    return i18n.sprintf(
      i18n.gettext('Rate this add-on %(starRating)s out of 5'),
      { starRating },
    );
  };

  onHoverStar: (star: number) => void = (star: number) => {
    if (this.props.readOnly) {
      return;
    }
    this._setState({ hoveringOverStar: star });
  };

  stopHovering: () => void = () => {
    if (this.props.readOnly) {
      return;
    }
    this._setState({ hoveringOverStar: null });
  };

  renderRatings(): Array<React.Node> {
    const { readOnly } = this.props;
    const { hoveringOverStar } = this.state;
    // Accept falsey values as if they are zeroes.
    const rating = this.props.rating || 0;

    return [1, 2, 3, 4, 5].map((thisRating) => {
      let isSelected = thisRating - rating <= 0.25;
      if (hoveringOverStar !== null) {
        isSelected = thisRating <= hoveringOverStar;
      }

      const title = this.renderTitle(rating, readOnly, thisRating);

      const halfStar =
        thisRating - rating > 0.25 && thisRating - rating <= 0.75;

      const props = {
        className: makeClassName('Rating-star', `Rating-rating-${thisRating}`, {
          'Rating-selected-star': isSelected,
          'Rating-half-star': halfStar,
        }),
        onClick: undefined,
        onMouseEnter: () => this.onHoverStar(thisRating),
        title,
      };

      if (readOnly) {
        return <div key={`rating-${thisRating}`} {...props} />;
      }

      if (!this.isLoading()) {
        props.onClick = this.onSelectRating;
      }

      const id = `Rating-rating-${thisRating}-title`;

      return (
        // eslint-disable-next-line react/jsx-key
        <button
          aria-describedby={id}
          type="button"
          value={thisRating}
          {...props}
        >
          <span id={id} className="visually-hidden">
            {title}
          </span>
        </button>
      );
    });
  }

  isLoading(): boolean {
    // When rating is undefined, the rating is still loading.
    // When rating is null, the rating has been loaded but it's empty.
    return this.props.rating === undefined;
  }

  render(): React.Node {
    const { className, rating, readOnly, styleSize, yellowStars } = this.props;
    if (!styleSize || !RATING_STYLE_SIZES.includes(styleSize)) {
      throw new Error(
        oneLine`styleSize=${styleSize || '[empty string]'} is not a valid
        value; possible values: ${RATING_STYLE_SIZES.join(', ')}`,
      );
    }

    // Wrap read only ratings with a description to maintain functionality
    // for the "Average rating of developer’s add-ons" tooltip.
    const description = readOnly
      ? this.renderTitle(rating, readOnly, null)
      : null;

    const allClassNames = makeClassName(
      'Rating',
      `Rating--${styleSize}`,
      className,
      {
        'Rating--editable': !readOnly,
        'Rating--loading': this.isLoading(),
        'Rating--yellowStars': yellowStars,
      },
    );

    const extraProps = {};
    if (this.isLoading()) {
      extraProps.role = 'alert';
      extraProps['aria-busy'] = 'true';
    }

    return (
      <div
        className={allClassNames}
        title={description}
        onMouseLeave={this.stopHovering}
        {...extraProps}
      >
        {this.renderRatings()}
        <span className="visually-hidden">{description}</span>
      </div>
    );
  }
}

const Rating: React.ComponentType<Props> = compose(translate())(RatingBase);

export default Rating;
