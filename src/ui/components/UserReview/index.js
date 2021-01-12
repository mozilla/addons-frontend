/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import { nl2br, sanitizeHTML } from 'amo/utils';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import UserRating from 'ui/components/UserRating';
import type { UserReviewType } from 'amo/actions/reviews';
import type { I18nType } from 'amo/types/i18n';
import ShowMoreCard from 'ui/components/ShowMoreCard';

import './styles.scss';

type Props = {|
  byLine: React.Node | null,
  children?: React.Node,
  className?: string,
  controls?: React.Node | null,
  isReply?: boolean,
  review: ?UserReviewType,
  showRating?: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

function reviewBody({
  content,
  html,
  id,
}: {|
  content?: React.Node | string,
  html?: React.Node,
  id: string,
|}) {
  invariant(
    content !== undefined || html !== undefined || id !== undefined,
    'content or html or id is required',
  );

  const bodyAttr = {};
  if (content) {
    bodyAttr.children = content;
  } else {
    bodyAttr.dangerouslySetInnerHTML = html;
  }

  return (
    <ShowMoreCard
      id={id}
      className={makeClassName('UserReview-body', {
        // Add an extra class if the content is an empty string.
        'UserReview-emptyBody': !content && !html,
      })}
    >
      <div {...bodyAttr} />
    </ShowMoreCard>
  );
}

export const UserReviewBase = (props: InternalProps) => {
  const {
    byLine,
    children,
    className,
    controls,
    i18n,
    isReply = false,
    review,
    showRating = false,
  } = props;

  const showMoreCardId =
    review && review.id ? String(review.id) : 'loading-text';
  let body = reviewBody({ content: <LoadingText />, id: showMoreCardId });

  if (review) {
    if (review.body) {
      body = reviewBody({
        html: sanitizeHTML(nl2br(review.body), ['br']),
        id: showMoreCardId,
      });
    } else {
      body = reviewBody({ content: '', id: showMoreCardId });
    }
  }

  return (
    <div className={makeClassName('UserReview', className)}>
      <div className="UserReview-byLine">
        {review && showRating ? (
          <UserRating styleSize="small" review={review} readOnly />
        ) : null}
        {review && isReply && (
          <h4 className="UserReview-reply-header">
            <Icon name="reply-arrow" />
            {i18n.gettext('Developer response')}
          </h4>
        )}
        {byLine}
      </div>
      {body}
      {controls}
      {children}
    </div>
  );
};

const UserReview: React.ComponentType<Props> = compose(translate())(
  UserReviewBase,
);

export default UserReview;
