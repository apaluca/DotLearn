import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaBook,
  FaTachometerAlt,
  FaChalkboardTeacher,
  FaPlus,
  FaUserGraduate,
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
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <div className="d-flex align-items-center">
            <FaBook className="me-2" size={24} />
            <span className="fw-bold">DotLearn LMS</span>
          </div>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto" activeKey={location.pathname}>
            {user && (
              <>
                <Nav.Link
                  as={Link}
                  to="/dashboard"
                  className="d-flex align-items-center"
                >
                  <FaTachometerAlt className="me-2" /> Dashboard
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/courses"
                  className="d-flex align-items-center"
                >
                  <FaBook className="me-2" /> Courses
                </Nav.Link>
                {(user.role === "Instructor" || user.role === "Admin") && (
                  <Nav.Link
                    as={Link}
                    to="/courses/create"
                    className="d-flex align-items-center"
                  >
                    <FaPlus className="me-2" /> Create Course
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
                      <FaUserCircle size={18} />
                      {user.role === "Admin" && (
                        <span
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                          style={{ fontSize: "0.5rem", padding: "0.2em 0.4em" }}
                        >
                          A
                        </span>
                      )}
                      {user.role === "Instructor" && (
                        <span
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success"
                          style={{ fontSize: "0.5rem", padding: "0.2em 0.4em" }}
                        >
                          I
                        </span>
                      )}
                    </div>
                    {user.username}
                  </div>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item
                  as={Link}
                  to="/profile"
                  className="d-flex align-items-center"
                >
                  <FaUserGraduate className="me-2" /> Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={handleLogout}
                  className="d-flex align-items-center"
                >
                  <FaSignOutAlt className="me-2" /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
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
