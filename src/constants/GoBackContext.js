import { View, Text } from 'react-native'
import React, { createContext, useState } from 'react'
export const RegisterBackContext = createContext();
export default function GoBackContext({children}) {
    const [RegisterBack,setRegisterBack] = useState(true);
    const [UpdateModal,setUpdateModal] = useState(false);
    const [GOOGLE_API_KEY,setGOOGLE_API_KEY] = useState('');
    const [Toast,setToast] = useState({
    visible: false,
    text: "",
    type: "success",
    top: 45,
  });
  return (
    <RegisterBackContext.Provider value={{RegisterBack,setRegisterBack,
      GOOGLE_API_KEY,setGOOGLE_API_KEY,
      Toast,setToast,
      UpdateModal,setUpdateModal
    }}>
        {children}
    </RegisterBackContext.Provider>
  )
}