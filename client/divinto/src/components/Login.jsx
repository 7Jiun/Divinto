import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { URL } from '../App';
export const Login = (props) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await fetch(`${URL}/api/user/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: pass }),
      });
      const data = await response.json();
      if (data.data.access_token) {
        localStorage.setItem('jwtToken', data.data.access_token);
        navigate('/whiteboard');
      } else {
        alert('wrong email or password');
      }
      window.location.reload();
    } catch (error) {
      console.error('登入錯誤', error);
    }
  };

  return (
    <div className="auth-form-container">
      <form>
        <label htmlFor="email">電子信箱</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="請輸入電子信箱"
          id="email"
          name="email"
          required
        ></input>
        <label htmlFor="password">密碼</label>
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type="password"
          placeholder="********"
          id="password"
          name="password"
          required
        ></input>
        <button onClick={handleSubmit}>登入</button>
      </form>
      <button className="secondary-button" onClick={() => props.onFormSwitch('Register')}>
        還沒有註冊過帳號？點選此處註冊
      </button>
    </div>
  );
};
