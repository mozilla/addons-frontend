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
import { ERROR, THEME_PREVIEW, THEME_RESET_PREVIEW, THEME_TYPE } from 'disco/constants';
import { stubAddonManager, getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';

const result = {
  id: 'test-id',
  type: 'extension',
  heading: 'test-heading',
  slug: 'test-slug',
  description: 'test-editorial-description',
};

const store = createStore((s) => s, {installations: {}, addons: {}});

function renderAddon(data) {
  return findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={getFakeI18nInst()}>
      <Provider store={store}>
        <Addon {...data} />
      </Provider>
    </I18nProvider>
  ), Addon).getWrappedInstance();
}

describe('<Addon />', () => {
  beforeEach(() => {
    stubAddonManager();
  });

  describe('<Addon type="extension"/>', () => {
    let root;

    beforeEach(() => {
      root = renderAddon(result);
    });

    it('renders an error overlay', () => {
      const data = {...result, status: ERROR,
        errorMessage: 'this is an error', closeErrorAction: sinon.stub()};
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.error');
      assert.equal(error.querySelector('p').textContent, 'this is an error',
                  'error message should be present');
      Simulate.click(error.querySelector('.close'));
      assert.ok(data.closeErrorAction.called, 'close link action should be called');
    });

    it('does not normally render an error', () => {
      assert.notOk(findDOMNode(root).querySelector('.error'));
    });

    it('renders the heading', () => {
      assert.include(root.refs.heading.textContent, 'test-heading');
    });

    it('renders the editorial description', () => {
      assert.equal(root.refs.editorialDescription.textContent, 'test-editorial-description');
    });

    it('purifies the heading', () => {
      root = renderAddon({
        ...result,
        heading: '<script>alert("hi")</script><em>Hey!</em> <i>This is <span>an add-on</span></i>',
      });
      assert.include(root.refs.heading.innerHTML, 'Hey! This is <span>an add-on</span>');
    });

    it('purifies the editorial description', () => {
      root = renderAddon({
        ...result,
        description: '<script>foo</script><blockquote>This is an add-on!</blockquote> ' +
                     '<i>Reviewed by <cite>a person</cite></i>',
      });
      assert.equal(
        root.refs.editorialDescription.innerHTML,
        '<blockquote>This is an add-on!</blockquote> Reviewed by <cite>a person</cite>');
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


  describe('<Addon type="theme"/>', () => {
    let root;

    beforeEach(() => {
      const data = {...result, type: THEME_TYPE};
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
      const data = {...result, type: THEME_TYPE, themeAction};
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
});
