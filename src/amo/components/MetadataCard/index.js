/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';

import LoadingText from 'amo/components/LoadingText';

import './styles.scss';

type Props = {|
  className?: string,
  metadata: Array<Object>,
|};

const MetadataCard = ({ className, metadata }: Props): React.Node => {
  invariant(metadata, 'The metadata property is required');

  return (
    <div className={makeClassName('MetadataCard', className)}>
      {
        // eslint-disable-next-line default-param-last
        metadata.map(({ content, title } = {}, index) => {
          if (content === undefined) {
            throw new Error('content is required');
          }
          if (title === undefined) {
            throw new Error('title is required');
          }

          // Empty string and zero values are allowed.
          const hasContent = content || content === '' || content === 0;

          return (
            // eslint-disable-next-line react/no-array-index-key
            <dl className="MetadataCard-list" key={index}>
              <dd className="MetadataCard-content">
                {hasContent ? content : <LoadingText />}
              </dd>
              <dt className="MetadataCard-title">{title}</dt>
            </dl>
          );
        })
      }
    </div>
  );
};

export default MetadataCard;
