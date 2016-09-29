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
import { signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

function render(customProps = {}) {
  const props = {
    i18n: getFakeI18nInst(),
    ...customProps,
  };
  const root = findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={props.i18n}>
      <AddonReview {...props} />
    </I18nProvider>
  ), AddonReviewBase);

  return findDOMNode(root);
}

describe('AddonReview', () => {
  // it('can post a review', () => {
  //   const rootNode = render();
  // });

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
