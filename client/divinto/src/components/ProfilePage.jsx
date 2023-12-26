import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getWhiteboardsByUser } from './Sidebar';
import { deleteWhiteboardOnServer } from './WhiteboardPage';
import * as IoIcons from 'react-icons/io';
import './ProfilePage.css';
import { URL } from '../App';

const token = localStorage.getItem('jwtToken');

export const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState({ name: 'divinto user' });
  const [isWhiteboardCreating, setIsWhiteboardCreating] = useState(false);
  const [whiteboardItems, setWhiteboardItems] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('jwtToken');

      const response = await fetch(`${URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await response.json();
      setUserProfile(userData.data); // 將數據存儲到狀態中
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchWhiteboards = async () => {
      try {
        const whiteboards = await getWhiteboardsByUser();
        const userWhiteboardItems = whiteboards.map((whiteboard) => ({
          title: whiteboard.title,
          path: `/whiteboard/${whiteboard._id}`,
          icon: <IoIcons.IoIosPaper />,
          cName: 'whiteboard-text',
        }));
        setWhiteboardItems([...whiteboardItems, ...userWhiteboardItems]);
      } catch (error) {
        console.error('Failed to fetch whiteboards:', error);
      }
    };

    fetchWhiteboards();
  }, []);

  const handleDeleteWhiteboardClick = (whiteboardId) => async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const userConfirmation = prompt(
      '此操作不可回復，請輸入[刪除]以刪除白板，若不要刪除，請輸入確認以外的內容',
    );
    if (userConfirmation === '刪除') {
      try {
        deleteWhiteboardOnServer(whiteboardId);
        alert('刪除成功！');
        const whiteboards = await getWhiteboardsByUser();
        const userWhiteboardItems = whiteboards.map((whiteboard) => ({
          title: whiteboard.title,
          path: `/whiteboard/${whiteboard._id}`,
          icon: <IoIcons.IoIosPaper />,
          cName: 'whiteboard-text',
        }));
        setWhiteboardItems(userWhiteboardItems);
      } catch (error) {
        console.error(error);
      }
    } else {
      alert('刪除失敗');
    }
  };

  function deleteWhiteboardOnServer(whiteboardId) {
    fetch(`${URL}/api/whiteboard/${whiteboardId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {})
      .catch((error) => {
        console.error('Error delete whiteboard', error);
      });
  }

  return (
    <>
      <div className="profile-container">
        <div className="avatar">
          <img src="logo2.png" alt="Profile Avatar" />
        </div>
        <h1 className="name">{userProfile.name}</h1>
        <div className="whiteboard-container">
          <h3>Whiteboards</h3>
          <hr />
        </div>
        <div className="whiteboard-pages-container">
          <ul className="whiteboard-ul">
            {whiteboardItems.map((item, index) => {
              return (
                <li key={index} className={item.cName}>
                  <Link to={item.path}>
                    {item.icon}
                    <span>{item.title}</span>
                    <button
                      className="whiteboard-text-button"
                      onClick={handleDeleteWhiteboardClick(item.path.split('/')[2])}
                    >
                      <IoIcons.IoIosClose />
                    </button>
                  </Link>
                </li>
              );
            })}
          </ul>
          {/* <button id="first-step" className="add-whiteboard-button" onClick={handleAddPageClick}>
              <IoIcons.IoIosAddCircleOutline size="2rem" />
              點擊新增白板
            </button> */}
        </div>
      </div>
    </>
  );
};
