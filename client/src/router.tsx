// src/router.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/ui/Layout';

import CollectionView from './pages/CollectionView';
import JobAnalysis from './pages/JobAnalysis';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import CategoriesPage from './pages/Categories';
import CategoryPage from './pages/Category';

import App from './App'; // optional homepage

const Router: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<App />} />
        <Route path="collections" element={<CollectionView />} />
        <Route path="job-analysis" element={<JobAnalysis />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="login" element={<Login />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/:id" element={<CategoryPage />} />
      </Route>
    </Routes>
  );
};

export default Router;
