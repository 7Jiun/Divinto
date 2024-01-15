import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import './Reflection.css';
import './ReflectionMDEditor.css';
import { URL } from '../App';
import { mergeCardContents } from '../initial-elements';

import SimpleMDE from 'react-simplemde-editor';
import Markdown from 'react-markdown';

const token = localStorage.getItem('jwtToken');

export function StreamingComponent() {
  const { id, streamingId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="search-render">
      <div className="search-bar-container">
        <div className="search-bar">
          <iframe
            width="700"
            height="400"
            src={`https://www.youtube.com/embed/${streamingId}`}
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          />
        </div>
      </div>
    </div>
  );
}

export function Streaming() {
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
        <StreamingComponent />
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
