/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { withRouter } from 'react-router-dom';

import SiteNotices from 'core/components/SiteNotices';
import SurveyNotice from 'core/components/SurveyNotice';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {| className?: string |};

type InternalProps = {|
  ...Props,
  location: ReactRouterLocationType,
|};

export const AppBannerBase = ({ className, location }: InternalProps) => {
  return (
    <div className={makeClassName('AppBanner', className)}>
      <SiteNotices />
      <SurveyNotice location={location} />
    </div>
  );
};

const AppBanner: React.ComponentType<Props> = withRouter(AppBannerBase);

export default AppBanner;
