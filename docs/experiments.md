# Experiments

AMO has the ability to run experiments, automatically dividing users into branches. After data has been gathered for an experiment, we use Google Analytics to analyze the results.

## Adding an Experiment to AMO

The following are the steps to add an experiment to AMO:

1. Create a config file for the experiment in `amo/experiments`.
   - The file should be named with the `experimentId`, e.g., `20210714_amo_vpn_promo.js`.
   - `experimentId` must be in the format `YYYYMMDD_amo_experimentName`. We generally use the date that the code was written for the YYYYMMDD portion.
   - The config file should export a `EXPERIMENT_CONFIG` variable, which is an object containing:
     - `id`, which is the same as the `experimentId`, above.
     - `variants`, which is an array of possible branches to which a user might be assigned. Each item in this array is an object with an `id` (which ends up being the experiment branch/variation) and a `percentage`, which is used to automatically allocate users to branches, and is expressed as number less than 1 (e.g., `0.5` means 50%). The sum total of all `percentage`s in the array must equal `1` or an error will be thrown. There is a special variant, `NOT_IN_EXPERIMENT`, which can be imported from `amo/withExperiment`, and any users allocated to that branch will be treated as not being enrolled in the experiment.
     - optionally a `shouldExcludeUser` function, which accepts a single object argument `{ state }` and returns a boolean. If this function returns `true` then the user will be excluded from the experiment. If this property is missing, then no users will be excluded.
     - Here is an example of a config file from a recent experiment:

     ```js
     import { CLIENT_APP_ANDROID } from 'amo/constants';
     import { NOT_IN_EXPERIMENT } from 'amo/withExperiment';
     import type { RegionCodeType } from 'amo/reducers/api';
     import type { ExperimentConfig } from 'amo/withExperiment';

     export const VARIANT_SHOW = 'show-promo';
     export const VARIANT_HIDE = 'hide-promo';

     export const shouldExcludeUser = ({
       clientApp,
       regionCode,
     }: {|
       clientApp: string,
       regionCode: RegionCodeType,
     |}): boolean => {
       return (
         clientApp === CLIENT_APP_ANDROID ||
         !['US', 'DE', 'FR'].includes(regionCode)
       );
     };

     export const EXPERIMENT_CONFIG: ExperimentConfig = {
       id: '20210714_amo_vpn_promo',
       variants: [
         { id: VARIANT_SHOW, percentage: 0.05 },
         { id: VARIANT_HIDE, percentage: 0.05 },
         { id: NOT_IN_EXPERIMENT, percentage: 0.9 },
       ],
       shouldExcludeUser({ state }) {
         const { clientApp, regionCode } = state.api;

         return shouldExcludeUser({ clientApp, regionCode });
       },
     };
     ```

   This file allocates users into 3 different branches: 5% of users will be in the `VARIANT_SHOW` branch, 5% of users will be in the `VARIANT_HIDE` branch, and 90% of users will be excluded from the experiment by being in the `NOT_IN_EXPERIMENT` branch.

   The example `shouldExcludeUser` function returns the result of the internal `shouldExcludeUser` function, which uses `clientApp` and `regionCode` from `state.api` to exclude users on the `android` site, as well as any users with a region other than `US`, `DE` or `FR`.

2. Update AMO's config to enable the experiment.
   - The default config file, `config/default.js`, contains an `experiments` property, which lists existing experiments along with their current enabled status. To enable an experiment, add it to the `experiments` object, using the `experimentId` as the key, and set the value to `true`. For example:

   ```js
       experiments: {
           '20210714_amo_vpn_promo': true,
       },
   ```

   - To disable an experiment, set its value to `false`.
   - The `default.js` file controls all of the AMO environments. If you wish to just enable an experiment locally, on dev, or on stage, add/update the `experiments` property in `development.js`, `dev.js` or `stage.js` respectively.

3. Implement the code for the experiment in the component whose behaviour needs to change for the purposes of the experiment.
   - Include `withExperiment()` in the `compose` function of the component, or a component which wraps the component.
   - `withExperiment` should be passed an object argument that includes the `EXPERIMENT_CONFIG`, as exported by the experiment's config file. For example: `withExperiment({ experimentConfig: EXPERIMENT_CONFIG })`.
   - The component that includes this call to `withExperiment` will receive a the following props:
     - `experimentId`, which is the `experimentId` as discussed above.
     - `isExperimentEnabled`, which is a boolean which will be `true` if the experiment is currently enabled.
     - `isUserInExperiment`, which is a boolean which will be `true` if the current user is enrolled in the experiment.
     - `variant`, which will be a string, or null, which is the branch/variation to which the current user has been assigned.
   - By making use of these props, the component can change its own behaviour based on whether the experiment is enabled, whether the current user is enrolled, and into which branch the user is enrolled. This behaviour may involve changing what the user sees, and could also include dispatching events to GA, if necessary.

The following PRs are examples of changes made to add an experiment to AMO:

- https://github.com/mozilla/addons-frontend/pull/10782
