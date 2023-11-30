import React, { useState } from 'react';
import './Login.css';
const url = 'http://localhost:3000';

export const Login = (props) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = async (e) => {
    try {
      const response = await fetch(`${url}/user/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await response.json();
      localStorage.setItem('jwtToken', data.data.access_token);
    } catch (error) {
      console.error('登入錯誤', error);
    }
  };

  return (
    <div className="auth-form-container">
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="please enter your email"
          id="email"
          name="email"
        ></input>
        <label htmlFor="password">password</label>
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type="password"
          placeholder="********"
          id="password"
          name="password"
        ></input>
        <button>Log In</button>
      </form>
      <button className="secondary-button" onClick={() => props.onFormSwitch('Register')}>
        Don't have an account? Register here
      </button>
    </div>
  );
};
