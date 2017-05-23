import React from 'react';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import JsonData from 'admin/components/JsonData';

describe('<JsonData />', () => {
  it('renders an object', () => {
    const obj = { foo: 'bar', baz: 'quux' };
    const pre = findDOMNode(renderIntoDocument(<JsonData data={obj} />)).querySelector('pre');
    expect(pre.textContent).toEqual(dedent`{
      "foo": "bar",
      "baz": "quux"
    }`);
  });

  it('shows the JSON when the button is clicked', () => {
    const obj = { foo: 'bar', baz: 'quux' };
    const root = findDOMNode(renderIntoDocument(<JsonData data={obj} />));
    const toggle = root.querySelector('.JsonData-toggle');
    expect(!root.classList.contains('JsonData-visible')).toBeTruthy();
    expect(toggle.textContent).toEqual('Show JSON');
    Simulate.click(root.querySelector('.JsonData-toggle'));
    expect(root.classList.contains('JsonData-visible')).toBeTruthy();
    expect(toggle.textContent).toEqual('Hide JSON');
    Simulate.click(root.querySelector('.JsonData-toggle'));
    expect(!root.classList.contains('JsonData-visible')).toBeTruthy();
    expect(toggle.textContent).toEqual('Show JSON');
  });
});
