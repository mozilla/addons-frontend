/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';

type Props = {|
  arrowAlt?: string,
  iconUrl: string,
  loading: boolean,
  name: string,
  type: string,
|};

const SearchSuggestion = ({
  arrowAlt,
  iconUrl,
  loading,
  name,
  type,
}: Props) => {
  return (
    <p className="SearchSuggestion">
      <img
        alt={name}
        className={makeClassName(
          'SearchSuggestion-icon',
          `SearchSuggestion-icon--${type}`,
        )}
        src={iconUrl}
      />
      <span className="SearchSuggestion-name">
        {loading ? <LoadingText minWidth={20} range={12} /> : name}
      </span>
      <Icon
        alt={arrowAlt}
        className="SearchSuggestion-icon-arrow"
        name="arrow-blue"
      />
    </p>
  );
};

export default SearchSuggestion;
