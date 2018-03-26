/* @flow */
import * as React from 'react';

import Collection from 'amo/components/Collection';
import type { Props } from 'amo/components/Collection';

const CollectionEdit = (props: Props) => {
  return <Collection {...props} editing />;
};

export default CollectionEdit;
