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
  Container,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaSearch, FaTimes, FaPlus, FaFilter } from "react-icons/fa";
import CourseCard from "./CourseCard";

function CourseList() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
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

        // If user is logged in, get their enrollments
        if (user) {
          try {
            const enrollmentsResponse = await axios.get(
              "/api/enrollments/courses",
            );
            setEnrolledCourses(enrollmentsResponse.data);
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

  const handleEnrollmentUpdate = async (
    action,
    courseId,
    enrollmentData = null,
  ) => {
    try {
      if (action === "enroll") {
        const courseData = courses.find((c) => c.id === courseId);
        if (!courseData) return;

        const newEnrollment = {
          id: courseId,
          title: courseData.title,
          description: courseData.description,
          instructorId: courseData.instructorId,
          instructorName: courseData.instructorName,
          status: "Active",
          enrollmentDate: new Date().toISOString(),
          enrollmentId: enrollmentData?.id || Date.now(),
        };

        setEnrolledCourses((prev) => [...prev, newEnrollment]);
      } else if (action === "drop") {
        setEnrolledCourses((prev) =>
          prev.filter((course) => course.id !== courseId),
        );
      }
    } catch (err) {
      console.error("Error updating enrollment state:", err);
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some((course) => course.id === courseId);
  };

  const isCourseCompleted = (courseId) => {
    const course = enrolledCourses.find((course) => course.id === courseId);
    return course && course.status === "Completed";
  };

  const getEnrollmentId = (courseId) => {
    const course = enrolledCourses.find((course) => course.id === courseId);
    return course ? course.enrollmentId : null;
  };

  const isInstructor = (course) => {
    return user && course.instructorId === parseInt(user.id);
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading courses...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-sm-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-sm-0">All Courses</h1>

        {user && (user.role === "Instructor" || user.role === "Admin") && (
          <Button
            as={Link}
            to="/courses/create"
            variant="primary"
            className="d-flex align-items-center gap-2"
          >
            <FaPlus /> Create Course
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text className="bg-white">
              <FaSearch className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search courses by title, description, or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-start-0"
            />
            {search && (
              <Button variant="outline-secondary" onClick={() => setSearch("")}>
                <FaTimes />
              </Button>
            )}
          </InputGroup>

          <div className="d-flex justify-content-between">
            <small className="text-muted">
              Showing {filteredCourses.length} of {courses.length} courses
            </small>

            <div className="d-flex align-items-center">
              <small className="text-muted me-2">Sort by:</small>
              <Form.Select size="sm" style={{ width: "auto" }}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Most Popular</option>
              </Form.Select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {filteredCourses.length > 0 ? (
        <Row className="g-3">
          {filteredCourses.map((course) => (
            <Col md={6} lg={4} key={course.id}>
              <CourseCard
                course={course}
                isEnrolled={isEnrolled(course.id)}
                isCompleted={isCourseCompleted(course.id)}
                isInstructor={isInstructor(course)}
                enrollmentId={getEnrollmentId(course.id)}
                onEnrollmentChange={handleEnrollmentUpdate}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="border-0 shadow-sm text-center p-5">
          <Card.Body>
            <p className="mb-3">
              No courses found matching your search criteria.
            </p>
            {search && (
              <Button variant="primary" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default CourseList;
