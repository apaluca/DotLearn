import { useState, useEffect } from "react";
import {
  Card,
  ProgressBar,
  ListGroup,
  Accordion,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaClock,
  FaBook,
  FaVideo,
  FaQuestionCircle,
  FaPlay,
} from "react-icons/fa";

function CourseProgress() {
  const { id } = useParams();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/progress/course/${id}`);
        setProgress(response.data);
      } catch (err) {
        console.error("Error fetching course progress:", err);
        setError(
          err.response?.data ||
            "Failed to load course progress. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading progress...</span>
        </Spinner>
        <p className="mt-2">Loading your progress...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!progress) {
    return <Alert variant="info">No progress data available.</Alert>;
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-light">
        <h3 className="h5 mb-0">Your Course Progress</h3>
      </Card.Header>

      <Card.Body>
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h4 className="h6 mb-0">Overall Progress</h4>
              <p className="text-muted mb-0 small">
                {progress.completedLessons} of {progress.totalLessons} lessons
                completed
              </p>
            </div>
            <Badge
              bg={getProgressBadgeColor(progress.progressPercentage)}
              className="py-2 px-3"
            >
              {Math.round(progress.progressPercentage)}%
            </Badge>
          </div>
          <ProgressBar
            now={progress.progressPercentage}
            variant={getProgressVariant(progress.progressPercentage)}
            style={{ height: "10px" }}
            className="mt-2"
          />
        </div>

        <Accordion defaultActiveKey="0">
          {progress.modules.map((module, index) => (
            <Accordion.Item key={module.moduleId} eventKey={index.toString()}>
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                  <div>
                    <span className="me-2">{module.moduleTitle}</span>
                    <ProgressBar
                      now={module.progressPercentage}
                      variant={getProgressVariant(module.progressPercentage)}
                      style={{ width: "100px", height: "8px" }}
                      className="d-inline-block"
                    />
                  </div>
                  <Badge bg={getProgressBadgeColor(module.progressPercentage)}>
                    {module.completedLessons}/{module.totalLessons}
                  </Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body className="p-0">
                <ListGroup variant="flush">
                  {module.lessons.map((lesson) => (
                    <ListGroup.Item
                      key={lesson.lessonId}
                      className="d-flex justify-content-between align-items-center py-3"
                    >
                      <div className="d-flex align-items-center">
                        {getLessonTypeIcon(lesson.lessonTitle)}
                        <div className="ms-3">
                          <div>{lesson.lessonTitle}</div>
                          {lesson.startedAt && !lesson.isCompleted && (
                            <div className="text-muted small d-flex align-items-center mt-1">
                              <FaClock className="me-1" /> Started:{" "}
                              {new Date(lesson.startedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {lesson.isCompleted ? (
                          <Badge
                            bg="success"
                            className="d-flex align-items-center gap-1"
                          >
                            <FaCheckCircle /> Completed
                          </Badge>
                        ) : lesson.startedAt ? (
                          <Badge
                            bg="warning"
                            className="d-flex align-items-center gap-1"
                          >
                            <FaPlay /> In Progress
                          </Badge>
                        ) : (
                          <Badge bg="secondary">Not Started</Badge>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Card.Body>
    </Card>
  );
}

function getProgressVariant(percentage) {
  if (percentage >= 100) return "success";
  if (percentage >= 75) return "info";
  if (percentage >= 50) return "primary";
  if (percentage >= 25) return "warning";
  return "danger";
}

function getProgressBadgeColor(percentage) {
  if (percentage >= 100) return "success";
  if (percentage >= 75) return "info";
  if (percentage >= 50) return "primary";
  if (percentage >= 25) return "warning";
  return "danger";
}

function getLessonTypeIcon(lessonTitle) {
  // This is a simplified example - ideally you would have the lesson type data
  if (lessonTitle.toLowerCase().includes("quiz")) {
    return <FaQuestionCircle className="text-warning fs-5" />;
  } else if (
    lessonTitle.toLowerCase().includes("video") ||
    lessonTitle.toLowerCase().includes("watch")
  ) {
    return <FaVideo className="text-success fs-5" />;
  } else {
    return <FaBook className="text-primary fs-5" />;
  }
}

export default CourseProgress;
