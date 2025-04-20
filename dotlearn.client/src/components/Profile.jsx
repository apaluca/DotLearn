import { useAuth } from "../context/AuthContext";
import { Card, ListGroup, Badge } from "react-bootstrap";

function Profile() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading user profile...</div>;
  }

  return (
    <div>
      <h1 className="mb-4">My Profile</h1>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex align-items-center mb-4">
            <div
              className="bg-primary rounded-circle d-flex justify-content-center align-items-center text-white"
              style={{ width: "80px", height: "80px", fontSize: "2rem" }}
            >
              {user.firstName?.charAt(0) || user.username.charAt(0)}
            </div>

            <div className="ms-3">
              <h2 className="mb-1">
                {user.firstName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </h2>
              <Badge bg={getRoleBadgeColor(user.role)}>{user.role}</Badge>
            </div>
          </div>

          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>Username:</strong> {user.username}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Email:</strong> {user.email}
            </ListGroup.Item>
            {user.firstName && (
              <>
                <ListGroup.Item>
                  <strong>First Name:</strong> {user.firstName}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Last Name:</strong> {user.lastName}
                </ListGroup.Item>
              </>
            )}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Additional profile sections could be added here, such as:
          - Account settings
          - Password change form
          - Course progress statistics
          - Achievements
      */}
    </div>
  );
}

function getRoleBadgeColor(role) {
  switch (role) {
    case "Admin":
      return "danger";
    case "Instructor":
      return "success";
    case "Student":
      return "primary";
    default:
      return "secondary";
  }
}

export default Profile;
