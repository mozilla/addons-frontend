/* @flow */
/* eslint camelcase: 0 */
import * as React from 'react';
import { withRouter } from 'react-router-dom';
import Helmet from 'react-helmet';

import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import type { Props as HeadMetaTagsProps } from 'amo/components/HeadMetaTags';
import type { ReactRouterLocationType } from 'core/types/router';

type Props = {|
  ...HeadMetaTagsProps,
|};

type InternalProps = {|
  ...Props,
  location: ReactRouterLocationType,
|};

export class UserProfileHeadBase extends React.Component<InternalProps> {
  computeQueryString() {
    const { query, search } = this.props.location;

    // `page_e` and `page_t` are defined in the `UserProfile` component.
    let page_e = Number(query.page_e);
    let page_t = Number(query.page_t);

    // We don't want to return a query string when values are '1'.
    if (page_e === 1) {
      page_e = null;
    }

    if (page_t === 1) {
      page_t = null;
    }

    let queryString = '';
    if (page_e && page_t) {
      // When both parameters are provided, we take the one with the highest
      // value. When both values are equal, we must respect the order in the
      // query string.
      if (page_e > page_t) {
        queryString = `?page_e=${page_e}`;
      } else if (page_e < page_t) {
        queryString = `?page_t=${page_t}`;
      } else if (search.indexOf('page_e') > search.indexOf('page_t')) {
        queryString = `?page_t=${page_t}`;
      } else {
        queryString = `?page_e=${page_e}`;
      }
    } else if (page_e) {
      queryString = `?page_e=${page_e}`;
    } else if (page_t) {
      queryString = `?page_t=${page_t}`;
    }

    return queryString;
  }

  render() {
    const { location, ...props } = this.props;

    const queryString = this.computeQueryString();

    return (
      <React.Fragment>
        <Helmet>
          <title>{props.title}</title>
        </Helmet>

        <HeadMetaTags {...props} queryString={queryString} />

        <HeadLinks queryString={queryString} />
      </React.Fragment>
    );
  }
}

const UserProfileHead: React.ComponentType<Props> = withRouter(
  UserProfileHeadBase,
);

export default UserProfileHead;
