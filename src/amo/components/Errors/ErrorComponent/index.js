/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';
import NestedStatus from 'react-nested-status';

import Card from 'ui/components/Card';

import './styles.scss';

type Props = {|
  children: React.Node,
  className?: string,
  code?: 400 | 401 | 404 | 500,
  header: React.Element<any> | string,
|};

export default class ErrorComponent extends React.Component<Props> {
  render() {
    const { children, className, code, header } = this.props;

    return (
      <NestedStatus code={code || 400}>
        <Card
          className={makeClassName('Errors', className, {
            NotAuthorized: code === 401,
            NotFound: code === 404,
            ServerError: code === 500,
          })}
          header={header}
        >
          {children}
        </Card>
      </NestedStatus>
    );
  }
}
