/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import SiteNotices from 'amo/components/SiteNotices';

import './styles.scss';

type Props = {| className?: string |};

export const AppBannerBase = ({ className }: Props) => {
  return (
    <div className={makeClassName('AppBanner', className)}>
      <SiteNotices />
    </div>
  );
};

export default AppBannerBase;
