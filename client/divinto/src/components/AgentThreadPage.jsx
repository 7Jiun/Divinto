import React, { useState, useEffect } from 'react';
import * as IoIcons from 'react-icons/io';
import { Link, useParams } from 'react-router-dom';
import { URL } from '../App';
import './WhiteboardPage.css';

const token = localStorage.getItem('jwtToken');

export async function getThreadsByAgent(agentId) {
  const token = localStorage.getItem('jwtToken');
  const response = await fetch(`${URL}/api/agent/${agentId}/thread`, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const agent = await response.json();
  console.log(agent);
  return agent.data[0].threads;
}

export const AgentThreadPage = () => {
  const [threads, setThreads] = useState([]);
  const { agentId } = useParams();

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const userThreads = await getThreadsByAgent(agentId);
        console.log(userThreads);
        const modifiedAgentThreads = userThreads.map((userThread) => ({
          title: userThread.title,
          path: `/agent/${agentId}/thread/${userThread._id}`,
          icon: <IoIcons.IoIosChatboxes />,
          cName: 'whiteboard-text',
        }));
        setThreads([...threads, ...modifiedAgentThreads]);
      } catch (error) {
        console.error('Failed to fetch threads:', error);
      }
    };

    fetchThreads();
  }, []);

  return (
    <>
      <div className="whiteboard-page-container">
        <ul className="whiteboard-ul">
          {threads.map((item, index) => {
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
