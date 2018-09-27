/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Link from 'amo/components/Link';
import LoadingText from 'ui/components/LoadingText';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  authorUsername?: string,
  id: number,
  loading?: boolean,
  name?: string,
  numberOfAddons?: number,
  slug?: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

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

  const linkProps = {};
  let numberText;

  if (loading) {
    linkProps.href = '';
  } else {
    invariant(authorUsername, 'authorUsername is required');
    invariant(name, 'name is required');
    invariant(slug, 'slug is required');
    invariant(
      numberOfAddons !== undefined && Number.isInteger(numberOfAddons),
      'numberOfAddons must be a number',
    );

    linkProps.to = `/collections/${authorUsername}/${slug}/`;
    numberText = i18n.sprintf(
      i18n.ngettext('%(total)s add-on', '%(total)s add-ons', numberOfAddons),
      { total: i18n.formatNumber(numberOfAddons) },
    );
  }

  return (
    <li className="UserCollection" key={id}>
      <Link className="UserCollection-link" {...linkProps}>
        <h2 className="UserCollection-name">{name || <LoadingText />}</h2>
        <p className="UserCollection-number">{numberText || <LoadingText />}</p>
      </Link>
    </li>
  );
};

const UserCollection: React.ComponentType<Props> = compose(translate())(
  UserCollectionBase,
);

export default UserCollection;
