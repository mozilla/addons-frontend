/* @flow */
import classnames from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { fetchCategories } from 'amo/reducers/categories';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import type { CategoriesState } from 'amo/reducers/categories';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

export type CategoryType = {|
  application: string,
  description?: string,
  id: number,
  misc: boolean,
  name: string,
  slug: string,
  type: string,
  weight: number,
|};

type Props = {|
  addonType: string,
  className?: string,
|};

type PropsFromState = {|
  categoriesState: $PropertyType<CategoriesState, 'categories'>,
  loading: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  jed: I18nType,
|};

export class CategoriesBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { addonType, categoriesState, dispatch, errorHandler, loading } =
      props;

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
      errorHandler,
      jed,
      loading,
    } = this.props;
    invariant(addonType, 'addonType is undefined');

    let categories: Array<mixed> = [];
    if (categoriesState && categoriesState[addonType]) {
      categories = Object.values(categoriesState[addonType]);
    }
    const classNameProp = classnames('Categories', className);

    if (!errorHandler.hasError() && !loading && !categories.length) {
      return (
        <Card className={classNameProp}>
          <p className="Categories-none-loaded-message">
            {jed.gettext('No categories found.')}
          </p>
        </Card>
      );
    }

    return (
      <Card className={classNameProp} header={jed.gettext('Categories')}>
        {errorHandler.renderErrorIfPresent()}
        {loading ? (
          <div className="Categories-loading">
            <span className="Categories-loading-info visually-hidden">
              {jed.gettext('Loading categories.')}
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
                    to={{
                      pathname: getCategoryResultsPathname({ addonType, slug }),
                    }}
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

function mapStateToProps(state: AppState): PropsFromState {
  return {
    categoriesState: state.categories.categories,
    loading: state.categories.loading,
  };
}

export const extractId = (props: Props): string => {
  return props.addonType;
};

const Categories: React.ComponentType<Props> = compose(
  withErrorHandler({ extractId, name: 'Categories' }),
  connect(mapStateToProps),
  translate(),
)(CategoriesBase);

export default Categories;
