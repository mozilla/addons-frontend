/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getCurrentUser } from 'amo/reducers/users';
import Rating, { RATING_STYLE_SIZE_TYPES } from 'ui/components/Rating';
import translate from 'core/i18n/translate';
import type { AppState } from 'amo/store';
import type { UserReviewType } from 'amo/actions/reviews';

type Props = {|
  className?: string,
  isOwner?: boolean,
  onSelectRating?: (rating: number) => any,
  readOnly?: boolean,
  review?: UserReviewType,
  // eslint-disable-next-line no-undef
  styleSize?: $Keys<typeof RATING_STYLE_SIZE_TYPES>,
|};

export const UserRatingBase = (props: Props) => {
  const {
    className,
    isOwner,
    onSelectRating,
    readOnly,
    review,
    styleSize,
  } = props;

  return (
    <Rating
      className={className}
      isOwner={isOwner}
      onSelectRating={onSelectRating}
      rating={(review && review.rating) || 0}
      readOnly={readOnly}
      styleSize={styleSize}
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
