import React, { useState, useEffect } from 'react';
import './Chatroom.css';
import Markdown from 'react-markdown';
import * as IoIcons from 'react-icons/io';
import { useParams } from 'react-router-dom';
import { URL } from '../App';

const token = localStorage.getItem('jwtToken');

const sendMessageToServer = async (message, agentId, threadId, setMessages) => {
  try {
    const response = await fetch(`${URL}/agent/${agentId}/thread/${threadId}/message`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: {
          speaker: 'user',
          text: message,
        },
      }),
    });
    const data = await response.json();
    // 假設伺服器響應包含來自 OpenAI 的消息
    console.log(data);
    if (data && data[0].text.value) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: message, from: 'user', timestamp: new Date() }, // 用戶發送的消息
        { text: data[0].text.value, from: 'agent', timestamp: new Date() }, // 伺服器響應的消息
      ]);
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

const fetchThreadMessages = async (threadId, setMessages) => {
  try {
    const response = await fetch(`${URL}/agent/thread/${threadId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log(data);
    setMessages(data.messages); // 假設響應體中有 messages 陣列
  } catch (error) {
    console.error('Failed to fetch thread messages:', error);
  }
};

export const Chatroom = () => {
  const { agentId, threadId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [agreedPoints, setAgreedPoints] = useState([]);
  const [disagreedPoints, setDisagreedPoints] = useState([]);

  const handleSendMessage = async () => {
    if (newMessage.trim() !== '') {
      await sendMessageToServer(newMessage, agentId, threadId, setMessages);
      setNewMessage(''); // 清空輸入框
    }
  };

  const addAgreedPoint = (point) => {
    setAgreedPoints((prev) => [...prev, point]);
  };

  const addDisagreedPoint = (point) => {
    setDisagreedPoints((prev) => [...prev, point]);
  };

  const adjustTextareaHeight = (event) => {
    const textarea = event.target;
    textarea.style.height = 'auto';
    const maxHeight = window.innerHeight * 0.1;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  useEffect(() => {
    fetchThreadMessages(threadId, setMessages);
  }, []);

  return (
    <div className="chat-container">
      <div className="chat-room">
        <div className="messages-list">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.speaker}-message`}>
              <div className="avatar">
                {message.speaker === 'user' ? <IoIcons.IoMdPerson /> : <IoIcons.IoLogoIonitron />}
              </div>
              <div className="text-container">
                <Markdown>{message.text}</Markdown>
              </div>
            </div>
          ))}
        </div>
        <div className="message-input">
          <textarea
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onInput={adjustTextareaHeight}
          />
          <button onClick={handleSendMessage}>
            <IoIcons.IoMdArrowRoundUp />
          </button>
        </div>
      </div>
      <div className="sidebar-container">
        <button className="export-ai-card-button">
          <IoIcons.IoMdSync />
          <p>export as a card</p>
        </button>
        <div className="agreed-points">
          <h3>認同的觀點</h3>
          <div className="recorded-points">
            <ul>
              {agreedPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="message-input">
            <textarea
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button>
              <IoIcons.IoMdArrowRoundUp />
            </button>
          </div>
        </div>
        <div className="disagreed-points">
          <h3>不認同的觀點</h3>
          <div className="recorded-points">
            <ul>
              {disagreedPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="message-input">
            <textarea
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button>
              <IoIcons.IoMdArrowRoundUp />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
