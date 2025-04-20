import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Alert,
  Spinner,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  FaBook,
  FaChalkboardTeacher,
  FaUsers,
  FaGraduationCap,
  FaClock,
  FaCheckCircle,
  FaEdit,
  FaPlus,
  FaSync,
} from "react-icons/fa";

function Dashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    completed: 0,
    inProgress: 0,
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (user) {
          // For students and instructors, get enrolled courses
          const enrolledResponse = await axios.get("/api/enrollments/courses");

          // Make sure we're setting the right data
          console.log("Enrolled courses data:", enrolledResponse.data);
          setEnrolledCourses(enrolledResponse.data);

          // Calculate statistics
          const total = enrolledResponse.data.length;
          const completed = enrolledResponse.data.filter(
            (c) => c.status === "Completed",
          ).length;
          const inProgress = enrolledResponse.data.filter(
            (c) => c.status === "Active",
          ).length;

          setStats({
            totalEnrolled: total,
            completed,
            inProgress,
          });

          // For instructors, also get their created courses
          if (user.role === "Instructor" || user.role === "Admin") {
            const coursesResponse = await axios.get("/api/courses");
            // Filter courses where user is the instructor
            const instructorCourses = coursesResponse.data.filter(
              (course) => course.instructorId === parseInt(user.id),
            );
            console.log("Instructor courses:", instructorCourses);
            setMyCourses(instructorCourses);
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

  const markCourseAsCompleted = async (enrollmentId) => {
    if (updatingStatus) return;

    try {
      setUpdatingStatus(true);

      // Call the API to update enrollment status
      await axios.put(`/api/enrollments/${enrollmentId}`, {
        status: "Completed",
      });

      // Update the local state
      setEnrolledCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.enrollmentId === enrollmentId
            ? {
                ...course,
                status: "Completed",
                completionDate: new Date().toISOString(),
              }
            : course,
        ),
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        completed: prev.completed + 1,
        inProgress: prev.inProgress - 1,
      }));

      alert("Course marked as completed!");
    } catch (err) {
      alert("Failed to update course status. Please try again.");
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

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

      {/* Dashboard Stats */}
      <Row className="mb-4">
        <Col md={user?.role === "Student" ? 12 : 6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h2 className="h5 d-flex align-items-center gap-2 mb-4">
                <FaGraduationCap /> My Learning
              </h2>

              <Row className="gy-3">
                <Col xs={4}>
                  <div className="d-flex flex-column align-items-center">
                    <div className="fs-1 fw-bold">{stats.totalEnrolled}</div>
                    <div className="text-muted">Total Courses</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="d-flex flex-column align-items-center">
                    <div className="fs-1 fw-bold">{stats.inProgress}</div>
                    <div className="text-muted">In Progress</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="d-flex flex-column align-items-center">
                    <div className="fs-1 fw-bold">{stats.completed}</div>
                    <div className="text-muted">Completed</div>
                  </div>
                </Col>
              </Row>

              {stats.totalEnrolled > 0 && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between mb-1">
                    <small>Completion Progress</small>
                    <small>
                      {Math.round(
                        (stats.completed / stats.totalEnrolled) * 100,
                      )}
                      %
                    </small>
                  </div>
                  <ProgressBar
                    now={Math.round(
                      (stats.completed / stats.totalEnrolled) * 100,
                    )}
                    variant="success"
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Instructor Stats */}
        {(user.role === "Instructor" || user.role === "Admin") && (
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <h2 className="h5 d-flex align-items-center gap-2 mb-4">
                  <FaChalkboardTeacher /> My Teaching
                </h2>

                <Row className="gy-3">
                  <Col xs={6}>
                    <div className="d-flex flex-column align-items-center">
                      <div className="fs-1 fw-bold">{myCourses.length}</div>
                      <div className="text-muted">Courses Created</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="d-flex flex-column align-items-center">
                      <div className="fs-1 fw-bold">
                        {myCourses.reduce(
                          (sum, course) => sum + course.enrollmentCount,
                          0,
                        )}
                      </div>
                      <div className="text-muted">Total Students</div>
                    </div>
                  </Col>
                </Row>

                <div className="mt-4 text-center">
                  <Button
                    as={Link}
                    to="/courses/create"
                    variant="outline-primary"
                    className="d-flex align-items-center gap-2 mx-auto"
                  >
                    <FaPlus /> Create New Course
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Student Section - My Enrolled Courses */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light">
          <h2 className="h5 mb-0 d-flex align-items-center gap-2">
            <FaBook /> My Enrolled Courses
          </h2>
        </Card.Header>
        <Card.Body>
          {enrolledCourses.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {enrolledCourses.map((course) => (
                <Col key={course.id}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Card.Title>{course.title}</Card.Title>
                      <Card.Text className="text-muted d-flex align-items-center gap-2 mb-3">
                        <FaChalkboardTeacher />
                        {course.instructorName}
                      </Card.Text>
                      <div className="d-flex align-items-center mb-3">
                        <span className="me-2">Status:</span>
                        <Badge bg={getStatusBadgeColor(course.status)}>
                          {course.status}
                        </Badge>
                      </div>
                      {course.status === "Active" && (
                        <div className="d-flex align-items-center">
                          <FaClock className="text-muted me-2" />
                          <small className="text-muted">
                            Enrolled on:{" "}
                            {new Date(
                              course.enrollmentDate,
                            ).toLocaleDateString()}
                          </small>
                        </div>
                      )}
                      {course.status === "Completed" && (
                        <div className="d-flex align-items-center">
                          <FaCheckCircle className="text-success me-2" />
                          <small className="text-muted">
                            Completed on:{" "}
                            {new Date(
                              course.completionDate,
                            ).toLocaleDateString()}
                          </small>
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer className="bg-white d-flex gap-2">
                      <Button
                        as={Link}
                        to={`/courses/${course.id}`}
                        variant={
                          course.status === "Completed"
                            ? "outline-primary"
                            : "primary"
                        }
                        className="flex-grow-1"
                      >
                        {course.status === "Completed"
                          ? "Review Course"
                          : "Continue Learning"}
                      </Button>

                      {course.status === "Active" && (
                        <Button
                          variant="outline-success"
                          className="d-flex align-items-center justify-content-center"
                          title="Mark as Completed"
                          onClick={() =>
                            markCourseAsCompleted(course.enrollmentId)
                          }
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? (
                            <FaSync className="fa-spin" />
                          ) : (
                            <FaCheckCircle />
                          )}
                        </Button>
                      )}
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

      {/* Instructor Section - My Courses */}
      {(user.role === "Instructor" || user.role === "Admin") && (
        <Card className="shadow-sm">
          <Card.Header className="bg-light">
            <h2 className="h5 mb-0 d-flex align-items-center gap-2">
              <FaChalkboardTeacher /> My Courses
            </h2>
          </Card.Header>
          <Card.Body>
            {myCourses.length > 0 ? (
              <Row xs={1} md={2} lg={3} className="g-4">
                {myCourses.map((course) => (
                  <Col key={course.id}>
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title>{course.title}</Card.Title>
                        <Card.Text>
                          {course.description.length > 100
                            ? course.description.substring(0, 100) + "..."
                            : course.description}
                        </Card.Text>
                        <div className="d-flex align-items-center mb-3">
                          <FaUsers className="text-muted me-2" />
                          <small className="text-muted">
                            {course.enrollmentCount} student
                            {course.enrollmentCount !== 1 ? "s" : ""} enrolled
                          </small>
                        </div>
                        <div className="d-flex align-items-center">
                          <FaClock className="text-muted me-2" />
                          <small className="text-muted">
                            Created:{" "}
                            {new Date(course.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      </Card.Body>
                      <Card.Footer className="bg-white d-flex justify-content-between">
                        <Button
                          as={Link}
                          to={`/courses/${course.id}`}
                          variant="primary"
                        >
                          View
                        </Button>
                        <Button
                          as={Link}
                          to={`/courses/editor/${course.id}`}
                          variant="outline-primary"
                          className="d-flex align-items-center gap-1"
                        >
                          <FaEdit /> Edit
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
