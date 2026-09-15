import { SELECTION_REGISTER } from "./Type";

export function selectregister(item) {
  console.log("action call", item);
  return {
    type: SELECTION_REGISTER,
    payload: item,
  };
}
