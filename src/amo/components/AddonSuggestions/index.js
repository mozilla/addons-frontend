/* @flow */
import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import {
  ADDON_TYPE_EXTENSION,
  INSTALL_SOURCE_SUGGESTIONS,
  SUGGESTIONS_CLICK_CATEGORY,
} from 'amo/constants';
import {
  fetchSuggestions,
  getSuggestionsByCollection,
} from 'amo/reducers/suggestions';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import defaultTracking, { getAddonTypeForTracking } from 'amo/tracking';
import LoadingText from 'amo/components/LoadingText';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { AddonType, CollectionAddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type DefaultProps = {|
  tracking: typeof defaultTracking,
|};

type PropsFromState = {|
  loading: boolean,
  suggestions: Array<CollectionAddonType> | null,
|};

type Props = {|
  ...DefaultProps,
  ...PropsFromState,
  addon: AddonType | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  jed: I18nType,
|};

const NUMBER_OF_SUGGESTIONS = 4;

const getCategory = (
  addon: AddonType | null,
  jed: I18nType,
): {| slug: string, collection: string, heading: string |} | null => {
  const starterPackBaseProps = {
    collection: 'b4d5649fb087446aa05add5f0258c3',
    heading: jed.gettext(
      `Explore our 'Starter Pack' to get started with extensions`,
    ),
  };
  // This is a list of category slugs in decending order of priority, used to
  // choose a category when an add-on has more than one category. It also
  // indicates the slug of the collection which holds the suggestions for the
  // category, and the heading to use for the category.
  const categoryHierarchy = [
    {
      slug: 'privacy-security',
      collection: 'privacy-matters',
      heading: jed.gettext('More powerful privacy & security extensions'),
    },
    {
      slug: 'download-management',
      collection: 'download_managers',
      heading: jed.gettext('More incredible download managers'),
    },

    {
      slug: 'bookmarks',
      collection: 'tab_bookmark_managers',
      heading: jed.gettext('More fantastic tab & bookmark extensions'),
    },
    {
      slug: 'tabs',
      collection: 'tab_bookmark_managers',
      heading: jed.gettext('More fantastic tab & bookmark extensions'),
    },
    {
      slug: 'games-entertainment',
      collection: '22469a386e654ca487b14d789e7250',
      heading: jed.gettext('More great extensions for games & entertainment'),
    },
    {
      slug: 'photos-music-videos',
      collection: '345d4c73b3e647a78522f385ce8ea7',
      heading: jed.gettext('More amazing image, photo & media extensions'),
    },
    {
      slug: 'language-support',
      collection: 'language_support',
      heading: jed.gettext(
        'More powerful tools for translations, writing & grammar support',
      ),
    },
    {
      slug: 'appearance',
      collection: 'c1b874b24c184334a7e4844a2305d4',
      heading: jed.gettext(
        'More amazing extensions to change the way Firefox looks',
      ),
    },
    {
      slug: 'social-communication',
      collection: 'social_media',
      heading: jed.gettext('More incredible social media extensions'),
    },
    {
      slug: 'search-tools',
      collection: '31c330a1d5594d06a7600288464732',
      heading: jed.gettext('More excellent search extensions'),
    },
    {
      slug: 'feeds-news-blogging',
      collection: '9be99620f151420b91ac1fb30573d0',
      heading: jed.gettext('More great extensions for feeds, news & media'),
    },
    {
      slug: 'alerts-updates',
      collection: '54adf6148c9e45c28a8fa35bd03fe2',
      heading: jed.gettext('More great notification extensions'),
    },
    {
      slug: 'shopping',
      ...starterPackBaseProps,
    },
    {
      slug: 'web-development',
      collection: 'webdeveloper',
      heading: jed.gettext('More great tools for web developers'),
    },
    {
      slug: 'other',
      ...starterPackBaseProps,
    },
  ];

  const categories = addon?.categories || [];
  if (categories.length) {
    for (const category of categoryHierarchy) {
      if (categories.includes(category.slug)) {
        return category;
      }
    }
  }
  return null;
};

export class AddonSuggestionsBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    tracking: defaultTracking,
  };

  componentDidMount() {
    const { addon, jed, suggestions } = this.props;

    if (addon && getCategory(addon, jed) && !suggestions) {
      this.dispatchFetchSuggestions(addon);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { addon: oldAddon } = prevProps;
    const { addon: newAddon, jed } = this.props;

    // Fetch suggestions when the add-on changes.
    if (
      newAddon &&
      getCategory(newAddon, jed) &&
      (!oldAddon || (oldAddon && oldAddon.guid !== newAddon.guid))
    ) {
      this.dispatchFetchSuggestions(newAddon);
    }
  }

  dispatchFetchSuggestions(addon: AddonType) {
    const { jed, loading } = this.props;
    const category = getCategory(addon, jed);

    invariant(category, 'Cannot dispatch fetchSuggestions without a category');

    if (!loading) {
      this.props.dispatch(
        fetchSuggestions({
          collection: category.collection,
          errorHandlerId: this.props.errorHandler.id,
        }),
      );
    }
  }

  onAddonClick: (addon: AddonType | CollectionAddonType) => void = (
    addon: AddonType | CollectionAddonType,
  ) => {
    const { tracking } = this.props;
    tracking.sendEvent({
      action: getAddonTypeForTracking(addon.type),
      category: SUGGESTIONS_CLICK_CATEGORY,
      label: addon.guid,
    });
  };

  getRandomSuggestions(): Array<CollectionAddonType> {
    const { suggestions } = this.props;

    return (
      (suggestions &&
        [...suggestions]
          .sort(() => 0.5 - Math.random())
          .slice(0, NUMBER_OF_SUGGESTIONS)) ||
      []
    );
  }

  render(): null | React.Node {
    const { addon, errorHandler, jed, loading, suggestions } = this.props;

    const category = getCategory(addon, jed);

    if (addon && addon.type !== ADDON_TYPE_EXTENSION) {
      log.debug('Not an extension, hiding the AddonSuggestions component.');
      return null;
    }

    if (suggestions && !suggestions.length) {
      log.debug('No suggestions, hiding the AddonSuggestions component.');
      return null;
    }

    if (!suggestions && errorHandler.hasError()) {
      log.debug(
        'Error in fetching suggestions, hiding the AddonSuggestions component.',
      );
      return null;
    }

    const header: React.Node | string =
      category && !loading && suggestions ? (
        category.heading
      ) : (
        <LoadingText width={100} />
      );

    const footerLink = category
      ? {
          pathname: `/collections/${config.get('mozillaUserId')}/${
            category.collection
          }/`,
          query: { addonInstallSource: INSTALL_SOURCE_SUGGESTIONS },
        }
      : null;

    return (
      <LandingAddonsCard
        addonInstallSource={INSTALL_SOURCE_SUGGESTIONS}
        addons={this.getRandomSuggestions()}
        alwaysDisplayFooter
        className="AddonSuggestions"
        header={header}
        footerText={jed.gettext('See Firefox Staff Picks')}
        footerLink={footerLink}
        loading={loading || !suggestions}
        onAddonClick={this.onAddonClick}
        placeholderCount={NUMBER_OF_SUGGESTIONS}
      />
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: Props): PropsFromState => {
  const { addon, jed } = ownProps;
  const { loading } = state.suggestions;
  let suggestions = null;
  const category = getCategory(addon, jed);
  if (category) {
    suggestions = getSuggestionsByCollection({
      collection: category.collection,
      state: state.suggestions,
    });
  }
  return { loading, suggestions };
};

const AddonSuggestions: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withErrorHandler({ id: 'AddonSuggestions' }),
)(AddonSuggestionsBase);

export default AddonSuggestions;
