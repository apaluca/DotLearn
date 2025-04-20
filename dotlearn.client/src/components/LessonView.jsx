import { useState, useEffect } from "react";
import { Card, Button, Spinner, Alert, Badge } from "react-bootstrap";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight,
  FaTimes,
  FaEdit,
} from "react-icons/fa";
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
  const [quizData, setQuizData] = useState(null);
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

      // Fetch lesson content
      const response = await axios.get(`/api/lessons/${lesson.id}`);
      setContent(response.data);

      // If this is a quiz, fetch quiz data for instructor preview
      if (lesson.type === "Quiz" && isInstructor) {
        try {
          const quizResponse = await axios.get(
            `/api/quizzes/lesson/${lesson.id}`,
          );
          setQuizData(quizResponse.data);
        } catch (err) {
          console.error("Error fetching quiz data:", err);
        }
      }

      // Mark lesson as started (only for non-instructors)
      if (!isInstructor) {
        await axios.post("/api/progress/lesson/start", {
          lessonId: lesson.id,
        });

        // Check progress status
        const progressResponse = await axios.get(
          `/api/progress/course/${response.data.courseId}`,
        );
        const courseProgress = progressResponse.data;

        // Find this lesson's progress - first find the right module
        let foundLessonProgress = null;

        // Loop through all modules and their lessons to find the current lesson's progress
        for (const module of courseProgress.modules) {
          const lessonProgress = module.lessons.find(
            (l) => l.lessonId === lesson.id,
          );

          if (lessonProgress) {
            foundLessonProgress = lessonProgress;
            break;
          }
        }

        if (foundLessonProgress) {
          console.log("Found lesson progress:", foundLessonProgress);
          setProgress({
            isStarted: true,
            isCompleted: foundLessonProgress.isCompleted,
            startedAt: foundLessonProgress.startedAt,
            completedAt: foundLessonProgress.completedAt,
          });
        } else {
          console.log("No progress found for lesson ID:", lesson.id);
          setProgress({
            isStarted: true,
            isCompleted: false,
            startedAt: new Date(),
            completedAt: null,
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
        onLessonComplete(lesson.id, true);
      }
    } catch (err) {
      console.error("Error marking lesson as complete:", err);
      setError("Failed to mark lesson as complete. Please try again.");
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleUnmarkComplete = async () => {
    try {
      setMarkingComplete(true);

      await axios.post("/api/progress/lesson/uncomplete", {
        lessonId: lesson.id,
      });

      setProgress({
        ...progress,
        isCompleted: false,
        completedAt: null,
      });

      // Notify parent component
      if (onLessonComplete) {
        onLessonComplete(lesson.id, false);
      }
    } catch (err) {
      console.error("Error unmarking lesson as complete:", err);
      setError("Failed to unmark lesson as complete. Please try again.");
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

  // Instructor viewing a quiz - show preview instead of editor
  if (lesson.type === "Quiz" && isInstructor) {
    return (
      <Card className="shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">Quiz Preview</h3>
        </Card.Header>
        <Card.Body>
          {quizData ? (
            <div>
              <p className="mb-4">
                This quiz contains {quizData.questions.length} question(s).
              </p>

              {quizData.questions.map((question, index) => (
                <Card key={question.id} className="mb-3">
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <span>Question {index + 1}</span>
                    <Badge
                      bg={
                        question.questionType === "SingleChoice"
                          ? "primary"
                          : "info"
                      }
                    >
                      {question.questionType === "SingleChoice"
                        ? "Single Choice"
                        : "Multiple Choice"}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-3">{question.questionText}</p>
                    <ul className="list-group">
                      {question.options.map((option) => (
                        <li
                          key={option.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          {option.optionText}
                          {option.isCorrect && (
                            <Badge bg="success">Correct Answer</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Alert variant="info">
              <p className="mb-0">
                This quiz has no questions yet. Please use the Course Editor to
                add questions.
              </p>
            </Alert>
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

            <div>
              {nextLesson && (
                <Button
                  as={Link}
                  to={`/courses/${content.courseId}/lesson/${nextLesson.id}`}
                  variant="outline-primary"
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

  return (
    <Card className="shadow-sm">
      <Card.Body>
        {/* Display content based on lesson type */}
        {lesson.type === "Quiz" ? (
          // Only show Quiz component for students
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
            {!isInstructor && lesson.type !== "Quiz" && (
              <>
                {progress.isCompleted ? (
                  <Button
                    variant="outline-warning"
                    onClick={handleUnmarkComplete}
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
                        Unmarking...
                      </>
                    ) : (
                      <>
                        <FaTimes /> Unmark as Complete
                      </>
                    )}
                  </Button>
                ) : (
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
              </>
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
