import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { URL } from '../App';
export const Register = (props) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await fetch(`${URL}/user/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'native', name, email, password: pass }),
      });
      const data = await response.json();
      if (data.data.access_token) {
        localStorage.setItem('jwtToken', data.data.access_token);
        navigate('/whiteboard');
      } else {
        alert('invalid email or password!');
      }
      window.location.reload();
    } catch (error) {
      console.error('登入錯誤', error);
      alert('wrong account or password!');
    }
  };

  return (
    <div className="auth-form-container">
      <form>
        <label htmlFor="name">name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="name"
          placeholder="Please enter your name..."
          id="name"
          name="name"
        ></input>
        <label htmlFor="email">email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Please enter your email..."
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
        <button onClick={handleSubmit}>Register</button>
      </form>
      <button onClick={() => props.onFormSwitch('Login')}>
        Already have an account? Login here
      </button>
    </div>
  );
};
