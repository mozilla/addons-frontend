/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import LoadingText from 'ui/components/LoadingText';
import type { I18nType } from 'core/types/i18n';

type Props = {|
  authorUsername?: string,
  id: number,
  loading?: boolean,
  name?: string,
  numberOfAddons?: number,
  slug?: string,
|};

type InjectedProps = {|
  i18n: I18nType,
|};

type InternalProps = { ...Props, ...InjectedProps };

export const UserCollectionBase = (props: InternalProps) => {
  const {
    authorUsername,
    id,
    loading,
    name,
    numberOfAddons,
    slug,
    i18n,
  } = props;

  let href;
  let numberText;

  if (!loading) {
    invariant(authorUsername, 'authorUsername is required');
    invariant(name, 'name is required');
    invariant(slug, 'slug is required');
    invariant(
      Number.isInteger(numberOfAddons),
      'numberOfAddons must be a number',
    );

    href = `/collections/${authorUsername}/${slug}/`;
    numberText = i18n.sprintf(
      i18n.ngettext('%(total)s add-on', '%(total)s add-ons', numberOfAddons),
      { total: i18n.formatNumber(numberOfAddons) },
    );
  }

  return (
    <li className="CollectionList-collection" key={id}>
      <a className="CollectionList-collection-link" href={href || '#'}>
        <h2 className="CollectionList-collection-name">
          {name || <LoadingText />}
        </h2>
        <p className="CollectionList-collection-number">
          {numberText || <LoadingText />}
        </p>
      </a>
    </li>
  );
};

const UserCollection: React.ComponentType<Props> = compose(translate())(
  UserCollectionBase,
);

export default UserCollection;
