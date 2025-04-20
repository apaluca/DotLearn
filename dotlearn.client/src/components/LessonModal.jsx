import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Tabs,
  Tab,
  Alert,
  InputGroup,
  Card,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import axios from "axios";
import RichTextEditor from "./RichTextEditor";
import {
  FaSave,
  FaPlay,
  FaEdit,
  FaQuestionCircle,
  FaTimes,
  FaYoutube,
  FaVimeo,
  FaPlus,
  FaTrash,
  FaCheck,
} from "react-icons/fa";

function LessonModal({
  show,
  onHide,
  lessonData,
  onSubmit,
  isEditing = false,
}) {
  const [formData, setFormData] = useState({
    title: "",
    type: "Text",
    content: "",
    moduleId: null,
  });

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Other state
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");

  // Initialize the form data when the modal opens or lesson changes
  useEffect(() => {
    if (show && lessonData) {
      console.log("Initializing lesson modal with data:", lessonData);

      setFormData({
        title: lessonData.title || "",
        type: lessonData.type || "Text",
        content: lessonData.content || "",
        moduleId: lessonData.moduleId || null,
      });

      // Set preview content initially
      setPreviewContent(lessonData.content || "");

      // Handle video URL preview
      if (lessonData.type === "Video" && lessonData.content) {
        updateVideoPreview(lessonData.content);
      }

      // If editing a quiz, fetch the quiz data
      if (isEditing && lessonData.type === "Quiz" && lessonData.lessonId) {
        fetchQuizData(lessonData.lessonId);
      } else {
        // Reset questions for new quizzes
        setQuestions([]);
        setActiveQuestionIndex(0);
      }
    }
  }, [lessonData, show, isEditing]);

  const fetchQuizData = async (lessonId) => {
    try {
      setLoadingQuiz(true);
      const response = await axios.get(`/api/quizzes/lesson/${lessonId}`);

      if (response.data && response.data.questions) {
        // Ensure we have the correct answers information - should be available for instructors
        setQuestions(response.data.questions);
        setActiveQuestionIndex(0);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Error fetching quiz data:", err);
      // Don't show error if it's a 404 - probably means quiz has no questions yet
      if (err.response?.status !== 404) {
        setError("Failed to load quiz questions. Please try again.");
      }
      setQuestions([]);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleTitleChange = (e) => {
    setFormData({ ...formData, title: e.target.value });
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData({ ...formData, type: newType });

    // Reset content based on type
    if (newType !== formData.type) {
      setFormData((prev) => ({
        ...prev,
        type: newType,
        content: newType === "Quiz" ? "" : "",
      }));
      setPreviewContent("");
      setVideoPreviewUrl("");
      setQuestions([]);
      setActiveQuestionIndex(0);
    }
  };

  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
    setPreviewContent(value);
  };

  const handleVideoUrlChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, content: url });
    updateVideoPreview(url);
  };

  const updateVideoPreview = (url) => {
    if (!url) {
      setVideoPreviewUrl("");
      return;
    }

    // Handle YouTube URLs
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtube.com/watch?v=")
        ? url.split("v=")[1]?.split("&")[0]
        : url.includes("youtu.be/")
          ? url.split("youtu.be/")[1]?.split("?")[0]
          : null;

      if (videoId) {
        setVideoPreviewUrl(`https://www.youtube-nocookie.com/embed/${videoId}`);
      }
    }
    // Handle Vimeo URLs
    else if (url.includes("vimeo.com")) {
      const vimeoId = url.match(/vimeo\.com\/([0-9]+)/)?.[1];
      if (vimeoId) {
        setVideoPreviewUrl(`https://player.vimeo.com/video/${vimeoId}?dnt=1`);
      }
    }
  };

  // Quiz functions
  const addNewQuestion = () => {
    const newQuestion = {
      questionText: "",
      questionType: "SingleChoice",
      options: [
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ],
      // Flag to indicate new questions
      isNew: true,
    };

    setQuestions([...questions, newQuestion]);
    setActiveQuestionIndex(questions.length);
  };

  const handleQuestionTextChange = (e) => {
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex].questionText = e.target.value;
    setQuestions(updatedQuestions);
  };

  const handleQuestionTypeChange = (e) => {
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex].questionType = e.target.value;
    setQuestions(updatedQuestions);
  };

  const handleOptionTextChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex].options[index].optionText = value;
    setQuestions(updatedQuestions);
  };

  const addOptionToQuestion = () => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[activeQuestionIndex].options.length < 5) {
      updatedQuestions[activeQuestionIndex].options.push({
        optionText: "",
        isCorrect: false,
      });
      setQuestions(updatedQuestions);
    }
  };

  const removeOptionFromQuestion = (index) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[activeQuestionIndex].options.length > 2) {
      updatedQuestions[activeQuestionIndex].options.splice(index, 1);
      setQuestions(updatedQuestions);
    }
  };

  const markOptionAsCorrect = (index) => {
    const updatedQuestions = [...questions];
    const questionType = updatedQuestions[activeQuestionIndex].questionType;

    // For single choice, unmark all others
    if (questionType === "SingleChoice") {
      updatedQuestions[activeQuestionIndex].options.forEach((option, i) => {
        option.isCorrect = i === index;
      });
    } else {
      // For multiple choice, toggle this option
      updatedQuestions[activeQuestionIndex].options[index].isCorrect =
        !updatedQuestions[activeQuestionIndex].options[index].isCorrect;
    }

    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index, 1);
      setQuestions(updatedQuestions);
      // Adjust active index if needed
      if (activeQuestionIndex >= updatedQuestions.length) {
        setActiveQuestionIndex(updatedQuestions.length - 1);
      }
    } else {
      // If it's the last question, just clear it
      setQuestions([
        {
          questionText: "",
          questionType: "SingleChoice",
          options: [
            { optionText: "", isCorrect: false },
            { optionText: "", isCorrect: false },
          ],
          isNew: true,
        },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      setError("Lesson title is required");
      return;
    }

    if (formData.type === "Text" && !formData.content.trim()) {
      setError("Lesson content is required");
      return;
    }

    if (formData.type === "Video" && !formData.content.trim()) {
      setError("Video URL is required");
      return;
    }

    // Validate quiz data if it's a quiz
    if (formData.type === "Quiz") {
      // Check if there's at least one question
      if (questions.length === 0) {
        setError("Quiz must have at least one question");
        return;
      }

      // Validate each question
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question.questionText.trim()) {
          setError(`Question ${i + 1} text is required`);
          setActiveQuestionIndex(i);
          return;
        }

        // Check if options are valid
        for (let j = 0; j < question.options.length; j++) {
          if (!question.options[j].optionText.trim()) {
            setError(`Option ${j + 1} for Question ${i + 1} text is required`);
            setActiveQuestionIndex(i);
            return;
          }
        }

        // Check if at least one option is marked as correct
        const hasCorrectOption = question.options.some(
          (option) => option.isCorrect,
        );
        if (!hasCorrectOption) {
          setError(`Question ${i + 1} must have at least one correct answer`);
          setActiveQuestionIndex(i);
          return;
        }
      }
    }

    setSaving(true);
    setError("");

    try {
      // First save the lesson basic info
      const savedLesson = await onSubmit(formData);

      // If it's a quiz and we have questions, save them too
      if (formData.type === "Quiz" && questions.length > 0 && savedLesson) {
        const lessonId = savedLesson.id || lessonData?.lessonId;

        // Save each question and its options
        for (const question of questions) {
          let questionId;

          // For new questions
          if (!question.id || question.isNew) {
            // Create the question first
            const questionResponse = await axios.post(
              `/api/quizzes/lesson/${lessonId}/questions`,
              {
                questionText: question.questionText,
                questionType: question.questionType,
                options: question.options.map((o) => ({
                  optionText: o.optionText,
                })), // Just send the text initially
              },
            );

            questionId = questionResponse.data.id;

            // Now set the correct options using dedicated endpoints
            for (let i = 0; i < question.options.length; i++) {
              const option = question.options[i];
              if (option.isCorrect) {
                const optionId = questionResponse.data.options[i].id;

                // Use the specific endpoint to mark this option as correct
                if (question.questionType === "SingleChoice") {
                  await axios.put(`/api/quizzes/options/${optionId}/correct`);
                } else {
                  await axios.put(
                    `/api/quizzes/options/${optionId}/toggle-correct`,
                  );
                }
              }
            }
          } else {
            // For existing questions
            questionId = question.id;

            // Update the question text and type
            await axios.put(`/api/quizzes/questions/${questionId}`, {
              questionText: question.questionText,
              questionType: question.questionType,
            });

            // For each option
            for (let i = 0; i < question.options.length; i++) {
              const option = question.options[i];

              // Update option text if needed
              if (option.id) {
                // If option exists but correct state changed, update it
                const shouldBeCorrect = option.isCorrect;
                const isCurrentlyCorrect = option.originalIsCorrect;

                if (shouldBeCorrect !== isCurrentlyCorrect) {
                  // Use correct endpoint based on question type
                  if (question.questionType === "SingleChoice") {
                    await axios.put(
                      `/api/quizzes/options/${option.id}/correct`,
                    );
                  } else {
                    await axios.put(
                      `/api/quizzes/options/${option.id}/toggle-correct`,
                    );
                  }
                }
              } else {
                // If new option, create it and mark as correct if needed
                const newOptionResponse = await axios.post(
                  `/api/quizzes/questions/${questionId}/options`,
                  {
                    optionText: option.optionText,
                  },
                );

                if (option.isCorrect) {
                  const newOptionId = newOptionResponse.data.id;
                  if (question.questionType === "SingleChoice") {
                    await axios.put(
                      `/api/quizzes/options/${newOptionId}/correct`,
                    );
                  } else {
                    await axios.put(
                      `/api/quizzes/options/${newOptionId}/toggle-correct`,
                    );
                  }
                }
              }
            }
          }
        }
      }

      onHide();
    } catch (err) {
      console.error("Error saving lesson:", err);
      setError(err.response?.data?.message || "Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? "Edit Lesson" : "Add Lesson"}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3" controlId="lessonTitle">
            <Form.Label>Lesson Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter lesson title"
              value={formData.title}
              onChange={handleTitleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="lessonType">
            <Form.Label>Lesson Type</Form.Label>
            <Form.Select value={formData.type} onChange={handleTypeChange}>
              <option value="Text">Text</option>
              <option value="Video">Video</option>
              <option value="Quiz">Quiz</option>
            </Form.Select>
            <Form.Text className="text-muted">
              Choose the type of content for this lesson
            </Form.Text>
          </Form.Group>

          {formData.type === "Text" && (
            <div className="mb-3">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab
                  eventKey="edit"
                  title={
                    <span>
                      <FaEdit className="me-2" />
                      Edit
                    </span>
                  }
                >
                  <RichTextEditor
                    initialValue={formData.content}
                    onChange={handleContentChange}
                    placeholder="Enter your lesson content here..."
                    hideSubmitButton={true}
                  />
                </Tab>
                <Tab
                  eventKey="preview"
                  title={
                    <span>
                      <FaPlay className="me-2" />
                      Preview
                    </span>
                  }
                >
                  <div className="border p-4 rounded bg-light lesson-content">
                    {previewContent ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: previewContent }}
                      />
                    ) : (
                      <p className="text-muted text-center">
                        No content to preview. Start editing to see content
                        here.
                      </p>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </div>
          )}

          {formData.type === "Video" && (
            <div className="mb-3">
              <Form.Label>Video URL</Form.Label>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  {formData.content.includes("youtube") ? (
                    <FaYoutube />
                  ) : formData.content.includes("vimeo") ? (
                    <FaVimeo />
                  ) : (
                    <FaPlay />
                  )}
                </InputGroup.Text>
                <Form.Control
                  type="url"
                  placeholder="Enter YouTube or Vimeo URL (e.g., https://www.youtube.com/watch?v=abcdefg)"
                  value={formData.content}
                  onChange={handleVideoUrlChange}
                />
                {formData.content && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setFormData({ ...formData, content: "" });
                      setVideoPreviewUrl("");
                    }}
                  >
                    <FaTimes />
                  </Button>
                )}
              </InputGroup>

              <Form.Text className="text-muted mb-3 d-block">
                Paste the full URL of a YouTube or Vimeo video
              </Form.Text>

              {videoPreviewUrl && (
                <div className="mt-4">
                  <h5>Video Preview</h5>
                  <div className="ratio ratio-16x9">
                    <iframe
                      src={videoPreviewUrl}
                      title="Video Preview"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      loading="lazy"
                    ></iframe>
                  </div>
                  <Alert variant="info" className="mt-2">
                    <small>
                      <strong>Note:</strong> If the preview doesn't load
                      correctly, don't worry. The video will still work for
                      students when viewing the course.
                    </small>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {formData.type === "Quiz" && (
            <div className="mb-3">
              {loadingQuiz ? (
                <div className="text-center my-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading quiz questions...</p>
                </div>
              ) : (
                <div>
                  {/* Question selector and add button */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4>Quiz Questions</h4>
                    <Button
                      variant="primary"
                      onClick={addNewQuestion}
                      className="d-flex align-items-center gap-2"
                    >
                      <FaPlus /> Add Question
                    </Button>
                  </div>

                  {/* Question tabs */}
                  {questions.length > 0 ? (
                    <div className="mb-4">
                      <div className="d-flex mb-3 gap-2 flex-wrap">
                        {questions.map((q, index) => (
                          <Button
                            key={index}
                            variant={
                              activeQuestionIndex === index
                                ? "primary"
                                : "outline-secondary"
                            }
                            onClick={() => setActiveQuestionIndex(index)}
                            className="position-relative"
                          >
                            Question {index + 1}
                            {index > 0 && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0 translate-middle-y"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeQuestion(index);
                                }}
                                style={{ padding: "0.1rem 0.3rem" }}
                              >
                                <FaTimes size={10} />
                              </Button>
                            )}
                          </Button>
                        ))}
                      </div>

                      {/* Current question editor */}
                      {questions.length > activeQuestionIndex && (
                        <Card className="mb-3">
                          <Card.Body>
                            <Form.Group className="mb-3">
                              <Form.Label>Question Text</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={
                                  questions[activeQuestionIndex].questionText
                                }
                                onChange={handleQuestionTextChange}
                                placeholder="Enter your question here"
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Question Type</Form.Label>
                              <Form.Select
                                value={
                                  questions[activeQuestionIndex].questionType
                                }
                                onChange={handleQuestionTypeChange}
                              >
                                <option value="SingleChoice">
                                  Single Choice (Radio Buttons)
                                </option>
                                <option value="MultipleChoice">
                                  Multiple Choice (Checkboxes)
                                </option>
                              </Form.Select>
                              <Form.Text className="text-muted">
                                {questions[activeQuestionIndex].questionType ===
                                "SingleChoice"
                                  ? "Students can select only one answer."
                                  : "Students can select multiple answers."}
                              </Form.Text>
                            </Form.Group>

                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="mb-0">
                                  Options
                                </Form.Label>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={addOptionToQuestion}
                                  disabled={
                                    questions[activeQuestionIndex].options
                                      .length >= 5
                                  }
                                  className="d-flex align-items-center gap-1"
                                >
                                  <FaPlus size={12} /> Add Option
                                </Button>
                              </div>

                              {questions[activeQuestionIndex].options.map(
                                (option, index) => (
                                  <Row
                                    key={index}
                                    className="mb-2 align-items-center"
                                  >
                                    <Col xs={8}>
                                      <Form.Control
                                        placeholder={`Option ${index + 1}`}
                                        value={option.optionText}
                                        onChange={(e) =>
                                          handleOptionTextChange(
                                            index,
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </Col>
                                    <Col xs={4} className="d-flex gap-2">
                                      <Button
                                        variant={
                                          option.isCorrect
                                            ? "success"
                                            : "outline-success"
                                        }
                                        onClick={() =>
                                          markOptionAsCorrect(index)
                                        }
                                        className="flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                                      >
                                        {option.isCorrect && <FaCheck />}
                                        {option.isCorrect
                                          ? "Correct"
                                          : "Mark Correct"}
                                      </Button>
                                      {questions[activeQuestionIndex].options
                                        .length > 2 && (
                                        <Button
                                          variant="outline-danger"
                                          onClick={() =>
                                            removeOptionFromQuestion(index)
                                          }
                                        >
                                          <FaTrash />
                                        </Button>
                                      )}
                                    </Col>
                                  </Row>
                                ),
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center border rounded p-4 mb-4">
                      <FaQuestionCircle
                        size={48}
                        className="text-primary mb-3"
                      />
                      <p className="mb-3">No questions have been added yet.</p>
                      <Button
                        variant="primary"
                        onClick={addNewQuestion}
                        className="d-flex align-items-center gap-2 mx-auto"
                      >
                        <FaPlus /> Add Your First Question
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Saving...
              </>
            ) : (
              <span>
                <FaSave className="me-2" />
                {isEditing ? "Save Changes" : "Save Lesson"}
              </span>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default LessonModal;
