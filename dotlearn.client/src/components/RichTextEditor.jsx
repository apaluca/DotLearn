import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import styles
import { Card, Button, Form, Alert } from "react-bootstrap";
import { FaSave } from "react-icons/fa";

// Define the formats we want to support
const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "code-block",
];

// Define the modules/toolbar options
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    ["link", "image", "code-block"],
    ["clean"],
  ],
};

function RichTextEditor({
  initialValue = "",
  onSave,
  placeholder = "Write your content here...",
}) {
  const [content, setContent] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  const handleChange = (value) => {
    setContent(value);
    if (value !== initialValue) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Content cannot be empty");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onSave(content);
      setIsDirty(false);
    } catch (err) {
      console.error("Error saving content:", err);
      setError("Failed to save content. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-sm rich-text-editor">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <h3 className="h5 mb-0">Content Editor</h3>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="d-flex align-items-center gap-2"
        >
          <FaSave /> {isSaving ? "Saving..." : "Save"}
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form.Group>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            style={{ height: "400px", marginBottom: "50px" }}
          />
        </Form.Group>
      </Card.Body>
    </Card>
  );
}

export default RichTextEditor;
