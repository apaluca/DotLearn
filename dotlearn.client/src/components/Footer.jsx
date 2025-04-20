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
          <Col md={4}>
            <div className="d-flex align-items-center mb-3">
              <FaBook className="me-2" size={24} />
              <h5 className="mb-0">DotLearn LMS</h5>
            </div>
            <p className="text-muted">
              A modern learning management system built with ASP.NET Core and
              React.
            </p>
          </Col>

          <Col md={4}>
            <h5 className="mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/courses" className="text-decoration-none text-muted">
                  All Courses
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/dashboard"
                  className="text-decoration-none text-muted"
                >
                  Dashboard
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/profile" className="text-decoration-none text-muted">
                  Profile
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={4}>
            <h5 className="mb-3">Connect</h5>
            <div className="d-flex gap-3 mb-3">
              <a href="#" className="text-light fs-5">
                <FaGithub />
              </a>
              <a href="#" className="text-light fs-5">
                <FaTwitter />
              </a>
              <a href="#" className="text-light fs-5">
                <FaLinkedin />
              </a>
              <a href="mailto:info@dotlearn.com" className="text-light fs-5">
                <FaEnvelope />
              </a>
            </div>
            <p className="text-muted mb-0">
              &copy; {currentYear} DotLearn. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
