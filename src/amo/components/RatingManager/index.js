/* @flow */
/* global Node */
/* eslint-disable react/sort-comp, react/no-unused-prop-types */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { oneLine } from 'common-tags';

import { withRenderedErrorHandler } from 'core/errorHandler';
import { setLatestReview } from 'amo/actions/reviews';
import { selectLatestUserReview } from 'amo/reducers/reviews';
import { getLatestUserReview, submitReview } from 'amo/api/reviews';
import DefaultAddonReview from 'amo/components/AddonReview';
import DefaultAuthenticateButton from 'core/components/AuthenticateButton';
import DefaultReportAbuseButton from 'amo/components/ReportAbuseButton';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  validAddonTypes as defaultValidAddonTypes,
} from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import DefaultUserRating from 'ui/components/UserRating';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { UserReviewType } from 'amo/actions/reviews';
import type {
  GetLatestReviewParams,
  SubmitReviewParams,
} from 'amo/api/reviews';
import type { DispatchFunc } from 'core/types/redux';
import type { ApiState } from 'core/reducers/api';
import type { AddonType, AddonVersionType } from 'core/types/addons';
import type { ReactRouterLocationType } from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type LoadSavedReviewFunc = ({|
  addonId: $PropertyType<GetLatestReviewParams, 'addon'>,
  apiState: ApiState,
  userId: $PropertyType<GetLatestReviewParams, 'user'>,
  versionId: $PropertyType<GetLatestReviewParams, 'version'>,
|}) => Promise<any>;

type SubmitReviewFunc = (SubmitReviewParams) => Promise<void>;

type Props = {|
  addon: AddonType,
  location: ReactRouterLocationType,
  onReviewSubmitted?: () => void,
  version: AddonVersionType,
|};

type DispatchMappedProps = {|
  loadSavedReview: LoadSavedReviewFunc,
  submitReview: SubmitReviewFunc,
|};

type InternalProps = {|
  ...Props,
  ...DispatchMappedProps,
  AddonReview: typeof DefaultAddonReview,
  AuthenticateButton: typeof DefaultAuthenticateButton,
  UserRating: typeof DefaultUserRating,
  ReportAbuseButton: typeof DefaultReportAbuseButton,
  apiState: ApiState,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  userId: number,
  userReview?: UserReviewType | null,
|};

type State = {|
  showTextEntry: boolean,
|};

export class RatingManagerBase extends React.Component<InternalProps, State> {
  ratingLegend: React.ElementRef<'legend'> | null;

  static defaultProps = {
    AddonReview: DefaultAddonReview,
    AuthenticateButton: DefaultAuthenticateButton,
    UserRating: DefaultUserRating,
    ReportAbuseButton: DefaultReportAbuseButton,
  };

  constructor(props: InternalProps) {
    super(props);
    this.state = { showTextEntry: false };
  }

  componentDidMount() {
    const {
      apiState,
      loadSavedReview,
      userId,
      addon,
      userReview,
      version,
    } = this.props;
    if (userId && addon && userReview === undefined) {
      log.debug(`loading a saved rating (if it exists) for user ${userId}`);
      loadSavedReview({
        apiState,
        userId,
        addonId: addon.id,
        versionId: version.id,
      });
    }
  }

  onSelectRating = (rating: number) => {
    const { userReview, version } = this.props;

    const params = {
      errorHandler: this.props.errorHandler,
      rating,
      apiState: this.props.apiState,
      addonId: this.props.addon.id,
      reviewId: undefined,
      versionId: version.id,
    };

    if (userReview) {
      log.debug(`Editing reviewId ${userReview.id}`);
      if (userReview.versionId === params.versionId) {
        log.debug(oneLine`Updating reviewId ${userReview.id} for
          versionId ${params.versionId || '[empty]'}`);
        params.reviewId = userReview.id;
      } else {
        // Since we have a version mismatch, submit the review against the
        // current most version, similar to how new reviews are created.
        params.versionId =
          this.props.addon.current_version &&
          this.props.addon.current_version.id;
        log.debug(oneLine`Submitting a new review for
          versionId ${params.versionId || '[empty]'}`);
      }
    } else {
      log.debug(oneLine`Submitting a new review for
        versionId ${params.versionId || '[empty]'}`);
    }
    return this.props.submitReview(params).then(() => {
      this.setState({ showTextEntry: true });
    });
  };

  getLogInPrompt(
    { addonType }: {| addonType: string |},
    {
      validAddonTypes = defaultValidAddonTypes,
    }: {|
      validAddonTypes: typeof defaultValidAddonTypes,
    |} = {},
  ) {
    const { i18n } = this.props;
    switch (addonType) {
      case ADDON_TYPE_DICT:
        return i18n.gettext('Log in to rate this dictionary');
      case ADDON_TYPE_LANG:
        return i18n.gettext('Log in to rate this language pack');
      case ADDON_TYPE_OPENSEARCH:
        return i18n.gettext('Log in to rate this search plugin');
      case ADDON_TYPE_STATIC_THEME:
      case ADDON_TYPE_THEME:
        return i18n.gettext('Log in to rate this theme');
      case ADDON_TYPE_EXTENSION:
        return i18n.gettext('Log in to rate this extension');
      default: {
        const validAddonType = validAddonTypes.includes(addonType);
        log.warn(
          `Using generic prompt for ${
            validAddonType ? 'add-on' : 'unknown add-on'
          } type: ${addonType}`,
        );
        return i18n.gettext('Log in to rate this add-on');
      }
    }
  }

  renderLogInToRate() {
    const { AuthenticateButton, addon, location } = this.props;
    return (
      <div className="RatingManager-log-in-to-rate">
        <AuthenticateButton
          noIcon
          className="RatingManager-log-in-to-rate-button"
          location={location}
          logInText={this.getLogInPrompt({ addonType: addon.type })}
        />
      </div>
    );
  }

  onReviewSubmitted = () => {
    this.setState({ showTextEntry: false });
    if (this.props.onReviewSubmitted) {
      this.props.onReviewSubmitted();
    }
  };

  render() {
    const {
      AddonReview,
      UserRating,
      ReportAbuseButton,
      i18n,
      addon,
      userId,
      userReview,
    } = this.props;
    const { showTextEntry } = this.state;
    const isLoggedIn = Boolean(userId);

    const prompt = i18n.sprintf(
      i18n.gettext('How are you enjoying your experience with %(addonName)s?'),
      { addonName: addon.name },
    );

    return (
      <div className="RatingManager">
        {showTextEntry && isLoggedIn && userReview ? (
          <AddonReview
            onReviewSubmitted={this.onReviewSubmitted}
            review={userReview}
          />
        ) : null}
        <form action="">
          <fieldset>
            <legend
              ref={(ref) => {
                this.ratingLegend = ref;
              }}
            >
              {prompt}
            </legend>
            {!isLoggedIn ? this.renderLogInToRate() : null}
            <UserRating
              readOnly={!isLoggedIn}
              onSelectRating={this.onSelectRating}
              review={userReview || undefined}
            />
          </fieldset>
        </form>
        <ReportAbuseButton addon={addon} />
      </div>
    );
  }
}

export const mapStateToProps = (state: AppState, ownProps: Props) => {
  const userId = state.users.currentUserID;
  let userReview;
  if (userId && ownProps.addon) {
    log.debug(
      `Looking for latest review of addon:${ownProps.addon.id}/version:${
        ownProps.version.id
      } by user:${userId}`,
    );
    userReview = selectLatestUserReview({
      reviewsState: state.reviews,
      userId,
      addonId: ownProps.addon.id,
      versionId: ownProps.version.id,
    });
  }

  return {
    apiState: state.api,
    userReview,
    userId,
  };
};

export const mapDispatchToProps = (
  dispatch: DispatchFunc,
): DispatchMappedProps => ({
  loadSavedReview({ apiState, userId, addonId, versionId }) {
    return getLatestUserReview({
      apiState,
      user: userId,
      addon: addonId,
      version: versionId,
    }).then((review) => {
      if (review) {
        dispatch(setLatestReview({ userId, addonId, versionId, review }));
      } else {
        log.debug(
          `No saved review found for userId ${userId}, addonId ${addonId}`,
        );
        dispatch(setLatestReview({ userId, addonId, versionId, review: null }));
      }
    });
  },

  submitReview(params) {
    return submitReview(params).then((review) => {
      // The API could possibly return a null review.version if that
      // version was deleted. In that case, we fall back to the submitted
      // versionId which came from the page data. It is highly unlikely
      // that both of these will be empty.
      // TODO: add tests
      const versionId =
        (review.version && review.version.id) || params.versionId;
      invariant(versionId, 'versionId cannot be empty');
      dispatch(
        setLatestReview({
          addonId: review.addon.id,
          userId: review.user.id,
          versionId,
          review,
        }),
      );
    });
  },
});

export const RatingManagerWithI18n = translate()(RatingManagerBase);

const RatingManager: React.ComponentType<Props> = compose(
  withRenderedErrorHandler({ name: 'RatingManager' }),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(RatingManagerWithI18n);

export default RatingManager;
