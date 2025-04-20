import { useState, useEffect } from "react";
import { Card, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function Dashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (user) {
          // For students and instructors, get enrolled courses
          const enrolledResponse = await axios.get("/api/enrollments/courses");
          setEnrolledCourses(enrolledResponse.data);

          // For instructors, also get their created courses
          if (user.role === "Instructor" || user.role === "Admin") {
            const coursesResponse = await axios.get("/api/courses");
            // Filter courses where user is the instructor
            setMyCourses(
              coursesResponse.data.filter(
                (course) => course.instructorId === parseInt(user.id),
              ),
            );
          }
        }
      } catch (err) {
        setError("Failed to load dashboard data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Welcome, {user?.firstName || user?.username}!</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Student Section */}
      <Card className="mb-4">
        <Card.Header>
          <h2>My Enrolled Courses</h2>
        </Card.Header>
        <Card.Body>
          {enrolledCourses.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {enrolledCourses.map((course) => (
                <Col key={course.id}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>{course.title}</Card.Title>
                      <Card.Text className="text-muted">
                        Instructor: {course.instructorName}
                      </Card.Text>
                      <Card.Text>
                        Status:{" "}
                        <span
                          className={`badge bg-${getStatusBadgeColor(course.status)}`}
                        >
                          {course.status}
                        </span>
                      </Card.Text>
                    </Card.Body>
                    <Card.Footer>
                      <Button
                        as={Link}
                        to={`/courses/${course.id}`}
                        variant="primary"
                        className="w-100"
                      >
                        Go to Course
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-4">
              <p>You are not enrolled in any courses yet.</p>
              <Button as={Link} to="/courses" variant="primary">
                Browse Courses
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Instructor Section */}
      {(user.role === "Instructor" || user.role === "Admin") && (
        <Card>
          <Card.Header>
            <h2>My Courses</h2>
          </Card.Header>
          <Card.Body>
            {myCourses.length > 0 ? (
              <Row xs={1} md={2} lg={3} className="g-4">
                {myCourses.map((course) => (
                  <Col key={course.id}>
                    <Card className="h-100">
                      <Card.Body>
                        <Card.Title>{course.title}</Card.Title>
                        <Card.Text>
                          {course.description.length > 100
                            ? course.description.substring(0, 100) + "..."
                            : course.description}
                        </Card.Text>
                        <Card.Text>
                          <small className="text-muted">
                            {course.enrollmentCount} student
                            {course.enrollmentCount !== 1 ? "s" : ""} enrolled
                          </small>
                        </Card.Text>
                      </Card.Body>
                      <Card.Footer className="d-flex justify-content-between">
                        <Button
                          as={Link}
                          to={`/courses/${course.id}`}
                          variant="primary"
                          className="me-2"
                        >
                          View
                        </Button>
                        <Button
                          as={Link}
                          to={`/courses/edit/${course.id}`}
                          variant="outline-primary"
                        >
                          Edit
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-4">
                <p>You haven't created any courses yet.</p>
                <Button as={Link} to="/courses/create" variant="primary">
                  Create Course
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

function getStatusBadgeColor(status) {
  switch (status) {
    case "Active":
      return "primary";
    case "Completed":
      return "success";
    case "Dropped":
      return "secondary";
    default:
      return "info";
  }
}

export default Dashboard;
