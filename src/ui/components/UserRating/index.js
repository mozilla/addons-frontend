/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getCurrentUser } from 'amo/reducers/users';
import Rating, { RATING_STYLE_SIZE_TYPES } from 'ui/components/Rating';
import translate from 'core/i18n/translate';
import type { UserReviewType } from 'amo/actions/reviews';
import type { UsersStateType } from 'amo/reducers/users';

type Props = {|
  className?: string,
  isOwner?: boolean,
  onSelectRating?: (SyntheticEvent<any>) => void,
  readOnly?: boolean,
  review?: UserReviewType,
  // eslint-disable-next-line no-undef
  styleSize?: $Keys<typeof RATING_STYLE_SIZE_TYPES>,
|};


export const UserRatingBase = (props: Props) => {
  const { className, isOwner, readOnly, onSelectRating, review, styleSize } = props;

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

const mapStateToProps = (
  state: {| users: UsersStateType |},
  ownProps: Props
) => {
  const { review } = ownProps;
  const siteUser = getCurrentUser(state.users);
  return { isOwner: !!(siteUser && review && review.userId === siteUser.id) };
};

export default compose(
  translate(),
  connect(mapStateToProps)
)(UserRatingBase);
