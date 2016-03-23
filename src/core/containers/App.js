import React from 'react';
import { Link } from 'react-router';

export default class App extends React.Component {
  render() {
    return (
      <ul>
        <li><Link to="/search">Search</Link></li>
        <li><Link to="/disco">Discovery Pane</Link></li>
      </ul>
    );
  }
}

