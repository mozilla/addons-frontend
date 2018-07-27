/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  REVIEW_FLAG_REASON_BUG_SUPPORT,
  REVIEW_FLAG_REASON_LANGUAGE,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import FlagReview from 'amo/components/FlagReview';
import AuthenticateButton from 'core/components/AuthenticateButton';
import { getCurrentUser } from 'amo/reducers/users';
import translate from 'core/i18n/translate';
import ListItem from 'ui/components/ListItem';
import TooltipMenu from 'ui/components/TooltipMenu';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';
import type { UserType } from 'amo/reducers/users';
import type { UserReviewType } from 'amo/actions/reviews';
import type { ReactRouterLocationType } from 'core/types/router';

type Props = {|
  isDeveloperReply?: boolean,
  location: ReactRouterLocationType,
  openerClass?: string,
  review: UserReviewType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  siteUser: UserType | null,
  wasFlagged: boolean,
|};

export class FlagReviewMenuBase extends React.Component<InternalProps> {
  static defaultProps = {
    isDeveloperReply: false,
  };

  render() {
    const {
      i18n,
      isDeveloperReply,
      location,
      openerClass,
      review,
      siteUser,
      wasFlagged,
    } = this.props;

    let items;
    if (!siteUser) {
      items = [
        <ListItem key="login-required">
          <AuthenticateButton
            noIcon
            location={location}
            logInText={
              isDeveloperReply
                ? i18n.gettext('Log in to flag this response')
                : i18n.gettext('Log in to flag this review')
            }
          />
        </ListItem>,
      ];
    } else if (siteUser.id === review.userId) {
      items = [
        <ListItem key="flagging-not-allowed">
          {isDeveloperReply
            ? i18n.gettext('You cannot flag your own response')
            : i18n.gettext('You cannot flag your own review')}
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
          />
        </ListItem>,
        <ListItem
          className="FlagReviewMenu-flag-language-item"
          key="flag-language"
        >
          <FlagReview
            reason={REVIEW_FLAG_REASON_LANGUAGE}
            review={review}
            buttonText={i18n.gettext('This contains inappropriate language')}
            wasFlaggedText={i18n.gettext('Flagged for inappropriate language')}
          />
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
            />
          </ListItem>
        ),
      ];
    }

    return (
      <TooltipMenu
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

const mapStateToProps = (state: AppState, ownProps: Props) => {
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
