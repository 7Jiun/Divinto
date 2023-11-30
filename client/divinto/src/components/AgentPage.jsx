import React, { useState, useEffect } from 'react';
import * as IoIcons from 'react-icons/io';
import { Link } from 'react-router-dom';
import { URL } from '../App';
import './WhiteboardPage.css';

const token = localStorage.getItem('jwtToken');

export async function getAgentsByUser() {
  const token = localStorage.getItem('jwtToken');
  const response = await fetch(`${URL}/user/agents`, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const user = await response.json();
  console.log(user);
  return user.data[0].agents;
}

export const AgentPage = () => {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const userAgents = await getAgentsByUser();
        console.log(userAgents);
        const modifiedUserAgents = userAgents.map((userAgent) => ({
          title: userAgent.id,
          path: `/agent/${userAgent._id}`,
          icon: <IoIcons.IoIosAirplane />,
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
        <ul className="whiteboard-ul">
          {agents.map((item, index) => {
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
      </div>
    </>
  );
};
