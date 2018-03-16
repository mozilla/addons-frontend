/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import { getAddonIconUrl } from 'core/imageUtils';
import type { AddonType } from 'core/types/addons';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

const EditableCollectionAddon = ({ addon }: Props) => {
  const iconURL = getAddonIconUrl(addon);
  return (
    <div className="EditableCollectionAddon">
      <img src={iconURL} alt="" />
      <h2 className="EditableCollectionAddon-name">
        {addon.name}
      </h2>
    </div>
  );
};

export default EditableCollectionAddon;
