import * as React from 'react';
import { createEvent, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DEFAULT_API_PAGE_SIZE } from 'amo/api';
import AddonsCard from 'amo/components/AddonsCard';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  DEFAULT_UTM_SOURCE,
  RECOMMENDED,
} from 'amo/constants';
import {
  createHistory,
  createInternalAddonWithLang,
  createLocalizedString,
  dispatchClientMetadata,
  fakeAddon,
  fakeAuthor,
  fakeI18n,
  fakePreview,
  render as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let addons;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({ history, location, lang, ...customProps } = {}) => {
    const props = {
      deleteNote: jest.fn(),
      removeAddon: jest.fn(),
      saveNote: jest.fn(),
      ...customProps,
    };
    const renderOptions = {
      history:
        history ||
        createHistory({
          initialEntries: [location || '/'],
        }),
      store,
    };
    if (lang) {
      renderOptions.i18n = fakeI18n({ lang });
    }

    return defaultRender(<AddonsCard {...props} />, renderOptions);
  };

  beforeAll(() => {
    addons = [
      {
        ...fakeAddon,
        name: createLocalizedString('I am add-on!'),
        slug: 'i-am-addon',
      },
      {
        ...fakeAddon,
        name: createLocalizedString('I am also add-on!'),
        slug: 'i-am-also-addon',
      },
    ].map((addon) => createInternalAddonWithLang(addon));
  });

  it('can render a horizontal class', () => {
    render({ type: 'horizontal' });

    expect(screen.getByClassName('AddonsCard--horizontal')).toBeInTheDocument();
  });

  it('does not render a horizontal class by default', () => {
    render();

    expect(
      screen.queryByClassName('AddonsCard--horizontal'),
    ).not.toBeInTheDocument();
  });

  it('renders add-ons when supplied', () => {
    render({ addons });

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: addons[0].name })).toHaveClass(
      'SearchResult-link',
    );
    expect(screen.getByRole('link', { name: addons[1].name })).toHaveClass(
      'SearchResult-link',
    );
  });

  it('renders editable add-ons when supplied and requested', () => {
    render({ addons, editing: true });

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: addons[0].name })).toHaveClass(
      'EditableCollectionAddon-name',
    );
    expect(screen.getByRole('heading', { name: addons[1].name })).toHaveClass(
      'EditableCollectionAddon-name',
    );
  });

  it('passes expected functions to editable add-ons', async () => {
    const deleteNote = jest.fn();
    const removeAddon = jest.fn();
    const saveNote = jest.fn();
    const notes = 'Some add-on notes.';

    render({
      addons: [createInternalAddonWithLang({ ...fakeAddon, notes })],
      deleteNote,
      editing: true,
      removeAddon,
      saveNote,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.type(screen.getByRole('textbox'), 'Some new notes');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(saveNote).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteNote).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(removeAddon).toHaveBeenCalled();
  });

  it('renders children', () => {
    const content = 'I am content';
    render({ addons, children: <div>{content}</div> });

    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders placeholders when loading addons', () => {
    render({ addons: null, loading: true });

    // There will be 4 loading indicators per SearchResult.
    expect(screen.getAllByRole('alert')).toHaveLength(
      DEFAULT_API_PAGE_SIZE * 4,
    );
    // By default we do not want "theme" placeholders.
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(DEFAULT_API_PAGE_SIZE);
    expect(imgs[0]).toHaveClass('SearchResult-icon--loading');
  });

  it('handles an empty set of addons', () => {
    render({ addons: [], loading: false });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('allows you configure the number of placeholders', () => {
    const placeholderCount = 2;
    render({
      addons: null,
      loading: true,
      placeholderCount,
    });

    expect(screen.getAllByRole('img')).toHaveLength(placeholderCount);
  });

  it('renders addons even when loading', () => {
    render({ addons, loading: true });

    expect(
      screen.getByRole('link', { name: addons[0].name }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: addons[1].name }),
    ).toBeInTheDocument();
  });

  it('hides summary for a static theme', () => {
    const summary = 'Summary for a theme';
    render({
      addons: [
        createInternalAddonWithLang({
          ...fakeAddon,
          summary: createLocalizedString(summary),
          type: ADDON_TYPE_STATIC_THEME,
        }),
      ],
    });

    expect(screen.queryByText(summary)).not.toBeInTheDocument();
  });

  it('passes the footer prop through to Card', () => {
    const footer = 'some footer';
    render({ footer });

    expect(screen.getByRole('contentinfo')).toHaveTextContent(footer);
  });

  it('passes the footerText prop through to Card', () => {
    const footerText = 'some footer text';
    render({ footerText });

    expect(screen.getByRole('contentinfo')).toHaveTextContent(footerText);
  });

  it('passes the footerLink prop through to Card', () => {
    const footerLink = 'some footer link';
    render({ footerLink });

    expect(screen.getByRole('contentinfo')).toHaveTextContent(footerLink);
  });

  it('passes the header prop through to Card', () => {
    const header = 'some header';
    render({ header });

    expect(screen.getByRole('banner')).toHaveTextContent(header);
  });

  it('passes the isHomepageShelf prop through to Card', () => {
    const footer = 'some footer';
    render({ footer, isHomepageShelf: true });

    expect(screen.getByRole('contentinfo')).toHaveClass('Card-shelf-footer');
  });

  describe('Tests for SearchResult', () => {
    const name = 'A search result';
    const slug = 'a-search-result';

    const createAddon = (props) =>
      createInternalAddonWithLang({
        ...fakeAddon,
        authors: [
          { name: 'A funky déveloper' },
          { name: 'A groovy developer' },
        ],
        average_daily_users: 5253,
        promoted: [],
        name: createLocalizedString(name),
        slug,
        ...props,
      });

    const renderWithResult = ({ addonProps = {}, props = {} } = {}) => {
      const addon = createAddon(addonProps);
      return render({ addons: [addon], ...props });
    };

    it('renders a heading with a link to the detail page', () => {
      renderWithResult();

      expect(screen.getByRole('link', { name })).toHaveAttribute(
        'href',
        `/en-US/android/addon/${slug}/`,
      );
    });

    it('stops propagation when clicking on the add-on name', () => {
      renderWithResult();

      const link = screen.getByRole('link', { name });
      const clickEvent = createEvent.click(link);
      const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

      fireEvent(link, clickEvent);
      expect(stopPropagationWatcher).toHaveBeenCalled();
    });

    it('links the heading to the detail page with UTM params', () => {
      const addonInstallSource = 'home-page-featured';
      renderWithResult({ props: { addonInstallSource } });

      const expectedLink = [
        `/en-US/android/addon/${slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
        'utm_medium=referral',
        `utm_content=${addonInstallSource}`,
      ].join('&');
      expect(screen.getByRole('link', { name })).toHaveAttribute(
        'href',
        expectedLink,
      );
    });

    it('renders the author', () => {
      const authorName = 'An add-on author';
      renderWithResult({
        addonProps: {
          authors: [{ ...fakeAuthor, name: authorName }],
        },
      });
      renderWithResult();

      expect(
        screen.getByRole('heading', { name: authorName }),
      ).toBeInTheDocument();
    });

    it('can hide the metadata section', () => {
      const authorName = 'An add-on author';
      renderWithResult({
        addonProps: {
          authors: [{ ...fakeAuthor, name: authorName }],
        },
        props: { showMetadata: false },
      });

      // The Author info is in the metadata section.
      expect(
        screen.queryByRole('heading', { name: authorName }),
      ).not.toBeInTheDocument();
    });

    it('ignores an empty author list', () => {
      renderWithResult({ addonProps: { authors: undefined } });

      expect(
        screen.queryByClassName('SearchResult-author'),
      ).not.toBeInTheDocument();
    });

    it("renders only the first author's name when there are multiple", () => {
      const authorName1 = 'An add-on author';
      const authorName2 = 'Another add-on author';
      renderWithResult({
        addonProps: {
          authors: [
            { ...fakeAuthor, name: authorName1 },
            { ...fakeAuthor, name: authorName2 },
          ],
        },
      });
      renderWithResult();

      expect(
        screen.getByRole('heading', { name: authorName1 }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: authorName2 }),
      ).not.toBeInTheDocument();
    });

    it('renders the user count', () => {
      renderWithResult({ addonProps: { average_daily_users: 6233 } });

      expect(
        screen.getByRole('heading', { name: '6,233 users' }),
      ).toBeInTheDocument();
    });

    it('localises the user count', () => {
      renderWithResult({
        addonProps: { average_daily_users: 6233 },
        props: { lang: 'fr' },
      });

      expect(
        screen.getByRole('heading', { name: '6 233 users' }),
      ).toBeInTheDocument();
    });

    it('renders the user count as singular', () => {
      renderWithResult({
        addonProps: { average_daily_users: 1 },
      });

      expect(
        screen.getByRole('heading', { name: '1 user' }),
      ).toBeInTheDocument();
    });

    it('links the li element to the detail page', async () => {
      const history = createHistory();
      renderWithResult({ props: { history } });

      const pushSpy = jest.spyOn(history, 'push');
      await userEvent.click(screen.getByRole('listitem'));

      expect(pushSpy).toHaveBeenCalledWith(`/en-US/android/addon/${slug}/`);
    });

    it('calls the custom onClick handler for the li element, passing the addon', async () => {
      const onClick = jest.fn();
      renderWithResult({ props: { onAddonClick: onClick } });

      await userEvent.click(screen.getByRole('listitem'));

      expect(onClick).toHaveBeenCalledWith(createAddon());
    });

    it('does not call the custom onClick handler for the li element without an addon', async () => {
      const onClick = jest.fn();
      render({ loading: true, onAddonClick: onClick, placeholderCount: 1 });

      await userEvent.click(screen.getByRole('listitem'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('calls the custom onClick handler for the anchor element, passing the addon', async () => {
      const onClick = jest.fn();
      renderWithResult({ props: { onAddonClick: onClick } });

      await userEvent.click(screen.getByRole('link', { name }));

      expect(onClick).toHaveBeenCalledWith(createAddon());
    });

    it('calls the custom onImpression handler, passing the addon', () => {
      const onImpression = jest.fn();
      renderWithResult({ props: { onAddonImpression: onImpression } });

      expect(onImpression).toHaveBeenCalledWith(createAddon());
    });

    it('does not call the custom onImpression handler without an addon', () => {
      const onImpression = jest.fn();
      render({ loading: true, onAddonImpression: onImpression });

      expect(onImpression).not.toHaveBeenCalled();
    });

    it('renders the star ratings', () => {
      renderWithResult({
        addonProps: { ratings: { ...fakeAddon.ratings, average: 3.9 } },
      });

      expect(screen.getAllByTitle('Rated 3.9 out of 5')).toHaveLength(6);
    });

    it('renders the summary', () => {
      const summary = 'Summary for an add-on';
      renderWithResult({
        addonProps: {
          summary: createLocalizedString(summary),
        },
      });

      expect(screen.getByText(summary)).toBeInTheDocument();
    });

    it('can hide the summary section', () => {
      const summary = 'Summary for an add-on';
      renderWithResult({
        addonProps: {
          summary: createLocalizedString(summary),
        },
        props: { showSummary: false },
      });

      expect(screen.queryByText(summary)).not.toBeInTheDocument();
    });

    it('adds a theme-specific class', () => {
      renderWithResult({
        addonProps: {
          type: ADDON_TYPE_STATIC_THEME,
        },
      });

      expect(screen.getByRole('listitem')).toHaveClass('SearchResult--theme');
    });

    it('adds a theme-specific class when useThemePlaceholder is true and it is loading', () => {
      render({ loading: true, placeholderCount: 1, useThemePlaceholder: true });

      expect(screen.getByRole('listitem')).toHaveClass('SearchResult--theme');
    });

    it("renders an image's alt attribute as its addon name", () => {
      renderWithResult();

      expect(screen.getByAltText(name)).toBeInTheDocument();
    });

    it('renders an empty string for the image alt tag while there is no addon', () => {
      render({ loading: true, placeholderCount: 1 });

      expect(screen.getByAltText('')).toBeInTheDocument();
    });

    it('renders a loading class name while there is no addon', () => {
      render({ loading: true, placeholderCount: 1 });

      expect(
        screen.getByClassName('SearchResult-icon--loading'),
      ).toBeInTheDocument();
    });

    it('displays the thumbnail image as the default src for static theme', () => {
      const headerImageThumb =
        'https://addons.mozilla.org/user-media/thumb/12345.png';

      renderWithResult({
        addonProps: {
          type: ADDON_TYPE_STATIC_THEME,
          previews: [
            {
              ...fakePreview,
              thumbnail_url: headerImageThumb,
            },
          ],
        },
      });

      expect(screen.getByAltText(name)).toHaveAttribute(
        'src',
        headerImageThumb,
      );
    });

    it('displays the full preview for static theme when showFullSizePreview: true', () => {
      const headerImageFull =
        'https://addons.mozilla.org/user-media/full/12345.png';

      renderWithResult({
        addonProps: {
          type: ADDON_TYPE_STATIC_THEME,
          previews: [
            {
              ...fakePreview,
              image_url: headerImageFull,
            },
          ],
        },
        props: {
          showFullSizePreview: true,
        },
      });

      expect(screen.getByAltText(name)).toHaveAttribute('src', headerImageFull);
    });

    it('displays a fallback image for themes that only have 1 preview option', () => {
      const headerImageThumb =
        'https://addons.mozilla.org/user-media/thumb/12345.png';

      renderWithResult({
        addonProps: {
          type: ADDON_TYPE_STATIC_THEME,
          previews: [
            {
              ...fakePreview,
              thumbnail_url: headerImageThumb,
            },
          ],
        },
      });

      expect(screen.getByAltText(name)).toHaveAttribute(
        'src',
        headerImageThumb,
      );
    });

    it('displays a message if the static theme preview image is unavailable', () => {
      renderWithResult({
        addonProps: { previews: [], type: ADDON_TYPE_STATIC_THEME },
      });

      expect(
        screen.getByText('No theme preview available'),
      ).toBeInTheDocument();
    });

    it("does not display a 'no theme preview available' message if the static theme preview image is available", () => {
      renderWithResult({ addonProps: { type: ADDON_TYPE_STATIC_THEME } });

      expect(
        screen.queryByText('No theme preview available'),
      ).not.toBeInTheDocument();
    });

    it('renders placeholders without an addon', () => {
      render({ loading: true, placeholderCount: 1 });

      // Since there's no add-on, there shouldn't be a link.
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByAltText('')).toHaveAttribute('src', 'default.svg');
      expect(screen.getAllByRole('alert')).toHaveLength(4);
      expect(screen.getAllByTitle('There are no ratings yet')).toHaveLength(6);
    });

    it('displays a note if the addon has a note', () => {
      const notes = 'Some add-on notes.';
      renderWithResult({
        addonProps: {
          notes,
        },
      });

      expect(
        screen.getByRole('heading', { name: 'Add-on note' }),
      ).toBeInTheDocument();
      expect(screen.getByClassName('Icon-comments-blue')).toBeInTheDocument();
      expect(screen.getByText(notes)).toBeInTheDocument();
    });

    it('renders newlines in notes', () => {
      const notes = 'Some\nnotes.';
      renderWithResult({
        addonProps: {
          notes,
        },
      });

      expect(screen.getByTextAcrossTags('Somenotes.')).toBeInTheDocument();
      expect(
        within(screen.getByClassName('SearchResult-note')).getByTagName('br'),
      ).toBeInTheDocument();
    });

    it('does not display a note if the addon has no notes', () => {
      renderWithResult();

      expect(
        screen.queryByRole('heading', { name: 'Add-on note' }),
      ).not.toBeInTheDocument();
    });

    it('displays a promoted badge when an add-on is promoted', () => {
      renderWithResult({
        addonProps: {
          promoted: [{ category: RECOMMENDED, apps: [CLIENT_APP_ANDROID] }],
        },
      });

      expect(screen.getByClassName('PromotedBadge')).toHaveClass(
        'PromotedBadge-small',
      );
      expect(screen.getByClassName('IconPromotedBadge')).toHaveClass(
        'IconPromotedBadge-small',
      );
      expect(
        screen.getByRole('link', {
          name: 'Firefox only recommends add-ons that meet our standards for security and performance.',
        }),
      ).toHaveTextContent('Recommended');
    });

    it('passes an onClick function which stops propagation to PromotedBadge', () => {
      renderWithResult({
        addonProps: {
          promoted: [{ category: RECOMMENDED, apps: [CLIENT_APP_ANDROID] }],
        },
      });

      const link = screen.getByRole('link', {
        name: 'Firefox only recommends add-ons that meet our standards for security and performance.',
      });

      const clickEvent = createEvent.click(link);
      const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

      fireEvent(link, clickEvent);
      expect(stopPropagationWatcher).toHaveBeenCalled();
    });

    it('does not display a promoted badge when showPromotedBadge is false', () => {
      renderWithResult({
        addonProps: {
          promoted: [{ category: RECOMMENDED, apps: [CLIENT_APP_ANDROID] }],
        },
        props: { showPromotedBadge: false },
      });

      expect(
        screen.queryByRole('link', {
          name: 'Firefox only recommends add-ons that meet our standards for security and performance.',
        }),
      ).not.toBeInTheDocument();
    });

    it('does not display a promoted badge when the addon is not promoted', () => {
      renderWithResult({ addonProps: { promoted: [] } });

      expect(
        screen.queryByRole('link', {
          name: 'Firefox only recommends add-ons that meet our standards for security and performance.',
        }),
      ).not.toBeInTheDocument();
    });

    it('sets an extra css class to the icon wrapper when there is no theme image', () => {
      renderWithResult({
        addonProps: {
          type: ADDON_TYPE_STATIC_THEME,
          previews: [],
        },
      });

      expect(
        screen.getByClassName('SearchResult-icon-wrapper--no-theme-image'),
      ).toBeInTheDocument();
    });

    it('sets an extra css class to the icon wrapper when there is no add-on and we want to use a theme placeholder', () => {
      render({
        loading: true,
        placeholderCount: 1,
        useThemePlaceholder: true,
      });

      expect(
        screen.getByClassName('SearchResult-icon-wrapper--no-theme-image'),
      ).toBeInTheDocument();
    });

    it('does not set an extra css class to the icon wrapper when there is no add-on and we do not want to use a theme placeholder', () => {
      render({
        loading: true,
        placeholderCount: 1,
        useThemePlaceholder: false,
      });

      expect(
        screen.getByClassName('SearchResult-icon-wrapper'),
      ).toBeInTheDocument();
      expect(
        screen.queryByClassName('SearchResult-icon-wrapper--no-theme-image'),
      ).not.toBeInTheDocument();
    });

    it('renders a "notheme" placeholder when there is no add-on and we want to use a theme placeholder', () => {
      render({
        loading: true,
        placeholderCount: 1,
        useThemePlaceholder: true,
      });

      expect(
        screen.getByText('No theme preview available'),
      ).toBeInTheDocument();
    });

    it('does not renderWithResult a "notheme" placeholder when there is no add-on and we do not want to use a theme placeholder', () => {
      render({
        loading: true,
        placeholderCount: 1,
        useThemePlaceholder: false,
      });

      expect(
        screen.queryByText('No theme preview available'),
      ).not.toBeInTheDocument();
    });
  });
});
