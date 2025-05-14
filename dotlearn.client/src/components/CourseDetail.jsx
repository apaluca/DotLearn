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
  ProgressBar,
  Container,
  Row,
  Col,
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
  FaEdit,
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

        if (courseResponse.data && courseResponse.data.modules) {
          courseResponse.data.modules = courseResponse.data.modules.map(
            (module) => ({
              ...module,
              lessons: module.lessons || [], // Ensure lessons array exists
            }),
          );
        }
        setCourse(courseResponse.data);
        setModules(courseResponse.data.modules || []);

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

                // Find appropriate lesson if not specified
                if (progressResponse.data && !lessonId) {
                  findAndSetActiveLesson(
                    courseResponse.data.modules,
                    progressResponse.data,
                  );
                }
              } catch (err) {
                console.error("Error fetching course progress:", err);
              }
            }
          } catch (err) {
            console.error("Error fetching enrollment:", err);
          }
        }

        // Find first module with lessons by default
        const firstModuleWithLessons = courseResponse.data.modules.find(
          (m) => m.lessons && m.lessons.length > 0,
        );

        // If a specific lesson ID is provided
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
        else if (firstModuleWithLessons && !activeLesson) {
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

  // Helper function to find and set the lesson based on progress
  const findAndSetActiveLesson = (modules, progressData) => {
    // Find a lesson that's in progress
    let lessonInProgress = null;
    let moduleOfLessonInProgress = null;

    // Track the last completed lesson
    let lastCompletedLesson = null;
    let moduleOfLastCompletedLesson = null;

    // Loop through all modules and their lessons
    for (const module of modules) {
      if (!module.lessons || module.lessons.length === 0) continue;

      for (const lesson of module.lessons) {
        // Find matching progress data
        let foundProgress = false;

        for (const moduleProgress of progressData.modules) {
          for (const lessonProgress of moduleProgress.lessons) {
            if (lessonProgress.lessonId === lesson.id) {
              foundProgress = true;

              // If started but not completed, that's our priority
              if (lessonProgress.startedAt && !lessonProgress.isCompleted) {
                lessonInProgress = lesson;
                moduleOfLessonInProgress = module;
                break;
              }

              // Track the last completed lesson
              if (lessonProgress.isCompleted) {
                lastCompletedLesson = lesson;
                moduleOfLastCompletedLesson = module;
              }
            }
          }
          if (foundProgress) break;
        }

        if (lessonInProgress) break;
      }

      if (lessonInProgress) break;
    }

    // If found a lesson in progress, set it active
    if (lessonInProgress && moduleOfLessonInProgress) {
      setActiveModule(moduleOfLessonInProgress);
      setActiveLesson(lessonInProgress);
      navigate(`/courses/${id}/lesson/${lessonInProgress.id}`, {
        replace: true,
      });
      return;
    }

    // If found a completed lesson, find the next one
    if (lastCompletedLesson && moduleOfLastCompletedLesson) {
      // Find index of last completed lesson
      const lessonIndex = moduleOfLastCompletedLesson.lessons.findIndex(
        (l) => l.id === lastCompletedLesson.id,
      );

      // If there's a next lesson in same module
      if (lessonIndex < moduleOfLastCompletedLesson.lessons.length - 1) {
        const nextLesson = moduleOfLastCompletedLesson.lessons[lessonIndex + 1];
        setActiveModule(moduleOfLastCompletedLesson);
        setActiveLesson(nextLesson);
        navigate(`/courses/${id}/lesson/${nextLesson.id}`, { replace: true });
        return;
      }

      // If we need to move to next module
      const moduleIndex = modules.findIndex(
        (m) => m.id === moduleOfLastCompletedLesson.id,
      );
      if (moduleIndex < modules.length - 1) {
        // Find next module with lessons
        for (let i = moduleIndex + 1; i < modules.length; i++) {
          if (modules[i].lessons && modules[i].lessons.length > 0) {
            setActiveModule(modules[i]);
            setActiveLesson(modules[i].lessons[0]);
            navigate(`/courses/${id}/lesson/${modules[i].lessons[0].id}`, {
              replace: true,
            });
            return;
          }
        }
      }
    }
  };

  const handleLessonSelect = (module, lesson) => {
    setLoadingLesson(true);
    setActiveModule(module);
    setActiveLesson(lesson);
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

      // Refresh enrollment status
      const enrollmentsResponse = await axios.get("/api/enrollments/courses");
      const userEnrollment = enrollmentsResponse.data.find(
        (e) => e.id === parseInt(id),
      );
      setEnrollment(userEnrollment);
    } catch (err) {
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
      navigate("/courses");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLessonComplete = async (lessonId, isCompleted = true) => {
    // Update local state
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

  // Navigation functions
  const getNextLesson = () => {
    if (!activeLesson || !activeModule) return null;

    // Find current lesson index
    const currentLessonIndex = activeModule.lessons.findIndex(
      (l) => l.id === activeLesson.id,
    );

    // If there's another lesson in this module
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

    // If there's a previous lesson in this module
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

  // Check if user is instructor or admin
  const isInstructorOrAdmin = () => {
    if (!user || !course) return false;
    return (
      user.role === "Admin" ||
      (user.role === "Instructor" && parseInt(user.id) === course.instructorId)
    );
  };

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
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading course details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container>
        <Alert variant="warning">Course not found.</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <h1 className="mb-3 mb-md-0">{course.title}</h1>

        {isInstructorOrAdmin() && (
          <div className="d-flex gap-2 flex-wrap">
            <Button
              as={Link}
              to={`/courses/${id}/students`}
              variant="outline-primary"
              className="d-flex align-items-center gap-2"
              size="sm"
            >
              <FaUsers /> Students
            </Button>
            <Button
              as={Link}
              to={`/courses/editor/${course.id}`}
              variant="outline-primary"
              className="d-flex align-items-center gap-2"
              size="sm"
            >
              <FaBook /> Edit Content
            </Button>
            <Button
              as={Link}
              to={`/courses/edit/${course.id}`}
              variant="outline-primary"
              className="d-flex align-items-center gap-2"
              size="sm"
            >
              <FaEdit /> Edit Details
            </Button>
            <Button
              variant="outline-danger"
              onClick={deleteCourse}
              className="d-flex align-items-center gap-2"
              size="sm"
            >
              <FaTrash /> Delete
            </Button>
          </div>
        )}
      </div>

      <Row className="mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4 mb-lg-0">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <FaChalkboardTeacher className="text-primary me-2" />
                <span className="text-muted">
                  Instructor: {course.instructorName}
                </span>
              </div>

              <p>{course.description}</p>

              {isInstructor() && (
                <Alert
                  variant="info"
                  className="mt-3 mb-0 d-flex align-items-center"
                >
                  <FaChalkboardTeacher className="me-2" />
                  <span>You are the instructor of this course</span>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              {user ? (
                enrollment ? (
                  <>
                    <div className="text-center mb-3">
                      <Badge bg="success" className="px-3 py-2 mb-3">
                        <FaCheckCircle className="me-2" /> Enrolled
                      </Badge>

                      {courseProgress && (
                        <div className="mt-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span>Your Progress</span>
                            <span className="fw-bold">
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
                            className="mb-2"
                          />
                          <small className="text-muted">
                            {courseProgress.completedLessons} of{" "}
                            {courseProgress.totalLessons} lessons completed
                          </small>
                        </div>
                      )}
                    </div>

                    <Button
                      as={Link}
                      to={`/courses/${id}/progress`}
                      variant="outline-primary"
                      className="d-flex align-items-center justify-content-center gap-2 mt-auto"
                    >
                      <FaChartLine /> View Detailed Progress
                    </Button>
                  </>
                ) : (
                  user.role === "Student" &&
                  !isInstructor() && (
                    <Button
                      variant="primary"
                      className="py-2"
                      onClick={enrollInCourse}
                      disabled={enrollingInProgress}
                    >
                      {enrollingInProgress ? "Enrolling..." : "Enroll Now"}
                    </Button>
                  )
                )
              ) : (
                <div className="text-center">
                  <p className="mb-3">Want to enroll in this course?</p>
                  <Button as={Link} to="/login" variant="primary">
                    Sign In to Enroll
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={4} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light border-0">
              <h3 className="h5 mb-0">Course Content</h3>
            </Card.Header>
            <Card.Body className="p-0">
              {modules.length > 0 ? (
                <Accordion
                  defaultActiveKey={
                    activeModule ? activeModule.id.toString() : "0"
                  }
                  alwaysOpen
                >
                  {modules.map((module) => (
                    <Accordion.Item
                      key={module.id}
                      eventKey={module.id.toString()}
                      className="border-0 border-bottom"
                    >
                      <Accordion.Header className="py-3">
                        <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                          <div>{module.title}</div>
                          <Badge bg="secondary" pill>
                            {module.lessons?.length || 0}
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
                                  className="border-0 py-3 ps-4"
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                      {lesson.type === "Text" && (
                                        <FaBook className="me-2 text-primary" />
                                      )}
                                      {lesson.type === "Video" && (
                                        <FaVideo className="me-2 text-success" />
                                      )}
                                      {lesson.type === "Quiz" && (
                                        <FaQuestionCircle className="me-2 text-warning" />
                                      )}
                                      <div>
                                        <div>{lesson.title}</div>
                                        {progressStatus === "completed" && (
                                          <small className="text-success d-flex align-items-center">
                                            <FaCheckCircle className="me-1" />{" "}
                                            Completed
                                          </small>
                                        )}
                                        {progressStatus === "in-progress" && (
                                          <small className="text-warning">
                                            In Progress
                                          </small>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              );
                            })
                          ) : (
                            <ListGroup.Item className="text-center py-3 border-0">
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
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              {/* Check if user can access content */}
              {!user ? (
                <Alert variant="warning">
                  <p className="mb-3">Please sign in to view course content.</p>
                  <Button as={Link} to="/login" variant="primary">
                    Sign In
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
                        <Spinner
                          animation="border"
                          variant="primary"
                          size="sm"
                        />
                        <p className="mt-2">Loading lesson content...</p>
                      </div>
                    ) : (
                      <LessonView
                        lesson={activeLesson}
                        onLessonComplete={handleLessonComplete}
                        nextLesson={getNextLesson()}
                        prevLesson={getPreviousLesson()}
                        isInstructor={isInstructor()}
                        isEnrolled={!!enrollment}
                      />
                    )
                  ) : (
                    <div className="text-center py-5">
                      {modules.length > 0 ? (
                        <>
                          <FaBook className="text-primary mb-3" size={40} />
                          <h2 className="h4 mb-3">Ready to Begin Learning?</h2>
                          <p className="mb-4">
                            Select a lesson from the course content to start
                            your learning journey.
                          </p>
                          {modules[0]?.lessons?.length > 0 && (
                            <Button
                              variant="primary"
                              onClick={() =>
                                handleLessonSelect(
                                  modules[0],
                                  modules[0].lessons[0],
                                )
                              }
                            >
                              Start First Lesson
                            </Button>
                          )}
                        </>
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
                          <FaEdit className="me-2" /> Add Course Content
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CourseDetail;
