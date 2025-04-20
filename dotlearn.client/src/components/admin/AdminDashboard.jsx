import { useState } from "react";
import { Card, Tabs, Tab, Alert } from "react-bootstrap";
import UserManagement from "./UserManagement";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaBook,
  FaUserGraduate,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const [key, setKey] = useState("users");
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
          <Tabs
            id="admin-dashboard-tabs"
            activeKey={key}
            onSelect={(k) => setKey(k)}
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
              <p className="text-muted">
                Course management functionality will be implemented in a future
                update.
              </p>
            </Tab>
            <Tab
              eventKey="instructors"
              title={
                <div className="d-flex align-items-center">
                  <FaChalkboardTeacher className="me-2" /> Instructor Management
                </div>
              }
            >
              <p className="text-muted">
                Instructor management functionality will be implemented in a
                future update.
              </p>
            </Tab>
            <Tab
              eventKey="students"
              title={
                <div className="d-flex align-items-center">
                  <FaUserGraduate className="me-2" /> Student Management
                </div>
              }
            >
              <p className="text-muted">
                Student management functionality will be implemented in a future
                update.
              </p>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
}

export default AdminDashboard;
