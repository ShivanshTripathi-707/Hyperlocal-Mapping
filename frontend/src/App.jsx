import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./Pages/Home";
import Login from "./Pages/Login";
import Doc from "./Pages/Doc";
import Feed from "./Pages/Feed";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("hyperlocal_user");
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route wrapper (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const user = localStorage.getItem("hyperlocal_user");
  return !user ? children : <Navigate to="/doc" replace />;
};

function App() {
  return (
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/doc"
          element={
            <ProtectedRoute>
              <Doc />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
  );
}

export default App;