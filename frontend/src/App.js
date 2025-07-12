// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DownloadPage from './pages/DownloadPage';
import EditorPage from './pages/EditorPage';
import Navigation from './components/Navigation';
import { Container } from 'react-bootstrap';

function App() {
  return (
    <Router>
      <Navigation />
      <Container className="py-4">
        <Routes>
          <Route path="/" element={<DownloadPage />} />
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;