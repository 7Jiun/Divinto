import React, { useEffect, useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import { useNavigate, useParams } from 'react-router-dom';

import { Link } from 'react-router-dom';
import { SidebarData } from './SidebarData';
import './Sidebar.css';
import { IconContext } from 'react-icons';
import { URL } from '../App';

const token = localStorage.getItem('jwtToken');

export async function getWhiteboardsByUser() {
  const token = localStorage.getItem('jwtToken');
  const response = await fetch(`${URL}/user/whiteboards`, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const user = await response.json();
  return user.data[0].whiteboards;
}

export async function createWhiteboardInDb(title) {
  const result = await fetch(`${URL}/whiteboard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: title,
    }),
  });
  const resultJson = result.json();
  return resultJson;
}

export const Sidebar = () => {
  const [sidebar, setSidebar] = useState(false);
  const [sidebarData, setSidebarData] = useState(SidebarData);
  const navigate = useNavigate();
  const { id } = useParams();

  const handleAddPageClick = async () => {
    const pageTitle = prompt('Enter the title for the new page:');
    if (pageTitle) {
      try {
        const newWhiteboard = await createWhiteboardInDb(pageTitle);
        const newPage = {
          title: pageTitle,
          path: `/whiteboard/${newWhiteboard.whiteboard._id}`,
          icon: <IoIcons.IoIosPaper />,
          cName: 'nav-text',
        };
        setSidebarData((SidebarData) => [...SidebarData, newPage]);
        navigate(newPage.path);
      } catch (error) {
        console.error(error);
      }
    }
  };
  const showSidebar = () => setSidebar(!sidebar);

  useEffect(() => {
    const fetchWhiteboards = async () => {
      try {
        const whiteboards = await getWhiteboardsByUser();
        const whiteboardItems = whiteboards.map((whiteboard) => ({
          title: whiteboard.title,
          path: `/whiteboard/${whiteboard._id}`,
          icon: <IoIcons.IoIosPaper />,
          cName: 'nav-text',
        }));
        setSidebarData([...SidebarData, ...whiteboardItems]);
      } catch (error) {
        console.error('Failed to fetch whiteboards:', error);
      }
    };

    fetchWhiteboards();
  }, []);

  const handleAgentClick = async () => {
    try {
      // 第一步: Fetch create agent API
      const demoId = '6565cedf26466d2e3168b39a';
      console.log(demoId);

      const agentResponse = await fetch(`${URL}/agent/${demoId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const agentData = await agentResponse.json();
      console.log(agentData);
      const agentId = agentData.data;
      console.log(agentId);
      // 第二步: Fetch create thread API
      const threadResponse = await fetch(`${URL}/agent/thread/${agentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadTitle: '做專案的目標釐清',
        }),
      });
      const threadData = await threadResponse.json();
      console.log(threadData);
      const threadId = threadData._id;

      // 第三步: 導航到新 URL
      navigate(`/agent/${agentId}/thread/${threadId}`);
    } catch (error) {
      console.error('Error occurred:', error);
    }
  };

  return (
    <>
      <IconContext.Provider value={{ color: 'fff' }}>
        <div className="navbar">
          <Link to="#" className="menu-bars">
            <FaIcons.FaBars onClick={showSidebar} />
          </Link>
        </div>
        <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
          <ul className="nav-menu-items" onClick={showSidebar}>
            <li className="navbar-toggle">
              <Link to="#" className="menu-bars">
                <AiIcons.AiOutlineClose />
              </Link>
            </li>
            {sidebarData.map((item, index) => {
              return (
                <li key={index} className={item.cName}>
                  <Link to={item.path}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button onClick={handleAddPageClick}>Add New Whiteboard</button>
            </li>
            <li>
              <button onClick={handleAgentClick}>Create Agent</button>
            </li>
          </ul>
        </nav>
      </IconContext.Provider>
    </>
  );
};
