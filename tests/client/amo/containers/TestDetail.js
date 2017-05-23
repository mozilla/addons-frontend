import React from 'react';

import { DetailPageBase, mapStateToProps } from 'amo/containers/DetailPage';
import AddonDetail from 'amo/components/AddonDetail';
import { INSTALLED, UNKNOWN } from 'core/constants';
import { fakeAddon } from 'tests/client/amo/helpers';
import { shallowRender } from 'tests/client/helpers';


describe('DetailPage', () => {
  it('renders AddonDetail with the same props', () => {
    const root = shallowRender(<DetailPageBase foo="bar" baz="quux" />);
    expect(root.props.className).toEqual('DetailPage');
    expect(root.props.children.props).toEqual({ foo: 'bar', baz: 'quux' });
    expect(root.props.children.type).toEqual(AddonDetail);
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
      expect(props).toEqual({ addon, ...addon, ...installation });
      expect(props.status).toEqual(INSTALLED);
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
      expect(props).toEqual({ addon, ...addon, status: UNKNOWN });
    });
  });
});
