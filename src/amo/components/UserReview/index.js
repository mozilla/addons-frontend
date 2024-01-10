/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import { nl2br, sanitizeHTML } from 'amo/utils';
import Icon from 'amo/components/Icon';
import LoadingText from 'amo/components/LoadingText';
import UserRating from 'amo/components/UserRating';
import type { UserReviewType } from 'amo/actions/reviews';
import type { I18nType } from 'amo/types/i18n';
import ShowMoreCard from 'amo/components/ShowMoreCard';

import './styles.scss';

export const loadingId = 'loading-text';

type Props = {|
  byLine: React.Node | null,
  children?: React.Node,
  controls?: React.Node | null,
  isReply: boolean,
  review: ?UserReviewType,
  showRating: boolean,
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
  html?: {| __html: string |},
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
      contentId={id}
      className={makeClassName('UserReview-body', {
        // Add an extra class if the content is an empty string.
        'UserReview-emptyBody': !content && !html,
      })}
    >
      <div {...bodyAttr} />
    </ShowMoreCard>
  );
}

export const UserReviewBase = (props: InternalProps): React.Node => {
  const { byLine, children, controls, i18n, isReply, review, showRating } =
    props;

  const showMoreCardId = review && review.id ? String(review.id) : loadingId;
  let body = reviewBody({ content: <LoadingText />, id: showMoreCardId });

  if (review) {
    if (review.body) {
      body = reviewBody({
        html: sanitizeHTML(nl2br(review.body), ['br']),
        id: showMoreCardId,
      });
    } else {
      body = reviewBody({
        content: '',
        id: showMoreCardId,
      });
    }
  }

  return (
    <div className="UserReview">
      <div className="UserReview-byLine">
        {review && showRating ? (
          <UserRating styleSize="small" review={review} readOnly />
        ) : null}
        {review && isReply && (
          <h4 className="UserReview-reply-header">
            <Icon name="reply-arrow" />
            {i18n.t('Developer response')}
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
