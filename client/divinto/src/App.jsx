import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { UpdateNode } from './components/Node';
import { Sidebar } from './components/Sidebar';
import { Chatroom } from './components/Chatroom';
import { Reflection } from './components/Reflection';
import { WhiteboardPage } from './components/WhiteboardPage';
import { AgentPage } from './components/AgentPage';
import { LandingPage } from './components/LandingPage';
import { AgentThreadPage } from './components/AgentThreadPage';

import 'reactflow/dist/style.css';
import './overview.css';
import './text-updater-note.css';
import './updatenode.css';
import './App.css';

export const URL = 'https://api.divinto.me';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const MainLayout = ({ children }) => (
    <>
      <Sidebar />
      <div>{children}</div>
    </>
  );

  useEffect(() => {
    const token =
      localStorage.getItem('jwtToken') ||
      document.cookie.split('; ').find((row) => row.startsWith('jwtToken='));
    setIsLoggedIn(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <MainLayout>
                <WhiteboardPage />
                <AgentPage />
              </MainLayout>
            ) : (
              <LandingPage />
            )
          }
        />
        <Route
          path="/whiteboard"
          element={
            isLoggedIn ? (
              <MainLayout>
                <WhiteboardPage />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>
        <Route
          path="/whiteboard/:id"
          element={
            isLoggedIn ? (
              <MainLayout>
                <UpdateNode />{' '}
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/whiteboard/:id/reflection"
          element={
            isLoggedIn ? (
              <MainLayout>
                <Reflection />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/whiteboard" /> : <LoginPage />} />
        <Route
          path="/agent"
          element={
            isLoggedIn ? (
              <MainLayout>
                {' '}
                <AgentPage />{' '}
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/agent/:agentId"
          element={
            isLoggedIn ? (
              <MainLayout>
                {' '}
                <AgentThreadPage />{' '}
              </MainLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/agent/:agentId/thread/:threadId"
          element={
            isLoggedIn ? (
              <MainLayout>
                <Chatroom />
              </MainLayout>
            ) : (
              <LoginPage />
            )
          }
        />
      </Routes>
    </Router>
  );
};
export default App;
