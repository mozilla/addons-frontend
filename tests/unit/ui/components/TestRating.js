import * as React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';

import { fakeI18n } from 'tests/unit/helpers';
import Rating, { RatingBase } from 'ui/components/Rating';

function render(customProps = {}) {
  const props = {
    i18n: fakeI18n(),
    ...customProps,
  };
  return findRenderedComponentWithType(renderIntoDocument(
    <Rating {...props} />
  ), RatingBase);
}

function makeFakeEvent() {
  return {
    preventDefault: sinon.stub(),
    stopPropagation: sinon.stub(),
    currentTarget: {},
  };
}

describe(__filename, () => {
  function selectRating(root, ratingNumber) {
    const button = root.ratingElements[ratingNumber];
    expect(button).toBeTruthy();
    Simulate.click(button);
  }

  it('classifies as editable by default', () => {
    const root = render();
    expect(root.element.className).toContain('Rating--editable');
  });

  it('can be classified as small', () => {
    const root = render({ styleSize: 'small' });
    expect(root.element.className).toContain('Rating--small');
  });

  it('can be classified as owned', () => {
    const root = render({ isOwner: true });
    expect(root.element.className).toContain('Rating--by-owner');
  });

  it('classifies as unowned by default', () => {
    const root = render();
    expect(root.element.className).not.toContain('Rating--by-owner');
  });

  it('throws an error for invalid styleSize', () => {
    expect(() => render({ styleSize: 'x-large' }))
      .toThrowError(/styleSize=x-large is not a valid value; possible values: small,/);
  });

  it('lets you select a one star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 1);
    expect(onSelectRating.called).toEqual(true);
    expect(onSelectRating.firstCall.args[0]).toEqual(1);
  });

  it('lets you select a two star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 2);
    expect(onSelectRating.called).toEqual(true);
    expect(onSelectRating.firstCall.args[0]).toEqual(2);
  });

  it('lets you select a three star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 3);
    expect(onSelectRating.called).toEqual(true);
    expect(onSelectRating.firstCall.args[0]).toEqual(3);
  });

  it('lets you select a four star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 4);
    expect(onSelectRating.called).toEqual(true);
    expect(onSelectRating.firstCall.args[0]).toEqual(4);
  });

  it('lets you select a five star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 5);
    expect(onSelectRating.called).toEqual(true);
    expect(onSelectRating.firstCall.args[0]).toEqual(5);
  });

  it('renders selected stars corresponding to rating number', () => {
    const root = render({ rating: 3 });

    // Make sure only the first 3 stars are selected.
    [1, 2, 3].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice Rating-selected-star');
    });
    [4, 5].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice');
    });
  });

  it('renders half stars in ratings', () => {
    // This should be treated like a rating of 3.5 (three and a half stars).
    const root = render({ rating: 3.60001 });

    // The first three stars are fully highlighted
    [1, 2, 3].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice Rating-selected-star');
    });
    [4].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice Rating-half-star');
    });
    [5].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice');
    });
  });

  it('rounds ratings to nearest 0.5 multiple', () => {
    // This should be treated like a rating of 3.5 in text.
    const root = render({ rating: 3.60001 });

    expect(findDOMNode(root).title).toContain('3.6 out of 5');
  });

  it('converts rating numbers to a float', () => {
    const rootWithInteger = render({ rating: 3 });
    const rootWithString = render({ rating: '3.60001' });

    expect(findDOMNode(rootWithInteger).title).toContain('3 out of 5');
    expect(findDOMNode(rootWithString).title).toContain('3.6 out of 5');
  });

  it('rounds readOnly average ratings to nearest 0.5 multiple', () => {
    // This should be treated like a rating of 3.5.
    const root = render({ rating: 3.6, readOnly: true });

    // The first three stars are fully highlighted
    [1, 2, 3].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice Rating-selected-star');
    });
    [4].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice Rating-half-star');
    });
    [5].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice');
    });
  });

  it('renders 0 selected stars for empty ratings', () => {
    // This will make dealing with API data easier when
    // an add-on hasn't been rated enough yet.
    const root = render({ rating: null });

    // Make sure no stars have the selected class.
    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice');
    });
  });

  it('renders all stars as selectable by default', () => {
    const root = render();
    [1, 2, 3, 4, 5].forEach((rating) => {
      const star = root.ratingElements[rating];
      expect(star.className).toEqual('Rating-choice');
      expect(star.tagName).toEqual('BUTTON');
    });
  });

  it('renders an accessible description for null stars', () => {
    const root = render({ rating: null });
    expect(findDOMNode(root).textContent).toEqual('Click to rate this add-on');
  });

  it('renders an accessible description for 0 stars', () => {
    const root = render({ rating: 0 });
    expect(findDOMNode(root).textContent).toEqual('Click to rate this add-on');
  });

  it('renders "no ratings" if no rating and readOnly', () => {
    const root = render({ rating: null, readOnly: true });
    expect(findDOMNode(root).textContent).toEqual('This add-on has no ratings.');
  });

  it('renders an accessible description for ratings', () => {
    const root = render({ rating: 2 });
    expect(findDOMNode(root).textContent).toEqual('Rated 2 out of 5');
  });

  it('renders star button with id in ratings', () => {
    const root = render();
    const elementKeys = Object.keys(root.ratingElements);

    let allDivs = true;
    elementKeys.forEach((key) => {
      if (!root.ratingElements[key].id) {
        allDivs = false;
      }
    });
    expect(allDivs).toBeTruthy();
  });

  it('renders read-only selected stars', () => {
    const root = render({ rating: 3, readOnly: true });

    // Make sure only the first 3 stars are selected.
    [1, 2, 3].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice Rating-selected-star');
    });
    [4, 5].forEach((rating) => {
      expect(root.ratingElements[rating].className).toEqual('Rating-choice');
    });
    expect(findDOMNode(root).textContent).toEqual('Rated 3 out of 5');
  });

  it('prevents form submission when selecting a rating', () => {
    const root = render({ onSelectRating: sinon.stub() });

    const fakeEvent = makeFakeEvent();
    const button = root.ratingElements[4];
    Simulate.click(button, fakeEvent);

    expect(fakeEvent.preventDefault.called).toEqual(true);
    expect(fakeEvent.stopPropagation.called).toEqual(true);
  });

  it('requires a valid onSelectRating callback', () => {
    const root = render({ onSelectRating: null });

    const button = root.ratingElements[4];
    expect(() => Simulate.click(button, makeFakeEvent()))
      .toThrowError(/onSelectRating was empty/);
  });

  describe('readOnly=true', () => {
    it('prevents you from selecting ratings', () => {
      const onSelectRating = sinon.stub();
      const root = render({
        onSelectRating,
        readOnly: true,
      });
      selectRating(root, 5);
      expect(onSelectRating.called).toEqual(false);
    });

    it('does not classify as editable when read-only', () => {
      const root = render({ readOnly: true });
      // Make sure it doesn't have the -editable class.
      expect(root.element.className).not.toContain('Rating--editable');
    });

    it('does not render buttons in read-only mode', () => {
      const root = render({ readOnly: true });
      const elementKeys = Object.keys(root.ratingElements);

      // Make sure we actually have 5 stars.
      expect(elementKeys.length).toEqual(5);

      let allDivs = true;
      elementKeys.forEach((key) => {
        if (root.ratingElements[key].tagName !== 'DIV') {
          allDivs = false;
        }
      });
      expect(allDivs).toBeTruthy();
    });

    it('does not define id to star divison when read-only', () => {
      const root = render({ readOnly: true });
      const elementKeys = Object.keys(root.ratingElements);

      let allDivs = true;
      elementKeys.forEach((key) => {
        if (root.ratingElements[key].id) {
          allDivs = false;
        }
      });
      expect(allDivs).toBeTruthy();
    });
  });

  describe('rating counts', () => {
    const getRating = (props = {}) => findDOMNode(render(props)).textContent;

    it('renders the average rating', () => {
      expect(getRating({ rating: 3.5 })).toEqual('Rated 3.5 out of 5');
    });

    it('localizes average rating', () => {
      const i18n = fakeI18n({ lang: 'de' });
      expect(getRating({ rating: 3.5, i18n })).toContain('3,5');
    });

    it('renders empty ratings', () => {
      expect(getRating({ rating: null })).toEqual('Click to rate this add-on');
    });
  });
});
