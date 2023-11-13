/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import {
  REVIEW_FLAG_REASON_BUG_SUPPORT,
  REVIEW_FLAG_REASON_LANGUAGE,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import Link from 'amo/components/Link';
import FlagReview from 'amo/components/FlagReview';
import AuthenticateButton from 'amo/components/AuthenticateButton';
import { getCurrentUser } from 'amo/reducers/users';
import translate from 'amo/i18n/translate';
import ListItem from 'amo/components/ListItem';
import TooltipMenu from 'amo/components/TooltipMenu';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type { UserType } from 'amo/reducers/users';
import type { UserReviewType } from 'amo/actions/reviews';

import './styles.scss';

type DefaultProps = {|
  isDeveloperReply?: boolean,
|};

type Props = {|
  ...DefaultProps,
  openerClass?: string,
  review: UserReviewType,
|};

type PropsFromState = {|
  siteUser: UserType | null,
  wasFlagged: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
|};

export class FlagReviewMenuBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    isDeveloperReply: false,
  };

  render(): React.Node {
    const {
      i18n,
      isDeveloperReply,
      openerClass,
      review,
      siteUser,
      wasFlagged,
    } = this.props;

    invariant(
      !siteUser || siteUser.id !== review.userId,
      'A user cannot flag their own review.',
    );

    const enableFeatureFeedbackFormLinks = config.get(
      'enableFeatureFeedbackFormLinks',
    );

    const disableItemsForUnauthenticatedUsers = enableFeatureFeedbackFormLinks
      ? !siteUser
      : false;

    let items;
    if (!enableFeatureFeedbackFormLinks && !siteUser) {
      items = [
        <ListItem key="login-required">
          <AuthenticateButton
            noIcon
            logInText={
              isDeveloperReply
                ? i18n.gettext('Log in to flag this response')
                : i18n.gettext('Log in to flag this review')
            }
          />
        </ListItem>,
      ];
    } else {
      items = [
        <ListItem className="FlagReviewMenu-flag-spam-item" key="flag-spam">
          <FlagReview
            reason={REVIEW_FLAG_REASON_SPAM}
            review={review}
            buttonText={i18n.gettext('This is spam')}
            wasFlaggedText={i18n.gettext('Flagged as spam')}
            disabled={disableItemsForUnauthenticatedUsers}
          />
        </ListItem>,
        <ListItem
          className="FlagReviewMenu-flag-language-item"
          key="flag-language"
        >
          {enableFeatureFeedbackFormLinks ? (
            <Link to={`/feedback/review/${review.id}/`}>
              {i18n.gettext('This contains inappropriate language')}
            </Link>
          ) : (
            <FlagReview
              reason={REVIEW_FLAG_REASON_LANGUAGE}
              review={review}
              buttonText={i18n.gettext('This contains inappropriate language')}
              wasFlaggedText={i18n.gettext(
                'Flagged for inappropriate language',
              )}
            />
          )}
        </ListItem>,
        // Only reviews (not developer responses) can be flagged as
        // misplaced bug reports or support requests.
        isDeveloperReply ? null : (
          <ListItem
            className="FlagReviewMenu-flag-bug-support-item"
            key="flag-bug-support"
          >
            <FlagReview
              reason={REVIEW_FLAG_REASON_BUG_SUPPORT}
              review={review}
              buttonText={i18n.gettext(
                'This is a bug report or support request',
              )}
              wasFlaggedText={i18n.gettext(
                'Flagged as a bug report or support request',
              )}
              disabled={disableItemsForUnauthenticatedUsers}
            />
          </ListItem>
        ),
      ];
    }

    return (
      <TooltipMenu
        className="FlagReviewMenu-menu"
        idPrefix="flag-review-"
        items={items}
        openerClass={openerClass}
        openerText={wasFlagged ? i18n.gettext('Flagged') : i18n.gettext('Flag')}
        openerTitle={
          isDeveloperReply
            ? i18n.gettext('Flag this developer response')
            : i18n.gettext('Flag this review')
        }
      />
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: Props): PropsFromState => {
  let wasFlagged = false;

  if (ownProps.review) {
    const view = state.reviews.view[ownProps.review.id];
    if (view && view.flag && view.flag.wasFlagged) {
      wasFlagged = true;
    }
  }

  return {
    wasFlagged,
    siteUser: getCurrentUser(state.users),
  };
};

const FlagReviewMenu: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(FlagReviewMenuBase);

export default FlagReviewMenu;
