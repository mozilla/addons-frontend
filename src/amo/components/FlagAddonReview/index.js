/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  REVIEW_FLAG_REASON_BUG_SUPPORT,
  REVIEW_FLAG_REASON_LANGUAGE,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import { flagReview } from 'amo/actions/reviews';
import AuthenticateButton from 'core/components/AuthenticateButton';
import { withErrorHandler } from 'core/errorHandler';
import { isAuthenticated } from 'core/reducers/user';
import translate from 'core/i18n/translate';
import ListItem from 'ui/components/ListItem';
import TooltipMenu from 'ui/components/TooltipMenu';
import type { FlagReviewReasonType } from 'amo/constants';
import type { ReviewState } from 'amo/reducers/reviews';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { UserStateType } from 'core/reducers/user';
import type { UserReviewType } from 'amo/actions/reviews';


/* eslint-disable react/no-unused-prop-types */
type FlagReviewParams = {|
  event: SyntheticEvent<any>,
  reason: FlagReviewReasonType,
|};
/* eslint-enable react/no-unused-prop-types */

type Props = {|
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  isDeveloperReply?: boolean,
  openerClass?: string,
  review: UserReviewType,
  siteUser: UserStateType,
  userIsAuthenticated: boolean,
|};

export class FlagAddonReviewBase extends React.Component<Props> {
  static defaultProps = {
    isDeveloperReply: false,
  };

  flagReview({ event, reason }: FlagReviewParams) {
    const { errorHandler, dispatch, review } = this.props;
    event.preventDefault();

    dispatch(flagReview({
      errorHandlerId: errorHandler.id,
      reason,
      reviewId: review.id,
    }));
  }

  flagAsSpam = (event: SyntheticEvent<any>) => {
    this.flagReview({ event, reason: REVIEW_FLAG_REASON_SPAM });
  }

  flagForLanguage = (event: SyntheticEvent<any>) => {
    this.flagReview({ event, reason: REVIEW_FLAG_REASON_LANGUAGE });
  }

  flagAsBugOrSupport = (event: SyntheticEvent<any>) => {
    this.flagReview({ event, reason: REVIEW_FLAG_REASON_BUG_SUPPORT });
  }

  render() {
    const {
      errorHandler,
      i18n,
      isDeveloperReply,
      openerClass,
      review,
      siteUser,
      userIsAuthenticated,
    } = this.props;

    // TODO:
    // - pass in location to AuthenticateButton
    // - render LoadingText while flagging
    // - show '...has been flagged' text after flagging

    let items;
    if (!userIsAuthenticated) {
      items = [
        <ListItem key="login-required">
          <AuthenticateButton
            noIcon
            location={'/TODO'}
            logInText={i18n.gettext('Log in to flag this review')}
          />
        </ListItem>,
      ];
    } else if (siteUser.id === review.userId) {
      items = [
        <ListItem key="flagging-not-allowed">
          {isDeveloperReply ?
            i18n.gettext('You cannot flag your own response') :
            i18n.gettext('You cannot flag your own review')
          }
        </ListItem>,
      ];
    } else {
      items = [
        errorHandler.hasError() ? (
          <ListItem key="error">
            {errorHandler.renderError()}
          </ListItem>
        ) : null,
        <ListItem key="flag-spam">
          <button
            className="FlagAddonReview-flag-spam"
            onClick={this.flagAsSpam}
          >
            {i18n.gettext('This is spam')}
          </button>
        </ListItem>,
        <ListItem key="flag-language">
          <button
            className="FlagAddonReview-flag-language"
            onClick={this.flagForLanguage}
          >
            {i18n.gettext('This contains inappropriate language')}
          </button>
        </ListItem>,
        isDeveloperReply ? null : (
          <ListItem key="flag-bug-support">
            <button
              className="FlagAddonReview-flag-bug-support"
              onClick={this.flagAsBugOrSupport}
            >
              {i18n.gettext('This is a bug report or support request')}
            </button>
          </ListItem>
        ),
      ];
    }

    return (
      <TooltipMenu
        idPrefix="flag-review-"
        items={items}
        openerClass={openerClass}
        openerText={i18n.gettext('Flag')}
        openerTitle={isDeveloperReply ?
          i18n.gettext('Flag this developer response') :
          i18n.gettext('Flag this review')
        }
      />
    );
  }
}

const mapStateToProps = (
  state: {| user: UserStateType, reviews: ReviewState |}
) => {
  return {
    siteUser: state.user,
    userIsAuthenticated: isAuthenticated(state),
  };
};

export default compose(
  connect(mapStateToProps),
  withErrorHandler({ name: 'FlagAddonReview' }),
  translate(),
)(FlagAddonReviewBase);
