import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import Rating from 'ui/components/Rating';

function render({ ...props } = {}) {
  return findRenderedComponentWithType(renderIntoDocument(
    <Rating {...props} />
  ), Rating);
}

function makeFakeEvent() {
  return {
    preventDefault: sinon.stub(),
    stopPropagation: sinon.stub(),
    currentTarget: {},
  };
}

describe('ui/components/Rating', () => {
  function selectRating(root, ratingNumber) {
    const button = root.ratingElements[ratingNumber];
    assert.ok(button, `No button returned for rating: ${ratingNumber}`);
    Simulate.click(button);
  }

  it('classifies as editable by default', () => {
    const root = render();
    assert.include(root.element.className, 'Rating--editable');
  });

  it('can be classified as small', () => {
    const root = render({ small: true });
    assert.include(root.element.className, 'Rating--small');
  });

  it('lets you select a one star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 1);
    assert.equal(onSelectRating.called, true);
    assert.equal(onSelectRating.firstCall.args[0], 1);
  });

  it('lets you select a two star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 2);
    assert.equal(onSelectRating.called, true);
    assert.equal(onSelectRating.firstCall.args[0], 2);
  });

  it('lets you select a three star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 3);
    assert.equal(onSelectRating.called, true);
    assert.equal(onSelectRating.firstCall.args[0], 3);
  });

  it('lets you select a four star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 4);
    assert.equal(onSelectRating.called, true);
    assert.equal(onSelectRating.firstCall.args[0], 4);
  });

  it('lets you select a five star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 5);
    assert.equal(onSelectRating.called, true);
    assert.equal(onSelectRating.firstCall.args[0], 5);
  });

  it('renders selected stars corresponding to rating number', () => {
    const root = render({ rating: 3 });

    // Make sure only the first 3 stars are selected.
    [1, 2, 3].forEach((rating) => {
      assert.equal(root.ratingElements[rating].className,
                   'Rating-choice Rating-selected-star');
    });
    [4, 5].forEach((rating) => {
      assert.equal(root.ratingElements[rating].className,
                   'Rating-choice');
    });
  });

  it('renders all stars as selectable by default', () => {
    const root = render();
    [1, 2, 3, 4, 5].forEach((rating) => {
      const star = root.ratingElements[rating];
      assert.equal(star.className, 'Rating-choice');
      assert.equal(star.tagName, 'BUTTON');
    });
  });

  it('renders read-only selected stars', () => {
    const root = render({ rating: 3, readOnly: true });

    // Make sure only the first 3 stars are selected.
    [1, 2, 3].forEach((rating) => {
      assert.equal(root.ratingElements[rating].className,
                   'Rating-choice Rating-selected-star');
    });
    [4, 5].forEach((rating) => {
      assert.equal(root.ratingElements[rating].className,
                   'Rating-choice');
    });
  });

  it('prevents form submission when selecting a rating', () => {
    const root = render({ onSelectRating: sinon.stub() });

    const fakeEvent = makeFakeEvent();
    const button = root.ratingElements[4];
    Simulate.click(button, fakeEvent);

    assert.equal(fakeEvent.preventDefault.called, true);
    assert.equal(fakeEvent.stopPropagation.called, true);
  });

  it('requires a valid onSelectRating callback', () => {
    const root = render({ onSelectRating: null });

    const button = root.ratingElements[4];
    assert.throws(() => Simulate.click(button, makeFakeEvent()),
                  /onSelectRating was empty/);
  });

  describe('readOnly=true', () => {
    it('prevents you from selecting ratings', () => {
      const onSelectRating = sinon.stub();
      const root = render({
        onSelectRating,
        readOnly: true,
      });
      selectRating(root, 5);
      assert.equal(onSelectRating.called, false);
    });

    it('does not classify as editable when read-only', () => {
      const root = render({ readOnly: true });
      // Make sure it doesn't have the -editable class.
      assert.equal(root.element.className, 'Rating');
    });

    it('does not render buttons in read-only mode', () => {
      const root = render({ readOnly: true });
      const elementKeys = Object.keys(root.ratingElements);

      // Make sure we actually have 5 stars.
      assert.equal(elementKeys.length, 5);

      let allDivs = true;
      elementKeys.forEach((key) => {
        if (root.ratingElements[key].tagName !== 'DIV') {
          allDivs = false;
        }
      });
      assert.ok(allDivs, 'At least one star element was not a div');
    });
  });
});
