import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { URL } from '../App';
import LoadingAnimation from './LoadingAnimation';
export const Register = (props) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegisterting] = useState(false);
  const navigate = useNavigate();
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return re.test(email);
  };
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!validateEmail(email)) {
        alert('請輸入有效的電子郵件地址。');
        return;
      }
      setIsRegisterting(true);
      const response = await fetch(`${URL}/api/user/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'native', name, email, password: pass }),
      });
      const data = await response.json();
      if (data.data.access_token) {
        localStorage.setItem('jwtToken', data.data.access_token);
        setIsRegisterting(false);
        navigate('/whiteboard');
      } else {
        alert('invalid email or password!');
        setIsRegisterting(false);
      }
      window.location.reload();
    } catch (error) {
      console.error('登入錯誤', error);
      setIsRegisterting(false);
      alert('wrong account or password!');
    }
  };

  return (
    <>
      {isRegistering && (
        <div className="overlay">
          <LoadingAnimation />
        </div>
      )}
      <div className="auth-form-container">
        <form>
          <label htmlFor="name">暱稱</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="name"
            placeholder="請輸入暱稱"
            id="name"
            name="name"
            maxLength={50}
          ></input>
          <label htmlFor="email">電子信箱</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="請輸入電子信箱"
            id="email"
            name="email"
            maxLength={50}
          ></input>
          <label htmlFor="password">密碼</label>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
            placeholder="********"
            id="password"
            name="password"
            maxLength={20}
          ></input>
          <button onClick={handleSubmit}>註冊</button>
        </form>
        <button onClick={() => props.onFormSwitch('Login')}>
          已經有帳號了嗎？點擊此處直接登入
        </button>
      </div>
    </>
  );
};
