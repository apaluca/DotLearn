import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaBookOpen,
  FaUserCircle,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBook,
  FaChalkboardTeacher,
  FaPlus,
  FaUserShield,
} from "react-icons/fa";

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm py-2 mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <div className="d-flex align-items-center">
            <FaBookOpen className="me-2 text-primary" size={24} />
            <span className="fw-bold">DotLearn</span>
          </div>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto" activeKey={location.pathname}>
            {user && (
              <>
                <Nav.Link as={Link} to="/dashboard" className="mx-1">
                  <FaTachometerAlt className="me-1" /> Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/courses" className="mx-1">
                  <FaBook className="me-1" /> Courses
                </Nav.Link>
                {(user.role === "Instructor" || user.role === "Admin") && (
                  <Nav.Link as={Link} to="/courses/create" className="mx-1">
                    <FaPlus className="me-1" /> Create Course
                  </Nav.Link>
                )}
                {user.role === "Admin" && (
                  <Nav.Link as={Link} to="/admin" className="mx-1">
                    <FaUserShield className="me-1" /> Admin
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>
          <Nav>
            {user ? (
              <NavDropdown
                title={
                  <div className="d-inline-flex align-items-center">
                    <div className="position-relative me-1">
                      <FaUserCircle size={20} />
                      {user.role !== "Student" && (
                        <span
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                          style={{ fontSize: "0.5rem", padding: "0.2em 0.4em" }}
                        >
                          {user.role === "Admin" ? "A" : "I"}
                        </span>
                      )}
                    </div>
                    {user.firstName || user.username}
                  </div>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <FaUserCircle className="me-2" /> My Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> Sign Out
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="mx-1">
                  Sign In
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/register"
                  className="btn btn-outline-primary ms-2"
                >
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
