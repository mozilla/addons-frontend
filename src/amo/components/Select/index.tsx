import makeClassName from 'classnames';
import * as React from 'react';
import './styles.scss';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

const Select = ({
  children,
  className,
  ...selectProps
}: Props): React.ReactNode => {
  return <select {...selectProps} className={makeClassName('Select', className)}>
      {children}
    </select>;
};

export default Select;