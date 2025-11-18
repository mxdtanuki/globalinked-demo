import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    // Not logged in, redirect to public page
    return <Navigate to="/" replace />;
  }
  return children;
}