/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
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

function reviewBody({
  content,
  html,
}: {|
  content?: React.Node | string,
  html?: React.Node,
|}) {
  invariant(
    content !== undefined || html !== undefined,
    'content or html is required',
  );

  const bodyAttr = {};

  if (content) {
    bodyAttr.children = content;
  } else {
    bodyAttr.dangerouslySetInnerHTML = html;
  }
  // eslint-disable-next-line react/no-danger-with-children
  return <div className="UserReview-body" {...bodyAttr} />;
}

const UserReview: React.ComponentType<Props> = ({
  byLine,
  children,
  className,
  controls,
  review,
  showRating = false,
}: Props) => {
  let body = reviewBody({ content: <LoadingText /> });

  if (review) {
    if (review.body) {
      body = reviewBody({
        html: sanitizeHTML(nl2br(review.body), ['br']),
      });
    } else {
      body = reviewBody({ content: '' });
    }
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
