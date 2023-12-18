import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../assets/LoadingAnimation.json';

const LoadingAnimation = () => {
  const options = {
    animationData: animationData,
    loop: true,
    autoplay: true,
  };

  return <Lottie {...options} />;
};

export default LoadingAnimation;
