/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION, SEARCH_SORT_TOP_RATED } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { makeQueryString } from 'amo/api';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';

type Props = {||};

type PropsFromState = {|
  clientApp: string,
  lang: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
|};

export class SearchToolsBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { clientApp, dispatch, lang } = props;

    const pathname = getCategoryResultsPathname({
      addonType: ADDON_TYPE_EXTENSION,
      slug: 'search-tools',
    });

    dispatch(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}${pathname}${makeQueryString({
          sort: SEARCH_SORT_TOP_RATED,
        })}`,
      }),
    );
  }

  // This will never be called, as we always do a server redirect in the
  // constructor.
  render(): null {
    return null;
  }
}

export function mapStateToProps(state: AppState): PropsFromState {
  return {
    clientApp: state.api.clientApp,
    lang: state.api.lang,
  };
}

const SearchTools: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(SearchToolsBase);

export default SearchTools;
