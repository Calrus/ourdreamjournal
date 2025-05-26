import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Layout } from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DreamForm from './components/dream/DreamForm';
import { DreamList } from './components/dreams/DreamList';
import { PublicDreamsPage } from './components/dreams/PublicDreamsPage';
import { DreamDetail } from './components/dreams/DreamDetail';
import { PublicProfilePage } from './components/dreams/PublicProfilePage';
import { EditProfilePage } from './components/dreams/EditProfilePage';
import { useAuth } from './context/AuthContext';
import { FriendsDreamsList } from './components/dreams/FriendsDreamsList';
import { FriendRequestsPage } from './components/dreams/FriendRequestsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { login, register } = useAuth();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Routes>
            <Route
              path="/login"
              element={
                <LoginForm
                  onSubmit={({ email, password }) => login(email, password)}
                  onRegisterClick={() => <Navigate to="/register" />}
                />
              }
            />
            <Route
              path="/register"
              element={
                <RegisterForm
              onSubmit={({ username, email, password }) => register(username, email, password)}
                  onLoginClick={() => <Navigate to="/login" />}
                />
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DreamList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DreamForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/public-dreams"
              element={<PublicDreamsPage />}
            />
            <Route
              path="/dreams/:id"
              element={<DreamDetail />}
            />
            <Route path="/users/:username" element={<PublicProfilePage />} />
            <Route path="/profile" element={<EditProfilePage />} />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FriendsDreamsList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/friend-requests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FriendRequestsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
    </ThemeProvider>
  );
};

export default App;
