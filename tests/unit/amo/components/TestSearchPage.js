import React from 'react';
import { shallow } from 'enzyme';

import { SearchPageBase, mapStateToProps } from 'amo/components/SearchPage';
import Search from 'amo/components/Search';
import { CLIENT_APP_ANDROID } from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe(__filename, () => {
  function render(props = {}) {
    return shallow(<SearchPageBase {...{ ...props, i18n: getFakeI18nInst() }} />);
  }

  describe('mapStateToProps()', () => {
    const { state } = dispatchClientMetadata();
    const location = {
      query: {
        page: 2,
        q: 'burger',
      },
    };

    it('returns filters based on location (URL) data', () => {
      expect(mapStateToProps(state, { location })).toEqual({
        filters: {
          clientApp: CLIENT_APP_ANDROID,
          page: 2,
          query: 'burger',
        },
      });
    });
  });

  it('should render Search results on search with query', () => {
    const root = render({ filters: { query: 'burger' } });

    expect(root.find(Search)).toHaveLength(1);
  });

  it('should render an error message on empty search', () => {
    const root = render({ filters: { query: null } });

    expect(root.find('.SearchContextCard-header')).toHaveText('Enter a search term and try again.');
  });
});
