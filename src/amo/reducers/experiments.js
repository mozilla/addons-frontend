/* @flow */
export const STORE_EXPERIMENT_VARIANT: 'STORE_EXPERIMENT_VARIANT' =
  'STORE_EXPERIMENT_VARIANT';

export type ExperimentsState = {| [experimentId: string]: string |};

export const initialState: ExperimentsState = {};

type StoreExperimentVariantParams = {|
  id: string,
  variant: string,
|};

export type StoreExperimentVariantAction = {|
  type: typeof STORE_EXPERIMENT_VARIANT,
  payload: StoreExperimentVariantParams,
|};

export const storeExperimentVariant = ({
  id,
  variant,
}: StoreExperimentVariantParams): StoreExperimentVariantAction => {
  return {
    type: STORE_EXPERIMENT_VARIANT,
    payload: { id, variant },
  };
};

type Action = StoreExperimentVariantAction;

export default function experimentsReducer(
  state: ExperimentsState = initialState,
  // $FlowIgnore
  action: Action = {},
): ExperimentsState {
  switch (action.type) {
    case STORE_EXPERIMENT_VARIANT: {
      const { id, variant } = action.payload;

      return { ...state, [id]: variant };
    }

    default:
      return state;
  }
}
