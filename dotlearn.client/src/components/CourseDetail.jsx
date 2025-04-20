import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Accordion,
  ListGroup,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModule, setActiveModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);

        // Get course details
        const courseResponse = await axios.get(`/api/courses/${id}`);
        setCourse(courseResponse.data);

        // If user is logged in, check enrollment status
        if (user) {
          try {
            const enrollmentsResponse = await axios.get(
              "/api/enrollments/courses",
            );
            const userEnrollment = enrollmentsResponse.data.find(
              (e) => e.id === parseInt(id),
            );
            setEnrollment(userEnrollment);
          } catch (err) {
            console.error("Error fetching enrollment:", err);
          }
        }

        // Set first module and lesson as active by default
        if (courseResponse.data.modules.length > 0) {
          setActiveModule(courseResponse.data.modules[0]);

          if (courseResponse.data.modules[0].lessons.length > 0) {
            setActiveLesson(courseResponse.data.modules[0].lessons[0]);
          }
        }
      } catch (err) {
        setError("Failed to load course details. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id, user]);

  const enrollInCourse = async () => {
    try {
      await axios.post("/api/enrollments", { courseId: parseInt(id) });
      alert("Successfully enrolled in the course!");

      // Refresh the enrollment status
      const enrollmentsResponse = await axios.get("/api/enrollments/courses");
      const userEnrollment = enrollmentsResponse.data.find(
        (e) => e.id === parseInt(id),
      );
      setEnrollment(userEnrollment);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to enroll in the course. Please try again.",
      );
      console.error(err);
    }
  };

  const deleteCourse = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/courses/${id}`);
      alert("Course deleted successfully.");
      navigate("/courses");
    } catch (err) {
      alert("Failed to delete the course. Please try again.");
      console.error(err);
    }
  };

  // Check if the logged in user is the instructor or admin
  const isInstructorOrAdmin = () => {
    if (!user || !course) return false;
    return (
      user.role === "Admin" ||
      (user.role === "Instructor" && parseInt(user.id) === course.instructorId)
    );
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading course details...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!course) {
    return <Alert variant="warning">Course not found.</Alert>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{course.title}</h1>

        <div>
          {isInstructorOrAdmin() && (
            <div className="d-flex gap-2">
              <Button
                as={Link}
                to={`/courses/editor/${course.id}`}
                variant="outline-primary"
                className="me-2"
              >
                Edit Course Content
              </Button>
              <Button
                as={Link}
                to={`/courses/edit/${course.id}`}
                variant="outline-primary"
                className="me-2"
              >
                Edit Course Details
              </Button>
              <Button variant="outline-danger" onClick={deleteCourse}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-md-flex justify-content-between">
            <div>
              <p className="text-muted mb-2">
                Instructor: {course.instructorName}
              </p>
              <p>{course.description}</p>
            </div>

            <div className="ms-md-4 mt-3 mt-md-0">
              {user ? (
                enrollment ? (
                  <div className="text-center">
                    <Badge bg="success" className="p-2 mb-3">
                      Enrolled
                    </Badge>
                    <p>Status: {enrollment.status}</p>
                    {enrollment.status === "Completed" && (
                      <p>
                        Completed on:{" "}
                        {new Date(
                          enrollment.completionDate,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  user.role === "Student" && (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100"
                      onClick={enrollInCourse}
                    >
                      Enroll Now
                    </Button>
                  )
                )
              ) : (
                <Alert variant="info">
                  <p className="mb-2">Want to enroll in this course?</p>
                  <Button as={Link} to="/login" variant="primary">
                    Login to Enroll
                  </Button>
                </Alert>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="row">
        <div className="col-md-4 mb-4 mb-md-0">
          <Card>
            <Card.Header>
              <h3>Course Content</h3>
            </Card.Header>
            <Card.Body className="p-0">
              {course.modules.length > 0 ? (
                <Accordion defaultActiveKey="0">
                  {course.modules.map((module, index) => (
                    <Accordion.Item key={module.id} eventKey={index.toString()}>
                      <Accordion.Header>
                        <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                          <div>{module.title}</div>
                          <Badge bg="secondary" pill>
                            {module.lessons?.length || 0} lessons
                          </Badge>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body className="p-0">
                        <ListGroup variant="flush">
                          {module.lessons?.length > 0 ? (
                            module.lessons.map((lesson) => (
                              <ListGroup.Item
                                key={lesson.id}
                                action
                                active={activeLesson?.id === lesson.id}
                                onClick={() => {
                                  setActiveModule(module);
                                  setActiveLesson(lesson);
                                }}
                                className="d-flex justify-content-between align-items-center"
                              >
                                <div>{lesson.title}</div>
                                <Badge
                                  bg={getLessonTypeBadgeColor(lesson.type)}
                                >
                                  {lesson.type}
                                </Badge>
                              </ListGroup.Item>
                            ))
                          ) : (
                            <ListGroup.Item className="text-center py-3">
                              <p className="text-muted mb-0">
                                No lessons in this module yet.
                              </p>
                            </ListGroup.Item>
                          )}
                        </ListGroup>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center p-4">
                  <p className="mb-0">
                    {isInstructorOrAdmin()
                      ? "You haven't added any content to this course yet."
                      : "No content available for this course yet."}
                  </p>
                  {isInstructorOrAdmin() && (
                    <Button
                      as={Link}
                      to={`/courses/editor/${course.id}`}
                      variant="primary"
                      className="mt-3"
                    >
                      Add Course Content
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-8">
          <Card>
            <Card.Header>
              <h3>
                {activeLesson
                  ? activeLesson.title
                  : activeModule
                    ? activeModule.title
                    : "Course Content"}
              </h3>
            </Card.Header>
            <Card.Body>
              {activeLesson ? (
                <div>
                  <p className="text-muted mb-4">
                    Module: {activeModule.title} • Lesson Type:{" "}
                    {activeLesson.type}
                  </p>

                  {/* Display lesson content based on type */}
                  {activeLesson.type === "Text" && (
                    <div>
                      {/* This would be the actual lesson content from API */}
                      <p>
                        This is a sample text lesson content. In a real
                        application, this would display the actual lesson
                        content retrieved from the API.
                      </p>
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat.
                      </p>

                      {isInstructorOrAdmin() && (
                        <Alert variant="info" className="mt-4">
                          <p className="mb-0">
                            As an instructor, you can see that this is
                            placeholder content. When you create real lessons,
                            your actual content will be displayed here.
                          </p>
                        </Alert>
                      )}
                    </div>
                  )}

                  {activeLesson.type === "Video" && (
                    <div className="text-center">
                      <p>Video content would be displayed here.</p>
                      <div className="bg-dark text-white p-5 d-flex align-items-center justify-content-center">
                        <h4>Video Player Placeholder</h4>
                      </div>

                      {isInstructorOrAdmin() && (
                        <Alert variant="info" className="mt-4">
                          <p className="mb-0">
                            When you create a video lesson, a video player will
                            be displayed here.
                          </p>
                        </Alert>
                      )}
                    </div>
                  )}

                  {activeLesson.type === "Quiz" && (
                    <div>
                      <p>Quiz content would be displayed here.</p>
                      <Alert variant="info">
                        <p className="mb-0">
                          This is a placeholder for quiz questions and answers.
                        </p>
                      </Alert>

                      {isInstructorOrAdmin() && (
                        <Alert variant="info" className="mt-4">
                          <p className="mb-0">
                            When you create a quiz lesson, interactive quiz
                            questions will be displayed here.
                          </p>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  {course.modules.length > 0 ? (
                    <p>
                      Select a lesson from the course content to begin learning.
                    </p>
                  ) : (
                    <p>This course doesn't have any content yet.</p>
                  )}

                  {isInstructorOrAdmin() && course.modules.length === 0 && (
                    <Button
                      as={Link}
                      to={`/courses/editor/${course.id}`}
                      variant="primary"
                      className="mt-3"
                    >
                      Add Course Content
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getLessonTypeBadgeColor(type) {
  switch (type) {
    case "Text":
      return "primary";
    case "Video":
      return "success";
    case "Quiz":
      return "warning";
    default:
      return "secondary";
  }
}

export default CourseDetail;
