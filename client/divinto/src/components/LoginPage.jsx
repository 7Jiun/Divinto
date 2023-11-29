import React, { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';

export function LoginPage() {
  const [currentForm, setCurrentForm] = useState('Login');

  const toggleForm = (formName) => {
    setCurrentForm(formName);
  };

  return (
    <div>
      {currentForm === 'Login' ? (
        <Login onFormSwitch={toggleForm} />
      ) : (
        <Register onFormSwitch={toggleForm} />
      )}
    </div>
  );
}
