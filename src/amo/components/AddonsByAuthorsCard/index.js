/* @flow */
/* eslint-disable react/no-unused-prop-types */
import makeClassName from 'classnames';
import deepEqual from 'deep-eql';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import {
  fetchAddonsByAuthors,
  getAddonsForAuthorIds,
  getCountForAuthorIds,
  getLoadingForAuthorIds,
} from 'amo/reducers/addonsByAuthors';
import Paginate from 'amo/components/Paginate';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  SEARCH_SORT_POPULAR,
} from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import LoadingText from 'ui/components/LoadingText';
import type { FetchAddonsByAuthorsParams } from 'amo/reducers/addonsByAuthors';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  addonType?: string,
  authorDisplayName: string | null,
  authorIds: Array<number> | null,
  className?: string,
  errorHandler?: ErrorHandlerType,
  forAddonSlug?: string,
  numberOfAddons: number,
  pageParam: string,
  paginate: boolean,
  pathname?: string,
  showMore?: boolean,

  // AddonsCard accepts these props which are drilled in.
  showSummary?: boolean,
  type?: 'horizontal' | 'vertical',
|};

type InternalProps = {|
  ...Props,
  addons: Array<AddonType> | null,
  count: number | null,
  dispatch: DispatchFunc,
  i18n: I18nType,
  loading: boolean | null,
  location: ReactRouterLocationType,
|};

type DispatchFetchAddonsByAuthorsParams = {|
  addonType: $PropertyType<FetchAddonsByAuthorsParams, 'addonType'>,
  authorIds: $PropertyType<FetchAddonsByAuthorsParams, 'authorIds'>,
  forAddonSlug: $PropertyType<FetchAddonsByAuthorsParams, 'forAddonSlug'>,
  page: $PropertyType<FetchAddonsByAuthorsParams, 'page'>,
|};

type FiltersForPagination = {|
  page?: string,
  sort?: string,
|};

export class AddonsByAuthorsCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    pageParam: 'page',
    paginate: false,
    showMore: true,
    showSummary: false,
    type: 'horizontal',
  };

  constructor(props: InternalProps) {
    super(props);

    const {
      addonType,
      authorIds,
      forAddonSlug,
      location,
      pageParam,
      paginate,
    } = props;

    if (!authorIds) {
      return;
    }

    this.dispatchFetchAddonsByAuthors({
      addonType,
      authorIds,
      forAddonSlug,
      page: this.getCurrentPage({ location, paginate, pageParam }),
    });
  }

  componentDidUpdate(prevProps: InternalProps) {
    const {
      addonType: oldAddonType,
      authorIds: oldAuthorIds,
      forAddonSlug: oldForAddonSlug,
      location: oldLocation,
    } = prevProps;
    const {
      addonType: newAddonType,
      authorIds: newAuthorIds,
      forAddonSlug: newForAddonSlug,
      location: newLocation,
      pageParam,
      paginate,
    } = this.props;

    if (!newAuthorIds) {
      return;
    }

    const newPage = paginate
      ? oldLocation.query[pageParam] !== newLocation.query[pageParam]
      : false;

    if (
      oldAddonType !== newAddonType ||
      oldForAddonSlug !== newForAddonSlug ||
      !deepEqual(oldAuthorIds, newAuthorIds) ||
      newPage
    ) {
      this.dispatchFetchAddonsByAuthors({
        addonType: newAddonType,
        authorIds: newAuthorIds,
        forAddonSlug: newForAddonSlug,
        page: this.getCurrentPage({
          location: newLocation,
          paginate,
          pageParam,
        }),
      });
    }
  }

  getCurrentPage({
    location,
    paginate,
    pageParam,
  }: {|
    location: ReactRouterLocationType,
    pageParam: string,
    paginate: boolean,
  |}): string | void {
    // We don't want to set a `page` when there is no pagination.
    if (!paginate) {
      return undefined;
    }

    const currentPage = parseInt(location.query[pageParam], 10);

    return Number.isNaN(currentPage) || currentPage < 1
      ? '1'
      : currentPage.toString();
  }

  dispatchFetchAddonsByAuthors({
    addonType,
    authorIds,
    forAddonSlug,
    page,
  }: DispatchFetchAddonsByAuthorsParams) {
    const { errorHandler, numberOfAddons, paginate } = this.props;

    const filtersForPagination: FiltersForPagination = {
      page: undefined,
      sort: undefined,
    };

    if (paginate) {
      invariant(page, 'page is required when paginate is `true`.');

      filtersForPagination.page = page;
      filtersForPagination.sort = SEARCH_SORT_POPULAR;
    }

    invariant(errorHandler, 'errorHandler is required');

    this.props.dispatch(
      fetchAddonsByAuthors({
        addonType,
        authorIds,
        errorHandlerId: errorHandler.id,
        forAddonSlug,
        page,
        pageSize: String(numberOfAddons),
        ...filtersForPagination,
      }),
    );
  }

  render() {
    const {
      addonType,
      addons,
      authorDisplayName,
      authorIds,
      className,
      errorHandler,
      i18n,
      loading,
      numberOfAddons,
      paginate,
      showMore,
      showSummary,
      type,
    } = this.props;

    invariant(errorHandler, 'errorHandler is required');

    if (errorHandler.hasError()) {
      return errorHandler.renderError();
    }

    const inLoadingState = loading === true || loading === null;

    if (!inLoadingState && (!addons || !addons.length)) {
      return null;
    }

    let header = <LoadingText />;
    if (authorIds) {
      switch (addonType) {
        case ADDON_TYPE_DICT:
          header = showMore
            ? i18n.ngettext(
                i18n.sprintf(i18n.gettext('More dictionaries by %(author)s'), {
                  author: authorDisplayName,
                }),
                i18n.gettext('More dictionaries by these translators'),
                authorIds.length,
              )
            : i18n.ngettext(
                i18n.sprintf(i18n.gettext('Dictionaries by %(author)s'), {
                  author: authorDisplayName,
                }),
                i18n.gettext('Dictionaries by these translators'),
                authorIds.length,
              );
          break;
        case ADDON_TYPE_EXTENSION:
          header = showMore
            ? i18n.ngettext(
                i18n.sprintf(i18n.gettext('More extensions by %(author)s'), {
                  author: authorDisplayName,
                }),
                i18n.gettext('More extensions by these developers'),
                authorIds.length,
              )
            : i18n.ngettext(
                i18n.sprintf(i18n.gettext('Extensions by %(author)s'), {
                  author: authorDisplayName,
                }),
                i18n.gettext('Extensions by these developers'),
                authorIds.length,
              );
          break;
        case ADDON_TYPE_LANG:
          header = showMore
            ? i18n.ngettext(
                i18n.sprintf(
                  i18n.gettext('More language packs by %(author)s'),
                  {
                    author: authorDisplayName,
                  },
                ),
                i18n.gettext('More language packs by these translators'),
                authorIds.length,
              )
            : i18n.ngettext(
                i18n.sprintf(i18n.gettext('Language packs by %(author)s'), {
                  author: authorDisplayName,
                }),
                i18n.gettext('Language packs by these translators'),
                authorIds.length,
              );
          break;
        case ADDON_TYPE_STATIC_THEME:
          header = showMore
            ? i18n.ngettext(
                i18n.sprintf(i18n.gettext('More themes by %(author)s'), {
                  author: authorDisplayName,
                }),
                i18n.gettext('More themes by these artists'),
                authorIds.length,
              )
            : i18n.ngettext(
                i18n.sprintf(i18n.gettext('Themes by %(author)s'), {
                  author: authorDisplayName,
                }),
                i18n.gettext('Themes by these artists'),
                authorIds.length,
              );
          break;
        default:
          header = showMore
            ? i18n.ngettext(
                i18n.sprintf(i18n.gettext('More add-ons by %(author)s'), {
                  author: authorDisplayName,
                }),
                i18n.gettext('More add-ons by these developers'),
                authorIds.length,
              )
            : i18n.ngettext(
                i18n.sprintf(i18n.gettext('Add-ons by %(author)s'), {
                  author: authorDisplayName,
                }),
                i18n.gettext('Add-ons by these developers'),
                authorIds.length,
              );
      }
    }

    const classnames = makeClassName('AddonsByAuthorsCard', className, {
      'AddonsByAuthorsCard--theme': ADDON_TYPE_STATIC_THEME === addonType,
    });

    let paginator = null;

    if (paginate) {
      const { count, location, pageParam, pathname } = this.props;

      invariant(pathname, 'pathname is required when paginate is `true`.');

      const currentPage = this.getCurrentPage({
        location,
        paginate,
        pageParam,
      });

      paginator =
        count && count > numberOfAddons ? (
          <Paginate
            LinkComponent={Link}
            count={count}
            currentPage={currentPage}
            pageParam={pageParam}
            pathname={pathname}
            perPage={numberOfAddons}
            queryParams={location.query}
          />
        ) : null;
    }

    return (
      <AddonsCard
        addons={addons}
        className={classnames}
        footer={paginator}
        header={header}
        loading={inLoadingState}
        placeholderCount={numberOfAddons}
        showMetadata
        showSummary={showSummary}
        type={type}
      />
    );
  }
}

export const mapStateToProps = (
  state: AppState,
  ownProps: Props,
): $Shape<InternalProps> => {
  const { addonType, authorIds, forAddonSlug, numberOfAddons } = ownProps;

  let addons = null;
  let loading = null;

  if (authorIds) {
    addons = getAddonsForAuthorIds(
      state.addonsByAuthors,
      authorIds,
      addonType,
      forAddonSlug,
    );
    addons = addons ? addons.slice(0, numberOfAddons) : addons;

    loading = getLoadingForAuthorIds(
      state.addonsByAuthors,
      authorIds,
      addonType,
    );
  }

  const count = authorIds
    ? getCountForAuthorIds(state.addonsByAuthors, authorIds, addonType)
    : 0;

  return {
    addons,
    count,
    loading,
  };
};

const AddonsByAuthorsCard: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'AddonsByAuthorsCard' }),
)(AddonsByAuthorsCardBase);

export default AddonsByAuthorsCard;
