/* @flow */
import classnames from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { fetchCategories } from 'core/reducers/categories';
import { getCategoryResultsQuery, getCategoryColor } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { DispatchFunc } from 'core/types/redux';
import type { I18nType } from 'core/types/i18n';
import type { GetCategoryResultsQueryParams } from 'core/utils';

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
}: GetCategoryResultsQueryParams) => {
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

  render() {
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
                    range={3}
                  />
                );
              })}
          </div>
        ) : (
          <ul className="Categories-list">
            {categories.map((category) => {
              // Flow cannot figure out CategoryType in this case.
              // See https://github.com/facebook/flow/issues/2174
              // and https://github.com/facebook/flow/issues/2221
              // $FLOW_IGNORE
              const { name, slug } = category;

              return (
                <li className="Categories-item" key={name}>
                  <Button
                    className={`Categories-link
                      Categories--category-color-${getCategoryColor(category)}`}
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
