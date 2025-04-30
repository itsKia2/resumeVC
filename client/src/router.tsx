import React from 'react';
import { Route, Routes } from 'react-router-dom';
import App from './App';
import Example from './pages/Example';

const Router: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/example" element={<Example />} />
    </Routes>
  );
};

export default Router;