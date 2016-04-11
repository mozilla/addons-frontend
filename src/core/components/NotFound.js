import React from 'react';
import { gettext as _ } from 'core/utils';

export default class NotFound extends React.Component {
  render() {
    return (
      <div className="not-found">
        <h1 ref="header">{_("We're sorry, but we can't find what you're looking for.")}</h1>
        <p>{_("The page or file you requested wasn't found on our site. It's possible that you " +
              "clicked a link that's out of date, or typed in the address incorrectly.")}</p>
      </div>
    );
  }
}
