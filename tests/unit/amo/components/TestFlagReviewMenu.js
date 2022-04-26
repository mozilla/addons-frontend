import { shallow } from 'enzyme';
import * as React from 'react';

import {
  REVIEW_FLAG_REASON_BUG_SUPPORT,
  REVIEW_FLAG_REASON_LANGUAGE,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import {
  createInternalReview,
  setReviewWasFlagged,
  showReplyToReviewForm,
} from 'amo/actions/reviews';
import FlagReview from 'amo/components/FlagReview';
import FlagReviewMenu, {
  FlagReviewMenuBase,
} from 'amo/components/FlagReviewMenu';
import { logOutUser } from 'amo/reducers/users';
import AuthenticateButton from 'amo/components/AuthenticateButton';
import {
  dispatchSignInActions,
  fakeI18n,
  fakeReview,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ListItem from 'amo/components/ListItem';
import TooltipMenu from 'amo/components/TooltipMenu';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchSignInActions({ userId: fakeReview.user.id + 1 }).store;
  });

  const render = (customProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      review: createInternalReview(fakeReview),
      store,
      ...customProps,
    };
    return shallowUntilTarget(
      <FlagReviewMenu {...props} />,
      FlagReviewMenuBase,
    );
  };

  const renderMenu = (customProps = {}) => {
    const root = render(customProps);
    const menu = root.find(TooltipMenu);
    expect(menu).toHaveProp('items');

    return {
      root,
      // Simulate how TooltipMenu renders a menu.
      menu: shallow(<div>{menu.prop('items')}</div>),
    };
  };

  it('can be configured with an openerClass', () => {
    const openerClass = 'SomeClass';
    const root = render({ openerClass });

    expect(root.find(TooltipMenu)).toHaveProp('openerClass', openerClass);
  });

  describe('interacting with different users', () => {
    it('requires you to be signed in', () => {
      store.dispatch(logOutUser());
      const { menu } = renderMenu();

      // Only the button item should be rendered.
      expect(menu.find(ListItem)).toHaveLength(1);

      const authButton = menu.find(AuthenticateButton);
      expect(authButton).toHaveLength(1);
    });

    it('prompts you to flag a review after login', () => {
      store.dispatch(logOutUser());
      const { menu } = renderMenu();

      const authButton = menu.find(AuthenticateButton);
      expect(authButton).toHaveProp('logInText');
      expect(authButton.prop('logInText')).toEqual(
        'Log in to flag this review',
      );
    });

    it('prompts you to flag a developer response after login', () => {
      store.dispatch(logOutUser());
      const { menu } = renderMenu({ isDeveloperReply: true });

      const authButton = menu.find(AuthenticateButton);
      expect(authButton).toHaveProp('logInText');
      expect(authButton.prop('logInText')).toEqual(
        'Log in to flag this response',
      );
    });
  });

  describe('prompts and FlagReview configuration', () => {
    it('provides a tooltip to flag reviews', () => {
      const root = render();

      expect(root.find(TooltipMenu)).toHaveProp(
        'openerTitle',
        'Flag this review',
      );
    });

    it('provides a tooltip to flag developer responses', () => {
      const root = render({ isDeveloperReply: true });

      expect(root.find(TooltipMenu)).toHaveProp(
        'openerTitle',
        'Flag this developer response',
      );
    });

    it('configures FlagReview to flag as spam', () => {
      const review = createInternalReview(fakeReview);
      const { menu } = renderMenu({ review });

      const flag = menu.find('.FlagReviewMenu-flag-spam-item').find(FlagReview);
      expect(flag).toHaveProp('review', review);
      expect(flag).toHaveProp('reason', REVIEW_FLAG_REASON_SPAM);
      expect(flag).toHaveProp('wasFlaggedText');
      expect(flag).toHaveProp('buttonText');
    });

    it('configures FlagReview to flag for language', () => {
      const review = createInternalReview(fakeReview);
      const { menu } = renderMenu({ review });

      const flag = menu
        .find('.FlagReviewMenu-flag-language-item')
        .find(FlagReview);
      expect(flag).toHaveProp('review', review);
      expect(flag).toHaveProp('reason', REVIEW_FLAG_REASON_LANGUAGE);
      expect(flag).toHaveProp('wasFlaggedText');
      expect(flag).toHaveProp('buttonText');
    });

    it('configures FlagReview to flag as bug/support', () => {
      const review = createInternalReview(fakeReview);
      const { menu } = renderMenu({ review });

      const flag = menu
        .find('.FlagReviewMenu-flag-bug-support-item')
        .find(FlagReview);
      expect(flag).toHaveProp('review', review);
      expect(flag).toHaveProp('reason', REVIEW_FLAG_REASON_BUG_SUPPORT);
      expect(flag).toHaveProp('wasFlaggedText');
      expect(flag).toHaveProp('buttonText');
    });

    it('does not prompt you to flag a response as a bug/support', () => {
      const { menu } = renderMenu({ isDeveloperReply: true });

      expect(menu.find('.FlagReviewMenu-flag-bug-support-item')).toHaveLength(
        0,
      );
    });

    it('changes prompt after review has been flagged', () => {
      const review = createInternalReview(fakeReview);
      store.dispatch(
        setReviewWasFlagged({
          reason: REVIEW_FLAG_REASON_SPAM,
          reviewId: review.id,
        }),
      );

      const root = render({ review });

      expect(root.find(TooltipMenu)).toHaveProp('openerText', 'Flagged');
    });

    it('does not change Flag prompt for other view state changes', () => {
      const review = createInternalReview(fakeReview);
      // This initializes the flag view state which was triggering a bug.
      store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

      const root = render({ review });

      expect(root.find(TooltipMenu)).toHaveProp('openerText', 'Flag');
    });
  });
});
