import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export const LandingPage = () => {
  const navigate = useNavigate();
  const onClick = () => {
    navigate('/login');
  };
  return (
    <div className="landing-page-container">
      <img src="logo2.png" alt="Logo" className="landing-page-logo" />

      <h1 className="landing-page-text">Divinto Yourself</h1>
      <p className="landing-page-text">透過日常卡片記錄、反思</p>
      <button className="landing-page-button" onClick={onClick}>
        點擊開始使用
      </button>
    </div>
  );
};
