/* @flow */
/* eslint-disable react/no-unused-prop-types */
import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { oneLine } from 'common-tags';

import {
  SAVED_RATING,
  STARTED_SAVE_RATING,
  createAddonReview,
  setLatestReview,
  setReview,
  updateAddonReview,
} from 'amo/actions/reviews';
import * as reviewsApi from 'amo/api/reviews';
import AddonReview from 'amo/components/AddonReview';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import AddonReviewManager from 'amo/components/AddonReviewManager';
import RatingManagerNotice from 'amo/components/RatingManagerNotice';
import ReportAbuseButton from 'amo/components/ReportAbuseButton';
import { selectLatestUserReview } from 'amo/reducers/reviews';
import AuthenticateButton from 'core/components/AuthenticateButton';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  validAddonTypes as defaultValidAddonTypes,
} from 'core/constants';
import { withRenderedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { genericType, successType } from 'ui/components/Notice';
import UserRating from 'ui/components/UserRating';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { FlashMessageType, UserReviewType } from 'amo/actions/reviews';
import type {
  GetLatestReviewParams,
  SubmitReviewParams,
} from 'amo/api/reviews';
import type { DispatchFunc } from 'core/types/redux';
import type { ApiState } from 'core/reducers/api';
import type { AddonType, ExternalAddonVersionType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type LoadSavedReviewFunc = ({|
  addonId: $PropertyType<GetLatestReviewParams, 'addon'>,
  addonSlug: string,
  apiState: ApiState,
  userId: $PropertyType<GetLatestReviewParams, 'user'>,
  versionId: $PropertyType<GetLatestReviewParams, 'version'>,
|}) => Promise<any>;

type SubmitReviewFunc = (SubmitReviewParams) => Promise<void>;

type Props = {|
  addon: AddonType,
  onReviewSubmitted?: () => void,
  version: ExternalAddonVersionType,
|};

type DispatchMappedProps = {|
  dispatch: DispatchFunc,
  loadSavedReview: LoadSavedReviewFunc,
  submitReview: SubmitReviewFunc,
|};

type InternalProps = {|
  ...Props,
  ...DispatchMappedProps,
  _config: typeof config,
  apiState: ApiState,
  editingReview: boolean,
  errorHandler: ErrorHandlerType,
  flashMessage?: FlashMessageType | void,
  i18n: I18nType,
  userId: number,
  userReview?: UserReviewType | null,
|};

type State = {|
  showTextEntry: boolean,
|};

export class RatingManagerBase extends React.Component<InternalProps, State> {
  static defaultProps = {
    _config: config,
  };

  constructor(props: InternalProps) {
    super(props);
    this.state = { showTextEntry: false };
  }

  componentDidMount() {
    const {
      addon,
      apiState,
      loadSavedReview,
      userId,
      userReview,
      version,
    } = this.props;

    if (userId && userReview === undefined) {
      log.debug(`Loading a saved rating (if it exists) for user ${userId}`);
      loadSavedReview({
        apiState,
        userId,
        addonId: addon.id,
        addonSlug: addon.slug,
        versionId: version.id,
      });
    }
  }

  onSelectRating = (score: number) => {
    const {
      _config,
      addon,
      apiState,
      dispatch,
      errorHandler,
      userReview,
      version,
    } = this.props;

    const params = {
      errorHandler,
      score,
      apiState,
      addonId: addon.id,
      reviewId: undefined,
      versionId: version.id,
    };

    if (userReview) {
      log.debug(`Editing reviewId ${userReview.id}`);
      params.reviewId = userReview.id;
    } else {
      log.debug(oneLine`Submitting a new review for
        versionId ${params.versionId || '[empty]'}`);
    }

    if (_config.get('enableFeatureInlineAddonReview')) {
      if (userReview) {
        dispatch(
          updateAddonReview({
            errorHandlerId: errorHandler.id,
            score,
            reviewId: userReview.id,
          }),
        );
      } else {
        dispatch(
          createAddonReview({
            addonId: addon.id,
            errorHandlerId: errorHandler.id,
            score,
            versionId: version.id,
          }),
        );
      }
      return null;
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

  onReviewSubmitted = () => {
    this.setState({ showTextEntry: false });
    if (this.props.onReviewSubmitted) {
      this.props.onReviewSubmitted();
    }
  };

  showTextEntry = (event: SyntheticEvent<any>) => {
    event.preventDefault();
    this.setState({ showTextEntry: true });
  };

  isSignedIn() {
    return Boolean(this.props.userId);
  }

  shouldShowTextEntry() {
    const { userReview } = this.props;
    const { showTextEntry } = this.state;

    return showTextEntry && userReview && this.isSignedIn();
  }

  renderLogInToRate() {
    const { addon } = this.props;

    return (
      <AuthenticateButton
        noIcon
        className="RatingManager-log-in-to-rate-button"
        logInText={this.getLogInPrompt({ addonType: addon.type })}
      />
    );
  }

  renderTextEntry() {
    const { _config, userReview } = this.props;
    invariant(userReview, 'userReview is required');

    if (_config.get('enableFeatureInlineAddonReview')) {
      return <AddonReviewManager review={userReview} />;
    }

    return (
      <AddonReview
        onReviewSubmitted={this.onReviewSubmitted}
        review={userReview}
      />
    );
  }

  isMessageVisible() {
    const { flashMessage } = this.props;

    return [STARTED_SAVE_RATING, SAVED_RATING].includes(flashMessage);
  }

  renderUserRatingForm() {
    const { addon, i18n, flashMessage, userReview } = this.props;

    const prompt = i18n.sprintf(
      i18n.gettext('How are you enjoying %(addonName)s?'),
      { addonName: addon.name },
    );

    return (
      <form action="">
        <fieldset>
          <legend className="RatingManager-legend">{prompt}</legend>
          <div className="RatingManager-ratingControl">
            {!this.isSignedIn() ? this.renderLogInToRate() : null}
            <UserRating
              className="RatingManager-UserRating"
              readOnly={!this.isSignedIn()}
              onSelectRating={this.onSelectRating}
              review={!this.isSignedIn() ? null : userReview}
            />
          </div>
          <RatingManagerNotice
            className={
              userReview && userReview.body
                ? 'RatingManager-savedRating-withReview'
                : null
            }
            hideMessage={!this.isMessageVisible()}
            message={
              flashMessage === STARTED_SAVE_RATING
                ? i18n.gettext('Saving star rating')
                : i18n.gettext('Star rating saved')
            }
            type={
              flashMessage === STARTED_SAVE_RATING ? genericType : successType
            }
          />
        </fieldset>
      </form>
    );
  }

  renderInlineReviewControls() {
    const { addon, editingReview, userReview } = this.props;

    return (
      <React.Fragment>
        {!editingReview && this.renderUserRatingForm()}
        {userReview && (
          <AddonReviewCard
            addon={addon}
            className="RatingManager-AddonReviewCard"
            flaggable={false}
            review={userReview}
            shortByLine
            showControls={!this.isMessageVisible()}
            showRating={false}
            smallerWriteReviewButton={false}
            verticalButtons
          />
        )}
      </React.Fragment>
    );
  }

  render() {
    const { _config, addon, version } = this.props;

    invariant(addon, 'addon is required');
    invariant(version, 'version is required');

    return (
      <div className="RatingManager">
        {this.shouldShowTextEntry() ? this.renderTextEntry() : null}
        {_config.get('enableFeatureInlineAddonReview')
          ? this.renderInlineReviewControls()
          : this.renderUserRatingForm()}
        <ReportAbuseButton addon={addon} />
      </div>
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const userId = state.users.currentUserID;
  let userReview;
  if (userId && ownProps.addon) {
    const addonId = ownProps.addon.id;
    const versionId = ownProps.version.id;

    log.debug(oneLine`Looking for latest review of
      addon:${addonId}/version:${versionId} by user:${userId}`);

    userReview = selectLatestUserReview({
      reviewsState: state.reviews,
      userId,
      addonId,
      versionId,
    });
  }

  let editingReview = false;
  if (userReview) {
    const view = state.reviews.view[userReview.id];
    if (view) {
      editingReview = view.editingReview;
    }
  }

  return {
    apiState: state.api,
    editingReview,
    flashMessage: state.reviews.flashMessage,
    userReview,
    userId,
  };
};

export const mapDispatchToProps = (
  dispatch: DispatchFunc,
  // We add `DispatchMappedProps` to override these functions in the tests.
  ownProps: Props | DispatchMappedProps,
): DispatchMappedProps => {
  const loadSavedReview = ({
    apiState,
    userId,
    addonId,
    addonSlug,
    versionId,
  }) => {
    return reviewsApi
      .getLatestUserReview({
        apiState,
        user: userId,
        addon: addonId,
        version: versionId,
      })
      .then((review) => {
        const _setLatestReview = (value) => {
          return setLatestReview({
            userId,
            addonId,
            addonSlug,
            versionId,
            review: value,
          });
        };

        if (review) {
          dispatch(setReview(review));
          dispatch(_setLatestReview(review));
        } else {
          log.debug(
            `No saved review found for userId ${userId}, addonId ${addonId}`,
          );
          dispatch(_setLatestReview(null));
        }
      });
  };

  const submitReview = (params) => {
    return reviewsApi.submitReview(params).then((review) => {
      // The API could possibly return a null review.version if that
      // version was deleted. In that case, we fall back to the submitted
      // versionId which came from the page data. It is highly unlikely
      // that both of these will be empty.
      const versionId =
        (review.version && review.version.id) || params.versionId;
      invariant(versionId, 'versionId cannot be empty');
      dispatch(
        setLatestReview({
          addonId: review.addon.id,
          addonSlug: review.addon.slug,
          userId: review.user.id,
          versionId,
          review,
        }),
      );
    });
  };

  return {
    dispatch,
    loadSavedReview: ownProps.loadSavedReview || loadSavedReview,
    submitReview: ownProps.submitReview || submitReview,
  };
};

export const RatingManagerWithI18n = translate()(RatingManagerBase);

const RatingManager: React.ComponentType<Props> = compose(
  withRenderedErrorHandler({ name: 'RatingManager' }),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(RatingManagerWithI18n);

export default RatingManager;
