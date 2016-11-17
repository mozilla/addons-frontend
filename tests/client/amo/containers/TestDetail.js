import React from 'react';

import { DetailPageBase, mapStateToProps } from 'amo/containers/DetailPage';
import AddonDetail from 'amo/components/AddonDetail';
import { INSTALLED, UNKNOWN } from 'core/constants';
import { fakeAddon } from 'tests/client/amo/helpers';
import { shallowRender } from 'tests/client/helpers';


describe('DetailPage', () => {
  it('renders AddonDetail with the same props', () => {
    const root = shallowRender(<DetailPageBase foo="bar" baz="quux" />);
    assert.equal(root.props.className, 'full-width no-top-padding', sinon.format(root));
    assert.deepEqual(root.props.children.props, { foo: 'bar', baz: 'quux' });
    assert.equal(root.props.children.type, AddonDetail);
  });

  describe('mapStateToProps', () => {
    it('pulls the add-on from state', () => {
      const addon = { ...fakeAddon, status: 'public' };
      const ownProps = { params: { slug: addon.slug } };
      const installation = { guid: addon.guid, needsRestart: false, status: INSTALLED };
      const state = {
        addons: {
          [addon.slug]: addon,
        },
        installations: {
          [addon.guid]: installation,
        },
      };
      const props = mapStateToProps(state, ownProps);
      assert.deepEqual(props, { addon, ...addon, ...installation });
      assert.equal(props.status, INSTALLED);
    });

    it('sets status to UNKNOWN if no installation', () => {
      const addon = { ...fakeAddon, status: 'public' };
      const ownProps = { params: { slug: addon.slug } };
      const state = {
        addons: {
          [addon.slug]: addon,
        },
        installations: {},
      };
      const props = mapStateToProps(state, ownProps);
      assert.deepEqual(props, { addon, ...addon, status: UNKNOWN });
    });
  });
});
