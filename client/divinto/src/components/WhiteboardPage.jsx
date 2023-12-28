import React, { useState, useEffect } from 'react';
import { driver } from 'driver.js';
import { getWhiteboardsByUser, createWhiteboardInDb } from './Sidebar';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { URL } from '../App';
import * as IoIcons from 'react-icons/io';
import LoadingAnimation from './LoadingAnimation';
import './WhiteboardPage.css';
import 'driver.js/dist/driver.css';

const token = localStorage.getItem('jwtToken');

export function deleteWhiteboardOnServer(whiteboardId) {
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

export const WhiteboardPage = () => {
  const [isWhiteboardCreating, setIsWhiteboardCreating] = useState(false);
  const [whiteboardItems, setWhiteboardItems] = useState([]);
  const navigate = useNavigate();

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

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedWhiteboardPage');
    if (hasVisited) return;
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#first-step',
          popover: {
            title: '新增白板',
            description:
              '點擊開啟一個白板，可以在白板上透過卡片的方式，視覺化整理想法。輸入討論的主題後，即可跳轉至紀錄該主題的頁面',
          },
        },
      ],
    });
    driverObj.drive();
    localStorage.setItem('hasVisitedWhiteboardPage', 'true');
  }, []);

  const handleAddPageClick = async () => {
    const pageTitle = prompt('請輸入白板主題');

    const maxInputLength = 20;

    if (pageTitle.length > maxInputLength) {
      alert('請輸入 20 個字元以內');
      return;
    }

    if (pageTitle) {
      setIsWhiteboardCreating(true);
      try {
        const newWhiteboard = await createWhiteboardInDb(pageTitle);
        const newAddedWhiteboard = {
          title: pageTitle,
          path: `/whiteboard/${newWhiteboard.whiteboard._id}`,
          icon: <IoIcons.IoIosPaper />,
          cName: 'whiteboard-text',
        };
        setWhiteboardItems((whiteboardItems) => [...whiteboardItems, newAddedWhiteboard]);
        navigate(newAddedWhiteboard.path);
      } catch (error) {
        console.error(error);
      }
      setIsWhiteboardCreating(false);
    }
  };

  const handleDeleteWhiteboardClick = (whiteboardId) => async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const userConfirmation = prompt(
      '此操作不可回復，請輸入[刪除]以刪除白板，若不要刪除，請輸入確認以外的內容',
    );
    if (userConfirmation === '刪除') {
      deleteWhiteboardOnServer(whiteboardId);
      alert('刪除成功！');
      try {
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

  return (
    <>
      {isWhiteboardCreating && (
        <div className="overlay">
          <LoadingAnimation />
        </div>
      )}

      <div className="whiteboard-page-container">
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
        <button id="first-step" className="add-whiteboard-button" onClick={handleAddPageClick}>
          <IoIcons.IoIosAddCircleOutline size="2rem" />
          點擊新增白板
        </button>
      </div>
    </>
  );
};
