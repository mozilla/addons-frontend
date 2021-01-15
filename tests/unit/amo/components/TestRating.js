import * as React from 'react';

import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import IconStar from 'amo/components/IconStar';
import Rating, { RatingBase } from 'amo/components/Rating';

describe(__filename, () => {
  function render(customProps = {}) {
    const props = {
      i18n: fakeI18n(),
      ...customProps,
    };
    return shallowUntilTarget(<Rating {...props} />, RatingBase);
  }

  function renderWithRating(props = {}) {
    return render({ rating: 4, ...props });
  }

  function renderWithEmptyRating(props = {}) {
    // This is when a user rating has been fetched but it does not exist.
    // As a counter-example, when rating===undefined, it has not been
    // fetched yet.
    return render({ rating: null, ...props });
  }

  const getStar = ({ root, rating }) => {
    return root.find(`.Rating-rating-${rating}`);
  };

  function selectRating(root, ratingNumber) {
    const star = getStar({ root, rating: ratingNumber });
    star.simulate(
      'click',
      createFakeEvent({
        currentTarget: { value: star.prop('value') },
      }),
    );
  }

  it('classifies as editable by default', () => {
    const root = render();
    expect(root).toHaveClassName('Rating--editable');
  });

  it('can be classified as small', () => {
    const root = render({ styleSize: 'small' });
    expect(root).toHaveClassName('Rating--small');
  });

  it('can be classified as yellow stars', () => {
    const root = render({ yellowStars: true });
    const star = root.find(IconStar).at(0);
    expect(star).toHaveProp('yellow');
  });

  it('classifies as yellowStars=false by default', () => {
    const root = render();
    expect(root).not.toHaveClassName('Rating--yellowStars');
  });

  it('throws an error for invalid styleSize', () => {
    expect(() => render({ styleSize: 'x-large' })).toThrowError(
      /styleSize=x-large is not a valid value; possible values: small,/,
    );
  });

  it('lets you select a one star rating', () => {
    const onSelectRating = sinon.stub();
    const root = renderWithRating({ onSelectRating });
    selectRating(root, 1);
    sinon.assert.calledWith(onSelectRating, 1);
  });

  it('lets you select a two star rating', () => {
    const onSelectRating = sinon.stub();
    const root = renderWithRating({ onSelectRating });
    selectRating(root, 2);
    sinon.assert.calledWith(onSelectRating, 2);
  });

  it('lets you select a three star rating', () => {
    const onSelectRating = sinon.stub();
    const root = renderWithRating({ onSelectRating });
    selectRating(root, 3);
    sinon.assert.calledWith(onSelectRating, 3);
  });

  it('lets you select a four star rating', () => {
    const onSelectRating = sinon.stub();
    const root = renderWithRating({ onSelectRating });
    selectRating(root, 4);
    sinon.assert.calledWith(onSelectRating, 4);
  });

  it('lets you select a five star rating', () => {
    const onSelectRating = sinon.stub();
    const root = renderWithRating({ onSelectRating });
    selectRating(root, 5);
    sinon.assert.calledWith(onSelectRating, 5);
  });

  it('does not let you select a star while loading', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating, rating: undefined });
    selectRating(root, 1);
    sinon.assert.notCalled(onSelectRating);
  });

  it('renders correct full stars for a rating', () => {
    const verifyRating = (root) => {
      // Make sure only the first 3 stars are selected.
      [1, 2, 3].forEach((rating) => {
        expect(getStar({ root, rating })).toHaveClassName(
          'Rating-selected-star',
        );
      });
      [4, 5].forEach((rating) => {
        expect(getStar({ root, rating })).not.toHaveClassName(
          'Rating-selected-star',
        );
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
        expect(getStar({ root, rating })).toHaveClassName(
          'Rating-selected-star',
        );
      });
      // The fourth star is a half-star.
      const fourthStar = getStar({ root, rating: 4 });
      expect(fourthStar).toHaveClassName('Rating-half-star');
      expect(fourthStar).not.toHaveClassName('Rating-selected-star');

      expect(getStar({ root, rating: 5 })).not.toHaveClassName(
        'Rating-selected-star',
      );
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

    expect(root).toHaveProp('title', 'Rated 3.6 out of 5');
  });

  it('renders 0 selected stars for empty ratings', () => {
    // This will make dealing with API data easier when
    // an add-on hasn't been rated enough yet.
    const root = renderWithEmptyRating();

    // Make sure no stars have the selected class.
    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(getStar({ root, rating })).not.toHaveClassName(
        'Rating-selected-star',
      );
    });
  });

  it('renders all stars as selectable by default', () => {
    const root = renderWithRating();
    [1, 2, 3, 4, 5].forEach((rating) => {
      const star = getStar({ root, rating });
      expect(star).toHaveClassName('Rating-star');
      expect(star.type()).toEqual('button');
    });
  });

  it('renders an accessible button for each rating', () => {
    const root = renderWithEmptyRating();
    [1, 2, 3, 4, 5].forEach((rating) => {
      const button = getStar({ root, rating });
      const id = `Rating-rating-${rating}-title`;

      expect(button).toHaveProp('aria-describedby', id);

      // Each rating should have a `span` along with a button.
      expect(root.find(`span[id="${id}"]`)).toHaveLength(1);
      expect(root.find(`span[id="${id}"]`)).toHaveProp(
        'className',
        'visually-hidden',
      );
      expect(root.find(`span[id="${id}"]`)).toHaveText(
        `Rate this add-on ${rating} out of 5`,
      );
    });
  });

  it('renders an accessible description for null stars', () => {
    const root = renderWithEmptyRating();

    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(getStar({ root, rating })).toHaveProp(
        'title',
        `Rate this add-on ${rating} out of 5`,
      );
    });
  });

  it('renders an accessible description for 0 stars', () => {
    const root = render({ rating: 0 });

    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(getStar({ root, rating })).toHaveProp(
        'title',
        `Rate this add-on ${rating} out of 5`,
      );
    });
  });

  it('renders an appropriate title when updating a rating', () => {
    const userRating = 3;
    const root = render({ rating: userRating });

    [1, 2, 4, 5].forEach((rating) => {
      expect(getStar({ root, rating })).toHaveProp(
        'title',
        `Update your rating to ${rating} out of 5`,
      );
    });

    expect(getStar({ root, rating: userRating })).toHaveProp(
      'title',
      `Rated ${userRating} out of 5`,
    );
  });

  it('prevents form submission when selecting a rating', () => {
    const root = renderWithRating({ onSelectRating: sinon.stub() });

    const fakeEvent = createFakeEvent();
    const star = getStar({ root, rating: 4 });
    star.simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    sinon.assert.called(fakeEvent.stopPropagation);
  });

  it('requires a valid onSelectRating callback', () => {
    const root = renderWithRating({ onSelectRating: null });
    const star = getStar({ root, rating: 4 });

    expect(() => star.simulate('click', createFakeEvent())).toThrowError(
      /onSelectRating was empty/,
    );
  });

  it('selects stars on hover', () => {
    const root = renderWithEmptyRating();

    const hoverStar = getStar({ root, rating: 4 });
    hoverStar.simulate('mouseEnter', createFakeEvent());

    // The first 4 should be selected:
    for (const star of [1, 2, 3, 4]) {
      expect(getStar({ root, rating: star })).toHaveClassName(
        'Rating-selected-star',
      );
    }

    // The last one should not be selected.
    expect(getStar({ root, rating: 5 })).not.toHaveClassName(
      'Rating-selected-star',
    );
  });

  it('overrides the current rating when hovering over a star', () => {
    const currentRating = 2;
    const root = render({ rating: currentRating });

    const hoverStar = getStar({ root, rating: 1 });
    hoverStar.simulate('mouseEnter', createFakeEvent());

    expect(getStar({ root, rating: currentRating })).not.toHaveClassName(
      'Rating-selected-star',
    );
  });

  it('finishes hovering on mouseLeave', () => {
    const root = renderWithEmptyRating();

    const rating = 3;
    const hoverStar = getStar({ root, rating });
    hoverStar.simulate('mouseEnter', createFakeEvent());

    root.simulate('mouseLeave', createFakeEvent());

    expect(getStar({ root, rating })).not.toHaveClassName(
      'Rating-selected-star',
    );
  });

  describe('readOnly=true', () => {
    it('prevents you from selecting ratings', () => {
      const onSelectRating = sinon.stub();
      const root = renderWithRating({
        onSelectRating,
        readOnly: true,
      });
      selectRating(root, 5);
      sinon.assert.notCalled(onSelectRating);
    });

    it('does nothing when you hover over stars', () => {
      const _setState = sinon.stub();
      const root = renderWithRating({ readOnly: true, _setState });

      const rating = 3;
      const hoverStar = getStar({ root, rating });
      hoverStar.simulate('mouseEnter', createFakeEvent());

      sinon.assert.notCalled(_setState);
    });

    it('does nothing when finishing a hover action', () => {
      const _setState = sinon.stub();
      const root = renderWithRating({ readOnly: true, _setState });
      root.simulate('mouseLeave', createFakeEvent());

      sinon.assert.notCalled(_setState);
    });

    it('does not classify as editable when read-only', () => {
      const root = renderWithRating({ readOnly: true });
      expect(root).not.toHaveClassName('Rating--editable');
    });

    it('does not render buttons in read-only mode', () => {
      const root = renderWithRating({ readOnly: true });
      const stars = root.find('.Rating-star');

      // Make sure we actually have 5 stars.
      expect(stars).toHaveLength(5);

      expect(stars.find('button')).toHaveLength(0);
    });

    it('renders an appropriate title with an undefined rating when read-only', () => {
      const root = render({ rating: undefined, readOnly: true });

      expect(root).toHaveProp('title', 'There are no ratings yet');
    });

    it('renders an appropriate title with a null rating when read-only', () => {
      const root = render({ rating: null, readOnly: true });

      expect(root).toHaveProp('title', 'There are no ratings yet');
    });

    it('renders an appropriate title with a given rating when read-only', () => {
      const root = render({ rating: 3.8, readOnly: true });

      expect(root).toHaveProp('title', 'Rated 3.8 out of 5');
    });

    it('renders an accessible description for null ratings and read-only', () => {
      const root = render({ rating: null, readOnly: true });

      expect(root).toHaveProp('title', 'There are no ratings yet');
    });

    it('renders read-only selected stars', () => {
      const root = render({ rating: 3, readOnly: true });

      // Make sure only the first 3 stars are selected.
      [1, 2, 3].forEach((rating) => {
        expect(getStar({ root, rating })).toHaveClassName(
          'Rating-selected-star',
        );
      });
      [4, 5].forEach((rating) => {
        expect(getStar({ root, rating })).not.toHaveClassName(
          'Rating-selected-star',
        );
      });
    });

    it('renders an accessible description for read-only ratings', () => {
      const root = render({ rating: 3, readOnly: true });

      [1, 2, 3, 4, 5].forEach((rating) => {
        expect(getStar({ root, rating })).toHaveProp(
          'title',
          'Rated 3 out of 5',
        );
      });
    });

    it("only passes the selected and yellow prop to the IconStar component when it's not readOnly", () => {
      const root = render({ readOnly: false });

      const star = root.find(IconStar).at(0);

      expect(star).toHaveProp('selected');
      expect(star).not.toHaveProp('half');
    });

    it("passes several props to the IconStar component when it's readOnly", () => {
      const root = render({ readOnly: true });

      const star = root.find(IconStar).at(0);

      expect(star).toHaveProp('selected');
      expect(star).toHaveProp('half');
      expect(star).toHaveProp('yellow');
      expect(star).toHaveProp('readOnly', true);
    });
  });

  describe('rating counts', () => {
    it('renders the average rating', () => {
      const rating = 3.5;
      const root = render({ rating, readOnly: true });

      expect(root).toHaveProp('title', `Rated ${rating} out of 5`);
    });

    it('localizes average rating', () => {
      const i18n = fakeI18n({ lang: 'de' });
      expect(render({ rating: 3.5, i18n, readOnly: true }).text()).toContain(
        '3,5',
      );
    });

    it('renders empty ratings', () => {
      const root = renderWithEmptyRating({ readOnly: true });

      expect(root).toHaveProp('title', 'There are no ratings yet');
    });
  });

  describe('loading state', () => {
    it('enters a loading state without a rating', () => {
      const root = render({ rating: undefined });

      expect(root).toHaveClassName('Rating--loading');
    });

    it('exits the loading state with a rating value', () => {
      const root = render({ rating: 4 });

      expect(root).not.toHaveClassName('Rating--loading');
    });

    it('exits the loading state with an empty rating', () => {
      const root = renderWithEmptyRating();

      expect(root).not.toHaveClassName('Rating--loading');
    });
  });
});
