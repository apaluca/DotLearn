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
  ProgressBar,
} from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import LessonView from "./LessonView";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaBook,
  FaVideo,
  FaQuestionCircle,
  FaPencilAlt,
  FaTrash,
  FaCheckCircle,
  FaUser,
  FaChartLine,
} from "react-icons/fa";

function CourseDetail() {
  const { id, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [courseProgress, setCourseProgress] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModule, setActiveModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [enrollingInProgress, setEnrollingInProgress] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        if (!id) {
          setError("Course ID is missing. Please return to the course list.");
          setLoading(false);
          return;
        }
        setLoading(true);

        // Get course details
        const courseResponse = await axios.get(`/api/courses/${id}`);
        setCourse(courseResponse.data);
        setModules(courseResponse.data.modules);

        // If user is logged in, check enrollment status and progress
        if (user) {
          try {
            // Check enrollment
            const enrollmentsResponse = await axios.get(
              "/api/enrollments/courses",
            );
            const userEnrollment = enrollmentsResponse.data.find(
              (e) => e.id === parseInt(id),
            );
            setEnrollment(userEnrollment);

            // Get course progress if enrolled
            if (userEnrollment) {
              try {
                const progressResponse = await axios.get(
                  `/api/progress/course/${id}`,
                );
                setCourseProgress(progressResponse.data);
              } catch (err) {
                console.error("Error fetching course progress:", err);
              }
            }
          } catch (err) {
            console.error("Error fetching enrollment:", err);
          }
        }

        // Find the first module with lessons by default
        const firstModuleWithLessons = courseResponse.data.modules.find(
          (m) => m.lessons && m.lessons.length > 0,
        );

        // If a specific lesson ID is provided in the URL
        if (lessonId) {
          setLoadingLesson(true);
          // Find the lesson and its module
          for (const module of courseResponse.data.modules) {
            const lesson = module.lessons.find(
              (l) => l.id === parseInt(lessonId),
            );
            if (lesson) {
              setActiveModule(module);
              setActiveLesson(lesson);
              break;
            }
          }
          setLoadingLesson(false);
        }
        // Otherwise set default active module and lesson
        else if (firstModuleWithLessons) {
          setActiveModule(firstModuleWithLessons);
          if (firstModuleWithLessons.lessons.length > 0) {
            setActiveLesson(firstModuleWithLessons.lessons[0]);
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
  }, [id, lessonId, user]);

  const handleLessonSelect = (module, lesson) => {
    setLoadingLesson(true);
    setActiveModule(module);
    setActiveLesson(lesson);

    // Update the URL without reloading the page
    navigate(`/courses/${id}/lesson/${lesson.id}`, { replace: true });
    setLoadingLesson(false);
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

  const handleLessonComplete = async (lessonId, isCompleted = true) => {
    // Update local state to reflect completion or uncompletion
    setModules((prevModules) =>
      prevModules.map((m) => {
        if (m.id === activeModule.id) {
          return {
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lessonId ? { ...l, isCompleted } : l,
            ),
          };
        }
        return m;
      }),
    );

    // Refresh progress data
    try {
      const progressResponse = await axios.get(`/api/progress/course/${id}`);
      setCourseProgress(progressResponse.data);
    } catch (err) {
      console.error("Error refreshing course progress:", err);
    }
  };

  const getNextLesson = () => {
    if (!activeLesson || !activeModule) return null;

    // Find current lesson index
    const currentLessonIndex = activeModule.lessons.findIndex(
      (l) => l.id === activeLesson.id,
    );

    // Check if there's another lesson in this module
    if (currentLessonIndex < activeModule.lessons.length - 1) {
      return activeModule.lessons[currentLessonIndex + 1];
    }

    // If not, check if there's another module
    const currentModuleIndex = modules.findIndex(
      (m) => m.id === activeModule.id,
    );

    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule.lessons && nextModule.lessons.length > 0) {
        return nextModule.lessons[0];
      }
    }

    return null;
  };

  const getPreviousLesson = () => {
    if (!activeLesson || !activeModule) return null;

    // Find current lesson index
    const currentLessonIndex = activeModule.lessons.findIndex(
      (l) => l.id === activeLesson.id,
    );

    // Check if there's a previous lesson in this module
    if (currentLessonIndex > 0) {
      return activeModule.lessons[currentLessonIndex - 1];
    }

    // If not, check if there's a previous module
    const currentModuleIndex = modules.findIndex(
      (m) => m.id === activeModule.id,
    );

    if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1];
      if (prevModule.lessons && prevModule.lessons.length > 0) {
        return prevModule.lessons[prevModule.lessons.length - 1];
      }
    }

    return null;
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

  // Get lesson progress status
  const getLessonProgressStatus = (lessonId) => {
    if (!courseProgress) return "not-started";

    for (const module of courseProgress.modules) {
      for (const lesson of module.lessons) {
        if (lesson.lessonId === lessonId) {
          if (lesson.isCompleted) return "completed";
          if (lesson.startedAt) return "in-progress";
        }
      }
    }

    return "not-started";
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
        <h1 className="mb-0">{course.title}</h1>

        <div>
          {isInstructorOrAdmin() && (
            <div className="d-flex gap-2">
              <Button
                as={Link}
                to={`/courses/${id}/students`}
                variant="outline-primary"
                className="d-flex align-items-center gap-2"
              >
                <FaUsers /> View Students
              </Button>
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

                    {courseProgress && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span>Progress:</span>
                          <span>
                            {Math.round(courseProgress.progressPercentage)}%
                          </span>
                        </div>
                        <ProgressBar
                          now={courseProgress.progressPercentage}
                          variant={
                            courseProgress.progressPercentage >= 100
                              ? "success"
                              : courseProgress.progressPercentage >= 50
                                ? "info"
                                : "primary"
                          }
                          style={{ height: "10px" }}
                        />
                        <div className="text-muted small mt-1">
                          {courseProgress.completedLessons} of{" "}
                          {courseProgress.totalLessons} lessons completed
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2 justify-content-center">
                      <Button
                        as={Link}
                        to={`/courses/${id}/progress`}
                        variant="outline-primary"
                        className="d-flex align-items-center gap-2"
                      >
                        <FaChartLine /> View Progress
                      </Button>
                    </div>
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
              {modules.length > 0 ? (
                <Accordion
                  defaultActiveKey={
                    activeModule ? activeModule.id.toString() : "0"
                  }
                >
                  {modules.map((module) => (
                    <Accordion.Item
                      key={module.id}
                      eventKey={module.id.toString()}
                    >
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
                            module.lessons.map((lesson) => {
                              const progressStatus = getLessonProgressStatus(
                                lesson.id,
                              );

                              return (
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
                                    <div>
                                      {lesson.title}
                                      {progressStatus === "completed" && (
                                        <div className="text-success small">
                                          <FaCheckCircle className="me-1" />{" "}
                                          Completed
                                        </div>
                                      )}
                                      {progressStatus === "in-progress" && (
                                        <div className="text-warning small">
                                          In Progress
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Badge
                                    bg={getLessonTypeBadgeColor(lesson.type)}
                                  >
                                    {lesson.type}
                                  </Badge>
                                </ListGroup.Item>
                              );
                            })
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
                    <LessonView
                      lesson={activeLesson}
                      moduleTitle={activeModule.title}
                      onLessonComplete={handleLessonComplete}
                      nextLesson={getNextLesson()}
                      prevLesson={getPreviousLesson()}
                      isInstructor={isInstructor()}
                    />
                  )
                ) : (
                  <div className="text-center py-4">
                    {modules.length > 0 ? (
                      <p>
                        Select a lesson from the course content to begin
                        learning.
                      </p>
                    ) : (
                      <p>This course doesn't have any content yet.</p>
                    )}

                    {isInstructorOrAdmin() && modules.length === 0 && (
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
