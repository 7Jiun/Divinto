import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import './Reflection.css';
import './ReflectionMDEditor.css';
import { driver } from 'driver.js';
import { URL } from '../App';
import { mergeCardContents } from '../initial-elements';
import SimpleMDE from 'react-simplemde-editor';
import Markdown from 'react-markdown';

const token = localStorage.getItem('jwtToken');

const fetchSearchApi = async (whiteboardId, keyword) => {
  try {
    const search = await fetch(`${URL}/api/whiteboard/${whiteboardId}/search?tag=${keyword}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const cards = await search.json();
    return cards.data;
  } catch (error) {
    console.error(error);
  }
};

const fetchFullTextSearchApi = async (whiteboardId, keyword) => {
  try {
    const search = await fetch(
      `${URL}/api/whiteboard/${whiteboardId}/fullTextSearch?keyword=${keyword}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const cards = await search.json();
    return cards.data;
  } catch (error) {
    console.error(error);
  }
};

export function SearchRenderComponent() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#first-step',
          popover: {
            title: '搜尋卡片欄',
            description: '輸入關鍵字以找尋相關的卡片',
          },
        },
        {
          element: '#second-step',
          popover: {
            title: '編輯卡片',
            description: '若針對卡片內容有反思，可在此處紀錄相關的想法',
          },
        },
        {
          element: '#third-step',
          popover: {
            title: '匯出反思內容',
            description: `點擊按鈕，將反思的內容作為卡片匯出、並跳轉至回原白板。`,
          },
        },
      ],
    });
    driverObj.drive();
  }, []);
  useEffect(() => {
    async function fetchData() {
      try {
        setCards([]);
        const searchCards = await fetchFullTextSearchApi(id, searchTerm);
        setCards(searchCards);
      } catch (error) {
        console.error(error);
      }
    }
    if (searchTerm) {
      fetchData();
    }
  }, [searchTerm]);

  return (
    <div className="search-render">
      <input
        id="first-step"
        type="text"
        placeholder="搜尋你的卡片"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul>
        {cards &&
          cards.map((card) => (
            <li
              key={card._id}
              onDoubleClick={() =>
                navigate(`/whiteboard/${id}?x=${card.position.x}&y=${card.position.y}`)
              }
            >
              <Markdown>{mergeCardContents(card)}</Markdown>
            </li>
          ))}
      </ul>
    </div>
  );
}

export function Reflection() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathPart = location.pathname.split('/');
  const id = pathPart[2];
  const [editorContent, setEditorContent] = useState('');

  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  const handleSubmit = async () => {
    const requestBody = {
      title: '',
      whiteboardId: id,
      position: {
        x: 100,
        y: 100,
      },
      content: editorContent,
    };
    try {
      const card = await fetch(`${URL}/api/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      const cardJson = await card.json();
      navigate(`/whiteboard/${id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="reflection-container">
        <SearchRenderComponent />
        <div id="second-step" className="MDeditor">
          <SimpleMDE onChange={handleEditorChange} value={editorContent} />
          <button id="third-step" className="reflection-card-button" onClick={handleSubmit}>
            輸出內容到白板
          </button>
        </div>
      </div>
    </>
  );
}
