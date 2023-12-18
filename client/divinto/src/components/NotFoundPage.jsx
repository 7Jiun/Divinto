import React from 'react';
import './NotFoundPage.css'; // 確保引入CSS檔案

export const NotFoundPage = () => {
  return (
    <div className="not-found-body">
      <div className="not-found-container">
        <h2>喔喔 . . . 您要尋找的頁面不存在。</h2>
        <img src="../../public/404.png" alt="Lost Dodoro" class="fixed-size-image" />
        <div></div>
        <a href="/">回首頁</a>
      </div>
    </div>
  );
};
