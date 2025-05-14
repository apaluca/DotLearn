import { useAuth } from "../context/AuthContext";
import { Card, ListGroup, Container, Row, Col, Badge } from "react-bootstrap";
import { FaUser, FaEnvelope, FaUserTag, FaIdCard } from "react-icons/fa";

function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Container>
        <div className="text-center py-5">
          <p>Loading user profile...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="mb-4">My Profile</h1>

      <Row>
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <div
                  className="bg-primary rounded-circle d-flex justify-content-center align-items-center text-white"
                  style={{ width: "80px", height: "80px", fontSize: "2.5rem" }}
                >
                  {user.firstName?.charAt(0) || user.username.charAt(0)}
                </div>

                <div className="ms-3">
                  <h2 className="h3 mb-1">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username}
                  </h2>
                  <Badge
                    bg={getRoleBadgeColor(user.role)}
                    className="px-3 py-2"
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>

              <ListGroup variant="flush" className="border-top border-bottom">
                <ListGroup.Item className="px-0 py-3 d-flex align-items-center">
                  <FaUserTag className="text-primary me-3" size={20} />
                  <div>
                    <div className="text-muted small">Username</div>
                    <div className="fw-medium">{user.username}</div>
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="px-0 py-3 d-flex align-items-center">
                  <FaEnvelope className="text-primary me-3" size={20} />
                  <div>
                    <div className="text-muted small">Email</div>
                    <div className="fw-medium">{user.email}</div>
                  </div>
                </ListGroup.Item>

                {user.firstName && (
                  <>
                    <ListGroup.Item className="px-0 py-3 d-flex align-items-center">
                      <FaUser className="text-primary me-3" size={20} />
                      <div>
                        <div className="text-muted small">First Name</div>
                        <div className="fw-medium">{user.firstName}</div>
                      </div>
                    </ListGroup.Item>

                    <ListGroup.Item className="px-0 py-3 d-flex align-items-center">
                      <FaIdCard className="text-primary me-3" size={20} />
                      <div>
                        <div className="text-muted small">Last Name</div>
                        <div className="fw-medium">{user.lastName}</div>
                      </div>
                    </ListGroup.Item>
                  </>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
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
