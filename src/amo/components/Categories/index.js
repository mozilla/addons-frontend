import classnames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import { categoriesFetch } from 'core/actions/categories';
import translate from 'core/i18n/translate';
import type { DispatchFunc } from 'core/types/redux';
import { getCategoryColor, visibleAddonType } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';


type CategoriesProps = {
  addonType: string,
  className: string,
  dispatch: DispatchFunc,
  categories: Object,
  error: boolean | null,
  loading: boolean,
  i18n: Object,
}

export class CategoriesBase extends React.Component {
  componentWillMount() {
    const { addonType, dispatch } = this.props;
    const categories = this.props.categories[addonType] || {};

    if (!Object.values(categories).length) {
      dispatch(categoriesFetch());
    }

    dispatch(setViewContext(addonType));
  }

  componentWillReceiveProps({ addonType: newAddonType }) {
    const { addonType: oldAddonType, dispatch } = this.props;
    if (oldAddonType !== newAddonType) {
      dispatch(setViewContext(newAddonType));
    }
  }

  props: CategoriesProps;

  render() {
    /* eslint-disable react/no-array-index-key */
    const { addonType, className, error, loading, i18n } = this.props;
    const categories = this.props.categories[addonType] ?
      Object.values(this.props.categories[addonType]) : [];
    const classNameProp = classnames('Categories', className);

    if (error) {
      return (
        <Card className={classNameProp}>
          <p className="Categories-none-loaded-message">
            {i18n.gettext('Failed to load categories.')}
          </p>
        </Card>
      );
    }

    if (!loading && !categories.length) {
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
            {categories.map((category) => (
              <li className="Categories-item" key={category.name}>
                <Button
                  className={`Categories-link Button--action
                    Button--small
                    Categories--category-color-${getCategoryColor(category)}`}
                  to={`/${visibleAddonType(addonType)}/${category.slug}/`}
                >
                  {category.name}
                </Button>
              </li>
            ))}
          </ul>
        }
      </Card>
    );
  }
}

export function mapStateToProps(state) {
  const clientApp = state.api.clientApp;
  const categories = state.categories.categories[clientApp];

  return {
    categories,
    error: state.categories.error,
    loading: state.categories.loading,
  };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(CategoriesBase);
