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
import { FaSearch, FaTimes, FaBook } from "react-icons/fa";
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

        // If user is logged in, get their enrollments to check which courses they're already in
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

  // This function will handle both enrollment and dropping
  const handleEnrollmentUpdate = async (
    action,
    courseId,
    enrollmentData = null,
  ) => {
    try {
      if (action === "enroll") {
        // Find the complete course data from our courses list
        const courseData = courses.find((c) => c.id === courseId);

        if (!courseData) {
          console.error("Course not found in courses list");
          return;
        }

        // Create a new enrollment object with all needed fields
        const newEnrollment = {
          id: courseId,
          title: courseData.title,
          description: courseData.description,
          instructorId: courseData.instructorId,
          instructorName: courseData.instructorName,
          status: "Active",
          enrollmentDate: new Date().toISOString(),
          enrollmentId: enrollmentData?.id || Date.now(), // Use API ID or fallback
        };

        // Update enrolled courses immediately
        setEnrolledCourses((prev) => [...prev, newEnrollment]);
      } else if (action === "drop") {
        // Remove the course from enrolled courses
        setEnrolledCourses((prev) =>
          prev.filter((course) => course.id !== courseId),
        );
      }
    } catch (err) {
      console.error("Error updating enrollment state:", err);
    }
  };

  // Now our isEnrolled and isCourseCompleted functions will always use the latest state
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

  // Check if user is the instructor of the course
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
