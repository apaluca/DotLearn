import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaEnvelope,
} from "react-icons/fa";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row className="gy-4">
          <Col md={5}>
            <div className="mb-3">
              <Link to="/" className="text-decoration-none">
                <div className="d-flex align-items-center">
                  <FaBook className="text-primary me-2" size={24} />
                  <h5 className="mb-0 text-white">DotLearn LMS</h5>
                </div>
              </Link>
            </div>
            <p className="text-muted">
              A modern learning management system built with ASP.NET Core and
              React. Empower your learning journey with our flexible and
              user-friendly platform.
            </p>
          </Col>

          <Col md={3} className="ms-auto">
            <h5 className="mb-3 text-white">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link
                  to="/courses"
                  className="text-decoration-none text-muted hover-text-white"
                >
                  All Courses
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/dashboard"
                  className="text-decoration-none text-muted hover-text-white"
                >
                  Dashboard
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/profile"
                  className="text-decoration-none text-muted hover-text-white"
                >
                  Profile
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={3}>
            <h5 className="mb-3 text-white">Connect</h5>
            <div className="d-flex gap-3 mb-3">
              <a href="#" className="text-muted">
                <FaGithub size={20} />
              </a>
              <a href="#" className="text-muted">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-muted">
                <FaLinkedin size={20} />
              </a>
              <a href="mailto:info@dotlearn.com" className="text-muted">
                <FaEnvelope size={20} />
              </a>
            </div>
            <p className="text-muted mb-0 small">
              &copy; {currentYear} DotLearn. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
