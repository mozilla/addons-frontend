/* @flow */
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

import './styles.scss';

type CategoryType = {
  application: string,
  description?: string,
  id: number,
  misc: boolean,
  name: string,
  slug: string,
  type: string,
  weight: number,
};

type CategoriesByAddonType = {
  [addonType: string]: void | { [categorySlug: string]: CategoryType },
};

type CategoriesStateType = {|
  categories: { [clientApp: ?string]: CategoriesByAddonType },
  loading: boolean,
|};

type CategoriesProps = {
  addonType: string,
  className: string,
  categories: CategoriesByAddonType,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: Object,
  loading: boolean,
}

export class CategoriesBase extends React.Component {
  componentWillMount() {
    const { addonType, dispatch, errorHandler } = this.props;
    const categories = this.props.categories[addonType] || {};

    if (!Object.values(categories).length) {
      dispatch(categoriesFetch({ errorHandlerId: errorHandler.id }));
    }

    dispatch(setViewContext(addonType));
  }

  componentWillReceiveProps({ addonType: newAddonType }: CategoriesProps) {
    const { addonType: oldAddonType, dispatch } = this.props;
    if (oldAddonType !== newAddonType) {
      dispatch(setViewContext(newAddonType));
    }
  }

  props: CategoriesProps;

  render() {
    /* eslint-disable react/no-array-index-key */
    const {
      addonType, className, errorHandler, loading, i18n,
    } = this.props;
    const categories = this.props.categories[addonType] ?
      Object.values(this.props.categories[addonType]) : [];
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
                  maxWidth={20}
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
              const name = category.name;
              // $FLOW_IGNORE
              const slug = category.slug;

              return (
                <li className="Categories-item" key={name}>
                  <Button
                    className={`Categories-link Button--action
                      Button--small
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
  const clientApp = state.api.clientApp;
  const categories = state.categories.categories[clientApp];

  return {
    categories,
    loading: state.categories.loading,
  };
}

export default compose(
  withErrorHandler({ name: 'Categories' }),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(CategoriesBase);
