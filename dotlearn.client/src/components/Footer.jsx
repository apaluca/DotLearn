import { Container } from "react-bootstrap";

function Footer() {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <div className="d-md-flex justify-content-between align-items-center">
          <div>
            <h5>DotLearn LMS</h5>
            <p className="text-muted">A simple learning management system</p>
          </div>

          <div className="mt-3 mt-md-0">
            <p>
              &copy; {new Date().getFullYear()} DotLearn. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
