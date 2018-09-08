/* eslint-disable react/no-multi-comp, react/prop-types */

import * as React from 'react';

import { withExperiment } from 'core/withExperiment';
import {
  createFakeEvent,
  createFakeTracking,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('withExperiment', () => {
    let fakeTracking;

    class ExperimentComponentBase extends React.Component {
      render() {
        return <div className="component">test</div>;
      }
    }

    const ExperimentComponent = withExperiment({
      nameId: 'ABtest',
      AName: 'AName',
      BName: 'BName',
    })(ExperimentComponentBase);

    const render = ({ ...props } = {}) => {
      const root = shallowUntilTarget(
        <ExperimentComponent {...props} />,
        ExperimentComponentBase,
      );
      return root;
    };

    beforeEach(() => {
      fakeTracking = createFakeTracking();
    });

    it('sets abTestIsOn prop to be true or false', () => {
      const nameId = 'Hero';
      const AName = 'Big';
      const BName = 'Small';
      const root = render({ nameId, AName, BName });

      const choices = [true, false];

      const { abTestIsOn } = root.instance().props;

      expect(choices).toEqual(expect.arrayContaining([abTestIsOn]));
    });

    it('sets cookie to contain one of the variant names', () => {
      // TODO
    });

    it('calls cookie save if cookie is not set yet', () => {
      // TODO
    });

    it('calls tracking on home page view', () => {
      const nameId = 'someTestName';
      const AName = 'VersionA';
      const BName = 'VersionB';
      const root = render({ AName, BName, nameId, _tracking: fakeTracking });
      const { abTestIsOn } = root.instance().props;

      const variantName = abTestIsOn
        ? `AB_TEST_${nameId}_${AName}`
        : `AB_TEST_${nameId}_${BName}`;

      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: `${nameId} Page View`,
        category: `AMO ${variantName}`,
        label: '',
      });

      sinon.assert.calledOnce(fakeTracking.sendEvent);
    });

    it('calls tracking on hero click', () => {
      // TODO: isolate this just to click?.

      const nameId = 'someTestName';
      const AName = 'VersionA';
      const BName = 'VersionB';
      const addonUrl = '/some-test-url';

      const root = render({ nameId, _tracking: fakeTracking });

      const { abTestIsOn } = root.instance().props;

      const variantName = abTestIsOn
        ? `AB_TEST_${nameId}_${AName}`
        : `AB_TEST_${nameId}_${BName}`;

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
        action: `${nameId} Page View`,
        category: `AMO ${variantName}`,
        label: '',
      });

      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: `${nameId} Click`,
        category: `AMO ${variantName}`,
        label: addonUrl,
      });
    });
  });
});
