/* @flow */
/* eslint-disable react/sort-comp */
/* global $Shape, Event, HTMLInputElement, Node */
import { oneLine } from 'common-tags';
import defaultDebounce from 'simple-debounce';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { submitReview } from 'amo/api';
import { setDenormalizedReview, setReview } from 'amo/actions/reviews';
import { refreshAddon } from 'core/utils';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import defaultLocalStateCreator, { LocalState } from 'core/localState';
import log from 'core/logger';
import OverlayCard from 'ui/components/OverlayCard';
import type { SetReviewAction, UserReviewType } from 'amo/actions/reviews';
import type { SubmitReviewParams } from 'amo/api/index';
import type { ApiStateType } from 'core/reducers/api';
import type { ErrorHandler as ErrorHandlerType } from 'core/errorHandler';
import type { ElementEvent } from 'core/types/dom';
import type { DispatchFunc } from 'core/types/redux';

import 'amo/css/AddonReview.scss';

type AddonReviewProps = {|
  apiState?: ApiStateType,
  createLocalState: typeof defaultLocalStateCreator,
  debounce: typeof defaultDebounce,
  errorHandler: ErrorHandlerType,
  i18n: Object,
  onReviewSubmitted: () => void | Promise<void>,
  refreshAddon: () => Promise<void>,
  review: UserReviewType,
  setDenormalizedReview: (review: $Shape<UserReviewType>) => SetReviewAction,
  updateReviewText: (review: $Shape<SubmitReviewParams>) => Promise<void>,
|};

type AddonReviewState = {|
  reviewBody: ?string,
|};

export class AddonReviewBase extends React.Component {
  localState: LocalState;
  props: AddonReviewProps;
  reviewForm: Node;
  reviewPrompt: Node;
  reviewTextarea: Node;
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

  checkForStoredState() {
    return this.localState.load().then(storedState => {
      if (storedState) {
        log.debug(
          oneLine`Initializing AddonReview state from LocalState
            ${this.localState.id}`,
          storedState
        );
        this.setState(storedState);
      }
    });
  }

  onSubmit = (event: Event) => {
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
    return this.props.updateReviewText(params).then(() =>
      Promise.all([
        // Give the parent a callback saying that the review has been
        // submitted. Example: this might close the review entry overlay.
        onReviewSubmitted(),
        // Clear the locally stored state since we are in sync with
        // the API now.
        this.localState.clear(),
        this.props.refreshAddon({
          addonSlug: review.addonSlug,
          apiState,
        }),
      ])
    );
  };

  onBodyInput = (event: ElementEvent<HTMLInputElement>) => {
    const saveState = this.props.debounce(state => {
      // After a few keystrokes, save the text to a local store
      // so we can recover from crashes.
      this.localState.save(state);
    }, 800);

    const newState = { reviewBody: event.target.value };
    saveState(newState);
    this.setState(newState);
  };

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
      <OverlayCard visibleOnLoad className="AddonReview">
        <h2 className="AddonReview-header">{i18n.gettext('Write a review')}</h2>
        <p
          ref={ref => {
            this.reviewPrompt = ref;
          }}
        >
          {prompt}
        </p>
        <form
          onSubmit={this.onSubmit}
          ref={ref => {
            this.reviewForm = ref;
          }}
        >
          <div className="AddonReview-form-input">
            {errorHandler.renderErrorIfPresent()}
            <label htmlFor="AddonReview-textarea" className="visually-hidden">
              {i18n.gettext('Review text')}
            </label>
            <textarea
              id="AddonReview-textarea"
              ref={ref => {
                this.reviewTextarea = ref;
              }}
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

export const mapDispatchToProps = (dispatch: DispatchFunc) => ({
  refreshAddon({
    addonSlug,
    apiState,
  }: {|
    addonSlug: string,
    apiState: ApiStateType,
  |}) {
    return refreshAddon({ addonSlug, apiState, dispatch });
  },
  setDenormalizedReview(review: UserReviewType) {
    dispatch(setDenormalizedReview(review));
  },
  updateReviewText(params: SubmitReviewParams): Promise<void> {
    return submitReview(params).then(review => dispatch(setReview(review)));
  },
});

export default compose(
  withErrorHandler({ name: 'AddonReview' }),
  connect(mapStateToProps, mapDispatchToProps),
  translate({ withRef: true })
)(AddonReviewBase);
