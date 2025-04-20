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
} from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
        setCourse(courseResponse.data);
        setModules(courseResponse.data.modules);
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

        // Add to local state
        setModules((prevModules) => [...prevModules, response.data]);
      }

      // Close modal
      setShowModuleModal(false);
    } catch (err) {
      alert("Failed to save module. Please try again.");
      console.error(err);
    }
  };

  const deleteModule = async (moduleId) => {
    if (
      !confirm(
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
      alert("Failed to delete module. Please try again.");
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
      const response = await axios.get(`/api/lessons/${lessonId}`);
      const lesson = response.data;

      setLessonFormData({
        title: lesson.title,
        content: lesson.content,
        type: lesson.type,
        moduleId: lesson.moduleId,
        editing: true,
        lessonId,
      });
      setShowLessonModal(true);
    } catch (err) {
      alert("Failed to load lesson data. Please try again.");
      console.error(err);
    }
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();

    try {
      if (lessonFormData.editing) {
        // Update existing lesson
        await axios.put(`/api/lessons/${lessonFormData.lessonId}`, {
          title: lessonFormData.title,
          content: lessonFormData.content,
          type: lessonFormData.type,
        });

        // Update local state
        setModules((prevModules) =>
          prevModules.map((m) => {
            if (m.id === lessonFormData.moduleId) {
              return {
                ...m,
                lessons: m.lessons.map((l) =>
                  l.id === lessonFormData.lessonId
                    ? {
                        ...l,
                        title: lessonFormData.title,
                        type: lessonFormData.type,
                      }
                    : l,
                ),
              };
            }
            return m;
          }),
        );
      } else {
        // Create new lesson
        const response = await axios.post("/api/lessons", {
          title: lessonFormData.title,
          content: lessonFormData.content,
          moduleId: lessonFormData.moduleId,
          type: lessonFormData.type,
        });

        // Add to local state
        setModules((prevModules) =>
          prevModules.map((m) => {
            if (m.id === lessonFormData.moduleId) {
              return {
                ...m,
                lessons: [...m.lessons, response.data],
              };
            }
            return m;
          }),
        );
      }

      // Close modal
      setShowLessonModal(false);
    } catch (err) {
      alert("Failed to save lesson. Please try again.");
      console.error(err);
    }
  };

  const deleteLesson = async (lessonId, moduleId) => {
    if (
      !confirm(
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
      alert("Failed to delete lesson. Please try again.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading course editor...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <Alert variant="warning">
        Course not found or you don't have permission to edit.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Edit Course Content: {course.title}</h1>

        <div>
          <Button
            variant="outline-secondary"
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

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2>Course Modules</h2>
          <Button variant="primary" onClick={openAddModuleModal}>
            Add Module
          </Button>
        </Card.Header>
        <Card.Body>
          {modules.length > 0 ? (
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
                          Edit Module
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => deleteModule(module.id)}
                        >
                          Delete Module
                        </Button>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openAddLessonModal(module.id)}
                      >
                        Add Lesson
                      </Button>
                    </div>

                    <ListGroup variant="flush">
                      {module.lessons?.length > 0 ? (
                        module.lessons.map((lesson) => (
                          <ListGroup.Item
                            key={lesson.id}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div className="d-flex align-items-center">
                              <Badge
                                bg={getLessonTypeBadgeColor(lesson.type)}
                                className="me-2"
                              >
                                {lesson.type}
                              </Badge>
                              {lesson.title}
                            </div>
                            <div>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => openEditLessonModal(lesson.id)}
                                className="me-2"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger"
                                onClick={() =>
                                  deleteLesson(lesson.id, module.id)
                                }
                              >
                                Delete
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
      <Modal
        show={showLessonModal}
        onHide={() => setShowLessonModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {lessonFormData.editing ? "Edit Lesson" : "Add Lesson"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleLessonSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="lessonTitle">
              <Form.Label>Lesson Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter lesson title"
                value={lessonFormData.title}
                onChange={(e) =>
                  setLessonFormData({
                    ...lessonFormData,
                    title: e.target.value,
                  })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="lessonType">
              <Form.Label>Lesson Type</Form.Label>
              <Form.Select
                value={lessonFormData.type}
                onChange={(e) =>
                  setLessonFormData({ ...lessonFormData, type: e.target.value })
                }
              >
                <option value="Text">Text</option>
                <option value="Video">Video</option>
                <option value="Quiz">Quiz</option>
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="lessonContent">
              <Form.Label>Lesson Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                placeholder="Enter lesson content"
                value={lessonFormData.content}
                onChange={(e) =>
                  setLessonFormData({
                    ...lessonFormData,
                    content: e.target.value,
                  })
                }
                required
              />
              <Form.Text className="text-muted">
                For Text lessons, add your content here. For Video lessons,
                paste the video URL. For Quiz lessons, format your questions and
                answers.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowLessonModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {lessonFormData.editing ? "Save Changes" : "Add Lesson"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
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

export default CourseEditor;
