/* @flow */
import * as React from 'react';

import LoadingText from 'ui/components/LoadingText';

import './styles.scss';

type Props = {|
  metadata: Array<Object>,
|};

const MetadataCard = (props: Props) => {
  if (!props.metadata) {
    throw new Error('The metadata property is required');
  }

  return (
    <div className="MetadataCard">
      {props.metadata.map(({ content, title } = {}) => {
        if (content === undefined) {
          throw new Error('content is required');
        }
        if (title === undefined) {
          throw new Error('title is required');
        }

        // Empty string and zero values are allowed.
        const hasContent = content || content === '' || content === 0;

        return (
          <dl className="MetadataCard-list" key={title}>
            <dd className="MetadataCard-content">
              {hasContent ? content : <LoadingText />}
            </dd>
            <dt className="MetadataCard-title">{title}</dt>
          </dl>
        );
      })}
    </div>
  );
};

export default MetadataCard;
