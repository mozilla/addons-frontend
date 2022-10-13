/* eslint camelcase: 0 */
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';

import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import type { Props as HeadMetaTagsProps } from 'amo/components/HeadMetaTags';
import type { AppState } from 'amo/store';
import type { LocationType } from 'amo/types/router';

type Props = HeadMetaTagsProps;
type PropsFromState = {
  location: LocationType;
};
type InternalProps = Props & PropsFromState;
export class UserProfileHeadBase extends React.Component<InternalProps> {
  computeQueryString(): string {
    const {
      query,
      search,
    } = this.props.location;
    // `page_e` and `page_t` are defined in the `UserProfile` component.
    let page_e: null | number = Number(query.page_e);
    let page_t: null | number = Number(query.page_t);

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

  render(): React.ReactNode {
    const {
      location,
      ...props
    } = this.props;
    const queryString = this.computeQueryString();
    return <>
        <Helmet>
          <title>{props.title}</title>
        </Helmet>

        <HeadMetaTags {...props} queryString={queryString} />

        <HeadLinks queryString={queryString} />
      </>;
  }

}

const mapStateToProps = (state: AppState): PropsFromState => {
  const {
    location,
  } = state.router;
  return {
    location,
  };
};

const UserProfileHead: React.ComponentType<Props> = connect(mapStateToProps)(UserProfileHeadBase);
export default UserProfileHead;