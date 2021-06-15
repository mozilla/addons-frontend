/* @flow */
export const CLEAR_EXPERIMENT_VARIANT: 'CLEAR_EXPERIMENT_VARIANT' =
  'CLEAR_EXPERIMENT_VARIANT';
export const STORE_EXPERIMENT_VARIANT: 'STORE_EXPERIMENT_VARIANT' =
  'STORE_EXPERIMENT_VARIANT';

export type ExperimentsState = {| [experimentId: string]: string |};

export const initialState: ExperimentsState = {};

type ClearExperimentVariantParams = {|
  id: string,
|};

export type ClearExperimentVariantAction = {|
  type: typeof CLEAR_EXPERIMENT_VARIANT,
  payload: ClearExperimentVariantParams,
|};

export const clearExperimentVariant = ({
  id,
}: ClearExperimentVariantParams): ClearExperimentVariantAction => {
  return {
    type: CLEAR_EXPERIMENT_VARIANT,
    payload: { id },
  };
};

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

type Action = ClearExperimentVariantAction | StoreExperimentVariantAction;

export default function experimentsReducer(
  state: ExperimentsState = initialState,
  action: Action,
): ExperimentsState {
  switch (action.type) {
    case CLEAR_EXPERIMENT_VARIANT: {
      const { id } = action.payload;

      const newState = { ...state };
      delete newState[id];
      return newState;
    }

    case STORE_EXPERIMENT_VARIANT: {
      const { id, variant } = action.payload;

      return { ...state, [id]: variant };
    }

    default:
      return state;
  }
}
