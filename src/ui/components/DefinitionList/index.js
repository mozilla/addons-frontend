/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import './styles.scss';


type DefinitionProps = {|
  children: React.Node,
  className?: string,
  term: React.Node,
|};

export const Definition = (
  { children, className, term }: DefinitionProps
) => {
  return (
    <React.Fragment>
      <dt className="Definition-dt">{term}</dt>
      <dd className={makeClassName('Definition-dd', className)}>{children}</dd>
    </React.Fragment>
  );
};

type DefinitionListProps = {|
  className?: string,
  children: React.ChildrenArray<React.Element<typeof Definition> | null>,
|};

const DefinitionList = ({ className, children }: DefinitionListProps) => {
  return (
    <dl className={makeClassName('DefinitionList', className)}>{children}</dl>
  );
};

export default DefinitionList;
