import { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`/api/courses/${id}`);
        setFormData({
          title: response.data.title,
          description: response.data.description,
        });
      } catch (err) {
        setError("Failed to load course data. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.title.trim()) {
      return setError("Course title is required");
    }

    if (!formData.description.trim()) {
      return setError("Course description is required");
    }

    try {
      setSaving(true);
      setError("");

      await axios.put(`/api/courses/${id}`, formData);

      // Redirect back to course
      navigate(`/courses/${id}`);
    } catch (err) {
      setError("Failed to update course. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading course data...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Edit Course</h1>

      <Card className="mb-4">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="courseTitle">
              <Form.Label>Course Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter course title"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="courseDescription">
              <Form.Label>Course Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter course description"
                rows={5}
                required
              />
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end">
              <Button
                variant="secondary"
                onClick={() => navigate(`/courses/${id}`)}
              >
                Cancel
              </Button>
              <Button
                as={Link}
                to={`/courses/editor/${id}`}
                variant="outline-primary"
                className="me-2"
              >
                Edit Course Content
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default EditCourse;
