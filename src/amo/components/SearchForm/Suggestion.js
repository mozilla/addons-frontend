/* @flow */
import React from 'react';

type Props = {|
  name: string,
  iconUrl: string,
|};

const Suggestion = ({ name, iconUrl }: Props) => {
  return (
    <p className="Suggestion">
      <img alt={name} className="Suggestion-icon" src={iconUrl} />
      <span className="Suggestion-name">{name}</span>
    </p>
  );
};

export default Suggestion;
