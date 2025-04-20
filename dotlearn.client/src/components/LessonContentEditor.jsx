import { useState, useEffect } from "react";
import { Card, Tabs, Tab, Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import RichTextEditor from "./RichTextEditor";
import QuizEditor from "./QuizEditor";
import { FaSave, FaPlay, FaEdit } from "react-icons/fa";

function LessonContentEditor({ lessonId, lessonType, onSaved }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const fetchLessonContent = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`/api/lessons/${lessonId}`);
        setContent(response.data.content || "");
      } catch (err) {
        console.error("Error fetching lesson content:", err);
        setError("Failed to load lesson content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchLessonContent();
    } else {
      setLoading(false);
    }
  }, [lessonId]);

  const handleSaveContent = async (updatedContent) => {
    try {
      setSaving(true);
      setError("");

      await axios.put(`/api/lessons/${lessonId}`, {
        content: updatedContent,
        type: lessonType,
      });

      // Update local state
      setContent(updatedContent);

      // Notify parent component if provided
      if (onSaved) {
        onSaved();
      }

      return true;
    } catch (err) {
      console.error("Error saving lesson content:", err);
      setError("Failed to save content. Please try again.");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading editor...</span>
        </Spinner>
        <p className="mt-2">Loading content editor...</p>
      </div>
    );
  }

  // If this is a quiz, show the quiz editor
  if (lessonType === "Quiz") {
    return <QuizEditor lessonId={lessonId} />;
  }

  // For text lessons, show the rich text editor
  if (lessonType === "Text") {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">Lesson Content</h3>
          <div>
            <Button
              variant={previewMode ? "outline-primary" : "outline-secondary"}
              className="me-2 d-flex align-items-center gap-2"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <FaEdit /> : <FaPlay />}
              {previewMode ? "Edit" : "Preview"}
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {previewMode ? (
            <div
              className="lesson-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <RichTextEditor
              initialValue={content}
              onSave={handleSaveContent}
              placeholder="Write your lesson content here..."
            />
          )}
        </Card.Body>
      </Card>
    );
  }

  // For video lessons, show a simpler editor
  if (lessonType === "Video") {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light">
          <h3 className="h5 mb-0">Video URL</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter YouTube or Vimeo URL"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <small className="text-muted mt-2 d-block">
              Paste the full URL of the video (e.g.,
              https://www.youtube.com/watch?v=abcdefghijk)
            </small>
          </div>

          <Button
            variant="primary"
            onClick={() => handleSaveContent(content)}
            disabled={saving}
            className="d-flex align-items-center gap-2"
          >
            <FaSave /> {saving ? "Saving..." : "Save Video URL"}
          </Button>

          {content && (
            <div className="mt-4">
              <h4 className="h6 mb-2">Preview:</h4>
              <div className="ratio ratio-16x9">
                <iframe
                  src={
                    content.includes("youtube.com")
                      ? content.replace("watch?v=", "embed/")
                      : content
                  }
                  title="Video preview"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  }

  return <Alert variant="warning">Unsupported lesson type: {lessonType}</Alert>;
}

export default LessonContentEditor;
