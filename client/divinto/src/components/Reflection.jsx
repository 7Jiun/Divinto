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
    const cardContent = cards.data.map((card) => card.cards);
    return cardContent;
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
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedReflectionPage');
    if (hasVisited) return;
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
          element: '#tag-search-step',
          popover: {
            title: '標籤搜尋',
            description: '亦可整合自定義的卡片標籤進行搜尋',
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
    localStorage.setItem('hasVisitedReflectionPage', 'true');
  }, []);

  useEffect(() => {
    fetch(`${URL}/api/whiteboard/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((whiteboard) => {
        const cards = whiteboard.data.cards;
        let tagsArray = [];
        cards.forEach((card) => {
          card.tags.forEach((tag) => {
            if (tagsArray.includes(tag)) return;
            tagsArray.push(tag);
          });
        });
        tagsArray.push('無');
        setTags(tagsArray);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setCards([]);
        const searchCards = await fetchFullTextSearchApi(id, searchTerm);
        if (!searchCards) return;
        if (selectedTag === '無' || !selectedTag) {
          setCards(searchCards);
          return;
        } else {
          let searchedCardWithTags = [];
          searchCards.forEach((searchCard) => {
            searchCard.tags.forEach((tag) => {
              if (tag === selectedTag) {
                searchedCardWithTags.push(searchCard);
                return;
              }
            });
          });
          setCards(searchedCardWithTags);
        }
      } catch (error) {
        console.error(error);
      }
    }

    async function fetchTagsData() {
      try {
        setCards([]);
        const searchCards = await fetchSearchApi(id, selectedTag);
        setCards(searchCards);
      } catch (error) {
        console.error(error);
      }
    }

    if (searchTerm !== '') {
      fetchData();
    } else if (selectedTag !== '無' || !selectedTag) {
      fetchTagsData();
    }
  }, [searchTerm, selectedTag]);

  return (
    <div className="search-render">
      <div className="search-bar-container">
        <div className="search-bar">
          <input
            id="first-step"
            type="text"
            placeholder="搜尋你的卡片"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="tag-search" id="tag-search-step">
            <button className="dropbtn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {selectedTag || '選擇標籤'}
            </button>
            {dropdownOpen && (
              <div className="dropdown-content">
                {tags.map((tag, index) => (
                  <li key={index} onClick={() => handleTagSelect(tag)}>
                    {tag}
                  </li>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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
