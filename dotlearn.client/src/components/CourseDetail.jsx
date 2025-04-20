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
  Breadcrumb,
} from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  FaChalkboardTeacher,
  FaBook,
  FaVideo,
  FaQuestionCircle,
  FaArrowLeft,
  FaPencilAlt,
  FaTrash,
  FaCheckCircle,
  FaUser,
} from "react-icons/fa";

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
  const [lessonContent, setLessonContent] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [enrollingInProgress, setEnrollingInProgress] = useState(false);

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
            const firstLesson = courseResponse.data.modules[0].lessons[0];
            setActiveLesson(firstLesson);
            fetchLessonContent(firstLesson.id);
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

  const fetchLessonContent = async (lessonId) => {
    try {
      setLoadingLesson(true);
      setLessonContent(null); // Clear previous lesson content
      const response = await axios.get(`/api/lessons/${lessonId}`);
      setLessonContent(response.data);
    } catch (err) {
      console.error("Error fetching lesson content:", err);
      // Check for specific error types to provide better feedback
      if (err.response) {
        if (err.response.status === 403) {
          alert(
            "You don't have permission to access this lesson. Please make sure you're enrolled in this course.",
          );
        } else if (err.response.status === 404) {
          alert("Lesson not found. It may have been deleted or moved.");
        } else {
          alert(
            `Error loading lesson: ${err.response.data || "Unknown error occurred"}`,
          );
        }
      } else if (err.request) {
        // Request was made but no response received
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Failed to load lesson content. Please try again later.");
      }
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleLessonSelect = (module, lesson) => {
    setActiveModule(module);
    setActiveLesson(lesson);
    fetchLessonContent(lesson.id);
  };

  const enrollInCourse = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setEnrollingInProgress(true);
      await axios.post("/api/enrollments", { courseId: parseInt(id) });

      // Refresh the enrollment status
      const enrollmentsResponse = await axios.get("/api/enrollments/courses");
      const userEnrollment = enrollmentsResponse.data.find(
        (e) => e.id === parseInt(id),
      );
      setEnrollment(userEnrollment);
      alert("Successfully enrolled in the course!");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to enroll in the course. Please try again.",
      );
      console.error(err);
    } finally {
      setEnrollingInProgress(false);
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

  // Check if the current user is the instructor of this course
  const isInstructor = () => {
    if (!user || !course) return false;
    return parseInt(user.id) === course.instructorId;
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
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/courses" }}>
          Courses
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{course.title}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">{course.title}</h1>

        <div>
          {isInstructorOrAdmin() && (
            <div className="d-flex gap-2">
              <Button
                as={Link}
                to={`/courses/editor/${course.id}`}
                variant="outline-primary"
                className="d-flex align-items-center gap-2"
              >
                <FaBook /> Edit Content
              </Button>
              <Button
                as={Link}
                to={`/courses/edit/${course.id}`}
                variant="outline-primary"
                className="d-flex align-items-center gap-2"
              >
                <FaPencilAlt /> Edit Details
              </Button>
              <Button
                variant="outline-danger"
                onClick={deleteCourse}
                className="d-flex align-items-center gap-2"
              >
                <FaTrash /> Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-md-flex justify-content-between">
            <div>
              <p className="text-muted mb-2 d-flex align-items-center gap-2">
                <FaChalkboardTeacher /> Instructor: {course.instructorName}
              </p>
              <p>{course.description}</p>

              {isInstructor() && (
                <Alert variant="info" className="mt-3 mb-0">
                  <div className="d-flex align-items-center gap-2">
                    <FaUser />
                    <span>You are the instructor of this course</span>
                  </div>
                </Alert>
              )}
            </div>

            <div className="ms-md-4 mt-3 mt-md-0">
              {user ? (
                enrollment ? (
                  <div className="text-center">
                    <Badge
                      bg="success"
                      className="p-2 mb-3 d-flex align-items-center gap-2 mx-auto"
                    >
                      <FaCheckCircle /> Enrolled
                    </Badge>
                    <p className="mb-2">Status: {enrollment.status}</p>
                    {enrollment.status === "Completed" ? (
                      <p className="mb-0">
                        Completed on:{" "}
                        {new Date(
                          enrollment.completionDate,
                        ).toLocaleDateString()}
                      </p>
                    ) : (
                      <Button
                        as={Link}
                        to="#course-content"
                        variant="primary"
                        className="w-100"
                        onClick={() => {
                          document
                            .getElementById("course-content")
                            .scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Continue Learning
                      </Button>
                    )}
                  </div>
                ) : (
                  user.role === "Student" &&
                  !isInstructor() && (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100"
                      onClick={enrollInCourse}
                      disabled={enrollingInProgress}
                    >
                      {enrollingInProgress ? "Enrolling..." : "Enroll Now"}
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

      <div className="row" id="course-content">
        <div className="col-md-4 mb-4 mb-md-0">
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h3 className="h5 mb-0">Course Content</h3>
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
                                onClick={() =>
                                  handleLessonSelect(module, lesson)
                                }
                                className="d-flex justify-content-between align-items-center"
                              >
                                <div className="d-flex align-items-center">
                                  {lesson.type === "Text" && (
                                    <FaBook className="me-2" />
                                  )}
                                  {lesson.type === "Video" && (
                                    <FaVideo className="me-2" />
                                  )}
                                  {lesson.type === "Quiz" && (
                                    <FaQuestionCircle className="me-2" />
                                  )}
                                  {lesson.title}
                                </div>
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
          <Card className="shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h3 className="h5 mb-0">
                {activeLesson
                  ? activeLesson.title
                  : activeModule
                    ? activeModule.title
                    : "Course Content"}
              </h3>
              {activeModule && activeLesson && (
                <Button
                  variant="link"
                  className="p-0 text-decoration-none"
                  onClick={() => {
                    setActiveLesson(null);
                    setLessonContent(null);
                  }}
                >
                  <FaArrowLeft className="me-1" /> Back to modules
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {/* Check if user can access content */}
              {!user ? (
                <Alert variant="warning">
                  <p className="mb-3">Please login to view course content.</p>
                  <Button as={Link} to="/login" variant="primary">
                    Login
                  </Button>
                </Alert>
              ) : !enrollment && !isInstructorOrAdmin() ? (
                <Alert variant="info">
                  <p className="mb-3">
                    You need to enroll in this course to access its content.
                  </p>
                  <Button
                    onClick={enrollInCourse}
                    variant="primary"
                    disabled={enrollingInProgress}
                  >
                    {enrollingInProgress ? "Enrolling..." : "Enroll Now"}
                  </Button>
                </Alert>
              ) : (
                <>
                  {activeLesson ? (
                    loadingLesson ? (
                      <div className="text-center my-5">
                        <Spinner animation="border" size="sm" />
                        <p className="mt-2">Loading lesson content...</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted mb-4">
                          Module: {activeModule.title} • Lesson Type:{" "}
                          <Badge
                            bg={getLessonTypeBadgeColor(activeLesson.type)}
                          >
                            {activeLesson.type}
                          </Badge>
                        </p>

                        {/* Display actual lesson content based on type */}
                        {activeLesson.type === "Text" && lessonContent && (
                          <div className="lesson-content">
                            {lessonContent.content}
                          </div>
                        )}

                        {activeLesson.type === "Video" && lessonContent && (
                          <div className="text-center">
                            {lessonContent.content.includes("youtube.com") ||
                            lessonContent.content.includes("youtu.be") ? (
                              <div className="ratio ratio-16x9">
                                <iframe
                                  src={lessonContent.content.replace(
                                    "watch?v=",
                                    "embed/",
                                  )}
                                  title={lessonContent.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              </div>
                            ) : (
                              <div className="bg-dark text-white p-5 d-flex align-items-center justify-content-center">
                                <h4>Video URL: {lessonContent.content}</h4>
                              </div>
                            )}
                          </div>
                        )}

                        {activeLesson.type === "Quiz" && lessonContent && (
                          <div>
                            <div className="lesson-content">
                              {lessonContent.content}
                            </div>
                            <Alert variant="info" className="mt-4">
                              <p className="mb-0">
                                Quiz functionality will be implemented in a
                                future update.
                              </p>
                            </Alert>
                          </div>
                        )}

                        {!lessonContent && (
                          <Alert variant="warning">
                            <p className="mb-0">
                              Failed to load lesson content. Please try again.
                            </p>
                          </Alert>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-4">
                      {course.modules.length > 0 ? (
                        <p>
                          Select a lesson from the course content to begin
                          learning.
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
                </>
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
