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
  FaInfoCircle,
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
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [savingOption, setSavingOption] = useState(false);
  const [deletingOption, setDeletingOption] = useState(false);

  // Other state
  const [activeTab, setActiveTab] = useState("edit");
  const [quizActiveTab, setQuizActiveTab] = useState("questions");
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
        setOriginalQuestions([]);
        setActiveQuestionIndex(0);
      }
    }
  }, [lessonData, show, isEditing]);

  const fetchQuizData = async (lessonId) => {
    try {
      setLoadingQuiz(true);
      const response = await axios.get(`/api/quizzes/lesson/${lessonId}`);

      if (response.data && response.data.questions) {
        // Create a deep copy of the questions to keep as original reference
        const fetchedQuestions = response.data.questions;
        setQuestions(fetchedQuestions);
        setOriginalQuestions(JSON.parse(JSON.stringify(fetchedQuestions)));
        setActiveQuestionIndex(0);
      } else {
        setQuestions([]);
        setOriginalQuestions([]);
      }
    } catch (err) {
      console.error("Error fetching quiz data:", err);
      // Don't show error if it's a 404 - probably means quiz has no questions yet
      if (err.response?.status !== 404) {
        setError("Failed to load quiz questions. Please try again.");
      }
      setQuestions([]);
      setOriginalQuestions([]);
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
      }));
      setPreviewContent(formData.content);
      setVideoPreviewUrl("");
      setQuestions([]);
      setOriginalQuestions([]);
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
      isNew: true,
    };

    setQuestions([...questions, newQuestion]);
    setActiveQuestionIndex(questions.length);
  };

  const handleQuestionTextChange = (e) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[activeQuestionIndex]) {
      updatedQuestions[activeQuestionIndex].questionText = e.target.value;
      setQuestions(updatedQuestions);
    }
  };

  const handleQuestionTypeChange = (e) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[activeQuestionIndex]) return;

    const oldType = updatedQuestions[activeQuestionIndex].questionType;
    const newType = e.target.value;

    updatedQuestions[activeQuestionIndex].questionType = newType;

    // If changing from multiple to single choice, ensure only one option is selected
    if (oldType === "MultipleChoice" && newType === "SingleChoice") {
      const options = updatedQuestions[activeQuestionIndex].options;
      const hasCorrectOption = options.some((o) => o.isCorrect);

      // If multiple options are selected, keep only the first correct one
      if (hasCorrectOption) {
        let foundCorrect = false;
        options.forEach((option) => {
          if (option.isCorrect) {
            if (foundCorrect) {
              option.isCorrect = false;
            } else {
              foundCorrect = true;
            }
          }
        });
      }
    }

    setQuestions(updatedQuestions);
  };

  const handleOptionTextChange = (index, value) => {
    if (
      !questions[activeQuestionIndex] ||
      !questions[activeQuestionIndex].options
    )
      return;

    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex].options[index].optionText = value;
    setQuestions(updatedQuestions);
  };

  const addOptionToQuestion = async () => {
    if (!questions[activeQuestionIndex]) return;

    const currentQuestion = questions[activeQuestionIndex];

    // Limit to 5 options max
    if (currentQuestion.options.length >= 5) {
      return;
    }

    // For new questions, just update the state
    if (!currentQuestion.id || currentQuestion.isNew) {
      const updatedQuestions = [...questions];
      updatedQuestions[activeQuestionIndex].options.push({
        optionText: "",
        isCorrect: false,
        isNew: true,
      });
      setQuestions(updatedQuestions);
      return;
    }

    // For existing questions, call the API endpoint
    try {
      setSavingOption(true);
      setError("");

      const response = await axios.post(
        `/api/quizzes/questions/${currentQuestion.id}/options`,
        {
          optionText: "",
        },
      );

      // Update the questions state with the new option
      const updatedQuestions = [...questions];
      updatedQuestions[activeQuestionIndex].options.push({
        id: response.data.id,
        optionText: response.data.optionText,
        isCorrect: response.data.isCorrect || false,
      });

      setQuestions(updatedQuestions);
    } catch (err) {
      console.error("Error adding option:", err);
      setError(err.response?.data?.message || "Failed to add option");
    } finally {
      setSavingOption(false);
    }
  };

  const removeOptionFromQuestion = async (index) => {
    if (
      !questions[activeQuestionIndex] ||
      !questions[activeQuestionIndex].options
    )
      return;

    const currentQuestion = questions[activeQuestionIndex];
    const option = currentQuestion.options[index];

    // Ensure we have at least 2 options
    if (currentQuestion.options.length <= 2) {
      return;
    }

    // For new questions, just update the state
    if (!currentQuestion.id || currentQuestion.isNew || !option.id) {
      const updatedQuestions = [...questions];
      updatedQuestions[activeQuestionIndex].options.splice(index, 1);
      setQuestions(updatedQuestions);
      return;
    }

    // For existing questions, call the API endpoint
    try {
      setDeletingOption(true);
      setError("");

      await axios.delete(`/api/quizzes/options/${option.id}`);

      // Update the questions state by removing the option
      const updatedQuestions = [...questions];
      updatedQuestions[activeQuestionIndex].options.splice(index, 1);

      setQuestions(updatedQuestions);
    } catch (err) {
      console.error("Error removing option:", err);
      setError(err.response?.data?.message || "Failed to remove option");
    } finally {
      setDeletingOption(false);
    }
  };

  const markOptionAsCorrect = async (index) => {
    if (
      !questions[activeQuestionIndex] ||
      !questions[activeQuestionIndex].options
    )
      return;

    const updatedQuestions = [...questions];
    const currentQuestion = updatedQuestions[activeQuestionIndex];
    const questionType = currentQuestion.questionType;
    const option = currentQuestion.options[index];

    // For single choice, unmark all others
    if (questionType === "SingleChoice") {
      currentQuestion.options.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      // For multiple choice, toggle this option
      option.isCorrect = !option.isCorrect;
    }

    // If this is an existing option and question, update via API
    if (currentQuestion.id && option.id && !currentQuestion.isNew) {
      try {
        setError("");

        if (questionType === "SingleChoice") {
          // Fix: Use the correct API endpoint path with POST method
          await axios.post(
            `/api/quizzes/questions/${currentQuestion.id}/options/${option.id}/correct`,
          );
        } else {
          // Fix: Use the correct API endpoint path with POST method
          await axios.post(
            `/api/quizzes/questions/${currentQuestion.id}/options/${option.id}/toggle`,
          );
        }
      } catch (err) {
        console.error("Error updating option correctness:", err);
        setError(err.response?.data?.message || "Failed to update option");

        // Revert the change on error
        fetchQuizData(lessonData.lessonId);
        return;
      }
    }

    setQuestions(updatedQuestions);
  };

  const removeQuestion = async (index) => {
    if (index < 0 || index >= questions.length) return;

    const questionToRemove = questions[index];

    if (questions.length <= 1) {
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
      setActiveQuestionIndex(0);
      return;
    }

    // If it's an existing question, delete it from the backend
    if (questionToRemove.id && !questionToRemove.isNew) {
      try {
        setError("");
        await axios.delete(`/api/quizzes/questions/${questionToRemove.id}`);
      } catch (err) {
        console.error(`Error deleting question ${questionToRemove.id}:`, err);
        setError(err.response?.data?.message || "Failed to delete question");
        return;
      }
    }

    // Update local state
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);

    // Adjust active index if needed
    if (activeQuestionIndex >= updatedQuestions.length) {
      setActiveQuestionIndex(updatedQuestions.length - 1);
    } else if (activeQuestionIndex === index) {
      // If we're deleting the active question, set to the same index (which will be the next question)
      // or the previous one if we're deleting the last question
      setActiveQuestionIndex(
        Math.min(activeQuestionIndex, updatedQuestions.length - 1),
      );
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
      if (formData.type === "Quiz" && savedLesson) {
        const lessonId = savedLesson.id || lessonData?.lessonId;

        if (!lessonId) {
          console.error("No lesson ID available to save quiz questions");
          setError("Failed to save quiz questions - missing lesson ID");
          setSaving(false);
          return;
        }

        // 1. Process deletion of questions that don't exist anymore
        if (isEditing && originalQuestions.length > 0) {
          // Find question IDs that were in original but not in current questions
          const originalIds = new Set(
            originalQuestions.map((q) => q.id).filter((id) => id),
          ); // Filter out undefined/null
          const currentIds = new Set(
            questions.map((q) => q.id).filter((id) => id),
          );

          // Delete questions that are no longer present
          for (const id of originalIds) {
            if (!currentIds.has(id)) {
              try {
                await axios.delete(`/api/quizzes/questions/${id}`);
              } catch (err) {
                console.error(`Error deleting question ${id}:`, err);
              }
            }
          }
        }

        // 2. Process each question - create new ones or update existing ones
        for (const question of questions) {
          if (!question.id || question.isNew) {
            // Create completely new question with all its options
            const questionResponse = await axios.post(
              `/api/quizzes/lesson/${lessonId}/questions`,
              {
                questionText: question.questionText,
                questionType: question.questionType,
                options: question.options.map((o) => ({
                  optionText: o.optionText,
                })),
              },
            );

            // Set correct options for the new question
            for (let i = 0; i < question.options.length; i++) {
              const option = question.options[i];
              if (option.isCorrect) {
                const optionId = questionResponse.data.options[i].id;

                if (question.questionType === "SingleChoice") {
                  await axios.post(
                    `/api/quizzes/questions/${questionResponse.data.id}/options/${optionId}/correct`,
                  );
                } else {
                  await axios.post(
                    `/api/quizzes/questions/${questionResponse.data.id}/options/${optionId}/toggle`,
                  );
                }
              }
            }
          } else {
            // Update existing question
            const questionId = question.id;

            // Update question text and type
            await axios.put(`/api/quizzes/questions/${questionId}`, {
              questionText: question.questionText,
              questionType: question.questionType,
            });

            // Update option text for each option
            for (const option of question.options) {
              if (option.id) {
                // Update option text if needed
                const originalQuestion = originalQuestions.find(
                  (q) => q.id === question.id,
                );
                if (!originalQuestion) continue;

                const originalOption = originalQuestion.options.find(
                  (o) => o.id === option.id,
                );
                if (!originalOption) continue;

                // If option text changed, update it
                if (option.optionText !== originalOption.optionText) {
                  try {
                    await axios.put(`/api/quizzes/options/${option.id}`, {
                      optionText: option.optionText,
                    });
                  } catch (err) {
                    console.error(`Error updating option text:`, err);
                    // Continue despite errors
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

  // Get current question to simplify template
  const currentQuestion = questions[activeQuestionIndex];

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
              <Tabs
                activeKey={quizActiveTab}
                onSelect={(k) => setQuizActiveTab(k)}
                className="mb-3"
              >
                <Tab
                  eventKey="instructions"
                  title={
                    <span>
                      <FaInfoCircle className="me-2" />
                      Quiz Instructions
                    </span>
                  }
                >
                  <Alert variant="info" className="mb-3">
                    <FaInfoCircle className="me-2" />
                    Add instructions that will be displayed to students before
                    they start the quiz.
                  </Alert>

                  <RichTextEditor
                    initialValue={formData.content}
                    onChange={handleContentChange}
                    placeholder="Enter quiz instructions here..."
                    hideSubmitButton={true}
                  />
                </Tab>
                <Tab
                  eventKey="questions"
                  title={
                    <span>
                      <FaQuestionCircle className="me-2" />
                      Quiz Questions
                    </span>
                  }
                >
                  {loadingQuiz ? (
                    <div className="text-center my-4">
                      <Spinner animation="border" variant="primary" />
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

                      {/* Question tabs - FIXED VERSION TO AVOID NESTED BUTTONS */}
                      {questions.length > 0 ? (
                        <div className="mb-4">
                          <div className="d-flex mb-3 gap-2 flex-wrap">
                            {questions.map((q, index) => (
                              <div
                                key={index}
                                className="position-relative d-inline-block me-2"
                              >
                                <Button
                                  variant={
                                    activeQuestionIndex === index
                                      ? "primary"
                                      : "outline-secondary"
                                  }
                                  onClick={() => setActiveQuestionIndex(index)}
                                >
                                  Question {index + 1}
                                </Button>
                                {questions.length > 1 && (
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
                              </div>
                            ))}
                          </div>

                          {/* Current question editor */}
                          {currentQuestion && (
                            <Card className="mb-3">
                              <Card.Body>
                                <Form.Group className="mb-3">
                                  <Form.Label>Question Text</Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={currentQuestion.questionText}
                                    onChange={handleQuestionTextChange}
                                    placeholder="Enter your question here"
                                  />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <Form.Label>Question Type</Form.Label>
                                  <Form.Select
                                    value={currentQuestion.questionType}
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
                                    {currentQuestion.questionType ===
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
                                        savingOption ||
                                        (currentQuestion.options &&
                                          currentQuestion.options.length >= 5)
                                      }
                                      className="d-flex align-items-center gap-1"
                                    >
                                      {savingOption ? (
                                        <Spinner
                                          size="sm"
                                          animation="border"
                                          className="me-1"
                                        />
                                      ) : (
                                        <FaPlus size={12} />
                                      )}
                                      Add Option
                                    </Button>
                                  </div>

                                  {currentQuestion.options &&
                                    currentQuestion.options.map(
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

                                            {currentQuestion.options.length >
                                              2 && (
                                              <Button
                                                variant="outline-danger"
                                                onClick={() =>
                                                  removeOptionFromQuestion(
                                                    index,
                                                  )
                                                }
                                                disabled={deletingOption}
                                              >
                                                {deletingOption ? (
                                                  <Spinner
                                                    size="sm"
                                                    animation="border"
                                                  />
                                                ) : (
                                                  <FaTrash />
                                                )}
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
                          <p className="mb-3">
                            No questions have been added yet.
                          </p>
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
                </Tab>
              </Tabs>
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
