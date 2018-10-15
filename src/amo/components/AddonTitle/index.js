/* @flow */
import * as React from 'react';

import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
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
  let children;
  let htmlTitle;

  if (addon) {
    let title;
    if (!addon.authors) {
      title = addon.name;
    } else {
      const authorList = addon.authors.map((author) => {
        if (author.url) {
          return `<a href="${author.url}">${author.name}</a>`;
        }

        return author.name;
      });

      title = i18n.sprintf(
        // translators: Example: The Add-On <span>by The Author</span>
        i18n.gettext('%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s'),
        {
          addonName: addon.name,
          authorList: authorList.join(', '),
          startSpan: '<span class="AddonTitle-author">',
          endSpan: '</span>',
        },
      );
    }

    htmlTitle = sanitizeHTML(title, ['a', 'span']);
  } else {
    children = <LoadingText width={70} />;
  }

  return (
    <h1
      className="AddonTitle"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={htmlTitle}
    >
      {children}
    </h1>
  );
};

const AddonTitle: React.ComponentType<Props> = translate()(AddonTitleBase);

export default AddonTitle;
