import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import * as amoApi from 'amo/api';
import {
  mapDispatchToProps, mapStateToProps, AddonReviewBase,
} from 'amo/components/AddonReview';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon, signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

const defaultReview = {
  id: 3321, addonSlug: fakeAddon.slug,
};

function render(customProps = {}) {
  const props = {
    i18n: getFakeI18nInst(),
    apiState: signedInApiState,
    review: defaultReview,
    updateReviewText: () => {},
    ...customProps,
  };
  const root = findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={props.i18n}>
      <AddonReviewBase {...props} />
    </I18nProvider>
  ), AddonReviewBase);

  return findDOMNode(root);
}

describe('AddonReview', () => {
  it('can update a review', () => {
    const updateReviewText = sinon.spy(() => {});
    const rootNode = render({ updateReviewText });

    const textarea = rootNode.querySelector('textarea');
    textarea.value = 'some review';
    Simulate.submit(rootNode.querySelector('form'));

    assert.equal(updateReviewText.called, true);
    const params = updateReviewText.firstCall.args[0];
    assert.equal(params.body, 'some review');
    assert.equal(params.addonId, defaultReview.addonSlug);
    assert.equal(params.reviewId, defaultReview.id);
    assert.equal(params.apiState, signedInApiState);
  });

  it('requires the review text to be non-empty', () => {
    const rootNode = render();
    // By default the textarea for the review is empty.
    try {
      Simulate.submit(rootNode.querySelector('form'));
      assert(false, 'unexpected success');
    } catch (error) {
      assert.match(error.message, /review .* cannot be empty/);
    }
  });

  it('requires a review object', () => {
    const review = { nope: 'not even close' };
    try {
      const rootNode = render({ review });
      assert(false, 'unexpected success');
    } catch (error) {
      assert.match(error.message, /Unexpected review property: {"nope".*/);
    }
  });

  describe('mapStateToProps', () => {
    it.skip('sets the review ID from the state', () => {
      const reviewId = 123;
      const addonId = 321;
      const thisUserName = 'some_user';

      const api = {
        ...signedInApiState,
        username: thisUserName,
      };
      const userRatings = {
        [thisUserName]: {
          [addonId]: {
            reviewId,
          },
        },
      };

      const props = mapStateToProps({ api, userRatings });
      assert.equal(props.reviewId, reviewId);
    });
  });
});
