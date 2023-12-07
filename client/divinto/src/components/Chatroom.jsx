import React, { useState, useEffect } from 'react';
import './Chatroom.css';
import Markdown from 'react-markdown';
import * as IoIcons from 'react-icons/io';
import { useParams, useNavigate } from 'react-router-dom';
import { URL } from '../App';

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
        { text: message, speaker: 'user', timestamp: new Date() },
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

  const handleSendMessage = async () => {
    if (newMessage.trim() !== '' && !isMessageSending) {
      setIsMessageSending(true);
      await sendMessageToServer(newMessage, agentId, threadId, setMessages);
      setNewMessage(''); // 清空輸入框
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
            placeholder="輸入以開啟對話"
            onInput={adjustTextareaHeight}
          />
          <button onClick={handleSendMessage} disabled={isMessageSending}>
            {isMessageSending ? <IoIcons.IoMdSquare /> : <IoIcons.IoMdArrowRoundUp />}
          </button>
        </div>
      </div>
      <div className="sidebar-container">
        <button className="export-ai-card-button" onClick={exportThreadAsCard}>
          <IoIcons.IoMdSync />
          <p>匯出對話紀錄到白板</p>
        </button>
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
              placeholder="輸入任何你的想法"
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
              placeholder="輸入任何你的想法"
              onInput={adjustTextareaHeight}
            />
            <button onClick={HandleSendDisapprovementPoint}>
              <IoIcons.IoMdArrowRoundUp />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
