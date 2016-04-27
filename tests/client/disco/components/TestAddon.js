import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import Addon from 'disco/components/Addon';

describe('<Addon />', () => {
  let root;
  const result = {
    id: 'test-id',
    type: 'Extension',
    heading: 'test-heading',
    subHeading: 'test-sub-heading',
    editorialDescription: 'test-editorial-description',
  };

  beforeEach(() => {
    root = renderIntoDocument(<Addon { ...result } />);
  });

  it('renders the heading', () => {
    assert.include(root.refs.heading.textContent, 'test-heading');
  });

  it('renders the editorial description', () => {
    assert.equal(root.refs['editorial-description'].textContent, 'test-editorial-description');
  });

  it('renders the sub-heading', () => {
    assert.equal(root.refs['sub-heading'].textContent, 'test-sub-heading');
  });

  it("doesn't render the subheading when not present", () => {
    const data = { ...result, subHeading: undefined };
    root = renderIntoDocument(<Addon {...data} />);
    assert.notEqual(root.refs.heading.textContent, 'test-sub-heading');
  });

  it('does render a logo for an extension', () => {
    assert.ok(findDOMNode(root).querySelector('.logo'));
  });

  it("doesn't render a theme image for an extension", () => {
    assert.equal(findDOMNode(root).querySelector('.theme-image'), null);
  });

  it('does render the theme image for a theme', () => {
    const data = { ...result, type: 'Theme' };
    root = renderIntoDocument(<Addon {...data} />);
    assert.ok(findDOMNode(root).querySelector('.theme-image'));
  });

  it("doesn't render the logo for a theme", () => {
    const data = { ...result, type: 'Theme' };
    root = renderIntoDocument(<Addon {...data} />);
    assert.notOk(findDOMNode(root).querySelector('.logo'));
  });
});
