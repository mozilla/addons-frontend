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

    it('sets cookie to contain one of the variant names', () => {
      const nameId = 'Hero';
      const AName = 'Big';
      const BName = 'Small';
      const root = render({ nameId, AName, BName });

      const choices = [`AB_${nameId}_${AName}`, `AB_${nameId}_${BName}`];

      const { variant } = root.instance().props;

      expect(choices).toEqual(expect.arrayContaining([variant]));
    });

    it('calls cookie save if cookie is not set yet', () => {
      // TODO
    });

    it('calls tracking on page view', () => {
      const nameId = 'someTestName';
      const root = render({ nameId, _tracking: fakeTracking });
      const { variant } = root.instance().props;

      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: `${nameId} Page View`,
        category: `AMO ${variant}`,
        label: '',
      });

      sinon.assert.calledOnce(fakeTracking.sendEvent);
    });

    it('calls tracking on hero click', () => {
      const nameId = 'someTestName';
      const addonUrl = '/some-test-url';
      const root = render({ nameId, _tracking: fakeTracking });
      const { variant } = root.instance().props;

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
        category: `AMO ${variant}`,
        label: addonUrl,
      });

      sinon.assert.called(fakeTracking.sendEvent);
    });
  });
});
