import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Addon from 'disco/components/Addon';

import { THEME_PREVIEW, THEME_RESET_PREVIEW } from 'disco/constants';


const result = {
  id: 'test-id',
  type: 'Extension',
  heading: 'test-heading',
  slug: 'test-slug',
  subHeading: 'test-sub-heading',
  editorialDescription: 'test-editorial-description',
};

const store = createStore((s) => s, {installations: {}});

function renderAddon(data) {
  return findRenderedComponentWithType(renderIntoDocument(
    <Provider store={store}>
      <Addon {...data} />
    </Provider>
  ), Addon);
}

describe('<Addon type="Extension"/>', () => {
  let root;

  beforeEach(() => {
    root = renderAddon(result);
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
    const data = {...result, subHeading: undefined};
    root = renderAddon(data);
    assert.notEqual(root.refs.heading.textContent, 'test-sub-heading');
  });

  it('does render a logo for an extension', () => {
    assert.ok(findDOMNode(root).querySelector('.logo'));
  });

  it("doesn't render a theme image for an extension", () => {
    assert.equal(findDOMNode(root).querySelector('.theme-image'), null);
  });

  it('throws on invalid add-on type', () => {
    assert.include(root.refs.heading.textContent, 'test-heading');
    const data = {...result, type: 'Whatever'};
    assert.throws(() => {
      renderAddon(data);
    }, Error, 'Invalid addon type');
  });
});


describe('<Addon type="Theme"/>', () => {
  let root;

  beforeEach(() => {
    const data = {...result, type: 'Theme'};
    root = renderAddon(data);
  });

  it('does render the theme image for a theme', () => {
    assert.ok(findDOMNode(root).querySelector('.theme-image'));
  });

  it("doesn't render the logo for a theme", () => {
    assert.notOk(findDOMNode(root).querySelector('.logo'));
  });
});


describe('Theme Previews', () => {
  let root;
  let themeImage;
  let themeAction;

  beforeEach(() => {
    themeAction = sinon.stub();
    const data = {...result, type: 'Theme', themeAction};
    root = renderAddon(data);
    themeImage = findDOMNode(root).querySelector('.theme-image');
  });

  it('runs theme preview onMouseOver on theme image', () => {
    Simulate.mouseOver(themeImage);
    assert.ok(themeAction.calledWith(themeImage, THEME_PREVIEW));
  });

  it('resets theme preview onMouseOut on theme image', () => {
    Simulate.mouseOut(themeImage);
    assert.ok(themeAction.calledWith(themeImage, THEME_RESET_PREVIEW));
  });

  it('runs theme preview onFocus on theme image', () => {
    Simulate.focus(themeImage);
    assert.ok(themeAction.calledWith(themeImage, THEME_PREVIEW));
  });

  it('resets theme preview onBlur on theme image', () => {
    Simulate.blur(themeImage);
    assert.ok(themeAction.calledWith(themeImage, THEME_RESET_PREVIEW));
  });

  it('runs preventDefault onClick', () => {
    const preventDefault = sinon.stub();
    Simulate.click(themeImage, {preventDefault});
    assert.ok(preventDefault.called);
  });
});
