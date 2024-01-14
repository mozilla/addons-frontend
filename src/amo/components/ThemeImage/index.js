/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';

import translate from 'amo/i18n/translate';
import { getPreviewImage } from 'amo/imageUtils';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import { ADDON_TYPE_STATIC_THEME } from 'amo/constants';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  roundedCorners: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const ThemeImageBase = ({
  addon,
  i18n,
  roundedCorners,
}: InternalProps): null | React.Node => {
  invariant(
    addon && ADDON_TYPE_STATIC_THEME === addon.type,
    'A ThemeImage can only be rendered for a static theme',
  );
  const label = i18n.t('Preview of %(title)s', {
    title: addon.name,
  });

  return (
    <div
      className={makeClassName('ThemeImage', {
        'ThemeImage--rounded-corners': roundedCorners,
      })}
      role="presentation"
    >
      <img
        alt={label}
        className="ThemeImage-image"
        src={getPreviewImage(addon)}
      />
    </div>
  );
};

const ThemeImage: React.ComponentType<Props> = translate()(ThemeImageBase);

export default ThemeImage;
