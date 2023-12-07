import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import SimpleMDE from 'react-simplemde-editor';
import './Reflection.css';
import './ReflectionMDEditor.css';
import { URL } from '../App';
import { mergeCardContents } from '../initial-elements';
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
    console.log(cards.data);
    return cards.data;
  } catch (error) {
    console.error(error);
  }
};

export function SearchRenderComponent() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        type="text"
        placeholder="搜尋你的卡片"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul>
        {cards &&
          cards.map((card) => (
            <li key={card._id}>
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
        <div className="MDeditor">
          <SimpleMDE onChange={handleEditorChange} value={editorContent} />
          <button className="reflection-card-button" onClick={handleSubmit}>
            輸出內容到白板
          </button>
        </div>
      </div>
    </>
  );
}
