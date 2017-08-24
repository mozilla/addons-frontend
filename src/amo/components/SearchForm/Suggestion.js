/* @flow */
import React from 'react';

import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';

import './Suggestion.scss';


type Props = {|
  name: string,
  iconUrl: string,
  loading: boolean,
  arrowAlt?: string,
|};

const Suggestion = ({ name, iconUrl, arrowAlt, loading }: Props) => {
  return (
    <p className="Suggestion">
      <img alt={name} className="Suggestion-icon" src={iconUrl} />
      <span className="Suggestion-name">
        {loading ? <LoadingText minWidth={20} range={12} /> : name}
      </span>
      <Icon name="arrow-big-blue" alt={arrowAlt} />
    </p>
  );
};

export default Suggestion;
