import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container } from "react-bootstrap";
import "./App.css";
import NavBar from "./components/NavBar";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import CourseList from "./components/CourseList";
import CourseDetail from "./components/CourseDetail";
import CreateCourse from "./components/CreateCourse";
import EditCourse from "./components/EditCourse";
import CourseEditor from "./components/CourseEditor";
import Profile from "./components/Profile";
import Footer from "./components/Footer";
import { AuthProvider, useAuth } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <NavBar />
      <Container className="py-4 main-container">
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route
            path="/courses/create"
            element={
              user && (user.role === "Instructor" || user.role === "Admin") ? (
                <CreateCourse />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/courses/edit/:id"
            element={
              user && (user.role === "Instructor" || user.role === "Admin") ? (
                <EditCourse />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          {/* Add this new route for the course content editor */}
          <Route
            path="/courses/editor/:id"
            element={
              user && (user.role === "Instructor" || user.role === "Admin") ? (
                <CourseEditor />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </Container>
      <Footer />
    </>
  );
}

export default App;
