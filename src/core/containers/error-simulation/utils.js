/* eslint-disable react/prop-types */
import defaultConfig from 'config';
import React from 'react';

import NotFound from 'core/components/ErrorPage/NotFound';

export const render404WhenNotAllowed = (Component) => ({
  config = defaultConfig, ...props
}) => {
  if (!config.get('allowErrorSimulation')) {
    return <NotFound />;
  }
  return <Component {...props} />;
};
