/* @flow */
import * as React from 'react';

import { nl2br, sanitizeHTML } from 'core/utils';
import LoadingText from 'ui/components/LoadingText';
import UserRating from 'ui/components/UserRating';
import type { UserReviewType } from 'amo/actions/reviews';

import './styles.scss';

type Props = {|
  byLine: React.Node | null,
  children?: React.Node,
  isReply?: boolean,
  review: ?UserReviewType,
|};

const UserReview: React.ComponentType<Props> = ({
  byLine,
  children,
  review,
  isReply = false,
}: Props) => {
  let body = (
    <p className="UserReview-body">
      <LoadingText />
    </p>
  );

  if (review) {
    body = (
      <p
        className="UserReview-body"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={sanitizeHTML(nl2br(review.body), ['br'])}
      />
    );
  }

  return (
    <div className="UserReview">
      {body}
      <div className="UserReview-byLine">
        {review && !isReply ? (
          <UserRating styleSize="small" review={review} readOnly />
        ) : null}
        {byLine}
      </div>
      {children}
    </div>
  );
};

export default UserReview;
