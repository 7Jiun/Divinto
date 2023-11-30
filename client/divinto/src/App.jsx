import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { UpdateNode } from './components/Node';
import { Sidebar } from './components/Sidebar';
import { Chatroom } from './components/Chatroom';
import { WhiteboardPage } from './components/WhiteboardPage';
import { AgentPage } from './components/AgentPage';
import 'reactflow/dist/style.css';
import './overview.css';
import './text-updater-note.css';
import './updatenode.css';
import './App.css';
import { AgentThreadPage } from './components/AgentThreadPage';

export const URL = 'http://localhost:3000';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem('jwtToken') ||
      document.cookie.split('; ').find((row) => row.startsWith('jwtToken='));
    setIsLoggedIn(!!token);
  }, []);

  return (
    <Router>
      <Sidebar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/whiteboard"
          element={isLoggedIn ? <WhiteboardPage /> : <Navigate to="/login" />}
        ></Route>
        <Route
          path="/whiteboard/:id"
          element={isLoggedIn ? <UpdateNode /> : <Navigate to="/login" />}
        />

        <Route path="/login" element={isLoggedIn ? <Navigate to="/whiteboard" /> : <LoginPage />} />
        <Route path="/agent" element={isLoggedIn ? <AgentPage /> : <Navigate to="/" />} />
        <Route
          path="/agent/:agentId"
          element={isLoggedIn ? <AgentThreadPage /> : <Navigate to="/" />}
        />

        <Route path="/agent/:agentId/thread/:threadId" element={<Chatroom />} />
      </Routes>
    </Router>
  );
};
export default App;
