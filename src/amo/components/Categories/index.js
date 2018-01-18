/* @flow */
/* global $PropertyType */
import classnames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import { categoriesFetch } from 'core/actions/categories';
import { withErrorHandler } from 'core/errorHandler';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { ApiStateType } from 'core/reducers/api';
import translate from 'core/i18n/translate';
import type { DispatchFunc } from 'core/types/redux';
import { getCategoryColor, visibleAddonType } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import type { I18nType } from 'core/types/i18n';

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

type Props = {
  addonType: string,
  className: string,
  clientApp: string,
  categoriesState?: $PropertyType<CategoriesStateType, 'categories'>,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  loading: boolean,
}

export class CategoriesBase extends React.Component<Props> {
  componentWillMount() {
    const {
      addonType, categoriesState, dispatch, errorHandler, loading,
    } = this.props;

    if (!loading && !categoriesState) {
      dispatch(categoriesFetch({ errorHandlerId: errorHandler.id }));
    }

    dispatch(setViewContext(addonType));
  }

  componentWillReceiveProps({ addonType: newAddonType }: Props) {
    const { addonType: oldAddonType, dispatch } = this.props;
    if (oldAddonType !== newAddonType) {
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
        {loading ?
          <div className="Categories-loading">
            <span className="Categories-loading-info visually-hidden">
              {i18n.gettext('Loading categories.')}
            </span>
            {Array(8).fill(0).map((value, index) => {
              return (
                <LoadingText
                  className="Categories-loading-text"
                  key={`Categories-loading-text-${index}`}
                  range={3}
                />
              );
            })}
          </div>
          :
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
                    to={`/${visibleAddonType(addonType)}/${slug}/`}
                  >
                    {name}
                  </Button>
                </li>
              );
            })}
          </ul>
        }
      </Card>
    );
  }
}

export function mapStateToProps(
  state: {| api: ApiStateType, categories: CategoriesStateType |}
) {
  return {
    categoriesState: state.categories.categories,
    clientApp: state.api.clientApp,
    loading: state.categories.loading,
  };
}

export default compose(
  withErrorHandler({ name: 'Categories' }),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(CategoriesBase);
