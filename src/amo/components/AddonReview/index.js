/* @flow */
/* eslint-disable react/sort-comp */
/* global $Shape */
import { oneLine } from 'common-tags';
import defaultDebounce from 'lodash.debounce';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { submitReview } from 'amo/api/reviews';
import { setDenormalizedReview, setReview } from 'amo/actions/reviews';
import { refreshAddon } from 'core/utils';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import defaultLocalStateCreator, { LocalState } from 'core/localState';
import log from 'core/logger';
import OverlayCard from 'ui/components/OverlayCard';
import Rating from 'ui/components/Rating';
import type { UserReviewType } from 'amo/actions/reviews';
import type { SubmitReviewParams } from 'amo/api/reviews';
import type { ApiStateType } from 'core/reducers/api';
import type { ErrorHandler as ErrorHandlerType } from 'core/errorHandler';
import type { ElementEvent } from 'core/types/dom';
import type { DispatchFunc } from 'core/types/redux';

import './styles.scss';

type SetDenormalizedReviewFunction = (review: $Shape<UserReviewType>) => void;

type RefreshAddonFunction = (
  params: {| addonSlug: string, apiState: ApiStateType |}
) => Promise<void>;

type UpdateReviewTextFunction =
  (review: $Shape<SubmitReviewParams>) => Promise<void>;

type AddonReviewProps = {|
  apiState: ApiStateType,
  createLocalState: typeof defaultLocalStateCreator,
  debounce: typeof defaultDebounce,
  errorHandler: ErrorHandlerType,
  i18n: Object,
  onEscapeOverlay?: () => void,
  onReviewSubmitted: () => void | Promise<void>,
  refreshAddon: RefreshAddonFunction,
  review: UserReviewType,
  setDenormalizedReview: SetDenormalizedReviewFunction,
  updateReviewText: UpdateReviewTextFunction,
|};

type AddonReviewState = {|
  reviewBody: ?string,
|};

export class AddonReviewBase extends React.Component {
  localState: LocalState;
  props: AddonReviewProps;
  reviewTextarea: HTMLElement;
  state: AddonReviewState;

  static defaultProps = {
    createLocalState: defaultLocalStateCreator,
    debounce: defaultDebounce,
  };

  constructor(props: AddonReviewProps) {
    super(props);
    this.state = {
      reviewBody: props.review.body,
    };
    this.localState = props.createLocalState(`AddonReview:${props.review.id}`);
    this.checkForStoredState();
  }

  componentWillReceiveProps(nextProps: AddonReviewProps) {
    const { review } = nextProps;
    if (review) {
      this.setState({ reviewBody: review.body });
    }
  }

  componentDidMount() {
    if (this.reviewTextarea) {
      this.reviewTextarea.focus();
    }
  }

  checkForStoredState() {
    return this.localState.load()
      .then((storedState) => {
        if (storedState) {
          log.debug(oneLine`Initializing AddonReview state from LocalState
            ${this.localState.id}`, storedState);
          this.setState(storedState);
        }
      });
  }

  onSubmit = (event: SyntheticEvent) => {
    const { apiState, errorHandler, onReviewSubmitted, review } = this.props;
    const { reviewBody } = this.state;
    event.preventDefault();
    event.stopPropagation();

    const newReviewParams = { body: reviewBody || undefined };
    const updatedReview = { ...review, ...newReviewParams };

    const params = {
      addonId: review.addonId,
      apiState,
      errorHandler,
      rating: review.rating,
      reviewId: review.id,
      ...newReviewParams,
    };
    // TODO: render a progress indicator in the UI.
    // https://github.com/mozilla/addons-frontend/issues/1156

    // Dispatch the new review to state so that the
    // component doesn't re-render with stale data while
    // the API request is in progress.
    this.props.setDenormalizedReview(updatedReview);

    // Next, update the review with an actual API request.
    return this.props.updateReviewText(params)
      .then(() => Promise.all([
        // Give the parent a callback saying that the review has been
        // submitted. Example: this might close the review entry overlay.
        onReviewSubmitted(),
        // Clear the locally stored state since we are in sync with
        // the API now.
        this.localState.clear(),
        this.props.refreshAddon({
          addonSlug: review.addonSlug, apiState,
        }),
      ]));
  }

  onBodyInput = (event: ElementEvent<HTMLInputElement>) => {
    const saveState = this.props.debounce((state) => {
      // After a few keystrokes, save the text to a local store
      // so we can recover from crashes.
      this.localState.save(state);
    }, 800);

    const newState = { reviewBody: event.target.value };
    saveState(newState);
    this.setState(newState);
  }

  onSelectRating = (rating: number) => {
    // Update the review object with a new rating but don't submit it
    // to the API yet.
    this.props.setDenormalizedReview({
      ...this.props.review,
      body: this.state.reviewBody || undefined,
      rating,
    });
  }

  render() {
    const { errorHandler, i18n, review } = this.props;
    const { reviewBody } = this.state;
    if (!review || !review.id || !review.addonSlug) {
      throw new Error(`Unexpected review property: ${JSON.stringify(review)}`);
    }

    let placeholder;
    let prompt;
    if (review.rating && review.rating > 3) {
      prompt = i18n.gettext(
        'Tell the world why you think this extension is fantastic!'
      );
      placeholder = i18n.gettext(
        'Tell us what you love about this extension. Be specific and concise.'
      );
    } else {
      prompt = i18n.gettext('Tell the world about this extension.');
      placeholder = i18n.gettext(
        'Tell us about your experience with this extension. ' +
        'Be specific and concise.'
      );
    }

    return (
      <OverlayCard
        visibleOnLoad
        onEscapeOverlay={this.props.onEscapeOverlay}
        className="AddonReview"
      >
        <h2 className="AddonReview-header">{i18n.gettext('Write a review')}</h2>
        <p className="AddonReview-prompt">{prompt}</p>
        <Rating
          styleName="large"
          rating={review.rating}
          onSelectRating={this.onSelectRating}
        />
        <form className="AddonReview-form" onSubmit={this.onSubmit}>
          <div className="AddonReview-form-input">
            {errorHandler.renderErrorIfPresent()}
            <label htmlFor="AddonReview-textarea" className="visually-hidden">
              {i18n.gettext('Review text')}
            </label>
            <textarea
              id="AddonReview-textarea"
              ref={(ref) => { this.reviewTextarea = ref; }}
              className="AddonReview-textarea"
              onInput={this.onBodyInput}
              name="review"
              value={reviewBody}
              placeholder={placeholder}
            />
          </div>
          <input
            className="AddonReview-submit"
            type="submit"
            value={i18n.gettext('Submit review')}
          />
        </form>
      </OverlayCard>
    );
  }
}

export const mapStateToProps = (state: {| api: ApiStateType |}) => ({
  apiState: state.api,
});

type DispatchMappedPropTypes = {|
  refreshAddon: RefreshAddonFunction,
  setDenormalizedReview: SetDenormalizedReviewFunction,
  updateReviewText: UpdateReviewTextFunction,
|};

export const mapDispatchToProps = (
  dispatch: DispatchFunc,
  ownProps: AddonReviewProps
): DispatchMappedPropTypes => {
  // The mapped properties that allow overrides do so for testing purposes.
  return {
    refreshAddon: ownProps.refreshAddon || (({ addonSlug, apiState }) => {
      return refreshAddon({ addonSlug, apiState, dispatch });
    }),
    setDenormalizedReview: (review) => {
      dispatch(setDenormalizedReview(review));
    },
    updateReviewText: ownProps.updateReviewText || ((params) => {
      return submitReview(params)
        .then((review) => dispatch(setReview(review)));
    }),
  };
};

export default compose(
  withErrorHandler({ name: 'AddonReview' }),
  connect(mapStateToProps, mapDispatchToProps),
  translate({ withRef: true }),
)(AddonReviewBase);
