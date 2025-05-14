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
  Container,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import CourseCard from "./CourseCard";
import {
  FaBook,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaChartLine,
  FaPlus,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (user) {
          // Get enrolled courses
          const enrolledResponse = await axios.get("/api/enrollments/courses");
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

          // For instructors, get created courses
          if (user.role === "Instructor" || user.role === "Admin") {
            const coursesResponse = await axios.get("/api/courses");
            const instructorCourses = coursesResponse.data.filter(
              (course) => course.instructorId === parseInt(user.id),
            );
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

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <Container>
      <div className="d-sm-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-sm-0">
          Welcome, {user?.firstName || user?.username}
        </h1>

        {(user.role === "Instructor" || user.role === "Admin") && (
          <Button
            as={Link}
            to="/courses/create"
            variant="primary"
            className="d-flex align-items-center gap-2"
          >
            <FaPlus /> Create New Course
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Dashboard Overview */}
      <Row className="mb-4 g-3">
        <Col lg={user?.role === "Student" ? 4 : 4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              <div className="text-primary mb-3 display-4">
                {stats.totalEnrolled}
              </div>
              <div className="text-center">
                <FaBook className="text-primary mb-2" size={24} />
                <h5>Total Courses</h5>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={user?.role === "Student" ? 4 : 4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              <div className="text-success mb-3 display-4">
                {stats.completed}
              </div>
              <div className="text-center">
                <FaUserGraduate className="text-success mb-2" size={24} />
                <h5>Completed</h5>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={user?.role === "Student" ? 4 : 4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              <div className="text-info mb-3 display-4">{stats.inProgress}</div>
              <div className="text-center">
                <FaChartLine className="text-info mb-2" size={24} />
                <h5>In Progress</h5>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* My Learning Section */}
      <h2 className="h4 mb-3 d-flex align-items-center">
        <FaBook className="me-2 text-primary" /> My Learning
      </h2>
      <Row className="mb-5 g-3">
        {enrolledCourses.length > 0 ? (
          enrolledCourses.map((course) => (
            <Col md={6} lg={4} key={course.id}>
              <CourseCard
                course={course}
                isEnrolled={true}
                isCompleted={course.status === "Completed"}
              />
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <FaBook className="text-muted mb-3" size={40} />
                <h5>You haven't enrolled in any courses yet</h5>
                <p className="text-muted mb-4">
                  Explore our courses and start learning today!
                </p>
                <Button as={Link} to="/courses" variant="primary">
                  Browse Courses
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Instructor Section */}
      {(user.role === "Instructor" || user.role === "Admin") && (
        <>
          <h2 className="h4 mb-3 d-flex align-items-center">
            <FaChalkboardTeacher className="me-2 text-primary" /> My Teaching
          </h2>
          <Row className="g-3">
            {myCourses.length > 0 ? (
              myCourses.map((course) => (
                <Col md={6} lg={4} key={course.id}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <h5 className="card-title mb-2">{course.title}</h5>
                      <p className="text-muted small mb-3">
                        <FaChalkboardTeacher className="me-1" /> Instructor
                      </p>
                      <p className="card-text text-truncate mb-3">
                        {course.description}
                      </p>
                      <div className="d-flex align-items-center mb-3">
                        <Badge bg="info" className="me-2">
                          {course.enrollmentCount} students
                        </Badge>
                      </div>
                    </Card.Body>
                    <Card.Footer className="bg-white border-0 pt-0">
                      <div className="d-grid gap-2">
                        <Button
                          as={Link}
                          to={`/courses/${course.id}`}
                          variant="outline-primary"
                          size="sm"
                        >
                          View Course
                        </Button>
                        <Button
                          as={Link}
                          to={`/courses/editor/${course.id}`}
                          variant="outline-secondary"
                          size="sm"
                        >
                          Edit Content
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <FaChalkboardTeacher
                      className="text-muted mb-3"
                      size={40}
                    />
                    <h5>You haven't created any courses yet</h5>
                    <p className="text-muted mb-4">
                      Share your knowledge by creating your first course!
                    </p>
                    <Button as={Link} to="/courses/create" variant="primary">
                      Create Your First Course
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </>
      )}
    </Container>
  );
}

export default Dashboard;
