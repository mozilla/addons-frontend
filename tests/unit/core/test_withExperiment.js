/* eslint-disable react/no-multi-comp, react/prop-types */

import { shallow } from 'enzyme';
import * as React from 'react';

import { withExperiment } from 'core/withExperiment';
import {
  createFakeEvent,
  createFakeTracking,
  fakeCookie,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('withExperiment', () => {
    let fakeTracking;

    class SomeComponentBase extends React.Component {
      render() {
        return <div className="component" />;
      }
    }

    const SomeComponent = withExperiment({
      nameId: 'ABtest',
      AName: 'AName',
      BName: 'BName',
    })(SomeComponentBase);

    const render = ({ ...props } = {}) => {
      const root = shallowUntilTarget(
        <SomeComponent {...props} />,
        SomeComponentBase,
      );
      return root;
    };

    const shallowRender = ({ ...props } = {}) => {
      return shallow(<SomeComponent {...props} />);
    };

    beforeEach(() => {
      fakeTracking = createFakeTracking();
    });

    it('passes the experimentIsOn prop', () => {
      const componentWithExperiment = shallowRender();
      expect(componentWithExperiment).toHaveProp('experimentIsOn');
    });

    it('sets experimentIsOn prop to be true or false', () => {
      const nameId = 'Hero';
      const AName = 'Big';
      const BName = 'Small';
      const root = render({ nameId, AName, BName });

      const options = [true, false];

      const { experimentIsOn } = root.instance().props;

      expect(options).toEqual(expect.arrayContaining([experimentIsOn]));
    });

    it('loads and saves cookie to contain one of the variant names', () => {
      const _cookie = fakeCookie();
      const nameId = 'Hero';
      const AName = 'Big';
      const BName = 'Small';
      const root = shallowRender({
        nameId,
        AName,
        BName,
        _cookie,
      });

      sinon.assert.calledWith(_cookie.load, `AB_${nameId}_COOKIE`);

      sinon.assert.calledWith(
        _cookie.save,
        `AB_${nameId}_COOKIE`,
        root.instance().abTestCookie,
        { path: '/' },
      );
    });

    it('calls tracking on component page view', () => {
      const nameId = 'someTestName';
      const AName = 'VersionA';
      const BName = 'VersionB';
      const root = render({ _tracking: fakeTracking, AName, BName, nameId });
      const { experimentIsOn } = root.instance().props;

      const variantName = experimentIsOn
        ? `AB_TEST_${nameId}_${AName}`
        : `AB_TEST_${nameId}_${BName}`;

      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: `${nameId} Page View`,
        category: `AMO ${variantName}`,
        label: '',
      });

      sinon.assert.calledOnce(fakeTracking.sendEvent);
    });

    it('calls tracking on click', () => {
      const nameId = 'someTestName';
      const AName = 'VersionA';
      const BName = 'VersionB';
      const addonUrl = '/some-test-url';

      const root = render({
        _tracking: fakeTracking,
        AName,
        BName,
        nameId,
      });

      const { experimentIsOn } = root.instance().props;

      const variantName = experimentIsOn
        ? `AB_TEST_${nameId}_${AName}`
        : `AB_TEST_${nameId}_${BName}`;

      // This is called via render which we need to do
      // to get access to click.
      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: `${nameId} Page View`,
        category: `AMO ${variantName}`,
        label: '',
      });

      sinon.assert.calledOnce(fakeTracking.sendEvent);

      // Simulate clicking an "a" tag with trackClick.
      root.instance().props.trackClick(
        createFakeEvent({
          ...createFakeEvent(),
          currentTarget: {
            nodeName: 'A',
          },
        }),
        addonUrl,
      );

      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: `${nameId} Click`,
        category: `AMO ${variantName}`,
        label: addonUrl,
      });

      sinon.assert.calledTwice(fakeTracking.sendEvent);
    });
  });
});
