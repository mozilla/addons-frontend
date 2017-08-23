/* @flow */
import React from 'react';

import Icon from 'ui/components/Icon';

type Props = {|
  name: string,
  iconUrl: string,
  arrowAlt?: string,
|};

const Suggestion = ({ name, iconUrl, arrowAlt }: Props) => {
  return (
    <p className="Suggestion">
      <img alt={name} className="Suggestion-icon" src={iconUrl} />
      <span className="Suggestion-name">{name}</span>
      <Icon name="arrow-big-blue" alt={arrowAlt} />
    </p>
  );
};

export default Suggestion;
