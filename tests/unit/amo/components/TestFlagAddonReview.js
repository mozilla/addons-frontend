import { shallow } from 'enzyme';
import React from 'react';

import {
  REVIEW_FLAG_REASON_BUG_SUPPORT,
  REVIEW_FLAG_REASON_LANGUAGE,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import { denormalizeReview, flagReview } from 'amo/actions/reviews';
import FlagAddonReview, {
  FlagAddonReviewBase,
} from 'amo/components/FlagAddonReview';
import { logOutUser } from 'core/actions';
import AuthenticateButton from 'core/components/AuthenticateButton';
import { ErrorHandler } from 'core/errorHandler';
import {
  dispatchSignInActions, fakeReview,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
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
      review: denormalizeReview(fakeReview),
      store,
      ...customProps,
    };
    return shallowUntilTarget(
      <FlagAddonReview {...props} />, FlagAddonReviewBase,
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

  it('renders an error', () => {
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('Unexpected API error'));

    const { menu } = renderMenu({ errorHandler });
    expect(menu.find(ErrorList)).toHaveLength(1);
  });

  describe('flagging behavior', () => {
    it('can flag a review', () => {
      const review = denormalizeReview({ ...fakeReview, id: 3321 });
      const fakeDispatch = sinon.stub(store, 'dispatch');
      const root = render({ review });

      const event = createFakeEvent();
      root.instance().flagReview({
        event, reason: REVIEW_FLAG_REASON_SPAM,
      });

      sinon.assert.calledWith(fakeDispatch, flagReview({
        errorHandlerId: root.instance().props.errorHandler.id,
        reason: REVIEW_FLAG_REASON_SPAM,
        reviewId: review.id,
      }));

      sinon.assert.called(event.preventDefault);
    });

    it('can flag a review as spam', () => {
      const { root, menu } = renderMenu();
      const flagReviewStub = sinon.stub(root.instance(), 'flagReview');

      const event = createFakeEvent();
      menu.find('.FlagAddonReview-flag-spam').simulate('click', event);

      sinon.assert.calledWith(flagReviewStub, {
        event, reason: REVIEW_FLAG_REASON_SPAM,
      });
    });

    it('can flag a review for inappropriate language', () => {
      const { root, menu } = renderMenu();
      const flagReviewStub = sinon.stub(root.instance(), 'flagReview');

      const event = createFakeEvent();
      menu.find('.FlagAddonReview-flag-language').simulate('click', event);

      sinon.assert.calledWith(flagReviewStub, {
        event, reason: REVIEW_FLAG_REASON_LANGUAGE,
      });
    });

    it('can flag a review as a bug report or support request', () => {
      const { root, menu } = renderMenu();
      const flagReviewStub = sinon.stub(root.instance(), 'flagReview');

      const event = createFakeEvent();
      menu.find('.FlagAddonReview-flag-bug-support')
        .simulate('click', event);

      sinon.assert.calledWith(flagReviewStub, {
        event, reason: REVIEW_FLAG_REASON_BUG_SUPPORT,
      });
    });
  });

  describe('interacting with different users', () => {
    it('requires you to be signed in', () => {
      store.dispatch(logOutUser());
      const { menu } = renderMenu();

      expect(menu.find(ListItem)).toHaveLength(1);
      expect(menu.find(AuthenticateButton)).toHaveLength(1);
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

  describe('prompts', () => {
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

    it('prompts you to flag as spam', () => {
      const { menu } = renderMenu();

      expect(menu.find('.FlagAddonReview-flag-spam').html())
        .toContain('This is spam');
    });

    it('prompts you to flag for language', () => {
      const { menu } = renderMenu();

      expect(menu.find('.FlagAddonReview-flag-language').html())
        .toContain('This contains inappropriate language');
    });

    it('prompts you to flag as a bug or support request', () => {
      const { menu } = renderMenu();

      expect(menu.find('.FlagAddonReview-flag-bug-support').html())
        .toContain('This is a bug report or support request');
    });

    it('does not prompt you to flag a response as a bug/support', () => {
      const { menu } = renderMenu({ isDeveloperReply: true });

      expect(menu.find('.FlagAddonReview-flag-bug-support')).toHaveLength(0);
    });
  });
});
