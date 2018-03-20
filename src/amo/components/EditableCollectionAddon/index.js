/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import { getAddonIconUrl } from 'core/imageUtils';
import type { AddonType } from 'core/types/addons';

import './styles.scss';

type Props = {|
  addon: AddonType,
  className?: string,
|};

const EditableCollectionAddon = ({ addon, className }: Props) => {
  const iconURL = getAddonIconUrl(addon);
  return (
    <div className={makeClassName('EditableCollectionAddon', className)}>
      <img src={iconURL} alt="" />
      <h2 className="EditableCollectionAddon-name">
        {addon.name}
      </h2>
    </div>
  );
};

export default EditableCollectionAddon;
