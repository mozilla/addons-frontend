import * as React from 'react';
import { shallow } from 'enzyme';

import SearchSuggestion from 'amo/components/SearchSuggestion';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import { fakeAddon } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const shallowComponent = (props = {}) => {
    const allProps = {
      name: fakeAddon.name,
      iconUrl: fakeAddon.icon_url,
      loading: false,
      ...props,
    };

    return shallow(<SearchSuggestion {...allProps} />);
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

  it('displays a loading indicator when loading prop is true', () => {
    const props = { loading: true };
    const root = shallowComponent(props);

    expect(root.find(Icon)).toHaveLength(1);
    expect(root.find(LoadingText)).toHaveLength(1);
  });
});
