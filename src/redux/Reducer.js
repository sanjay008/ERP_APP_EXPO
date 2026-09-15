import { SELECTION_REGISTER } from "./Type";

const initialState = {
  isRegistered: false,
};

const reducer = (state = initialState, action) => {
  console.log("reducer call", action);
  switch (action.type) {
    case SELECTION_REGISTER:
      return {
        ...state,
        isRegistered: action.payload,
      };
    default:
      return state;
  }
};
export default reducer;
// const initialState = {
//   isRegistered: false,  // default state
// };

// const reducer = (state = initialState, action) => {
//   switch (action.type) {
//     case SELECTION_REGISTER:
//       return {
//         ...state,
//         isRegistered: action.payload,
//       };

//     case 'persist/REHYDRATE':
//       // Optionally modify the rehydrated state
//       return {
//         ...state,
//         ...action.payload.Reducer,  // Merging the rehydrated state
//       };

//     default:
//       return state;
//   }
// };


