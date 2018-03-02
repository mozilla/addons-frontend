import { shallow } from 'enzyme';
import * as React from 'react';

import {
  REVIEW_FLAG_REASON_BUG_SUPPORT,
  REVIEW_FLAG_REASON_LANGUAGE,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import {
  denormalizeReview, setReviewWasFlagged, showReplyToReviewForm,
} from 'amo/actions/reviews';
import FlagReview from 'amo/components/FlagReview';
import FlagReviewMenu, {
  FlagReviewMenuBase,
} from 'amo/components/FlagReviewMenu';
import { logOutUser } from 'amo/reducers/users';
import AuthenticateButton from 'core/components/AuthenticateButton';
import {
  dispatchSignInActions, fakeReview,
} from 'tests/unit/amo/helpers';
import {
  fakeI18n,
  fakeRouterLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ListItem from 'ui/components/ListItem';
import TooltipMenu from 'ui/components/TooltipMenu';


describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchSignInActions().store;
  });

  const render = (customProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      location: fakeRouterLocation(),
      review: denormalizeReview(fakeReview),
      store,
      ...customProps,
    };
    return shallowUntilTarget(
      <FlagReviewMenu {...props} />, FlagReviewMenuBase,
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
      const location = fakeRouterLocation();
      const { menu } = renderMenu({ location });

      // Only the button item should be rendered.
      expect(menu.find(ListItem)).toHaveLength(1);

      const authButton = menu.find(AuthenticateButton);
      expect(authButton).toHaveLength(1);
      expect(authButton).toHaveProp('location', location);
    });

    it('prompts you to flag a review after login', () => {
      store.dispatch(logOutUser());
      const { menu } = renderMenu();

      const authButton = menu.find(AuthenticateButton);
      expect(authButton).toHaveProp('logInText');
      expect(authButton.prop('logInText'))
        .toEqual('Log in to flag this review');
    });

    it('prompts you to flag a developer response after login', () => {
      store.dispatch(logOutUser());
      const { menu } = renderMenu({ isDeveloperReply: true });

      const authButton = menu.find(AuthenticateButton);
      expect(authButton).toHaveProp('logInText');
      expect(authButton.prop('logInText'))
        .toEqual('Log in to flag this response');
    });

    it('does not let you flag your own review', () => {
      const review = denormalizeReview({ ...fakeReview });
      dispatchSignInActions({ store, userId: review.userId });
      const { menu } = renderMenu({ review });

      const items = menu.find(ListItem);
      expect(items).toHaveLength(1);
      expect(items.at(0).html()).toContain(
        'You cannot flag your own review'
      );
    });

    it('does not let you flag your own response', () => {
      const review = denormalizeReview({ ...fakeReview });
      dispatchSignInActions({ store, userId: review.userId });
      const { menu } = renderMenu({ review, isDeveloperReply: true });

      const items = menu.find(ListItem);
      expect(items).toHaveLength(1);
      expect(items.at(0).html()).toContain(
        'You cannot flag your own response'
      );
    });
  });

  describe('prompts and FlagReview configuration', () => {
    it('provides a tooltip to flag reviews', () => {
      const root = render();

      expect(root.find(TooltipMenu))
        .toHaveProp('openerTitle', 'Flag this review');
    });

    it('provides a tooltip to flag developer responses', () => {
      const root = render({ isDeveloperReply: true });

      expect(root.find(TooltipMenu))
        .toHaveProp('openerTitle', 'Flag this developer response');
    });

    it('configures FlagReview to flag as spam', () => {
      const review = denormalizeReview(fakeReview);
      const { menu } = renderMenu({ review });

      const flag = menu.find('.FlagReviewMenu-flag-spam-item')
        .find(FlagReview);
      expect(flag).toHaveProp('review', review);
      expect(flag).toHaveProp('reason', REVIEW_FLAG_REASON_SPAM);
      expect(flag).toHaveProp('wasFlaggedText');
      expect(flag).toHaveProp('buttonText');
    });

    it('configures FlagReview to flag for language', () => {
      const review = denormalizeReview(fakeReview);
      const { menu } = renderMenu({ review });

      const flag = menu.find('.FlagReviewMenu-flag-language-item')
        .find(FlagReview);
      expect(flag).toHaveProp('review', review);
      expect(flag).toHaveProp('reason', REVIEW_FLAG_REASON_LANGUAGE);
      expect(flag).toHaveProp('wasFlaggedText');
      expect(flag).toHaveProp('buttonText');
    });

    it('configures FlagReview to flag as bug/support', () => {
      const review = denormalizeReview(fakeReview);
      const { menu } = renderMenu({ review });

      const flag = menu.find('.FlagReviewMenu-flag-bug-support-item')
        .find(FlagReview);
      expect(flag).toHaveProp('review', review);
      expect(flag).toHaveProp('reason', REVIEW_FLAG_REASON_BUG_SUPPORT);
      expect(flag).toHaveProp('wasFlaggedText');
      expect(flag).toHaveProp('buttonText');
    });

    it('does not prompt you to flag a response as a bug/support', () => {
      const { menu } = renderMenu({ isDeveloperReply: true });

      expect(menu.find('.FlagReviewMenu-flag-bug-support-item'))
        .toHaveLength(0);
    });

    it('changes prompt after review has been flagged', () => {
      const review = denormalizeReview(fakeReview);
      store.dispatch(setReviewWasFlagged({
        reason: REVIEW_FLAG_REASON_SPAM,
        reviewId: review.id,
      }));

      const root = render({ review });

      expect(root.find(TooltipMenu)).toHaveProp('openerText', 'Flagged');
    });

    it('does not change Flag prompt for other view state changes', () => {
      const review = denormalizeReview(fakeReview);
      // This initializes the flag view state which was triggering a bug.
      store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

      const root = render({ review });

      expect(root.find(TooltipMenu)).toHaveProp('openerText', 'Flag');
    });
  });
});
