import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Tabs,
  Tab,
  Alert,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import RichTextEditor from "./RichTextEditor";
import {
  FaSave,
  FaPlay,
  FaEdit,
  FaQuestionCircle,
  FaTimes,
  FaYoutube,
  FaVimeo,
} from "react-icons/fa";

function LessonModal({
  show,
  onHide,
  lessonData,
  onSubmit,
  isEditing = false,
  courseId,
}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    type: "Text",
    content: "",
    moduleId: null,
  });

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
    }
  }, [lessonData, show]);

  // Add debugging to see what data is received
  useEffect(() => {
    if (isEditing) {
      console.log("Editing existing lesson:", lessonData);
    }
  }, [isEditing, lessonData]);

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
        content:
          newType === "Quiz"
            ? "Click 'Save & Edit Quiz' to configure questions"
            : "",
      }));
      setPreviewContent("");
      setVideoPreviewUrl("");
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

    // Handle YouTube URLs - use privacy-enhanced mode
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtube.com/watch?v=")
        ? url.split("v=")[1]?.split("&")[0]
        : url.includes("youtu.be/")
          ? url.split("youtu.be/")[1]?.split("?")[0]
          : null;

      if (videoId) {
        // Use youtube-nocookie.com for privacy-enhanced mode
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

    setSaving(true);
    setError("");

    try {
      await onSubmit(formData);
      onHide();
    } catch (err) {
      console.error("Error saving lesson:", err);
      setError(err.response?.data?.message || "Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleQuizSetup = async () => {
    if (!formData.title.trim()) {
      setError("Please provide a title for your quiz first");
      return;
    }

    setSaving(true);

    try {
      // First save the quiz lesson
      const result = await onSubmit(formData);

      // Close the modal
      onHide();

      // Navigate to the lesson view which will show the quiz editor
      if (result && result.id) {
        navigate(`/courses/${courseId}/lesson/${result.id}`);
      }

      return result;
    } catch (err) {
      console.error("Error setting up quiz:", err);
      setError(err.response?.data?.message || "Failed to set up quiz");
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
                      students when viewing the course. Some browsers block
                      tracking from video providers.
                    </small>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {formData.type === "Quiz" && (
            <div className="mb-3 text-center p-4 border rounded bg-light">
              <FaQuestionCircle size={48} className="text-primary mb-3" />
              <h4>Quiz Editor</h4>
              <p className="mb-4">
                After saving this quiz lesson, you'll be able to add questions
                and configure the quiz settings.
              </p>
              <Button
                variant="primary"
                onClick={handleQuizSetup}
                disabled={saving}
              >
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
                    Setting up quiz...
                  </>
                ) : (
                  "Save & Edit Quiz"
                )}
              </Button>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          {formData.type !== "Quiz" && (
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
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default LessonModal;
