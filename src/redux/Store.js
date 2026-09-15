import { configureStore } from '@reduxjs/toolkit';
import RootReducer from './RootReducer';

const store = configureStore({
  reducer: RootReducer,
});

export default store;

// store.js

// import { configureStore } from '@reduxjs/toolkit';
// import { persistStore, persistReducer } from 'redux-persist';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import RootReducer from './RootReducer';

// // Configure persist with AsyncStorage for React Native
// const persistConfig = {
//   key: 'root',
//   storage: AsyncStorage, // use AsyncStorage for React Native
// };

// // Persisted Reducer
// const persistedReducer = persistReducer(persistConfig, RootReducer);

// // Create the store with the persisted reducer
// const store = configureStore({
//   reducer: persistedReducer,
// });

// // Persistor setup
// export const persistor = persistStore(store);
// export default store;

{/* <PersistGate loading={null} persistor={persistor}>
<Screens />
</PersistGate> */}
