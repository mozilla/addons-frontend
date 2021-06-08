/* @flow */
export type StoredVariant = {| id: string, variant: string |};

export const STORE_EXPERIMENT_VARIANT: 'STORE_EXPERIMENT_VARIANT' =
  'STORE_EXPERIMENT_VARIANT';

export type ExperimentsState = {
  storedVariant: StoredVariant | null,
};

export const initialState: ExperimentsState = {
  storedVariant: null,
};

type StoreExperimentVariantParams = {|
  storedVariant: StoredVariant | null,
|};

export type StoreExperimentVariantAction = {|
  type: typeof STORE_EXPERIMENT_VARIANT,
  payload: StoreExperimentVariantParams,
|};

export const storeExperimentVariant = ({
  storedVariant,
}: StoreExperimentVariantParams): StoreExperimentVariantAction => {
  return {
    type: STORE_EXPERIMENT_VARIANT,
    payload: { storedVariant },
  };
};

type Action = StoreExperimentVariantAction;

export default function experimentsReducer(
  state: ExperimentsState = initialState,
  action: Action,
): ExperimentsState {
  switch (action.type) {
    case STORE_EXPERIMENT_VARIANT: {
      const { storedVariant } = action.payload;

      return {
        ...state,
        storedVariant,
      };
    }
    default:
      return state;
  }
}
