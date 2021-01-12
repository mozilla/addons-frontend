import knuthShuffle from 'knuth-shuffle';

import heroBannerOrderReducer, {
  initialState,
  setHeroBannerOrder,
} from 'amo/reducers/heroBanners';

describe(__filename, () => {
  const defaultParams = { name: 'MegaHero', sections: ['1', '2', '3'] };

  it('defaults to empty', () => {
    const state = heroBannerOrderReducer(initialState, {});

    expect(state).toEqual({});
  });

  it('creates a new key if one is not found', () => {
    const knuthShuffleSpy = sinon.spy(knuthShuffle, 'knuthShuffle');
    const state = heroBannerOrderReducer(
      initialState,
      setHeroBannerOrder({
        name: 'NotAKnownKey1234',
        sections: [1, 2, 3],
      }),
    );

    sinon.assert.notCalled(knuthShuffleSpy);
    expect(state).toMatchObject({
      NotAKnownKey1234: { order: [0, 1, 2] },
    });
  });

  it('randomizes the order if random prop is passed', () => {
    const knuthShuffleSpy = sinon.spy(knuthShuffle, 'knuthShuffle');
    const state = heroBannerOrderReducer(
      initialState,
      setHeroBannerOrder({
        name: 'CoolPage',
        random: true,
        sections: [1, 2, 3],
      }),
    );

    sinon.assert.called(knuthShuffleSpy);
    expect(state).toMatchObject({
      CoolPage: { order: expect.arrayContaining([0, 1, 2]) },
    });
  });

  it('does not modify the original sections data', () => {
    const knuthShuffleSpy = sinon.spy(knuthShuffle, 'knuthShuffle');
    const sections = [1, 2, 3, 5];
    heroBannerOrderReducer(
      initialState,
      setHeroBannerOrder({
        name: 'CoolPage',
        random: true,
        sections,
      }),
    );

    sinon.assert.called(knuthShuffleSpy);
    expect(sections).toEqual([1, 2, 3, 5]);
  });

  it('limits the number of sections to three', () => {
    const state = heroBannerOrderReducer(
      initialState,
      setHeroBannerOrder({
        name: 'CoolPage',
        sections: [1, 2, 3, 4, 5],
      }),
    );

    expect(state).toMatchObject({
      CoolPage: { order: expect.arrayContaining([0, 1, 2]) },
    });
  });

  it('accepts fewer than three sections', () => {
    const state = heroBannerOrderReducer(
      initialState,
      setHeroBannerOrder({
        name: 'CoolPage',
        sections: [1, 2],
      }),
    );

    expect(state).toMatchObject({
      CoolPage: { order: expect.arrayContaining([0, 1]) },
    });
  });

  it('randomizes first and then picks three sections', () => {
    const sections = [0, 1, 2, 3, 4, 5];
    // Our sort algorithm is reverse ordering.
    const knuthShuffleSpy = sinon
      .stub(knuthShuffle, 'knuthShuffle')
      .callsFake((sectionsToSort) => {
        return sectionsToSort.reverse();
      });

    const state = heroBannerOrderReducer(
      initialState,
      setHeroBannerOrder({
        name: 'CoolPage',
        random: true,
        sections,
      }),
    );

    sinon.assert.called(knuthShuffleSpy);
    expect(state).toMatchObject({
      CoolPage: { order: [5, 4, 3] },
    });
  });

  describe('carousel actions', () => {
    it('requires name', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.name;

      expect(() => {
        setHeroBannerOrder(partialParams);
      }).toThrow(/name is required/);
    });

    it('requires sections', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.sections;

      expect(() => {
        setHeroBannerOrder(partialParams);
      }).toThrow(/sections are required/);
    });
  });
});
