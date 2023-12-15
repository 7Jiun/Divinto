import React, { useState, useEffect } from 'react';
import { getWhiteboardsByUser, createWhiteboardInDb } from './Sidebar';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import * as IoIcons from 'react-icons/io';
import LoadingAnimation from './LoadingAnimation';
import './WhiteboardPage.css';

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
                </Link>
              </li>
            );
          })}
        </ul>
        <button className="add-whiteboard-button" onClick={handleAddPageClick}>
          <IoIcons.IoIosAddCircleOutline size="2rem" />
          點擊新增白板
        </button>
      </div>
    </>
  );
};
