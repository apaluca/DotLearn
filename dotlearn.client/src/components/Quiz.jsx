import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Alert,
  ProgressBar,
  Spinner,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import { FaCheck, FaTimes, FaRedo } from "react-icons/fa";

function Quiz({ lessonId, onQuizComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quizResult, setQuizResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/quizzes/lesson/${lessonId}`);
        setQuiz(response.data);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError(
          err.response?.data || "Failed to load quiz. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [lessonId]);

  const handleOptionSelect = (questionId, optionId) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionId,
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const isLastQuestion = () => {
    return currentQuestion === quiz?.questions.length - 1;
  };

  const isQuizComplete = () => {
    return (
      quiz && Object.keys(selectedOptions).length === quiz.questions.length
    );
  };

  const handleSubmitQuiz = async () => {
    if (!isQuizComplete()) {
      alert("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const answers = Object.keys(selectedOptions).map((questionId) => ({
        questionId: parseInt(questionId),
        selectedOptionId: selectedOptions[questionId],
      }));

      const response = await axios.post("/api/quizzes/submit", {
        lessonId: lessonId,
        answers,
      });

      setQuizResult(response.data);
      setShowResults(true);

      // If quiz was passed, notify parent component
      if (response.data.passed) {
        onQuizComplete && onQuizComplete(response.data);
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError(
        err.response?.data || "Failed to submit quiz. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setShowResults(false);
    setSelectedOptions({});
    setCurrentQuestion(0);
    setQuizResult(null);
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading quiz...</span>
        </Spinner>
        <p className="mt-2">Loading quiz questions...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Alert variant="warning">This quiz doesn't have any questions yet.</Alert>
    );
  }

  if (showResults && quizResult) {
    return (
      <Card className="quiz-results">
        <Card.Header className="bg-light">
          <h3 className="h5 mb-0">Quiz Results</h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h2>
              {quizResult.passed ? (
                <span className="text-success">
                  <FaCheck className="me-2" />
                  Quiz Passed!
                </span>
              ) : (
                <span className="text-danger">
                  <FaTimes className="me-2" />
                  Quiz Failed
                </span>
              )}
            </h2>
            <p className="fs-4">
              Your score: {quizResult.score} / {quizResult.totalQuestions} (
              {Math.round((quizResult.score / quizResult.totalQuestions) * 100)}
              %)
            </p>
            <ProgressBar
              now={(quizResult.score / quizResult.totalQuestions) * 100}
              variant={quizResult.passed ? "success" : "danger"}
              className="mb-3"
              style={{ height: "10px" }}
            />
          </div>

          <h4 className="mb-3">Question Summary</h4>
          {quizResult.answers.map((answer, index) => (
            <Card key={answer.questionId} className="mb-3">
              <Card.Header
                className={`d-flex justify-content-between ${
                  answer.isCorrect ? "bg-success-subtle" : "bg-danger-subtle"
                }`}
              >
                <span>Question {index + 1}</span>
                <Badge bg={answer.isCorrect ? "success" : "danger"}>
                  {answer.isCorrect ? "Correct" : "Incorrect"}
                </Badge>
              </Card.Header>
              <Card.Body>
                <p className="mb-3">{answer.questionText}</p>
                <div className="ms-3">
                  <p className="mb-1">
                    <strong>Your answer: </strong>
                    {answer.selectedOptionText || "No answer provided"}
                    {answer.isCorrect ? (
                      <FaCheck className="text-success ms-2" />
                    ) : (
                      <FaTimes className="text-danger ms-2" />
                    )}
                  </p>
                  {!answer.isCorrect && (
                    <p className="text-success mb-0">
                      <strong>Correct answer: </strong>
                      {answer.correctOptionText}
                    </p>
                  )}
                </div>
              </Card.Body>
            </Card>
          ))}

          <div className="d-flex justify-content-between mt-4">
            {!quizResult.passed && (
              <Button
                variant="primary"
                onClick={handleRetry}
                className="d-flex align-items-center gap-2"
              >
                <FaRedo /> Retry Quiz
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <h3 className="h5 mb-0">
          {quiz.lessonTitle} - Question {currentQuestion + 1}/
          {quiz.questions.length}
        </h3>
        <ProgressBar
          now={((currentQuestion + 1) / quiz.questions.length) * 100}
          variant="primary"
          style={{ width: "100px", height: "10px" }}
        />
      </Card.Header>
      <Card.Body>
        <h4 className="mb-4">{question.questionText}</h4>

        <Form>
          {question.options.map((option) => (
            <Form.Check
              key={option.id}
              type="radio"
              id={`option-${option.id}`}
              className="mb-3"
              label={option.optionText}
              checked={selectedOptions[question.id] === option.id}
              onChange={() => handleOptionSelect(question.id, option.id)}
            />
          ))}
        </Form>

        <div className="d-flex justify-content-between mt-4">
          <Button
            variant="outline-secondary"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          {isLastQuestion() ? (
            <Button
              variant="primary"
              onClick={handleSubmitQuiz}
              disabled={!isQuizComplete() || submitting}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          ) : (
            <Button variant="outline-primary" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default Quiz;
