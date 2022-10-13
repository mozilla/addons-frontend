import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION } from 'amo/constants';
import translate from 'amo/i18n/translate';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';

type Props = {};
type PropsFromState = {
  clientApp: string;
  lang: string;
};
type InternalProps = Props & PropsFromState & {
  dispatch: DispatchFunc;
};
export class SearchToolsBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);
    const {
      clientApp,
      dispatch,
      lang,
    } = props;
    const pathname = getCategoryResultsPathname({
      addonType: ADDON_TYPE_EXTENSION,
      slug: 'search-tools',
    });
    dispatch(sendServerRedirect({
      status: 301,
      url: `/${lang}/${clientApp}${pathname}`,
    }));
  }

  // This should never be called, as we always do a server redirect in the
  // constructor. We show a 404 page anyway in case we cannot perform a redirect.
  render(): React.ReactNode {
    return <NotFoundPage />;
  }

}

function mapStateToProps(state: AppState): PropsFromState {
  return {
    clientApp: state.api.clientApp,
    lang: state.api.lang,
  };
}

const SearchTools: React.ComponentType<Props> = compose(translate(), connect(mapStateToProps))(SearchToolsBase);
export default SearchTools;