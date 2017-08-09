import React, { Component } from 'react';
import { mount, shallow } from 'enzyme';
import { compose } from 'redux';

import { unwrapComponent } from 'tests/unit/helpers';

describe('helpers', () => {
  describe('unwrapComponent', () => {
    function ExampleBase() {
      return <div>Example component</div>;
    }

    function wrapper() {
      return function Wrapper(WrappedComponent) {
        return function InnerWrapper(props) {
          return <WrappedComponent {...props} />;
        };
      };
    }

    it('requires a componentInstance', () => {
      expect(() => unwrapComponent(undefined, ExampleBase))
        .toThrow('componentInstance parameter is required');
    });

    it('requires a ShallowWrapper', () => {
      const Example = compose(
        wrapper(),
      )(ExampleBase);

      expect(() => {
        unwrapComponent(mount(<Example />), ExampleBase);
      }).toThrow(/componentInstance must be the result of enzyme\.shallow/);
    });

    it('requires a ComponentBase', () => {
      const Example = compose(
        wrapper(),
      )(ExampleBase);

      expect(() => unwrapComponent(shallow(<Example />), undefined))
        .toThrow('ComponentBase parameter is required');
    });

    it('lets you unwrap a component one level', () => {
      const Example = compose(
        wrapper(),
      )(ExampleBase);

      const root = unwrapComponent(shallow(<Example />), ExampleBase);
      expect(root.text()).toEqual('Example component');
    });

    it('lets you unwrap a component two levels', () => {
      const Example = compose(
        wrapper(),
        wrapper(),
      )(ExampleBase);

      const root = unwrapComponent(shallow(<Example />), ExampleBase);
      expect(root.text()).toEqual('Example component');
    });

    it('lets you unwrap a React class based component', () => {
      class ReactExampleBase extends Component {
        render() {
          return <div>example of class based component</div>;
        }
      }

      const Example = compose(
        wrapper(),
      )(ReactExampleBase);

      const root = unwrapComponent(shallow(<Example />), ReactExampleBase);
      expect(root.instance()).toBeInstanceOf(ReactExampleBase);
    });

    it('does not let you unwrap a component that is not wrapped', () => {
      expect(() => {
        unwrapComponent(shallow(<ExampleBase />), ExampleBase);
      }).toThrow(/Cannot unwrap this component because it is not wrapped/);
    });

    it('gives up trying to unwrap component after maxTries', () => {
      const Example = compose(
        wrapper(),
        wrapper(),
        wrapper(),
      )(ExampleBase);

      expect(() => {
        unwrapComponent(shallow(<Example />), ExampleBase, {
          maxTries: 2,
        });
      }).toThrow(/Could not find .*gave up after 2 tries/);
    });
  });
});
