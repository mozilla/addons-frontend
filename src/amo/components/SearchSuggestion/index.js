/* @flow */
import * as React from 'react';

import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';


type Props = {|
  name: string,
  iconUrl: string,
  loading: boolean,
  arrowAlt?: string,
|};

const SearchSuggestion = ({ name, iconUrl, arrowAlt, loading }: Props) => {
  return (
    <p className="SearchSuggestion">
      <img alt={name} className="SearchSuggestion-icon" src={iconUrl} />
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
