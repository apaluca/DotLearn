import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
  InputGroup,
  Row,
  Col,
} from "react-bootstrap";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaUsers,
  FaChalkboardTeacher,
  FaBook,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";

function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");
  const [deleting, setDeleting] = useState(false);

  // Trigger fetching courses
  const { refreshCounter } = useAdmin();

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/courses");
        setCourses(response.data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [refreshCounter]);

  // Handle sort
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort courses
  const getFilteredAndSortedCourses = () => {
    if (!courses.length) return [];

    const filtered = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase()) ||
        course.instructorName.toLowerCase().includes(search.toLowerCase()),
    );

    return [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle string comparison
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Handle course deletion
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/courses/${selectedCourse.id}`);

      // Remove course from state
      setCourses(courses.filter((course) => course.id !== selectedCourse.id));
      setShowDeleteModal(false);
      setSelectedCourse(null);
    } catch (err) {
      console.error("Error deleting course:", err);
      setError(err.response?.data?.message || "Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  // Render function for action buttons
  const renderActionButtons = (course) => (
    <div className="d-flex gap-2">
      <Button
        as={Link}
        to={`/courses/${course.id}`}
        variant="outline-primary"
        size="sm"
        title="View Course"
      >
        <FaExternalLinkAlt />
      </Button>
      <Button
        as={Link}
        to={`/courses/edit/${course.id}`}
        variant="outline-info"
        size="sm"
        title="Edit Course"
      >
        <FaEdit />
      </Button>
      <Button
        as={Link}
        to={`/courses/editor/${course.id}`}
        variant="outline-secondary"
        size="sm"
        title="Edit Content"
      >
        <FaBook />
      </Button>
      <Button
        as={Link}
        to={`/courses/${course.id}/students`}
        variant="outline-success"
        size="sm"
        title="View Students"
      >
        <FaUsers />
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => {
          setSelectedCourse(course);
          setShowDeleteModal(true);
        }}
        title="Delete Course"
      >
        <FaTrash />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading courses...</p>
      </div>
    );
  }

  const filteredCourses = getFilteredAndSortedCourses();

  return (
    <div>
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">Course Management</h3>
          <Button
            as={Link}
            to="/courses/create"
            variant="primary"
            className="d-flex align-items-center gap-2"
          >
            <FaPlus /> Add Course
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="mb-3">
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search courses by title, description, or instructor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("title")}
                    className="cursor-pointer"
                  >
                    Title {renderSortIcon("title")}
                  </th>
                  <th
                    onClick={() => handleSort("instructorName")}
                    className="cursor-pointer"
                  >
                    Instructor {renderSortIcon("instructorName")}
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="cursor-pointer"
                  >
                    Created At {renderSortIcon("createdAt")}
                  </th>
                  <th
                    onClick={() => handleSort("enrollmentCount")}
                    className="cursor-pointer text-center"
                  >
                    Students {renderSortIcon("enrollmentCount")}
                  </th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.title}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <FaChalkboardTeacher />
                          {course.instructorName}
                        </div>
                      </td>
                      <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                      <td className="text-center">
                        <Badge bg="primary" pill>
                          {course.enrollmentCount}
                        </Badge>
                      </td>
                      <td className="text-end">
                        {renderActionButtons(course)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-3">
                      No courses found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <p>
            Are you sure you want to delete the course:{" "}
            <strong>{selectedCourse?.title}</strong>?
          </p>
          <p className="text-danger">
            Warning: This action will permanently delete the course, all its
            modules, lessons, and student enrollment data. This cannot be
            undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteCourse}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Course"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  // Helper function to render sort icon
  function renderSortIcon(field) {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <FaSortAlphaDown className="ms-1" />
    ) : (
      <FaSortAlphaUp className="ms-1" />
    );
  }
}

export default CourseManagement;
