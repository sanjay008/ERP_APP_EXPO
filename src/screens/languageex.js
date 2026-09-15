// import { loadLanguages } from 'i18next';
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';


// Import your language file

const languageex = () => {
  const [language, setLanguage] = useState('en'); // Default language is English

  const handleLanguageChange = () => {
    const newLanguage = language === 'en' ? 'fr' : 'en';
    setLanguage(newLanguage);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{loadLanguages[language].greeting}</Text>
      <Button title="Change Language" onPress={handleLanguageChange} />
    </View>
  );
};

export default languageex;