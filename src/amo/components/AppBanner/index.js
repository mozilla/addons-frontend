/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { withRouter } from 'react-router-dom';

import SiteNotices from 'amo/components/SiteNotices';
import SurveyNotice from 'amo/components/SurveyNotice';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

type Props = {| className?: string |};

type InternalProps = {|
  ...Props,
  location: ReactRouterLocationType,
|};

export const AppBannerBase = ({ className, location }: InternalProps): React.Element<"div"> => {
  return (
    <div className={makeClassName('AppBanner', className)}>
      <SiteNotices />
      <SurveyNotice location={location} />
    </div>
  );
};

const AppBanner: React.ComponentType<Props> = withRouter(AppBannerBase);

export default AppBanner;
