/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { nl2br, sanitizeHTML } from 'core/utils';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import ShowMoreCard from 'ui/components/ShowMoreCard';
import UserRating from 'ui/components/UserRating';
import type { UserReviewType } from 'amo/actions/reviews';
import type { I18nType } from 'core/types/i18n';

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
    'content or html is required',
  );

  const bodyAttr = {};

  if (content) {
    bodyAttr.children = content;
  } else {
    bodyAttr.dangerouslySetInnerHTML = html;
  }

  return (
    <ShowMoreCard
      className={makeClassName('UserReview-body', {
        // Add an extra class if the content is an empty string.
        'UserReview-emptyBody': !content && !html,
      })}
      id={id}
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

  const showMoreId = review && review.id ? `${review.id}` : 'loading-text';
  let body = reviewBody({ content: <LoadingText />, id: showMoreId });

  if (review) {
    if (review.body) {
      body = reviewBody({
        html: sanitizeHTML(nl2br(review.body), ['br']),
        id: showMoreId,
      });
    } else {
      body = reviewBody({ content: '', id: showMoreId });
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
