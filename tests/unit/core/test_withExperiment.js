/* eslint-disable react/no-multi-comp, react/prop-types */

import { shallow } from 'enzyme';
import * as React from 'react';

import { withExperiment } from 'core/withExperiment';
import { fakeCookie } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('withExperiment', () => {
    class SomeComponentBase extends React.Component {
      render() {
        return <div className="component" />;
      }
    }

    function componentWithExperiment({ experimentProps, props } = {}) {
      const TestComponent = withExperiment({
        id: 'ABtest',
        variantA: 'AName',
        variantB: 'BName',
        ...experimentProps,
      })(SomeComponentBase);

      return shallow(<TestComponent {...props} />);
    }

    it('passes the variant prop', () => {
      const root = componentWithExperiment();
      expect(root).toHaveProp('variant');
    });

    it('loads and saves cookie', () => {
      const _cookie = fakeCookie();
      const id = 'Hero';

      const root = componentWithExperiment({
        props: {
          _cookie,
          id,
        },
      });

      sinon.assert.calledWith(_cookie.load, `experiment_${id}`);

      sinon.assert.calledWith(
        _cookie.save,
        `experiment_${id}`,
        root.instance().experimentCookie,
      );
    });

    it('saves cookie with updated config', () => {
      const overrideCookieConfig = { path: '/test' };
      const _cookie = fakeCookie();
      const id = 'layoutTest';

      const root = componentWithExperiment({
        props: {
          _cookie,
          id,
        },
        experimentProps: { cookieConfig: overrideCookieConfig },
      });

      sinon.assert.calledWith(
        _cookie.save,
        `experiment_${id}`,
        root.instance().experimentCookie,
        overrideCookieConfig,
      );
    });

    // it('calls tracking on component page view', () => {
    //   const nameId = 'someTestName';
    //   const AName = 'VersionA';
    //   const BName = 'VersionB';
    //   const root = render({ _tracking: fakeTracking, AName, BName, nameId });
    //   const { experimentIsOn } = root.instance().props;

    //   const variantName = experimentIsOn
    //     ? `AB_TEST_${nameId}_${AName}`
    //     : `AB_TEST_${nameId}_${BName}`;

    //   sinon.assert.calledWith(fakeTracking.sendEvent, {
    //     action: `${nameId} Page View`,
    //     category: `AMO ${variantName}`,
    //     label: '',
    //   });

    //   sinon.assert.calledOnce(fakeTracking.sendEvent);
    // });

    // it('calls tracking on click', () => {
    //   const nameId = 'someTestName';
    //   const AName = 'VersionA';
    //   const BName = 'VersionB';
    //   const addonUrl = '/some-test-url';

    //   const root = render({
    //     _tracking: fakeTracking,
    //     AName,
    //     BName,
    //     nameId,
    //   });

    //   const { experimentIsOn } = root.instance().props;

    //   const variantName = experimentIsOn
    //     ? `AB_TEST_${nameId}_${AName}`
    //     : `AB_TEST_${nameId}_${BName}`;

    //   // This is called via render which we need to do
    //   // to get access to click.
    //   sinon.assert.calledWith(fakeTracking.sendEvent, {
    //     action: `${nameId} Page View`,
    //     category: `AMO ${variantName}`,
    //     label: '',
    //   });

    //   sinon.assert.calledOnce(fakeTracking.sendEvent);

    //   // Simulate clicking an "a" tag with trackClick.
    //   root.instance().props.trackClick(
    //     createFakeEvent({
    //       ...createFakeEvent(),
    //       currentTarget: {
    //         nodeName: 'A',
    //       },
    //     }),
    //     addonUrl,
    //   );

    //   sinon.assert.calledWith(fakeTracking.sendEvent, {
    //     action: `${nameId} Click`,
    //     category: `AMO ${variantName}`,
    //     label: addonUrl,
    //   });

    //   sinon.assert.calledTwice(fakeTracking.sendEvent);
    // });
  });
});
