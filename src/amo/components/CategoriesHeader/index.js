import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { categoriesFetch } from 'core/actions/categories';
import translate from 'core/i18n/translate';
import { getCategoryColor, visibleAddonType } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import type { DispatchFunc } from 'core/types/redux';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';


type CategoriesHeaderProps = {
  addonType: string,
  dispatch: DispatchFunc,
  categories: Object,
  clientApp: string,
  error: boolean | null,
  loading: boolean,
  i18n: Object,
}

export class CategoriesHeaderBase extends React.Component {
  componentWillMount() {
    const { addonType, clientApp, dispatch } = this.props;
    const categories = this.props.categories[addonType] || {};

    if (!Object.values(categories).length) {
      dispatch(categoriesFetch({ addonType, clientApp }));
    }
  }

  props: CategoriesHeaderProps;

  render() {
    /* eslint-disable react/no-array-index-key */
    const { addonType, error, loading, i18n } = this.props;
    const categories = this.props.categories[addonType] ?
      Object.values(this.props.categories[addonType]) : [];

    if (error) {
      return (
        <Card className="CategoriesHeader">
          <p>{i18n.gettext('Failed to load categories.')}</p>
        </Card>
      );
    }

    if (!loading && !categories.length) {
      return (
        <Card className="CategoriesHeader">
          <p>{i18n.gettext('No categories found.')}</p>
        </Card>
      );
    }

    return (
      <Card className="CategoriesHeader" header={i18n.gettext('Categories')}>
        {loading ?
          <div className="CategoriesHeader-loading">
            <span className="CategoriesHeader-loading-info visually-hidden">
              {i18n.gettext('Loading categories.')}
            </span>
            {Array(8).fill(0).map((value, index) => {
              return (
                <LoadingText
                  className="CategoriesHeader-loading-text"
                  key={`CategoriesHeader-loading-text-${index}`}
                  maxWidth={20}
                  range={3}
                />
              );
            })}
          </div>
        :
          <ul className="CategoriesHeader-list">
            {categories.map((category) => (
              <li className="CategoriesHeader-item" key={category.name}>
                <Button
                  className={`CategoriesHeader-link Button--action
                    Button--small
                    CategoriesHeader--category-color-${getCategoryColor(category)}`}
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
    clientApp,
    error: state.categories.error,
    loading: state.categories.loading,
  };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(CategoriesHeaderBase);
