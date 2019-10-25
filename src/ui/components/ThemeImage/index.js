/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import translate from 'core/i18n/translate';
import { getPreviewImage } from 'core/imageUtils';
import { isTheme } from 'core/utils';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  roundedCorners?: boolean,
  useStandardSize?: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const ThemeImageBase = ({
  addon,
  i18n,
  roundedCorners = false,
  useStandardSize = true,
}: InternalProps) => {
  if (addon && isTheme(addon.type)) {
    const label = i18n.sprintf(i18n.gettext('Preview of %(title)s'), {
      title: addon.name,
    });

    const previewURL = getPreviewImage(addon, { useStandardSize });

    return (
      <div
        className={makeClassName('ThemeImage', {
          'ThemeImage--rounded-corners': roundedCorners,
        })}
        role="presentation"
      >
        <img alt={label} className="ThemeImage-image" src={previewURL} />
      </div>
    );
  }

  return null;
};

const ThemeImage: React.ComponentType<Props> = translate()(ThemeImageBase);

export default ThemeImage;
