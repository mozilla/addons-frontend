import config from 'config';
import * as React from 'react';

import SearchSuggestion, {
  SearchSuggestionBase,
} from 'amo/components/SearchSuggestion';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  VERIFIED,
} from 'amo/constants';
import Icon from 'amo/components/Icon';
import {
  createFakeAutocompleteResult,
  createInternalSuggestionWithLang,
  dispatchClientMetadata,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import IconPromotedBadge from 'amo/components/IconPromotedBadge';
import LoadingText from 'amo/components/LoadingText';

describe(__filename, () => {
  const shallowComponent = (props = {}) => {
    const allProps = {
      loading: false,
      store: dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store,
      suggestion: createInternalSuggestionWithLang(
        createFakeAutocompleteResult(),
      ),
      ...props,
    };

    return shallowUntilTarget(
      <SearchSuggestion {...allProps} />,
      SearchSuggestionBase,
    );
  };

  it('renders itself', () => {
    const iconUrl = `${config.get('amoCDN')}/some-icon.png`;
    const name = 'suggestion name';
    const suggestion = createInternalSuggestionWithLang(
      createFakeAutocompleteResult({ icon_url: iconUrl, name }),
    );
    const root = shallowComponent({ suggestion });

    expect(root.find('.SearchSuggestion')).toHaveLength(1);
    expect(root.find('.SearchSuggestion-icon')).toHaveProp('src', iconUrl);
    expect(root.find('.SearchSuggestion-name')).toHaveText(name);
    expect(root.find(LoadingText)).toHaveLength(0);
  });

  it('can pass a alt text to the arrow icon', () => {
    const props = { arrowAlt: 'go to add-on' };
    const root = shallowComponent(props);

    expect(root.find(Icon)).toHaveLength(1);
    expect(root.find(Icon)).toHaveProp('alt', props.arrowAlt);
  });

  it('displays a class name with its type', () => {
    const suggestion = createInternalSuggestionWithLang(
      createFakeAutocompleteResult({ type: ADDON_TYPE_STATIC_THEME }),
    );
    const root = shallowComponent({ suggestion });

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

  it('displays a promoted icon when the add-on is promoted', () => {
    const category = VERIFIED;
    const root = shallowComponent({
      _getPromotedCategory: sinon.stub().returns(category),
    });

    expect(root.find(IconPromotedBadge)).toHaveLength(1);
    expect(root.find(IconPromotedBadge)).toHaveProp('category', category);
  });

  it('does not display a promoted icon when the add-on is not promoted', () => {
    const root = shallowComponent({
      _getPromotedCategory: sinon.stub().returns(null),
    });

    expect(root.find(IconPromotedBadge)).toHaveLength(0);
  });
});
