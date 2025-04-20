// src/components/LessonView.jsx
import { useState, useEffect } from "react";
import { Card, Button, Spinner, Alert, Badge } from "react-bootstrap";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import Quiz from "./Quiz";

function LessonView({
  lesson,
  onLessonComplete,
  nextLesson,
  prevLesson,
  isInstructor = false,
}) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({
    isStarted: false,
    isCompleted: false,
    startedAt: null,
    completedAt: null,
  });
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    if (lesson?.id) {
      fetchLessonContent();
    }
  }, [lesson?.id]);

  const fetchLessonContent = async () => {
    try {
      setLoading(true);
      setError("");

      // Mark lesson as started
      await axios.post("/api/progress/lesson/start", {
        lessonId: lesson.id,
      });

      // Fetch lesson content
      const response = await axios.get(`/api/lessons/${lesson.id}`);
      setContent(response.data);

      // Check progress status
      const progressResponse = await axios.get(
        `/api/progress/course/${response.data.courseId}`,
      );
      const courseProgress = progressResponse.data;

      // Find this lesson's progress
      const moduleProgress = courseProgress.modules.find(
        (m) => m.moduleId === lesson.moduleId,
      );
      if (moduleProgress) {
        const lessonProgress = moduleProgress.lessons.find(
          (l) => l.lessonId === lesson.id,
        );
        if (lessonProgress) {
          setProgress({
            isStarted: true,
            isCompleted: lessonProgress.isCompleted,
            startedAt: lessonProgress.startedAt,
            completedAt: lessonProgress.completedAt,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching lesson content:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load lesson content. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      setMarkingComplete(true);

      await axios.post("/api/progress/lesson/complete", {
        lessonId: lesson.id,
      });

      setProgress({
        ...progress,
        isCompleted: true,
        completedAt: new Date(),
      });

      // Notify parent component
      if (onLessonComplete) {
        onLessonComplete(lesson.id);
      }
    } catch (err) {
      console.error("Error marking lesson as complete:", err);
      setError("Failed to mark lesson as complete. Please try again.");
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleQuizComplete = (quizResult) => {
    if (quizResult.passed) {
      handleMarkComplete();
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading lesson...</span>
        </Spinner>
        <p className="mt-2">Loading lesson content...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!content) {
    return <Alert variant="warning">Lesson content not found.</Alert>;
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        {/* Display content based on lesson type */}
        {lesson.type === "Quiz" ? (
          <Quiz lessonId={lesson.id} onQuizComplete={handleQuizComplete} />
        ) : lesson.type === "Video" ? (
          <div className="mb-4">
            <div className="ratio ratio-16x9">
              <iframe
                src={
                  content.content.includes("youtube.com") ||
                  content.content.includes("youtu.be")
                    ? content.content.replace("watch?v=", "embed/")
                    : content.content
                }
                title={content.title}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        ) : (
          <div
            className="lesson-content mb-4"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        )}

        <div className="d-flex justify-content-between mt-4">
          <div>
            {prevLesson && (
              <Button
                as={Link}
                to={`/courses/${content.courseId}/lesson/${prevLesson.id}`}
                variant="outline-primary"
                className="d-flex align-items-center gap-2"
              >
                <FaArrowLeft /> Previous Lesson
              </Button>
            )}
          </div>

          <div className="d-flex gap-2">
            {!progress.isCompleted &&
              lesson.type !== "Quiz" &&
              !isInstructor && (
                <Button
                  variant="success"
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                  className="d-flex align-items-center gap-2"
                >
                  {markingComplete ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />{" "}
                      Marking...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> Mark as Complete
                    </>
                  )}
                </Button>
              )}

            {nextLesson && (
              <Button
                as={Link}
                to={`/courses/${content.courseId}/lesson/${nextLesson.id}`}
                variant={progress.isCompleted ? "primary" : "outline-primary"}
                className="d-flex align-items-center gap-2"
              >
                Next Lesson <FaArrowRight />
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default LessonView;
