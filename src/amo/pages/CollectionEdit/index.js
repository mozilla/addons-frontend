/* @flow */
import * as React from 'react';

import Collection from 'amo/pages/Collection';
import type { Props } from 'amo/pages/Collection';

const CollectionEdit = (props: Props) => {
  return <Collection {...props} editing />;
};

export default CollectionEdit;
