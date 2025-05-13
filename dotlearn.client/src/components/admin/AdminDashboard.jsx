import { useState } from "react";
import { Card, Tabs, Tab, Alert } from "react-bootstrap";
import UserManagement from "./UserManagement";
import CourseManagement from "./CourseManagement";
import InstructorManagement from "./InstructorManagement";
import StudentManagement from "./StudentManagement";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaBook,
  FaUserGraduate,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { AdminProvider, useAdmin } from "../../context/AdminContext";

function AdminTabs() {
  const [key, setKey] = useState("users");
  const { triggerRefresh } = useAdmin();

  // Handle tab change to trigger data refresh
  const handleTabChange = (newKey) => {
    setKey(newKey);
    triggerRefresh(); // Trigger refresh when changing tabs
  };

  return (
    <Tabs
      id="admin-dashboard-tabs"
      activeKey={key}
      onSelect={handleTabChange}
      className="mb-3"
    >
      <Tab
        eventKey="users"
        title={
          <div className="d-flex align-items-center">
            <FaUsers className="me-2" /> User Management
          </div>
        }
      >
        <UserManagement />
      </Tab>
      <Tab
        eventKey="courses"
        title={
          <div className="d-flex align-items-center">
            <FaBook className="me-2" /> Course Management
          </div>
        }
      >
        <CourseManagement />
      </Tab>
      <Tab
        eventKey="instructors"
        title={
          <div className="d-flex align-items-center">
            <FaChalkboardTeacher className="me-2" /> Instructor Management
          </div>
        }
      >
        <InstructorManagement />
      </Tab>
      <Tab
        eventKey="students"
        title={
          <div className="d-flex align-items-center">
            <FaUserGraduate className="me-2" /> Student Management
          </div>
        }
      >
        <StudentManagement />
      </Tab>
    </Tabs>
  );
}

function AdminDashboard() {
  const { user } = useAuth();

  // Check if the current user is an admin
  if (user?.role !== "Admin") {
    return (
      <Alert variant="danger">
        <Alert.Heading>Access Denied</Alert.Heading>
        <p>
          You don't have permission to access the admin dashboard. Please
          contact an administrator if you believe this is an error.
        </p>
      </Alert>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Admin Dashboard</h1>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <AdminProvider>
            <AdminTabs />
          </AdminProvider>
        </Card.Body>
      </Card>
    </div>
  );
}

export default AdminDashboard;
