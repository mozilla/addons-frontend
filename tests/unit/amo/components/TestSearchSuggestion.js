import * as React from 'react';

import SearchSuggestion, {
  SearchSuggestionBase,
} from 'amo/components/SearchSuggestion';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import {
  fakeAddon,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { ADDON_TYPE_STATIC_THEME } from 'core/constants';

describe(__filename, () => {
  const shallowComponent = (props = {}) => {
    const allProps = {
      _config: getFakeConfig({
        enableFeatureRecommendedBadges: false,
      }),
      name: fakeAddon.name,
      i18n: fakeI18n(),
      iconUrl: fakeAddon.icon_url,
      isRecommended: false,
      loading: false,
      ...props,
    };

    return shallowUntilTarget(
      <SearchSuggestion {...allProps} />,
      SearchSuggestionBase,
    );
  };

  it('renders itself', () => {
    const root = shallowComponent();

    expect(root.find('.SearchSuggestion')).toHaveLength(1);
    expect(root.find(Icon)).toHaveLength(1);
    expect(root.find(LoadingText)).toHaveLength(0);
  });

  it('can pass a alt text to the arrow icon', () => {
    const props = { arrowAlt: 'go to add-on' };
    const root = shallowComponent(props);

    expect(root.find(Icon)).toHaveLength(1);
    expect(root.find(Icon)).toHaveProp('alt', props.arrowAlt);
  });

  it('displays a class name with its type', () => {
    const props = { type: ADDON_TYPE_STATIC_THEME };
    const root = shallowComponent(props);

    expect(root).toHaveClassName(
      `SearchSuggestion--${ADDON_TYPE_STATIC_THEME}`,
    );
  });

  it('displays a loading indicator when loading prop is true', () => {
    const props = { loading: true };
    const root = shallowComponent(props);

    expect(root.find(Icon)).toHaveLength(1);
    expect(root.find(LoadingText)).toHaveLength(1);
  });

  it('displays a recommended icon when the add-on is recommended', () => {
    const props = {
      _config: getFakeConfig({
        enableFeatureRecommendedBadges: true,
      }),
      isRecommended: true,
    };
    const root = shallowComponent(props);

    expect(root.find('.SearchSuggestion-icon-recommended')).toHaveLength(1);
  });

  it('does not display a recommended icon when the add-on is not recommended', () => {
    const props = {
      _config: getFakeConfig({
        enableFeatureRecommendedBadges: true,
      }),
      isRecommended: false,
    };
    const root = shallowComponent(props);

    expect(root.find('.SearchSuggestion-icon-recommended')).toHaveLength(0);
  });

  it('does not display a recommended icon when the feature is disabled', () => {
    const props = {
      _config: getFakeConfig({
        enableFeatureRecommendedBadges: false,
      }),
      isRecommended: true,
    };
    const root = shallowComponent(props);

    expect(root.find('.SearchSuggestion-icon-recommended')).toHaveLength(0);
  });
});
