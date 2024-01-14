/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import Link from 'amo/components/Link';
import LoadingText from 'amo/components/LoadingText';
import { collectionName } from 'amo/reducers/collections';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  authorId?: number,
  id: number,
  name?: string,
  // numberOfAddons is null when the collection is in a loading state.
  numberOfAddons: number | null,
  slug?: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const UserCollectionBase = (props: InternalProps): React.Node => {
  const { authorId, id, name, numberOfAddons, slug, i18n } = props;

  const linkProps = {};
  let numberText;

  if (numberOfAddons === null) {
    linkProps.href = '';
  } else {
    invariant(authorId, 'authorId is required');
    invariant(slug, 'slug is required');
    invariant(
      numberOfAddons !== undefined && Number.isInteger(numberOfAddons),
      'numberOfAddons must be a number',
    );

    linkProps.to = `/collections/${authorId}/${slug}/`;
    numberText = /* manual-change: merge keys 
    '%(total)s add-on' -> '%(total)s add-on_one'
    '%(total)s add-ons' -> '%(total)s add-on_other' */ i18n.t(
      '%(total)s add-on',
      { count: numberOfAddons, total: i18n.formatNumber(numberOfAddons) },
    );
  }

  return (
    <li className="UserCollection" key={id}>
      <Link className="UserCollection-link" {...linkProps}>
        <h2 className="UserCollection-name">
          {numberOfAddons === null ? (
            <LoadingText />
          ) : (
            collectionName({ name, i18n })
          )}
        </h2>
        <p className="UserCollection-number">{numberText || <LoadingText />}</p>
      </Link>
    </li>
  );
};

const UserCollection: React.ComponentType<Props> = compose(translate())(
  UserCollectionBase,
);

export default UserCollection;
