import React, { useEffect, useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import LoadingAnimation from './LoadingAnimation';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { SidebarData } from './SidebarData';
import { IconContext } from 'react-icons';
import { URL } from '../App';
import './Sidebar.css';

const token = localStorage.getItem('jwtToken');

export async function getWhiteboardsByUser() {
  const token = localStorage.getItem('jwtToken');
  const response = await fetch(`${URL}/api/user/whiteboards`, {
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
  const result = await fetch(`${URL}/api/whiteboard`, {
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
  const [sidebarData, setSidebarData] = useState(
    SidebarData.map((item) => ({
      ...item,
      show: true,
    })),
  );
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [isWhiteboardCreating, setIsWhiteboardCreating] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isWhiteboardPage = location.pathname.match(/\/whiteboard\/\w+/);

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
      setIsWhiteboardCreating(false);
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
      if (isWhiteboardPage) {
        const whiteboardId = location.pathname.split('/')[2];
        const maxInputLength = 20;

        const isCardAmountsEnough = await fetch(`${URL}/api/whiteboard/${whiteboardId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((whiteboard) => {
            const cards = whiteboard.data[0].cards;
            if (cards.length < 3) {
              alert('一張必須要有至少三張卡片才可以使用此功能！');
              return false;
            } else {
              return true;
            }
          })
          .catch((err) => {
            console.error(err);
            return false;
          });

        if (!isCardAmountsEnough) return;

        const agentName = prompt('請幫夥伴取個名字吧 :');
        const threadTitle = prompt('你這次談話的主題 :');

        if (!agentName || !threadTitle) {
          alert('請輸入一些字喔！');
          return;
        }

        if (agentName.length > maxInputLength || threadTitle.length > maxInputLength) {
          alert('請輸入 20 個字元以內');
          return;
        }

        setIsAgentLoading(true);

        const agentResponse = await fetch(`${URL}/api/agent/${whiteboardId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agentName: agentName,
          }),
        });

        const agentData = await agentResponse.json();
        const agentId = agentData.data;

        const threadResponse = await fetch(`${URL}/api/agent/thread/${agentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            threadTitle: threadTitle,
          }),
        });
        const threadData = await threadResponse.json();
        const threadId = threadData._id;

        navigate(`/agent/${agentId}/thread/${threadId}`);
        setIsAgentLoading(false);
      }
    } catch (error) {
      console.error('Error occurred:', error);
      alert('創建失敗，請稍後再試！');
    }
  };

  const handleReflectionClick = () => {
    navigate(`${location.pathname}/reflection`);
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('jwtToken');
    navigate('/');
    window.location.reload();
  };

  return (
    <>
      {isAgentLoading && (
        <div className="overlay">
          <LoadingAnimation />
        </div>
      )}

      {isWhiteboardCreating && (
        <div className="overlay">
          <LoadingAnimation />
        </div>
      )}

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
              <button onClick={handleAddPageClick}>
                <IoIcons.IoIosAddCircle /> 新增白板
              </button>
            </li>
            {isWhiteboardPage && (
              <>
                <li>
                  <button id="sidebar-search-step" onClick={handleReflectionClick}>
                    <IoIcons.IoIosSwitch />
                    反思、整理卡片
                  </button>
                </li>
                <li>
                  <button id="sidebar-chat-step" onClick={handleAgentClick}>
                    <IoIcons.IoLogoIonitron />
                    和小夥伴聊聊
                  </button>
                </li>
              </>
            )}
            <li>
              <button onClick={handleLogoutClick}>
                <IoIcons.IoIosLogOut />
                登出
              </button>
            </li>
          </ul>
        </nav>
      </IconContext.Provider>
    </>
  );
};
