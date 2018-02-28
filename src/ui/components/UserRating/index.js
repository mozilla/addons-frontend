/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getCurrentUser } from 'amo/reducers/users';
import Rating, { RATING_STYLE_SIZE_TYPES } from 'ui/components/Rating';
import translate from 'core/i18n/translate';
import type { UserReviewType } from 'amo/actions/reviews';


type Props = {|
  className?: string,
  isOwner: boolean,
  onSelectRating?: Function,
  readOnly: boolean,
  review: UserReviewType,
  // eslint-disable-next-line no-undef
  styleSize: $Keys<typeof RATING_STYLE_SIZE_TYPES>,
|};


export class UserRatingBase extends React.Component<Props> {
  static defaultProps = {
    styleSize: 'large',
  };

  render() {
    const { className, isOwner, readOnly, onSelectRating, review, styleSize } = this.props;

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
  }
}

const mapStateToProps = (
  state: Object, ownProps: Props
): $Shape<Props> => {
  const { review } = ownProps;
  const siteUser = getCurrentUser(state.users);
  return { isOwner: !!(siteUser && review && review.userId === siteUser.id) };
};

export default compose(
  translate({ withRef: true }),
  connect(mapStateToProps)
)(UserRatingBase);
