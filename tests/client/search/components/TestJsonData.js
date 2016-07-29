import React from 'react';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import JsonData from 'search/components/JsonData';

describe('<JsonData />', () => {
  it('renders an object', () => {
    const obj = { foo: 'bar', baz: 'quux' };
    const pre = findDOMNode(renderIntoDocument(<JsonData data={obj} />)).querySelector('pre');
    assert.equal(pre.textContent, `{
  "foo": "bar",
  "baz": "quux"
}`);
  });

  it('shows the JSON when the button is clicked', () => {
    const obj = { foo: 'bar', baz: 'quux' };
    const root = findDOMNode(renderIntoDocument(<JsonData data={obj} />));
    const toggle = root.querySelector('.JsonData-toggle');
    assert.ok(!root.classList.contains('JsonData-visible'));
    assert.equal(toggle.textContent, 'Show JSON');
    Simulate.click(root.querySelector('.JsonData-toggle'));
    assert.ok(root.classList.contains('JsonData-visible'));
    assert.equal(toggle.textContent, 'Hide JSON');
    Simulate.click(root.querySelector('.JsonData-toggle'));
    assert.ok(!root.classList.contains('JsonData-visible'));
    assert.equal(toggle.textContent, 'Show JSON');
  });
});
