import { CLOSE_INFO, SHOW_INFO } from 'disco/constants';

export default function infoDialog(state = {}, { type, payload }) {
  switch (type) {
    case SHOW_INFO:
      return {
        show: true,
        data: payload,
      };
    case CLOSE_INFO:
      return {
        show: false,
      };
    default:
      return state;
  }
}
