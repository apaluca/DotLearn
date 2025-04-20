import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
  ListGroup,
  InputGroup,
  Modal,
} from "react-bootstrap";
import axios from "axios";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
  FaSave,
  FaTimes,
} from "react-icons/fa";

function QuizEditor({ lessonId }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Form state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionFormData, setQuestionFormData] = useState({
    questionText: "",
    options: [
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
    ],
  });
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/quizzes/lesson/${lessonId}`);
        setQuiz(response.data);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        // If quiz doesn't exist yet, that's ok
        if (err.response?.status === 404) {
          setQuiz({ lessonId, questions: [] });
        } else {
          setError(
            err.response?.data || "Failed to load quiz. Please try again.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [lessonId]);

  const handleAddQuestion = () => {
    setEditingQuestionId(null);
    setQuestionFormData({
      questionText: "",
      options: [
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ],
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestionId(question.id);
    setQuestionFormData({
      questionText: question.questionText,
      options: question.options.map((option) => ({
        id: option.id,
        optionText: option.optionText,
        isCorrect: false, // We don't know which is correct in the UI view
      })),
    });
    setShowQuestionModal(true);
  };

  const handleQuestionTextChange = (e) => {
    setQuestionFormData({
      ...questionFormData,
      questionText: e.target.value,
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...questionFormData.options];
    updatedOptions[index].optionText = value;
    setQuestionFormData({
      ...questionFormData,
      options: updatedOptions,
    });
  };

  const handleAddOption = () => {
    if (questionFormData.options.length < 5) {
      setQuestionFormData({
        ...questionFormData,
        options: [
          ...questionFormData.options,
          { optionText: "", isCorrect: false },
        ],
      });
    }
  };

  const handleRemoveOption = (index) => {
    if (questionFormData.options.length > 2) {
      const updatedOptions = [...questionFormData.options];
      updatedOptions.splice(index, 1);
      setQuestionFormData({
        ...questionFormData,
        options: updatedOptions,
      });
    }
  };

  const handleSetCorrect = async (questionId, optionId) => {
    try {
      setSaving(true);
      await axios.put(`/api/quizzes/options/${optionId}/correct`);

      // Update the local state with the new correct option
      setQuiz((prevQuiz) => {
        return {
          ...prevQuiz,
          questions: prevQuiz.questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  options: q.options.map((o) => ({
                    ...o,
                    isCorrect: o.id === optionId,
                  })),
                }
              : q,
          ),
        };
      });
    } catch (err) {
      console.error("Error setting correct option:", err);
      setError(
        err.response?.data || "Failed to set correct option. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();

    if (!questionFormData.questionText.trim()) {
      alert("Please enter a question.");
      return;
    }

    // Make sure all options have text
    if (questionFormData.options.some((option) => !option.optionText.trim())) {
      alert("All options must have text.");
      return;
    }

    try {
      setSaving(true);

      if (editingQuestionId) {
        // Not implementing question editing for simplicity, but you can add it
        alert("Editing questions is not supported in this demo.");
        setShowQuestionModal(false);
        return;
      } else {
        // Create new question
        const response = await axios.post(
          `/api/quizzes/lesson/${lessonId}/questions`,
          {
            questionText: questionFormData.questionText,
            options: questionFormData.options.map((option) => ({
              optionText: option.optionText,
            })),
          },
        );

        // Update local state
        const newQuestion = response.data;
        setQuiz((prevQuiz) => ({
          ...prevQuiz,
          questions: [...(prevQuiz.questions || []), newQuestion],
        }));
      }

      setShowQuestionModal(false);
    } catch (err) {
      console.error("Error saving question:", err);
      setError(
        err.response?.data || "Failed to save question. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading quiz editor...</span>
        </Spinner>
        <p className="mt-2">Loading quiz editor...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">Quiz Editor</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddQuestion}
            className="d-flex align-items-center gap-2"
          >
            <FaPlus /> Add Question
          </Button>
        </Card.Header>
        <Card.Body>
          {quiz?.questions?.length > 0 ? (
            <ListGroup variant="flush">
              {quiz.questions.map((question, qIndex) => (
                <ListGroup.Item key={question.id} className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5>
                      Question {qIndex + 1}: {question.questionText}
                    </h5>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEditQuestion(question)}
                      className="d-flex align-items-center gap-1"
                    >
                      <FaEdit /> Edit
                    </Button>
                  </div>

                  <ListGroup variant="flush" className="ms-3">
                    {question.options.map((option) => (
                      <ListGroup.Item
                        key={option.id}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <span>{option.optionText}</span>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() =>
                            handleSetCorrect(question.id, option.id)
                          }
                          disabled={option.isCorrect}
                          className="d-flex align-items-center gap-1"
                        >
                          {option.isCorrect ? (
                            <>
                              <FaCheck /> Correct Answer
                            </>
                          ) : (
                            "Set as Correct"
                          )}
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="text-center py-4">
              <p className="mb-3">This quiz doesn't have any questions yet.</p>
              <Button
                variant="primary"
                onClick={handleAddQuestion}
                className="d-flex align-items-center gap-2 mx-auto"
              >
                <FaPlus /> Add Your First Question
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Question Modal */}
      <Modal
        show={showQuestionModal}
        onHide={() => setShowQuestionModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingQuestionId ? "Edit Question" : "Add Question"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitQuestion}>
          <Modal.Body>
            <Form.Group className="mb-4" controlId="questionText">
              <Form.Label>Question</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter your question"
                value={questionFormData.questionText}
                onChange={handleQuestionTextChange}
                required
              />
            </Form.Group>

            <div className="mb-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Options</h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleAddOption}
                disabled={questionFormData.options.length >= 5}
                className="d-flex align-items-center gap-1"
              >
                <FaPlus /> Add Option
              </Button>
            </div>

            {questionFormData.options.map((option, index) => (
              <Row key={index} className="mb-3 align-items-center">
                <Col>
                  <InputGroup>
                    <Form.Control
                      placeholder={`Option ${index + 1}`}
                      value={option.optionText}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      required
                    />
                    <Button
                      variant="outline-danger"
                      onClick={() => handleRemoveOption(index)}
                      disabled={questionFormData.options.length <= 2}
                    >
                      <FaTrash />
                    </Button>
                  </InputGroup>
                </Col>
              </Row>
            ))}

            <Alert variant="info">
              <small>
                After saving the question, you'll be able to set which option is
                correct.
              </small>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowQuestionModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={saving}
              className="d-flex align-items-center gap-2"
            >
              {saving ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save Question
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default QuizEditor;
