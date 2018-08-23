/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import { nl2br, sanitizeHTML } from 'core/utils';
import LoadingText from 'ui/components/LoadingText';
import UserRating from 'ui/components/UserRating';
import type { UserReviewType } from 'amo/actions/reviews';

import './styles.scss';

type Props = {|
  byLine: React.Node | null,
  children?: React.Node,
  className?: string,
  controls?: React.Node | null,
  review: ?UserReviewType,
  showRating?: boolean,
|};

const UserReview: React.ComponentType<Props> = ({
  byLine,
  children,
  className,
  controls,
  review,
  showRating = false,
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
    <div className={makeClassName('UserReview', className)}>
      <div className="UserReview-byLine">
        {review && showRating ? (
          <UserRating styleSize="small" review={review} readOnly />
        ) : null}
        {byLine}
      </div>
      {body}
      {controls}
      {children}
    </div>
  );
};

export default UserReview;
