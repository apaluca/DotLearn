import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function CourseList() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/courses");
        setCourses(response.data);
        setFilteredCourses(response.data);
      } catch (err) {
        setError("Failed to load courses. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredCourses(courses);
    } else {
      const searchTerm = search.toLowerCase();
      setFilteredCourses(
        courses.filter(
          (course) =>
            course.title.toLowerCase().includes(searchTerm) ||
            course.description.toLowerCase().includes(searchTerm) ||
            course.instructorName.toLowerCase().includes(searchTerm),
        ),
      );
    }
  }, [search, courses]);

  const enrollInCourse = async (courseId) => {
    try {
      await axios.post("/api/enrollments", { courseId });

      // Update the UI to show enrollment
      alert("Successfully enrolled in the course!");

      // Refresh the course list
      const response = await axios.get("/api/courses");
      setCourses(response.data);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to enroll in the course. Please try again.",
      );
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading courses...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>All Courses</h1>

        {user && (user.role === "Instructor" || user.role === "Admin") && (
          <Button as={Link} to="/courses/create" variant="primary">
            Create Course
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Search courses by title, description, or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button variant="outline-secondary" onClick={() => setSearch("")}>
                Clear
              </Button>
            )}
          </InputGroup>

          <p className="text-muted">
            Showing {filteredCourses.length} of {courses.length} courses
          </p>
        </Card.Body>
      </Card>

      {filteredCourses.length > 0 ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredCourses.map((course) => (
            <Col key={course.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{course.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    Instructor: {course.instructorName}
                  </Card.Subtitle>
                  <Card.Text>
                    {course.description.length > 150
                      ? course.description.substring(0, 150) + "..."
                      : course.description}
                  </Card.Text>
                  <Card.Text>
                    <small className="text-muted">
                      {course.enrollmentCount} student
                      {course.enrollmentCount !== 1 ? "s" : ""} enrolled
                    </small>
                  </Card.Text>
                </Card.Body>
                <Card.Footer>
                  <div className="d-grid gap-2">
                    <Button
                      as={Link}
                      to={`/courses/${course.id}`}
                      variant="primary"
                    >
                      View Course
                    </Button>

                    {user && user.role === "Student" && (
                      <Button
                        variant="outline-primary"
                        onClick={() => enrollInCourse(course.id)}
                      >
                        Enroll
                      </Button>
                    )}
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-5">
          <p>No courses found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}

export default CourseList;
