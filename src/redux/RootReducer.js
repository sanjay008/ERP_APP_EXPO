// import { combineReducers } from "redux";
// import Reducer from "./Reducer";

// export default combineReducers({
//   Reducer,
// });


import { combineReducers } from 'redux';
import reducer from './Reducer';

const RootReducer = combineReducers({
  // reducer,
  Reducer: reducer,

});

export default RootReducer;