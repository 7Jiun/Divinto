import React, { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import './Login.css';

export function LoginPage() {
  const [currentForm, setCurrentForm] = useState('Login');

  const toggleForm = (formName) => {
    setCurrentForm(formName);
  };

  return (
    <div className="login-page-container">
      {currentForm === 'Login' ? (
        <Login onFormSwitch={toggleForm} />
      ) : (
        <Register onFormSwitch={toggleForm} />
      )}
    </div>
  );
}
