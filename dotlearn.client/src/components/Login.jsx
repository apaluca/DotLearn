import { useState } from "react";
import { Form, Button, Card, Alert, InputGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaUser,
  FaLock,
  FaSignInAlt,
  FaUserPlus,
  FaBook,
} from "react-icons/fa";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!username || !password) {
      return setError("Please enter both username and password");
    }

    try {
      setError("");
      setLoading(true);

      const result = await login(username, password);

      if (!result.success) {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to log in. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center">
      <Card className="shadow" style={{ width: "450px" }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <FaBook size={40} className="text-primary mb-2" />
            <Card.Title as="h2" className="mb-1">
              Welcome Back
            </Card.Title>
            <p className="text-muted">Sign in to continue to DotLearn LMS</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaUser />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4" controlId="password">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLock />
                </InputGroup.Text>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              <FaSignInAlt />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Form>

          <div className="text-center mt-4">
            <p className="mb-0">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="d-inline-flex align-items-center gap-1"
              >
                <FaUserPlus size={14} /> Register Now
              </Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;
