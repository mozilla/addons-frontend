import makeClassName from 'classnames';
import * as React from 'react';

import Notice from 'amo/components/Notice';
import type { NoticeType } from 'amo/components/Notice';
import './styles.scss';

type Props = {
  className?: string | null;
  hideMessage: boolean;
  message: string;
  type?: NoticeType;
};

const RatingManagerNotice = ({
  className,
  hideMessage,
  message,
  type,
}: Props): React.ReactNode => {
  const props = {
    className: makeClassName('RatingManagerNotice-savedRating', className, {
      'RatingManagerNotice-savedRating-hidden': hideMessage,
    }),
  };

  if (type) {
    return <Notice type={type} light {...props}>
        {message}
      </Notice>;
  }

  return <span {...props}>{message}</span>;
};

export default RatingManagerNotice;