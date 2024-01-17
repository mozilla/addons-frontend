import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { cleanup, createEvent, fireEvent } from '@testing-library/react';

import Rating from 'amo/components/Rating';
import { fakeI18n, render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return defaultRender(<Rating {...props} />);
  };

  function renderWithRating(props = {}) {
    return render({ rating: 4, ...props });
  }

  function renderWithEmptyRating(props = {}) {
    // This is when a user rating has been fetched but it does not exist.
    // As a counter-example, when rating===undefined, it has not been
    // fetched yet.
    return render({ rating: null, ...props });
  }

  const getStarButton = ({ rating, currentRating = null }) => {
    let name = `Update your rating to ${rating} out of 5`;
    if (!currentRating) {
      name = `Rate this add-on ${rating} out of 5`;
    } else if (currentRating === rating) {
      name = `Rated ${rating} out of 5`;
    }

    return screen.getByRole('button', { name });
  };

  const getStar = ({ rating }) => {
    return screen.getByClassName(`Rating-rating-${rating}`);
  };

  const selectRating = async (ratingNumber) => {
    const star = getStarButton({ rating: ratingNumber });
    await userEvent.click(star);
  };

  it('classifies as editable by default', () => {
    render();
    expect(screen.getByClassName('Rating')).toHaveClass('Rating--editable');
  });

  it('can be classified as small', () => {
    render({ styleSize: 'small' });
    expect(screen.getByClassName('Rating')).toHaveClass('Rating--small');
  });

  it('can be classified as yellow stars', () => {
    render({ readOnly: true, yellowStars: true });

    expect(screen.getByClassName('Rating--yellowStars')).toBeInTheDocument();
  });

  it('classifies as yellowStars=false by default', () => {
    render({ readOnly: true });

    expect(
      screen.queryByClassName('Rating--yellowStars'),
    ).not.toBeInTheDocument();
  });

  it('throws an error for invalid styleSize', () => {
    expect(() => render({ styleSize: 'x-large' })).toThrow(
      /styleSize=x-large is not a valid value; possible values: small,/,
    );
  });

  it.each([1, 2, 3, 4, 5])(
    'lets you select a %s star rating',
    async (rating) => {
      const onSelectRating = jest.fn();
      renderWithEmptyRating({ onSelectRating });
      await selectRating(rating);
      expect(onSelectRating).toHaveBeenCalledWith(rating);
    },
  );

  it('does not let you select a star while loading', async () => {
    const onSelectRating = jest.fn();
    render({ onSelectRating, rating: undefined });
    await selectRating(1);
    expect(onSelectRating).not.toHaveBeenCalled();
  });

  it('renders correct full stars for a rating', () => {
    const verifyRating = (currentRating) => {
      // Make sure only the first 3 stars are selected.
      [1, 2, 3].forEach((rating) => {
        expect(getStarButton({ rating, currentRating })).toHaveClass(
          'Rating-selected-star',
        );
      });
      [4, 5].forEach((rating) => {
        expect(getStarButton({ rating, currentRating })).not.toHaveClass(
          'Rating-selected-star',
        );
      });
    };

    // Exact rating.
    let currentRating = 3;
    render({ rating: currentRating });
    verifyRating(currentRating);
    cleanup();

    // Should round down to full star.
    currentRating = 3.249;
    render({ rating: currentRating });
    verifyRating(currentRating);
    cleanup();

    // Should round up to full star.
    currentRating = 2.75;
    render({ rating: currentRating });
    verifyRating(currentRating);
  });

  it('renders correct half stars for a rating', () => {
    const verifyRating = (currentRating) => {
      // The first three stars are fully highlighted.
      [1, 2, 3].forEach((rating) => {
        expect(getStarButton({ currentRating, rating })).toHaveClass(
          'Rating-selected-star',
        );
      });
      // The fourth star is a half-star.
      const fourthStar = getStarButton({ currentRating, rating: 4 });
      expect(fourthStar).toHaveClass('Rating-half-star');
      expect(fourthStar).not.toHaveClass('Rating-selected-star');

      expect(getStarButton({ currentRating, rating: 5 })).not.toHaveClass(
        'Rating-selected-star',
      );
    };

    // Should round up to a half star.
    let currentRating = 3.25;
    render({ rating: currentRating });
    verifyRating(currentRating);
    cleanup();

    // Should round down to a half star.
    currentRating = 3.749;
    render({ rating: currentRating });
    verifyRating(currentRating);
  });

  it('rounds ratings to nearest 0.5 multiple', () => {
    // This should be treated like a rating of 3.5 in text.
    render({ rating: 3.60001, readOnly: true });
    expect(screen.getAllByTitle('Rated 3.6 out of 5')).toHaveLength(6);
  });

  it('renders 0 selected stars for empty ratings', () => {
    // This will make dealing with API data easier when
    // an add-on hasn't been rated enough yet.
    renderWithEmptyRating();

    // Make sure no stars have the selected class.
    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(getStarButton({ rating })).not.toHaveClass('Rating-selected-star');
    });
  });

  it('renders an accessible button for each rating', () => {
    renderWithEmptyRating();
    [1, 2, 3, 4, 5].forEach((rating) => {
      const button = getStarButton({ rating });
      const id = `Rating-rating-${rating}-title`;

      expect(button).toHaveAttribute('aria-describedby', id);

      // Each rating should have a `span` along with a button.
      const span = screen.getByText(`Rate this add-on ${rating} out of 5`);
      expect(span).toHaveClass('visually-hidden');
    });
  });

  it('renders an accessible description for null stars', () => {
    renderWithEmptyRating();

    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(
        screen.getByTitle(`Rate this add-on ${rating} out of 5`),
      ).toBeInTheDocument();
    });
  });

  it('renders an accessible description for 0 stars', () => {
    render({ rating: 0 });

    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(
        screen.getByTitle(`Rate this add-on ${rating} out of 5`),
      ).toBeInTheDocument();
    });
  });

  it('renders an appropriate title when updating a rating', () => {
    const userRating = 3;
    render({ rating: userRating });

    [1, 2, 4, 5].forEach((rating) => {
      expect(
        screen.getByTitle(`Update your rating to ${rating} out of 5`),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByTitle(`Rated ${userRating} out of 5`),
    ).toBeInTheDocument();
  });

  it('prevents form submission when selecting a rating', () => {
    renderWithEmptyRating({ onSelectRating: jest.fn() });
    const star = getStarButton({ rating: 1 });

    const clickEvent = createEvent.click(star);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
    const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

    fireEvent(star, clickEvent);
    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(stopPropagationWatcher).toHaveBeenCalled();
  });

  it('selects stars on hover', async () => {
    renderWithEmptyRating();

    const hoverStar = getStarButton({ rating: 4 });
    await userEvent.hover(hoverStar);

    // The first 4 should be selected:
    for (const star of [1, 2, 3, 4]) {
      expect(getStarButton({ rating: star })).toHaveClass(
        'Rating-selected-star',
      );
    }

    // The last one should not be selected.
    expect(getStarButton({ rating: 5 })).not.toHaveClass(
      'Rating-selected-star',
    );
  });

  it('overrides the current rating when hovering over a star', async () => {
    const currentRating = 2;
    render({ rating: currentRating });

    const hoverStar = getStarButton({ currentRating, rating: 1 });
    await userEvent.hover(hoverStar);

    expect(
      getStarButton({ currentRating, rating: currentRating }),
    ).not.toHaveClass('Rating-selected-star');
  });

  it('finishes hovering on mouseLeave', async () => {
    renderWithEmptyRating();

    const rating = 3;
    const hoverStar = getStarButton({ rating });
    await userEvent.hover(hoverStar);
    await userEvent.unhover(hoverStar);

    expect(getStarButton({ rating })).not.toHaveClass('Rating-selected-star');
  });

  describe('readOnly=true', () => {
    it('prevents you from selecting ratings', async () => {
      const onSelectRating = jest.fn();
      renderWithRating({ onSelectRating, readOnly: true });
      const star = getStar({ rating: 1 });
      await userEvent.click(star);
      expect(onSelectRating).not.toHaveBeenCalled();
    });

    it('does nothing when you hover over stars', async () => {
      const _setState = jest.fn();
      renderWithRating({ readOnly: true, _setState });

      const rating = 3;
      const hoverStar = getStar({ rating });
      await userEvent.hover(hoverStar);
      expect(_setState).not.toHaveBeenCalled();
    });

    it('does nothing when finishing a hover action', async () => {
      const _setState = jest.fn();
      renderWithRating({ readOnly: true, _setState });

      const rating = 3;
      const hoverStar = getStar({ rating });
      await userEvent.hover(hoverStar);
      await userEvent.unhover(hoverStar);
      expect(_setState).not.toHaveBeenCalled();
    });

    it('does not classify as editable when read-only', () => {
      renderWithRating({ readOnly: true });
      expect(screen.getByClassName('Rating')).not.toHaveClass(
        'Rating--editable',
      );
    });

    it('does not render buttons in read-only mode', () => {
      renderWithRating({ readOnly: true });

      // Make sure we actually have 5 stars.
      expect(screen.getAllByClassName('Rating-star')).toHaveLength(5);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders correct and accessible titles with an undefined rating when read-only', () => {
      render({ rating: undefined, readOnly: true });

      expect(screen.getAllByTitle('There are no ratings yet')).toHaveLength(6);
    });

    it('renders correct and accessible titles with a null rating when read-only', () => {
      render({ rating: null, readOnly: true });

      expect(screen.getAllByTitle('There are no ratings yet')).toHaveLength(6);
    });

    it('renders correct and accessible titles with a given rating when read-only', () => {
      render({ rating: 3.8, readOnly: true });

      expect(screen.getAllByTitle('Rated 3.8 out of 5')).toHaveLength(6);
    });

    it('renders read-only selected stars', () => {
      render({ rating: 3, readOnly: true });

      // Make sure only the first 3 stars are selected.
      [1, 2, 3].forEach((rating) => {
        expect(getStar({ rating })).toHaveClass('Rating-selected-star');
      });
      [4, 5].forEach((rating) => {
        expect(getStar({ rating })).not.toHaveClass('Rating-selected-star');
      });
    });
  });

  it('localizes the rating title', () => {
    const jed = fakeI18n({ lang: 'de' });
    render({ rating: 3.5, jed, readOnly: true });
    expect(screen.getAllByTitle('Rated 3,5 out of 5')).toHaveLength(6);
  });

  describe('loading state', () => {
    it('enters a loading state without a rating', () => {
      render({ rating: undefined });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('exits the loading state with a rating value', () => {
      render({ rating: 4 });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('exits the loading state with an empty rating', () => {
      renderWithEmptyRating();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
