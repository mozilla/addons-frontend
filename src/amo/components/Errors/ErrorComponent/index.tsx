import * as React from 'react';
import invariant from 'invariant';
import makeClassName from 'classnames';
import NestedStatus from 'react-nested-status';

import Card from 'amo/components/Card';
import './styles.scss';

type Props = {
  children: React.ReactNode;
  className?: string;
  code: 400 | 401 | 404 | 451 | 500;
  header: React.ReactNode | string;
};
export default class ErrorComponent extends React.Component<Props> {
  render(): React.ReactNode {
    const {
      children,
      className,
      code,
      header,
    } = this.props;
    const validCodes = [400, 401, 404, 451, 500];
    invariant(children, 'children is required');
    invariant(header, 'header is required');
    invariant(validCodes.includes(code), 'a valid error code is required');
    return <NestedStatus code={code}>
        <Card
          className={makeClassName('Errors', className, {
        NotAuthorized: code === 401,
        NotFound: code === 404,
        UnavailableForLegalReasons: code === 451,
        ServerError: code === 500,
      })}
          header={header}
        >
          {children}
        </Card>
      </NestedStatus>;
  }

}