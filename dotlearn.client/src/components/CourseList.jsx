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
  Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  FaSearch,
  FaTimes,
  FaBook,
  FaChalkboardTeacher,
  FaUsers,
  FaArrowRight,
} from "react-icons/fa";

function CourseList() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all courses
        const coursesResponse = await axios.get("/api/courses");
        setCourses(coursesResponse.data);
        setFilteredCourses(coursesResponse.data);

        // If user is logged in, get their enrollments to check which courses they're already in
        if (user) {
          try {
            const enrollmentsResponse = await axios.get(
              "/api/enrollments/courses",
            );
            const enrolledIds = new Set(
              enrollmentsResponse.data.map((course) => course.id),
            );
            setEnrolledCourseIds(enrolledIds);
          } catch (err) {
            console.error("Error fetching enrollments:", err);
          }
        }
      } catch (err) {
        setError("Failed to load courses. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
    if (!user) {
      alert("Please log in to enroll in this course.");
      return;
    }

    try {
      await axios.post("/api/enrollments", { courseId });

      // Add to the enrolled courses set
      setEnrolledCourseIds((prev) => new Set([...prev, courseId]));

      alert("Successfully enrolled in the course!");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to enroll in the course. Please try again.",
      );
      console.error(err);
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourseIds.has(courseId);
  };

  // Don't show enroll button if user is the instructor of the course
  const isInstructor = (course) => {
    return user && course.instructorId === parseInt(user.id);
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
          <Button
            as={Link}
            to="/courses/create"
            variant="primary"
            className="d-flex align-items-center gap-2"
          >
            <FaBook /> Create Course
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search courses by title, description, or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button variant="outline-secondary" onClick={() => setSearch("")}>
                <FaTimes />
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
                  <Card.Title className="mb-3">{course.title}</Card.Title>
                  <Card.Subtitle className="mb-3 text-muted d-flex align-items-center gap-2">
                    <FaChalkboardTeacher /> {course.instructorName}
                  </Card.Subtitle>
                  <Card.Text>
                    {course.description.length > 150
                      ? course.description.substring(0, 150) + "..."
                      : course.description}
                  </Card.Text>
                  <div className="d-flex align-items-center mb-3">
                    <FaUsers className="text-muted me-2" />
                    <small className="text-muted">
                      {course.enrollmentCount} student
                      {course.enrollmentCount !== 1 ? "s" : ""} enrolled
                    </small>
                  </div>

                  {isEnrolled(course.id) && (
                    <Badge bg="success" className="mb-2">
                      You're enrolled
                    </Badge>
                  )}

                  {isInstructor(course) && (
                    <Badge bg="info" className="mb-2">
                      You're the instructor
                    </Badge>
                  )}
                </Card.Body>
                <Card.Footer className="bg-white">
                  <div className="d-grid gap-2">
                    <Button
                      as={Link}
                      to={`/courses/${course.id}`}
                      variant={isEnrolled(course.id) ? "success" : "primary"}
                      className="d-flex align-items-center justify-content-center gap-2"
                    >
                      {isEnrolled(course.id)
                        ? "Continue Learning"
                        : "View Course"}
                      <FaArrowRight />
                    </Button>

                    {user &&
                      user.role === "Student" &&
                      !isEnrolled(course.id) &&
                      !isInstructor(course) && (
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
        <Card className="text-center py-5 shadow-sm">
          <Card.Body>
            <p className="mb-3">
              No courses found matching your search criteria.
            </p>
            {search && (
              <Button variant="outline-primary" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default CourseList;
