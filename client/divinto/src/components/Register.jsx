import React, { useState } from 'react';
const url = 'http://localhost:3000';

export const Register = (props) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const handleSubmit = async (e) => {
    try {
      const response = await fetch(`${url}/user/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'native', name, email, password: pass }),
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
        <label htmlFor="name">name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="name"
          placeholder="please enter your name"
          id="name"
          name="name"
        ></input>
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
        <button>Register</button>
      </form>
      <button onClick={() => props.onFormSwitch('Login')}>
        Already have an account? Login here
      </button>
    </div>
  );
};
