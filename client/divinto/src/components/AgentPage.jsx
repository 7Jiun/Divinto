import React, { useState, useEffect } from 'react';
import * as IoIcons from 'react-icons/io';
import { Link } from 'react-router-dom';
import { URL } from '../App';
import './WhiteboardPage.css';

const token = localStorage.getItem('jwtToken');

export async function getAgentsByUser() {
  const token = localStorage.getItem('jwtToken');
  const response = await fetch(`${URL}/api/user/agents`, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const user = await response.json();
  return user.data[0].agents;
}

export const AgentPage = () => {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const userAgents = await getAgentsByUser();
        const modifiedUserAgents = userAgents.map((userAgent) => ({
          title: userAgent.name,
          path: `/agent/${userAgent._id}`,
          icon: <IoIcons.IoLogoIonitron color="#003D79" size={'24px'} />,
          cName: 'whiteboard-text',
        }));
        setAgents([...agents, ...modifiedUserAgents]);
      } catch (error) {
        console.error('Failed to fetch whiteboards:', error);
      }
    };

    fetchAgents();
  }, []);

  return (
    <>
      <div className="whiteboard-page-container">
        <div>
          {agents.length === 0 ? (
            <div className="hint-container">
              <h3 className="agent-hint">
                目前還没有任何對話紀錄喔，請到白板頁記錄至少三張卡片後才可以創建助理並開啟對話
              </h3>
            </div>
          ) : (
            <ul className="whiteboard-ul">
              {agents.map((item, index) => (
                <li key={index} className={item.cName}>
                  <Link to={item.path}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};
