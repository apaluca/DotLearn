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
import {
  FaSearch,
  FaEdit,
  FaKey,
  FaUserPlus,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUserShield,
  FaBook,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";

function InstructorManagement() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("lastName");
  const [sortDirection, setSortDirection] = useState("asc");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  // Refresh counter to trigger re-fetching
  const { refreshCounter } = useAdmin();

  // Fetch instructors
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/admin/users");
        // Filter users with "Instructor" role
        const instructorUsers = response.data.filter(
          (user) => user.role === "Instructor",
        );
        setInstructors(instructorUsers);
      } catch (err) {
        console.error("Error fetching instructors:", err);
        setError("Failed to load instructors. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
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

  // Filter and sort instructors
  const getFilteredAndSortedInstructors = () => {
    if (!instructors.length) return [];

    const filtered = instructors.filter(
      (instructor) =>
        instructor.firstName.toLowerCase().includes(search.toLowerCase()) ||
        instructor.lastName.toLowerCase().includes(search.toLowerCase()) ||
        instructor.username.toLowerCase().includes(search.toLowerCase()) ||
        instructor.email.toLowerCase().includes(search.toLowerCase()),
    );

    return [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Special case for full name sorting
      if (sortField === "fullName") {
        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
      }

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

  // Form change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open edit modal
  const handleEditInstructor = (instructor) => {
    setSelectedInstructor(instructor);
    setFormData({
      username: instructor.username,
      email: instructor.email,
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      password: "",
      confirmPassword: "",
    });
    setShowEditModal(true);
  };

  // Open password reset modal
  const handlePasswordReset = (instructor) => {
    setSelectedInstructor(instructor);
    setFormData((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
    }));
    setShowPasswordModal(true);
  };

  // Add new instructor
  const handleAddInstructor = async () => {
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setProcessingAction(true);
      setError("");

      // Use the instructor role header
      const headers = {
        "X-User-Role": "Instructor",
      };

      await axios.post(
        "/api/admin/users",
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        { headers },
      );

      // Refresh instructor list
      const response = await axios.get("/api/admin/users");
      const instructorUsers = response.data.filter(
        (user) => user.role === "Instructor",
      );
      setInstructors(instructorUsers);

      // Reset form and close modal
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding instructor:", err);
      setError(err.response?.data?.message || "Failed to add instructor");
    } finally {
      setProcessingAction(false);
    }
  };

  // Update instructor
  const handleUpdateInstructor = async () => {
    try {
      setProcessingAction(true);
      setError("");

      await axios.put(`/api/admin/users/${selectedInstructor.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: "Instructor", // Ensure role stays as instructor
      });

      // Refresh instructor list
      const response = await axios.get("/api/admin/users");
      const instructorUsers = response.data.filter(
        (user) => user.role === "Instructor",
      );
      setInstructors(instructorUsers);

      // Reset form and close modal
      resetForm();
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating instructor:", err);
      setError(err.response?.data?.message || "Failed to update instructor");
    } finally {
      setProcessingAction(false);
    }
  };

  // Update password
  const handleUpdatePassword = async () => {
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setProcessingAction(true);
      setError("");

      await axios.put(`/api/admin/users/${selectedInstructor.id}/password`, {
        newPassword: formData.password,
      });

      // Reset form and close modal
      resetForm();
      setShowPasswordModal(false);
    } catch (err) {
      console.error("Error updating password:", err);
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setProcessingAction(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    });
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading instructors...</p>
      </div>
    );
  }

  const filteredInstructors = getFilteredAndSortedInstructors();

  return (
    <div>
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">Instructor Management</h3>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="d-flex align-items-center gap-2"
          >
            <FaUserPlus /> Add Instructor
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
                placeholder="Search instructors by name, username, or email..."
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
                    onClick={() => handleSort("fullName")}
                    className="cursor-pointer"
                  >
                    Name {renderSortIcon("fullName")}
                  </th>
                  <th
                    onClick={() => handleSort("username")}
                    className="cursor-pointer"
                  >
                    Username {renderSortIcon("username")}
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    className="cursor-pointer"
                  >
                    Email {renderSortIcon("email")}
                  </th>
                  <th
                    onClick={() => handleSort("coursesCreated")}
                    className="cursor-pointer text-center"
                  >
                    Courses {renderSortIcon("coursesCreated")}
                  </th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstructors.length > 0 ? (
                  filteredInstructors.map((instructor) => (
                    <tr key={instructor.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <FaChalkboardTeacher className="text-primary" />
                          {instructor.firstName} {instructor.lastName}
                        </div>
                      </td>
                      <td>{instructor.username}</td>
                      <td>{instructor.email}</td>
                      <td className="text-center">
                        <Badge bg={getBadgeColor(instructor.coursesCreated)}>
                          {instructor.coursesCreated}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditInstructor(instructor)}
                            title="Edit Instructor"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handlePasswordReset(instructor)}
                            title="Reset Password"
                          >
                            <FaKey />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-3">
                      No instructors found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add Instructor Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Instructor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddInstructor}
            disabled={processingAction}
          >
            {processingAction ? "Adding..." : "Add Instructor"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Instructor Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Instructor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" value={formData.username} disabled />
              <Form.Text className="text-muted">
                Username cannot be changed
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateInstructor}
            disabled={processingAction}
          >
            {processingAction ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <p>
            Reset password for instructor:{" "}
            <strong>
              {selectedInstructor?.firstName} {selectedInstructor?.lastName}
            </strong>
          </p>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPasswordModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdatePassword}
            disabled={processingAction}
          >
            {processingAction ? "Updating..." : "Update Password"}
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

  // Helper function to get badge color
  function getBadgeColor(count) {
    if (count === 0) return "secondary";
    if (count <= 2) return "info";
    if (count <= 5) return "primary";
    return "success";
  }
}

export default InstructorManagement;
