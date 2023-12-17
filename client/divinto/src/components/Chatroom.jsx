import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import * as IoIcons from 'react-icons/io';
import { useParams, useNavigate } from 'react-router-dom';
import { URL } from '../App';
import { driver } from 'driver.js';
import './Chatroom.css';

const token = localStorage.getItem('jwtToken');

const sendMessageToServer = async (message, agentId, threadId, setMessages) => {
  try {
    const response = await fetch(`${URL}/api/agent/${agentId}/thread/${threadId}/message`, {
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
    if (data && data[0].text.value) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: data[0].text.value, speaker: 'agent', timestamp: new Date() },
      ]);
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

const fetchThreadMessages = async (
  threadId,
  setMessages,
  setApprovementPoints,
  setDisapprovementPoints,
) => {
  try {
    const response = await fetch(`${URL}/api/agent/thread/${threadId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    setMessages(data.messages);
    setApprovementPoints(data.approvements || []);
    setDisapprovementPoints(data.disapprovements || []);
  } catch (error) {
    console.error('Failed to fetch thread messages:', error);
  }
};

const postApproveMessage = async (threadId, approvementPoint) => {
  try {
    const put = await fetch(`${URL}/api/agent/thread/${threadId}/approvement`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        approvementContent: approvementPoint,
      }),
    });
    const data = await put.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

const postDisapproveMessage = async (threadId, disapprovementPoint) => {
  try {
    const put = await fetch(`${URL}/api/agent/thread/${threadId}/disapprovement`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        disapprovementContent: disapprovementPoint,
      }),
    });
    const data = await put.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

const fetchExportCardApi = async (threadId) => {
  try {
    const aiCard = await fetch(`${URL}/api/agent/thread/${threadId}/export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await aiCard.json();
    return result;
  } catch (error) {
    console.error('export card error', error);
    return false;
  }
};

export const Chatroom = () => {
  const { agentId, threadId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [approvementPoints, setApprovementPoints] = useState([]);
  const [newApprovementPoints, setNewApprovementPoints] = useState('');
  const [disapprovementPoints, setDisapprovementPoints] = useState([]);
  const [newDisapprovementPoints, setNewDisapprovementPoints] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedChatroomPage');
    if (hasVisited) return;
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#first-step',
          popover: {
            title: '常用對話',
            description: '可以點擊按鈕，請助理協助整理白板的內容，或是給予建議',
          },
        },
        {
          element: '#second-step',
          popover: {
            title: '對話輸入框',
            description: '可由此處自行輸入對話，點擊右方箭頭以發送訊息',
          },
        },
        {
          element: '#third-step',
          popover: {
            title: '對話梳理區',
            description:
              '可以將過程中的對話複製貼上，或是輸入梳理出來的想法，分別整理到認同或是不認同的區塊',
          },
        },
        {
          element: '#fourth-step',
          popover: {
            title: '匯出梳理內容',
            description: '點擊按鈕，將筆記區中整理的內容作為卡片匯出、並跳轉至回原白板。',
          },
        },
      ],
    });
    driverObj.drive();
    localStorage.setItem('hasVisitedChatroomPage', 'true');
  }, []);

  const defaultOptions = [
    '請協助整理我的觀點？',
    '請協助釐清我的感受？',
    '請針對我的狀況給出具體行動建議？',
    '請問我該如何持續地深入這個主題？',
  ];

  // 處理預設選項的點擊事件
  const handleDefaultOptionClick = async (option) => {
    setMessages([{ text: option, speaker: 'user', timestamp: new Date() }]);
    setIsMessageSending(true);
    await sendMessageToServer(option, agentId, threadId, setMessages);
    setIsMessageSending(false);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() !== '' && !isMessageSending) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: newMessage, speaker: 'user', timestamp: new Date() },
      ]);
      setIsMessageSending(true);
      setNewMessage('');
      await sendMessageToServer(newMessage, agentId, threadId, setMessages);
      setIsMessageSending(false);
    }
  };

  const HandleSendApprovementPoint = async () => {
    if (newApprovementPoints.trim() !== '') {
      try {
        await postApproveMessage(threadId, newApprovementPoints);
        setApprovementPoints((prev) => [...prev, newApprovementPoints]);
        setNewApprovementPoints('');
      } catch (error) {
        console.error('發送失敗:', error);
      }
    }
  };

  const HandleSendDisapprovementPoint = async () => {
    if (newDisapprovementPoints.trim() !== '') {
      await postDisapproveMessage(threadId, newDisapprovementPoints);
      setDisapprovementPoints((prev) => [...prev, newDisapprovementPoints]);
      setNewDisapprovementPoints('');
    }
  };

  const adjustTextareaHeight = (event) => {
    const textarea = event.target;
    textarea.style.height = 'auto';
    const maxHeight = window.innerHeight * 0.1;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  const exportThreadAsCard = async () => {
    const result = await fetchExportCardApi(threadId);
    if (result) {
      const whiteboardId = result.whiteboardId;
      navigate(`../../../../whiteboard/${whiteboardId}`);
    }
    return result;
  };

  useEffect(() => {
    fetchThreadMessages(threadId, setMessages, setApprovementPoints, setDisapprovementPoints);
  }, []);

  return (
    <div className="chat-container">
      <div className="chat-room">
        <div className="messages-list">
          {messages.length === 0 ? (
            <div id="first-step" className="default-options">
              {defaultOptions.map((option, index) => (
                <div
                  key={index}
                  className="default-option"
                  onClick={() => handleDefaultOptionClick(option)}
                >
                  {option}
                </div>
              ))}
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.speaker}-message`}>
                <div className="avatar">
                  {message.speaker === 'user' ? <IoIcons.IoMdPerson /> : <IoIcons.IoLogoIonitron />}
                </div>
                <div className="text-container">
                  <Markdown>{message.text}</Markdown>
                </div>
              </div>
            ))
          )}
        </div>
        {isMessageSending ? (
          <div className="loading-container">
            <div className="loading-indicator"></div>
            <div className="loading-word">訊息全力加載中...</div>
          </div>
        ) : (
          <div></div>
        )}
        <div id="second-step" className="message-input">
          <textarea
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="輸入以開啟對話..."
            onInput={adjustTextareaHeight}
            disabled={isMessageSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={isMessageSending}
            className={isMessageSending ? 'no-hover' : ''}
          >
            {isMessageSending ? (
              <div className="unable-message-button">
                <IoIcons.IoMdSquare />
              </div>
            ) : (
              <div className="enable-message-button">
                <IoIcons.IoMdArrowRoundUp />
              </div>
            )}
          </button>
        </div>
      </div>
      <div className="sidebar-container">
        <button id="fourth-step" className="export-ai-card-button" onClick={exportThreadAsCard}>
          <IoIcons.IoMdSync />
          <p>匯出梳理筆記到白板</p>
        </button>
        <div id="third-step">
          <div className="approvement-points">
            <h3>認同的觀點</h3>
            <div className="recorded-points">
              <ul>
                {approvementPoints.map((point, index) => (
                  <li key={index}>
                    <Markdown>{`${point}\n\n`}</Markdown>
                  </li>
                ))}
              </ul>
            </div>
            <div className="message-input">
              <textarea
                type="text"
                value={newApprovementPoints}
                onChange={(e) => setNewApprovementPoints(e.target.value)}
                placeholder="輸入任何你的想法..."
                onInput={adjustTextareaHeight}
              />
              <button onClick={HandleSendApprovementPoint}>
                <IoIcons.IoMdArrowRoundUp />
              </button>
            </div>
          </div>
          <div className="disapprovement-points">
            <h3>不認同的觀點</h3>
            <div className="recorded-points">
              <ul>
                {disapprovementPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="message-input">
              <textarea
                type="text"
                value={newDisapprovementPoints}
                onChange={(e) => setNewDisapprovementPoints(e.target.value)}
                placeholder="輸入任何你的想法..."
                onInput={adjustTextareaHeight}
              />
              <button onClick={HandleSendDisapprovementPoint}>
                <IoIcons.IoMdArrowRoundUp />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
