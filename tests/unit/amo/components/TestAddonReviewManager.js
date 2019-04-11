import { shallow } from 'enzyme';
import * as React from 'react';

import {
  SAVED_RATING,
  STARTED_SAVE_RATING,
  STARTED_SAVE_REVIEW,
  createInternalReview,
  flashReviewMessage,
  hideFlashedReviewMessage,
  updateAddonReview,
} from 'amo/actions/reviews';
import AddonReviewManager, {
  AddonReviewManagerBase,
  extractId,
} from 'amo/components/AddonReviewManager';
import AddonReviewManagerRating from 'amo/components/AddonReviewManagerRating';
import RatingManagerNotice from 'amo/components/RatingManagerNotice';
import Link from 'amo/components/Link';
import { ErrorHandler } from 'core/errorHandler';
import ErrorList from 'ui/components/ErrorList';
import {
  dispatchClientMetadata,
  fakeI18n,
  fakeReview,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import DismissibleTextForm from 'ui/components/DismissibleTextForm';

describe(__filename, () => {
  const getProps = (props = {}) => {
    return {
      i18n: fakeI18n(),
      review: createInternalReview({ ...fakeReview }),
      store: dispatchClientMetadata().store,
      ...props,
    };
  };

  const render = (otherProps = {}) => {
    const props = getProps(otherProps);
    return shallowUntilTarget(
      <AddonReviewManager {...props} />,
      AddonReviewManagerBase,
    );
  };

  const createInternalReply = () => {
    return createInternalReview({
      ...fakeReview,
      is_developer_reply: true,
    });
  };

  it('configures AddonReviewManagerRating with the review rating', () => {
    const rating = 3;
    const review = createInternalReview({ ...fakeReview, rating });
    const root = render({ review });

    const ratingComponent = root.find(AddonReviewManagerRating);
    expect(ratingComponent).toHaveProp('rating', rating);
  });

  it('renders DismissibleTextForm text', () => {
    const body = 'This ad blocker add-on is easy on CPU';
    const review = createInternalReview({ ...fakeReview, body });
    const root = render({ review });

    const form = root.find(DismissibleTextForm);
    expect(form).toHaveProp('text', body);
  });

  it('renders a DismissibleTextForm formFooter', () => {
    const firstPart = 'this is the first part';
    const lastPart = 'this is the last part';
    const linkText = 'guides link';
    const text = `${firstPart} %(linkStart)s${linkText}%(linkEnd)s ${lastPart}`;

    const i18n = {
      ...fakeI18n(),
      gettext: sinon.stub().returns(text),
    };

    const root = render({ i18n });

    const form = root.find(DismissibleTextForm);
    expect(form).toHaveProp('formFooter');

    const formFooter = shallow(form.prop('formFooter'));
    expect(formFooter.text()).toContain(firstPart);
    expect(formFooter.text()).toContain(lastPart);

    const formFooterLink = formFooter.find(Link);
    expect(formFooterLink).toHaveLength(1);
    expect(formFooterLink).toHaveProp('to', '/review_guide');
    expect(formFooterLink).toHaveProp('prependClientApp', false);
    expect(formFooterLink).toHaveProp('children', linkText);
  });

  it('configures DismissibleTextForm with an ID', () => {
    const root = render({ review: createInternalReview({ ...fakeReview }) });

    const form = root.find(DismissibleTextForm);
    expect(form).toHaveProp('id');

    const formId = form.prop('id');
    expect(formId).toContain('AddonReviewManager');
    expect(formId).toContain(extractId(root.instance().props));
  });

  it('does not configure DismissibleTextForm for cancellation by default', () => {
    const root = render();

    const form = root.find(DismissibleTextForm);
    expect(form).toHaveProp('onDismiss', undefined);
  });

  it('can configure DismissibleTextForm for cancellation', () => {
    const onCancel = sinon.stub();
    const root = render({ onCancel });

    const form = root.find(DismissibleTextForm);
    expect(form).toHaveProp('onDismiss');
    const onDismiss = form.prop('onDismiss');
    onDismiss();

    sinon.assert.called(onCancel);
  });

  it('configures DismissibleTextForm without puffyButtons by default', () => {
    const root = render();

    expect(root.find(DismissibleTextForm)).toHaveProp('puffyButtons', false);
  });

  it('passes puffyButtons to DismissibleTextForm', () => {
    const root = render({ puffyButtons: true });

    expect(root.find(DismissibleTextForm)).toHaveProp('puffyButtons', true);
  });

  it('updates the rating when you select a star', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const review = createInternalReview({
      ...fakeReview,
      id: 99654,
      score: 2,
    });
    const root = render({ store, review });
    const rating = root.find(AddonReviewManagerRating);

    const newScore = 4;

    // Emulate how AddonReviewManagerRating lets you select a star.
    const onSelectRating = rating.prop('onSelectRating');
    onSelectRating(newScore);

    sinon.assert.calledWith(
      dispatchSpy,
      updateAddonReview({
        score: newScore,
        errorHandlerId: root.instance().props.errorHandler.id,
        reviewId: review.id,
      }),
    );
  });

  it('updates the review body when you submit the form', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const review = createInternalReview({
      ...fakeReview,
      body: 'I dislike the colors',
      id: 99654,
    });
    const root = render({ store, review });
    const form = root.find(DismissibleTextForm);

    const newBody = 'I really like the colors of this add-on';

    // Simulate how DismissibleTextForm submits the form.
    const onSubmit = form.prop('onSubmit');
    onSubmit({ text: newBody });

    sinon.assert.calledWith(
      dispatchSpy,
      updateAddonReview({
        body: newBody,
        errorHandlerId: root.instance().props.errorHandler.id,
        reviewId: review.id,
      }),
    );
  });

  it('renders errors', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('any error'));

    const root = render({ store, errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('flashes a saving rating message', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(flashReviewMessage(STARTED_SAVE_RATING));

    const root = render({ store });

    const notice = root.find(RatingManagerNotice);
    expect(notice).toHaveProp('message', 'Saving');
    expect(notice).toHaveProp('hideMessage', false);
  });

  it('flashes a saved rating message', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(flashReviewMessage(SAVED_RATING));

    const root = render({ store });

    const notice = root.find(RatingManagerNotice);
    expect(notice).toHaveProp('message', 'Saved');
    expect(notice).toHaveProp('hideMessage', false);
  });

  it('hides a flashed rating message', () => {
    const { store } = dispatchClientMetadata();
    // Set a message then hide it.
    store.dispatch(flashReviewMessage(SAVED_RATING));
    store.dispatch(hideFlashedReviewMessage());

    const root = render({ store });

    const notice = root.find(RatingManagerNotice);
    expect(notice).toHaveProp('hideMessage', true);
  });

  it('enters a submitting review state', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(flashReviewMessage(STARTED_SAVE_REVIEW));

    const root = render({ store });

    expect(root.find(DismissibleTextForm)).toHaveProp('isSubmitting', true);
  });

  it('does not enter a submitting state by default', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    expect(root.find(DismissibleTextForm)).toHaveProp('isSubmitting', false);
  });

  it('passes a null review while saving a rating', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(flashReviewMessage(STARTED_SAVE_RATING));

    const root = render({ store });

    const rating = root.find(AddonReviewManagerRating);
    // This will render a loading state.
    expect(rating).toHaveProp('rating', undefined);
  });

  it('prompts to submit when no review text exists yet', () => {
    const root = render({
      review: createInternalReview({
        ...fakeReview,
        score: 5,
        body: undefined,
      }),
    });

    const form = root.find(DismissibleTextForm);
    expect(form).toHaveProp('submitButtonText', 'Submit review');
    expect(form).toHaveProp('submitButtonInProgressText', 'Submitting review');
  });

  it('prompts to update when review text exists', () => {
    const root = render({
      review: createInternalReview({
        ...fakeReview,
        score: 5,
        body: 'This add-on is nice',
      }),
    });

    const form = root.find(DismissibleTextForm);
    expect(form).toHaveProp('submitButtonText', 'Update review');
    expect(form).toHaveProp('submitButtonInProgressText', 'Updating review');
  });

  it('hides the star rating for a reply', () => {
    const root = render({
      review: createInternalReply(),
    });

    expect(root.find('.AddonReviewManager-starRating')).toHaveLength(0);
  });

  it('hides the dismissible form footer for a reply', () => {
    const root = render({
      review: createInternalReply(),
    });

    expect(root.find(DismissibleTextForm)).toHaveProp('formFooter', undefined);
  });

  it('shows the expected button text for a reply', () => {
    const root = render({
      review: createInternalReply(),
    });

    const form = root.find(DismissibleTextForm);
    expect(form).toHaveProp('submitButtonText', 'Update reply');
    expect(form).toHaveProp('submitButtonInProgressText', 'Updating reply');
  });

  describe('extractId', () => {
    it('extracts an ID from the review', () => {
      const id = 551224;
      expect(
        extractId(
          getProps({ review: createInternalReview({ ...fakeReview, id }) }),
        ),
      ).toEqual(id.toString());
    });
  });
});
