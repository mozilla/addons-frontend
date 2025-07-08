/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import './styles.scss';

type DefinitionProps = {|
  children: React.Node,
  className?: string,
  term: React.Node,
|};

export const Definition = ({
  children,
  className,
  term,
}: DefinitionProps): React.Node => {
  if (!children) {
    return null;
  }
  return (
    <>
      <dt className="Definition-dt">{term}</dt>
      <dd className={makeClassName('Definition-dd', className)}>{children}</dd>
    </>
  );
};

type DefinitionListProps = {|
  className?: string,
  children: React.ChildrenArray<React.Element<typeof Definition> | null>,
|};

const DefinitionList = ({
  className,
  children,
}: DefinitionListProps): React.Node => {
  return (
    <dl className={makeClassName('DefinitionList', className)}>{children}</dl>
  );
};

export default DefinitionList;
