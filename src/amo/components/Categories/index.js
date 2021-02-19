/* @flow */
import classnames from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { fetchCategories } from 'amo/reducers/categories';
import { getCategoryResultsQuery } from 'amo/utils/categories';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { DispatchFunc } from 'amo/types/redux';
import type { I18nType } from 'amo/types/i18n';
import type { GetCategoryResultsQueryParams } from 'amo/utils/categories';

import './styles.scss';

type CategoryType = {|
  application: string,
  description?: string,
  id: number,
  misc: boolean,
  name: string,
  slug: string,
  type: string,
  weight: number,
|};

type CategoriesStateType = {|
  categories: {
    [clientApp: string]: void | {
      [addonType: string]: void | { [categorySlug: string]: CategoryType },
    },
  },
  loading: boolean,
|};

type Props = {|
  addonType: string,
  className?: string,
|};

type InternalProps = {|
  ...Props,
  categoriesState: $PropertyType<CategoriesStateType, 'categories'>,
  clientApp: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  loading: boolean,
|};

export const categoryResultsLinkTo = ({
  addonType,
  slug,
}: GetCategoryResultsQueryParams): {|pathname: string, query: any|} => {
  return {
    pathname: '/search/',
    query: getCategoryResultsQuery({
      addonType,
      slug,
    }),
  };
};

export class CategoriesBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const {
      addonType,
      categoriesState,
      dispatch,
      errorHandler,
      loading,
    } = props;

    invariant(addonType, 'addonType is undefined');

    if (!loading && !categoriesState) {
      dispatch(fetchCategories({ errorHandlerId: errorHandler.id }));
    }

    dispatch(setViewContext(addonType));
  }

  componentDidUpdate({ addonType: oldAddonType }: InternalProps) {
    const { addonType: newAddonType, dispatch } = this.props;

    if (newAddonType && oldAddonType !== newAddonType) {
      dispatch(setViewContext(newAddonType));
    }
  }

  render(): React.Node {
    /* eslint-disable react/no-array-index-key */
    const {
      addonType,
      categoriesState,
      className,
      clientApp,
      errorHandler,
      i18n,
      loading,
    } = this.props;
    invariant(addonType, 'addonType is undefined');

    let categories = [];
    if (
      categoriesState &&
      categoriesState[clientApp] &&
      categoriesState[clientApp][addonType]
    ) {
      categories = Object.values(categoriesState[clientApp][addonType]);
    }
    const classNameProp = classnames('Categories', className);

    if (!errorHandler.hasError() && !loading && !categories.length) {
      return (
        <Card className={classNameProp}>
          <p className="Categories-none-loaded-message">
            {i18n.gettext('No categories found.')}
          </p>
        </Card>
      );
    }

    return (
      <Card className={classNameProp} header={i18n.gettext('Categories')}>
        {errorHandler.renderErrorIfPresent()}
        {loading ? (
          <div className="Categories-loading">
            <span className="Categories-loading-info visually-hidden">
              {i18n.gettext('Loading categories.')}
            </span>
            {Array(8)
              .fill(0)
              .map((value, index) => {
                return (
                  <LoadingText
                    className="Categories-loading-text"
                    key={`Categories-loading-text-${index}`}
                  />
                );
              })}
          </div>
        ) : (
          <ul className="Categories-list">
            {categories.map((category, index) => {
              // Flow cannot figure out CategoryType in this case.
              // See https://github.com/facebook/flow/issues/2174
              // and https://github.com/facebook/flow/issues/2221
              // $FlowIgnore
              const { name, slug } = category;

              return (
                <li className="Categories-item" key={name}>
                  <Button
                    // `12` is the number of colors declared in
                    // "$category-colors".
                    className={`Categories-link
                      Categories--category-color-${(index % 12) + 1}`}
                    to={categoryResultsLinkTo({ addonType, slug })}
                  >
                    {name}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    );
  }
}

export function mapStateToProps(state: AppState) {
  return {
    categoriesState: state.categories.categories,
    clientApp: state.api.clientApp,
    loading: state.categories.loading,
  };
}

const Categories: React.ComponentType<Props> = compose(
  withErrorHandler({ name: 'Categories' }),
  connect(mapStateToProps),
  translate(),
)(CategoriesBase);

export default Categories;
