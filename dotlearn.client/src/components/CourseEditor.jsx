import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Accordion,
  ListGroup,
  Form,
  Modal,
  Alert,
  Spinner,
  Badge,
  Container,
} from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import LessonModal from "./LessonModal";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBook,
  FaVideo,
  FaQuestionCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Module state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleFormData, setModuleFormData] = useState({
    title: "",
    editing: false,
    moduleId: null,
  });

  // Lesson state
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    content: "",
    type: "Text",
    moduleId: null,
    editing: false,
    lessonId: null,
  });

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);

        // Get course details
        const courseResponse = await axios.get(`/api/courses/${id}`);

        // Ensure all modules have a lessons array
        const courseData = courseResponse.data;
        if (courseData && courseData.modules) {
          courseData.modules = courseData.modules.map((module) => ({
            ...module,
            lessons: module.lessons || [], // Ensure lessons array exists
          }));
        }

        setCourse(courseData);
        setModules(courseData.modules || []);
      } catch (err) {
        setError("Failed to load course data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id]);

  // Check if user has permission to edit this course
  useEffect(() => {
    if (course && user) {
      const hasPermission =
        user.role === "Admin" ||
        (user.role === "Instructor" &&
          parseInt(user.id) === course.instructorId);

      if (!hasPermission) {
        navigate(`/courses/${id}`);
      }
    }
  }, [course, user, id, navigate]);

  // Module functions
  const openAddModuleModal = () => {
    setModuleFormData({
      title: "",
      editing: false,
      moduleId: null,
    });
    setShowModuleModal(true);
  };

  const openEditModuleModal = (module) => {
    setModuleFormData({
      title: module.title,
      editing: true,
      moduleId: module.id,
    });
    setShowModuleModal(true);
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (moduleFormData.editing) {
        // Update existing module
        await axios.put(`/api/modules/${moduleFormData.moduleId}`, {
          title: moduleFormData.title,
        });

        // Update local state
        setModules((prevModules) =>
          prevModules.map((m) =>
            m.id === moduleFormData.moduleId
              ? { ...m, title: moduleFormData.title }
              : m,
          ),
        );
      } else {
        // Create new module
        const response = await axios.post("/api/modules", {
          title: moduleFormData.title,
          courseId: parseInt(id),
        });

        // Ensure the new module has a lessons array
        const newModule = {
          ...response.data,
          lessons: [], // Initialize empty lessons array
        };

        // Add to local state
        setModules((prevModules) => [...prevModules, newModule]);
      }

      // Close modal
      setShowModuleModal(false);
    } catch (err) {
      setError("Failed to save module. Please try again.");
      console.error(err);
    }
  };

  const deleteModule = async (moduleId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this module and all its lessons? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/modules/${moduleId}`);

      // Remove from local state
      setModules((prevModules) => prevModules.filter((m) => m.id !== moduleId));
    } catch (err) {
      setError("Failed to delete module. Please try again.");
      console.error(err);
    }
  };

  // Lesson functions
  const openAddLessonModal = (moduleId) => {
    setLessonFormData({
      title: "",
      content: "",
      type: "Text",
      moduleId,
      editing: false,
      lessonId: null,
    });
    setShowLessonModal(true);
  };

  const openEditLessonModal = async (lessonId) => {
    try {
      setLoading(true);

      // Fetch the full lesson details including content
      const response = await axios.get(`/api/lessons/${lessonId}`);
      const lesson = response.data;

      // Set the form data with all the lesson details
      setLessonFormData({
        title: lesson.title,
        content: lesson.content, // Make sure content is included
        type: lesson.type,
        moduleId: lesson.moduleId,
        editing: true,
        lessonId: lessonId,
        courseId: id, // The course ID from the route params
      });

      // Now open the modal
      setShowLessonModal(true);
    } catch (err) {
      console.error("Error loading lesson data:", err);
      setError("Failed to load lesson data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSubmit = async (formData) => {
    try {
      if (lessonFormData.editing) {
        // Update existing lesson
        await axios.put(`/api/lessons/${lessonFormData.lessonId}`, {
          title: formData.title,
          content: formData.content,
          type: formData.type,
        });

        // Update local state
        setModules((prevModules) =>
          prevModules.map((m) => {
            if (m.id === lessonFormData.moduleId) {
              return {
                ...m,
                lessons:
                  m.lessons && m.lessons.length
                    ? m.lessons.map((l) =>
                        l.id === lessonFormData.lessonId
                          ? {
                              ...l,
                              title: formData.title,
                              type: formData.type,
                            }
                          : l,
                      )
                    : [], // If lessons array doesn't exist or is empty
              };
            }
            return m;
          }),
        );

        return { id: lessonFormData.lessonId };
      } else {
        // Create new lesson
        const response = await axios.post("/api/lessons", {
          title: formData.title,
          content: formData.content,
          moduleId: lessonFormData.moduleId,
          type: formData.type,
        });

        // Add to local state
        setModules((prevModules) =>
          prevModules.map((m) => {
            if (m.id === lessonFormData.moduleId) {
              return {
                ...m,
                lessons:
                  m.lessons && Array.isArray(m.lessons)
                    ? [...m.lessons, response.data]
                    : [response.data], // Create new array if it doesn't exist
              };
            }
            return m;
          }),
        );

        return response.data;
      }
    } catch (err) {
      console.error("Failed to save lesson:", err);
      throw err;
    }
  };

  const deleteLesson = async (lessonId, moduleId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this lesson? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/lessons/${lessonId}`);

      // Remove from local state
      setModules((prevModules) =>
        prevModules.map((m) => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: m.lessons.filter((l) => l.id !== lessonId),
            };
          }
          return m;
        }),
      );
    } catch (err) {
      setError("Failed to delete lesson. Please try again.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading course editor...</p>
        </div>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container>
        <Alert variant="warning">
          Course not found or you don't have permission to edit.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Edit Course Content</h1>

        <div>
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={() => navigate(`/courses/${id}`)}
          >
            Back to Course
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => navigate(`/courses/edit/${id}`)}
          >
            Edit Course Details
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h2 className="h5 mb-0">Course Modules</h2>
          <Button variant="primary" onClick={openAddModuleModal}>
            <FaPlus className="me-2" /> Add Module
          </Button>
        </Card.Header>
        <Card.Body>
          {modules && modules.length > 0 ? (
            <Accordion defaultActiveKey={modules[0]?.id.toString()}>
              {modules.map((module) => (
                <Accordion.Item key={module.id} eventKey={module.id.toString()}>
                  <Accordion.Header>
                    <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                      <div>{module.title}</div>
                      <Badge bg="secondary" pill>
                        {module.lessons?.length || 0} lessons
                      </Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openEditModuleModal(module)}
                          className="me-2"
                        >
                          <FaEdit className="me-1" /> Edit Module
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => deleteModule(module.id)}
                        >
                          <FaTrash className="me-1" /> Delete Module
                        </Button>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openAddLessonModal(module.id)}
                      >
                        <FaPlus className="me-1" /> Add Lesson
                      </Button>
                    </div>

                    <ListGroup variant="flush">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons.map((lesson) => (
                          <ListGroup.Item
                            key={lesson.id}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div className="d-flex align-items-center">
                              {getLessonTypeIcon(lesson.type)}
                              <div className="ms-2">{lesson.title}</div>
                            </div>
                            <div>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => openEditLessonModal(lesson.id)}
                                className="me-2"
                              >
                                <FaEdit /> Edit
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger"
                                onClick={() =>
                                  deleteLesson(lesson.id, module.id)
                                }
                              >
                                <FaTrash /> Delete
                              </Button>
                            </div>
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
            <div className="text-center py-5">
              <FaExclamationTriangle className="text-muted mb-3" size={40} />
              <p className="text-muted mb-3">
                This course doesn't have any modules yet.
              </p>
              <Button variant="primary" onClick={openAddModuleModal}>
                Add Your First Module
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Module Modal */}
      <Modal show={showModuleModal} onHide={() => setShowModuleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {moduleFormData.editing ? "Edit Module" : "Add Module"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModuleSubmit}>
          <Modal.Body>
            <Form.Group controlId="moduleTitle">
              <Form.Label>Module Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter module title"
                value={moduleFormData.title}
                onChange={(e) =>
                  setModuleFormData({
                    ...moduleFormData,
                    title: e.target.value,
                  })
                }
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowModuleModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {moduleFormData.editing ? "Save Changes" : "Add Module"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Lesson Modal */}
      <LessonModal
        show={showLessonModal}
        onHide={() => setShowLessonModal(false)}
        lessonData={lessonFormData}
        onSubmit={handleLessonSubmit}
        isEditing={lessonFormData.editing}
        courseId={id}
      />
    </Container>
  );
}

// Helper function to get lesson type icon
function getLessonTypeIcon(type) {
  switch (type) {
    case "Text":
      return <FaBook className="text-primary" />;
    case "Video":
      return <FaVideo className="text-success" />;
    case "Quiz":
      return <FaQuestionCircle className="text-warning" />;
    default:
      return <FaBook className="text-primary" />;
  }
}

export default CourseEditor;
