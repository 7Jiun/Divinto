import React, { useState, useEffect } from 'react';
import { getWhiteboardsByUser, createWhiteboardInDb, Sidebar } from './sidebar';
import * as IoIcons from 'react-icons/io';
import { Link } from 'react-router-dom';
import './WhiteboardPage.css';

export const WhiteboardPage = () => {
  const [whiteboardItems, setWhiteboardItems] = useState([]);

  useEffect(() => {
    const fetchWhiteboards = async () => {
      try {
        const whiteboards = await getWhiteboardsByUser();
        console.log(whiteboards);
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
    const pageTitle = prompt('Enter the title for the new page:');
    if (pageTitle) {
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
    }
  };

  return (
    <>
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
          Add New Whiteboard
        </button>
      </div>
    </>
  );
};
