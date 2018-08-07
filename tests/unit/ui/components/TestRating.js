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
  return findRenderedComponentWithType(
    renderIntoDocument(<Rating {...props} />),
    RatingBase,
  );
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

  it('can be classified as yellowStars', () => {
    const root = render({ yellowStars: true });
    expect(root.element.className).toContain('Rating--yellowStars');
  });

  it('classifies as non-yellow by default', () => {
    const root = render();
    expect(root.element.className).not.toContain('Rating--yellowStars');
  });

  it('throws an error for invalid styleSize', () => {
    expect(() => render({ styleSize: 'x-large' })).toThrowError(
      /styleSize=x-large is not a valid value; possible values: small,/,
    );
  });

  it('lets you select a one star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 1);
    sinon.assert.calledWith(onSelectRating, 1);
  });

  it('lets you select a two star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 2);
    sinon.assert.calledWith(onSelectRating, 2);
  });

  it('lets you select a three star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 3);
    sinon.assert.calledWith(onSelectRating, 3);
  });

  it('lets you select a four star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 4);
    sinon.assert.calledWith(onSelectRating, 4);
  });

  it('lets you select a five star rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });
    selectRating(root, 5);
    sinon.assert.calledWith(onSelectRating, 5);
  });

  it('renders correct full stars for a rating', () => {
    const verifyRating = (root) => {
      // Make sure only the first 3 stars are selected.
      [1, 2, 3].forEach((rating) => {
        expect(root.ratingElements[rating].className).toEqual(
          'Rating-choice Rating-selected-star',
        );
      });
      [4, 5].forEach((rating) => {
        expect(root.ratingElements[rating].className).toEqual('Rating-choice');
      });
    };

    // Exact rating.
    let root = render({ rating: 3 });
    verifyRating(root);

    // Should round down to full star.
    root = render({ rating: 3.249 });
    verifyRating(root);

    // Should round up to full star.
    root = render({ rating: 2.75 });
    verifyRating(root);
  });

  it('renders correct half stars for a rating', () => {
    const verifyRating = (root) => {
      // The first three stars are fully highlighted.
      [1, 2, 3].forEach((rating) => {
        expect(root.ratingElements[rating].className).toEqual(
          'Rating-choice Rating-selected-star',
        );
      });
      // The fourth star is a half-star.
      expect(root.ratingElements[4].className).toEqual(
        'Rating-choice Rating-half-star',
      );
      expect(root.ratingElements[5].className).toEqual('Rating-choice');
    };

    // Should round up to a half star.
    let root = render({ rating: 3.25 });
    verifyRating(root);
    // Should round down to a half star.
    root = render({ rating: 3.749 });
    verifyRating(root);
  });

  it('rounds ratings to nearest 0.5 multiple', () => {
    // This should be treated like a rating of 3.5 in text.
    const root = render({ rating: 3.60001, readOnly: true });

    expect(findDOMNode(root).title).toContain('3.6 out of 5');
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

    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(root.ratingElements[rating].title).toEqual(
        `Rate this add-on ${rating} out of 5`,
      );
    });
  });

  it('renders an accessible description for 0 stars', () => {
    const root = render({ rating: 0 });

    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(root.ratingElements[rating].title).toEqual(
        `Rate this add-on ${rating} out of 5`,
      );
    });
  });

  it('renders an appropriate title when updating a rating', () => {
    const root = render({ rating: 3 });

    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(root.ratingElements[rating].title).toEqual(
        `Update your rating to ${rating} out of 5`,
      );
    });
  });

  it('prevents form submission when selecting a rating', () => {
    const root = render({ onSelectRating: sinon.stub() });

    const fakeEvent = makeFakeEvent();
    const button = root.ratingElements[4];
    Simulate.click(button, fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    sinon.assert.called(fakeEvent.stopPropagation);
  });

  it('requires a valid onSelectRating callback', () => {
    const root = render({ onSelectRating: null });

    const button = root.ratingElements[4];
    expect(() => Simulate.click(button, makeFakeEvent())).toThrowError(
      /onSelectRating was empty/,
    );
  });

  describe('readOnly=true', () => {
    it('prevents you from selecting ratings', () => {
      const onSelectRating = sinon.stub();
      const root = render({
        onSelectRating,
        readOnly: true,
      });
      selectRating(root, 5);
      sinon.assert.notCalled(onSelectRating);
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

    it('renders an appropriate title with an undefined rating when read-only', () => {
      const root = render({ readOnly: true });

      expect(findDOMNode(root).title).toEqual('There are no ratings yet');
    });

    it('renders an appropriate title with a null rating when read-only', () => {
      const root = render({ rating: null, readOnly: true });

      expect(findDOMNode(root).title).toEqual('There are no ratings yet');
    });

    it('renders an appropriate title with a given rating when read-only', () => {
      const root = render({ rating: 3.8, readOnly: true });

      expect(findDOMNode(root).title).toEqual('Rated 3.8 out of 5');
    });

    it('renders an accessible description for null ratings and read-only', () => {
      const root = render({ rating: null, readOnly: true });

      expect(findDOMNode(root).title).toContain('There are no ratings yet');
    });

    it('renders read-only selected stars', () => {
      const root = render({ rating: 3, readOnly: true });

      // Make sure only the first 3 stars are selected.
      [1, 2, 3].forEach((rating) => {
        expect(root.ratingElements[rating].className).toEqual(
          'Rating-choice Rating-selected-star',
        );
      });
      [4, 5].forEach((rating) => {
        expect(root.ratingElements[rating].className).toEqual('Rating-choice');
      });
    });

    it('renders an accessible description for read-only ratings', () => {
      const root = render({ rating: 3, readOnly: true });

      [1, 2, 3, 4, 5].forEach((rating) => {
        expect(root.ratingElements[rating].title).toEqual('Rated 3 out of 5');
      });
    });
  });

  describe('rating counts', () => {
    const getRating = (props = {}) => findDOMNode(render(props)).textContent;

    it('renders the average rating', () => {
      expect(getRating({ rating: 3.5, readOnly: true })).toEqual(
        'Rated 3.5 out of 5',
      );
    });

    it('localizes average rating', () => {
      const i18n = fakeI18n({ lang: 'de' });
      expect(getRating({ rating: 3.5, i18n, readOnly: true })).toContain('3,5');
    });

    it('renders empty ratings', () => {
      expect(getRating({ rating: null, readOnly: true })).toEqual(
        'There are no ratings yet',
      );
    });
  });
});
