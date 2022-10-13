import * as React from 'react';
import makeClassName from 'classnames';
import './styles.scss';

type DefinitionProps = {
  children: React.ReactNode;
  className?: string;
  term: React.ReactNode;
};
export const Definition = ({
  children,
  className,
  term,
}: DefinitionProps): React.ReactNode => {
  return <>
      <dt className="Definition-dt">{term}</dt>
      <dd className={makeClassName('Definition-dd', className)}>{children}</dd>
    </>;
};
type DefinitionListProps = {
  className?: string;
  children: React.ChildrenArray<React.ReactElement<typeof Definition> | null>;
};

const DefinitionList = ({
  className,
  children,
}: DefinitionListProps): React.ReactNode => {
  return <dl className={makeClassName('DefinitionList', className)}>{children}</dl>;
};

export default DefinitionList;