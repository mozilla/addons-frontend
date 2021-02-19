/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getCurrentUser } from 'amo/reducers/users';
import Rating, { RATING_STYLE_SIZE_TYPES } from 'amo/components/Rating';
import translate from 'amo/i18n/translate';
import type { AppState } from 'amo/store';
import type { UserReviewType } from 'amo/actions/reviews';

type Props = {|
  className?: string,
  isOwner?: boolean,
  onSelectRating?: (rating: number) => any,
  readOnly?: boolean,
  review?: UserReviewType | null,
  // eslint-disable-next-line no-undef
  styleSize?: $Keys<typeof RATING_STYLE_SIZE_TYPES>,
|};

export const UserRatingBase = (props: Props): React.Node => {
  const {
    className,
    isOwner,
    readOnly,
    onSelectRating,
    review,
    styleSize,
  } = props;

  return (
    <Rating
      className={className}
      onSelectRating={onSelectRating}
      rating={review && review.score}
      readOnly={readOnly || false}
      styleSize={styleSize}
      yellowStars={isOwner}
    />
  );
};

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const { review } = ownProps;
  const siteUser = getCurrentUser(state.users);

  return { isOwner: !!(siteUser && review && review.userId === siteUser.id) };
};

const UserRating: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(UserRatingBase);

export default UserRating;
