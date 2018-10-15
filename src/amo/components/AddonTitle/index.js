/* @flow */
import * as React from 'react';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import LoadingText from 'ui/components/LoadingText';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const AddonTitleBase = ({ addon, i18n }: InternalProps) => {
  const authors = [];

  if (addon && addon.authors) {
    const nbAuthors = addon.authors.length;

    addon.authors.forEach((author, index) => {
      authors.push(
        author.url ? (
          <Link key={author.id} to={`/user/${author.username}/`}>
            {author.name}
          </Link>
        ) : (
          author.name
        ),
      );

      if (index + 1 < nbAuthors) {
        authors.push(', ');
      }
    });
  }

  return (
    <h1 className="AddonTitle">
      {addon ? (
        <React.Fragment>
          {addon.name}
          {authors.length > 0 && (
            <span className="AddonTitle-author">
              {// translators: Example: "add-on" by "some authors"
              i18n.gettext('by')}{' '}
              {authors}
            </span>
          )}
        </React.Fragment>
      ) : (
        <LoadingText width={70} />
      )}
    </h1>
  );
};

const AddonTitle: React.ComponentType<Props> = translate()(AddonTitleBase);

export default AddonTitle;
