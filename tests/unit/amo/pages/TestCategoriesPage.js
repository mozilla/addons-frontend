import { waitFor } from '@testing-library/react';

import { setViewContext } from 'amo/actions/viewContext';
import {
  FETCH_CATEGORIES,
  fetchCategories,
  loadCategories,
} from 'amo/reducers/categories';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import { getCanonicalURL, visibleAddonType } from 'amo/utils';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import {
  createFailedErrorHandler,
  createHistory,
  dispatchClientMetadata,
  fakeCategory,
  getElement,
  onLocationChanged,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const lang = 'en-US';
  const getLocation = (addonType = ADDON_TYPE_EXTENSION) =>
    `/${lang}/${clientApp}/${visibleAddonType(addonType)}/categories/`;
  const getErrorHandlerId = (addonType = ADDON_TYPE_EXTENSION) =>
    `Categories-${addonType}`;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const render = ({ addonType = ADDON_TYPE_EXTENSION } = {}) => {
    return defaultRender({
      history: createHistory({
        initialEntries: [getLocation(addonType)],
      }),
      store,
    });
  };

  it.each([
    [ADDON_TYPE_EXTENSION, 'extension'],
    [ADDON_TYPE_STATIC_THEME, 'theme'],
  ])('renders an HTML title for %s', async (addonType, expectedMatch) => {
    render({ addonType });

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        `All ${expectedMatch} categories – Add-ons for Firefox (en-US)`,
      ),
    );
  });

  it('renders a HeadLinks component', async () => {
    render();

    await waitFor(() =>
      expect(getElement('link[rel="canonical"]')).toBeInTheDocument(),
    );

    expect(getElement('link[rel="canonical"]')).toHaveAttribute(
      'href',
      getCanonicalURL({ locationPathname: getLocation() }),
    );
  });

  it.each([
    [ADDON_TYPE_EXTENSION, 'extension'],
    [ADDON_TYPE_STATIC_THEME, 'theme'],
  ])(
    'renders a HeadMetaTags component for %s',
    async (addonType, expectedMatch) => {
      render({ addonType });

      await waitFor(() =>
        expect(getElement('meta[property="og:title"]')).toBeInTheDocument(),
      );

      expect(getElement(`meta[property="og:title"]`)).toHaveAttribute(
        'content',
        `All ${expectedMatch} categories – Add-ons for Firefox (en-US)`,
      );
    },
  );

  describe('Tests for Categories', () => {
    it('fetches categories if needed', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).toHaveBeenCalledWith(
        fetchCategories({
          errorHandlerId: getErrorHandlerId(),
        }),
      );
    });

    it('does not fetch categories if already loading them', () => {
      store.dispatch(
        fetchCategories({
          errorHandlerId: getErrorHandlerId(),
        }),
      );
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_CATEGORIES }),
      );
    });

    it('does not fetch categories if already loaded', () => {
      store.dispatch(loadCategories({ results: [fakeCategory] }));
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_CATEGORIES }),
      );
    });

    it('does not fetch categories if an empty set was loaded', () => {
      store.dispatch(loadCategories({ results: [] }));
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_CATEGORIES }),
      );
    });

    it('changes viewContext if addonType changes', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      store.dispatch(
        onLocationChanged({
          pathname: getLocation(ADDON_TYPE_STATIC_THEME),
        }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        setViewContext(ADDON_TYPE_STATIC_THEME),
      );
    });

    it('does not dispatch setViewContext if addonType does not change', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).toHaveBeenCalledWith(
        setViewContext(ADDON_TYPE_EXTENSION),
      );

      dispatch.mockClear();

      store.dispatch(
        onLocationChanged({
          pathname: getLocation(ADDON_TYPE_EXTENSION),
        }),
      );

      expect(dispatch).not.toHaveBeenCalledWith(
        setViewContext(ADDON_TYPE_EXTENSION),
      );
    });

    it('renders Categories', () => {
      render();

      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    it('renders loading text when loading', () => {
      store.dispatch(
        fetchCategories({
          errorHandlerId: getErrorHandlerId(),
        }),
      );
      render();

      expect(screen.getByText('Loading categories.')).toBeInTheDocument();
    });

    it('renders LoadingText components when loading', () => {
      store.dispatch(
        fetchCategories({
          errorHandlerId: getErrorHandlerId(),
        }),
      );

      render();

      expect(screen.getAllByRole('alert')).toHaveLength(8);
    });

    it('generates an expected link for a category', () => {
      const categoriesResponse = {
        results: [
          {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            name: 'Games',
            slug: 'Games',
            type: ADDON_TYPE_EXTENSION,
          },
          {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            name: 'Travel',
            slug: 'Travel',
            type: ADDON_TYPE_EXTENSION,
          },
        ],
      };

      store.dispatch(loadCategories(categoriesResponse));

      render();

      expect(screen.getByRole('link', { name: 'Games' })).toHaveAttribute(
        'href',
        `/${lang}/${clientApp}${getCategoryResultsPathname({
          addonType: ADDON_TYPE_EXTENSION,
          slug: 'Games',
        })}`,
      );
      expect(screen.getByRole('link', { name: 'Travel' })).toHaveAttribute(
        'href',
        `/${lang}/${clientApp}${getCategoryResultsPathname({
          addonType: ADDON_TYPE_EXTENSION,
          slug: 'Travel',
        })}`,
      );
    });

    it('sorts and renders the sorted categories', () => {
      const categoriesResponse = {
        results: [
          {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            name: 'Travel',
            slug: 'travel',
            type: ADDON_TYPE_EXTENSION,
          },
          {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            name: 'Music',
            slug: 'music',
            type: ADDON_TYPE_EXTENSION,
          },
          {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            name: 'Nature',
            slug: 'nature',
            type: ADDON_TYPE_EXTENSION,
          },
          {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            name: 'Games',
            slug: 'Games',
            type: ADDON_TYPE_EXTENSION,
          },
        ],
      };

      store.dispatch(loadCategories(categoriesResponse));
      render();

      const categoryLinks = within(
        screen.getByClassName('Categories-list'),
      ).getAllByRole('link');

      expect(categoryLinks[0]).toHaveTextContent('Games');
      expect(categoryLinks[1]).toHaveTextContent('Music');
      expect(categoryLinks[2]).toHaveTextContent('Nature');
      expect(categoryLinks[3]).toHaveTextContent('Travel');
    });

    it('renders a no categories found message', () => {
      const categoriesResponse = { results: [] };
      store.dispatch(loadCategories(categoriesResponse));
      render();

      expect(screen.getByText('No categories found.')).toBeInTheDocument();
    });

    it('reports errors', () => {
      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(),
        message,
        store,
      });
      render();

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('renders a class name with a color for each category', () => {
      const categoriesResponse = {
        // Generate 13 categories.
        results: Array(13)
          .fill()
          .map((_, index) => ({
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            id: index,
            name: `category ${index}`,
            slug: `category-${index}`,
            type: ADDON_TYPE_EXTENSION,
          })),
      };
      store.dispatch(loadCategories(categoriesResponse));
      render();

      const categoryLinks = within(
        screen.getByClassName('Categories-list'),
      ).getAllByRole('link');

      expect(categoryLinks).toHaveLength(13);

      // The first `color-1` should be set on the 1st category.
      expect(categoryLinks[0]).toHaveClass('Categories--category-color-1');
      // The `color-12` should be set on the 12th category.
      expect(categoryLinks[11]).toHaveClass('Categories--category-color-12');
      // The second `color-1` should be set on the 13th category.
      expect(categoryLinks[12]).toHaveClass('Categories--category-color-1');
    });
  });
});
