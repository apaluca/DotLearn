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
  Dropdown,
  ProgressBar,
  Tab,
  Tabs,
} from "react-bootstrap";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaEdit,
  FaKey,
  FaUserPlus,
  FaUserGraduate,
  FaBook,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaCalendarAlt,
  FaChartLine,
  FaBookmark,
  FaGraduationCap,
  FaTrash,
  FaUnlink,
} from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";

function StudentManagement() {
  const { refreshCounter } = useAdmin();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("lastName");
  const [sortDirection, setSortDirection] = useState("asc");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showDropCourseModal, setShowDropCourseModal] = useState(false);
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  // Enrollment form state
  const [enrollmentData, setEnrollmentData] = useState({
    courseId: "",
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all users and filter for students
        const usersResponse = await axios.get("/api/admin/users");
        const studentUsers = usersResponse.data.filter(
          (user) => user.role === "Student",
        );
        setStudents(studentUsers);

        // Fetch all courses for enrollment dropdown
        const coursesResponse = await axios.get("/api/courses");
        setCourses(coursesResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshCounter]);

  // Fetch student enrollments when viewing them
  const fetchStudentEnrollments = async (studentId) => {
    try {
      setLoadingEnrollments(true);

      // We need an endpoint to get enrollments for a specific user
      // For now, we'll get all enrollments and filter by user ID
      const response = await axios.get("/api/enrollments");
      // Filter enrollments for this student
      const studentEnrolls = response.data.filter(
        (enrollment) => enrollment.userId === studentId,
      );

      setStudentEnrollments(studentEnrolls);
    } catch (err) {
      console.error("Error fetching student enrollments:", err);
      setError("Failed to load enrollments. Please try again.");
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Handle sort
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort students
  const getFilteredAndSortedStudents = () => {
    if (!students.length) return [];

    const filtered = students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(search.toLowerCase()) ||
        student.lastName.toLowerCase().includes(search.toLowerCase()) ||
        student.username.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()),
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

  // Enrollment form change handler
  const handleEnrollmentChange = (e) => {
    const { name, value } = e.target;
    setEnrollmentData((prev) => ({ ...prev, [name]: value }));
  };

  // Open edit modal
  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setFormData({
      username: student.username,
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      password: "",
      confirmPassword: "",
    });
    setShowEditModal(true);
  };

  // Open password reset modal
  const handlePasswordReset = (student) => {
    setSelectedStudent(student);
    setFormData((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
    }));
    setShowPasswordModal(true);
  };

  // Open enroll modal
  const handleOpenEnrollModal = (student) => {
    setSelectedStudent(student);
    setEnrollmentData({
      courseId: courses.length > 0 ? courses[0].id.toString() : "",
    });
    setShowEnrollModal(true);
  };

  // Open student enrollments modal
  const handleViewEnrollments = async (student) => {
    setSelectedStudent(student);
    await fetchStudentEnrollments(student.id);
    setShowEnrollmentsModal(true);
  };

  // Add new student
  const handleAddStudent = async () => {
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

      // Use the student role header
      const headers = {
        "X-User-Role": "Student",
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

      // Refresh student list
      const response = await axios.get("/api/admin/users");
      const studentUsers = response.data.filter(
        (user) => user.role === "Student",
      );
      setStudents(studentUsers);

      // Reset form and close modal
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding student:", err);
      setError(err.response?.data?.message || "Failed to add student");
    } finally {
      setProcessingAction(false);
    }
  };

  // Update student
  const handleUpdateStudent = async () => {
    try {
      setProcessingAction(true);
      setError("");

      await axios.put(`/api/admin/users/${selectedStudent.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: "Student", // Ensure role stays as student
      });

      // Refresh student list
      const response = await axios.get("/api/admin/users");
      const studentUsers = response.data.filter(
        (user) => user.role === "Student",
      );
      setStudents(studentUsers);

      // Reset form and close modal
      resetForm();
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating student:", err);
      setError(err.response?.data?.message || "Failed to update student");
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

      await axios.put(`/api/admin/users/${selectedStudent.id}/password`, {
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

  // Enroll student in course
  const handleEnrollStudent = async () => {
    try {
      setProcessingAction(true);
      setError("");

      // Use the admin enrollment endpoint
      await axios.post("/api/enrollments/admin", {
        userId: selectedStudent.id,
        courseId: parseInt(enrollmentData.courseId),
      });

      // Refresh the student data
      const response = await axios.get("/api/admin/users");
      const studentUsers = response.data.filter(
        (user) => user.role === "Student",
      );
      setStudents(studentUsers);

      setShowEnrollModal(false);
      setEnrollmentData({ courseId: "" });
    } catch (err) {
      console.error("Error enrolling student:", err);
      setError(
        err.response?.data?.message ||
          "Failed to enroll student. The student may already be enrolled in this course.",
      );
    } finally {
      setProcessingAction(false);
    }
  };

  // Drop student from course
  const handleDropFromCourse = async () => {
    if (!selectedEnrollment) return;

    try {
      setProcessingAction(true);
      setError("");

      // Use the admin unenroll endpoint
      await axios.delete("/api/enrollments/admin", {
        data: {
          userId: selectedStudent.id,
          courseId: selectedEnrollment.courseId,
        },
      });

      // Refresh the enrollments list
      await fetchStudentEnrollments(selectedStudent.id);

      // Refresh the student data
      const response = await axios.get("/api/admin/users");
      const studentUsers = response.data.filter(
        (user) => user.role === "Student",
      );
      setStudents(studentUsers);

      setShowDropCourseModal(false);
    } catch (err) {
      console.error("Error dropping student from course:", err);
      setError(
        err.response?.data?.message || "Failed to drop student from course",
      );
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
        <p className="mt-2">Loading students...</p>
      </div>
    );
  }

  const filteredStudents = getFilteredAndSortedStudents();

  return (
    <div>
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">Student Management</h3>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="d-flex align-items-center gap-2"
          >
            <FaUserPlus /> Add Student
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
                placeholder="Search students by name, username, or email..."
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
                    onClick={() => handleSort("coursesEnrolled")}
                    className="cursor-pointer text-center"
                  >
                    Enrolled {renderSortIcon("coursesEnrolled")}
                  </th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <FaUserGraduate className="text-primary" />
                          {student.firstName} {student.lastName}
                        </div>
                      </td>
                      <td>{student.username}</td>
                      <td>{student.email}</td>
                      <td className="text-center">
                        <Badge
                          bg={getBadgeColor(student.coursesEnrolled)}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleViewEnrollments(student)}
                          title="View enrollments"
                        >
                          {student.coursesEnrolled}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          <Dropdown>
                            <Dropdown.Toggle
                              variant="outline-primary"
                              size="sm"
                              id={`dropdown-${student.id}`}
                            >
                              Actions
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => handleEditStudent(student)}
                              >
                                <FaEdit className="me-2" /> Edit Profile
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={() => handlePasswordReset(student)}
                              >
                                <FaKey className="me-2" /> Reset Password
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={() => handleOpenEnrollModal(student)}
                              >
                                <FaBookmark className="me-2" /> Enroll in Course
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={() => handleViewEnrollments(student)}
                              >
                                <FaBook className="me-2" /> View Enrollments
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-3">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add Student Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Student</Modal.Title>
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
            onClick={handleAddStudent}
            disabled={processingAction}
          >
            {processingAction ? "Adding..." : "Add Student"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Student Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Student</Modal.Title>
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
            onClick={handleUpdateStudent}
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
            Reset password for student:{" "}
            <strong>
              {selectedStudent?.firstName} {selectedStudent?.lastName}
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

      {/* Enroll Student Modal */}
      <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enroll Student in Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <p>
            Enroll student:{" "}
            <strong>
              {selectedStudent?.firstName} {selectedStudent?.lastName}
            </strong>
          </p>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Course</Form.Label>
              <Form.Select
                name="courseId"
                value={enrollmentData.courseId}
                onChange={handleEnrollmentChange}
                required
              >
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} - {course.instructorName}
                    </option>
                  ))
                ) : (
                  <option value="">No courses available</option>
                )}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEnrollStudent}
            disabled={processingAction || courses.length === 0}
          >
            {processingAction ? "Enrolling..." : "Enroll Student"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Enrollments Modal */}
      <Modal
        show={showEnrollmentsModal}
        onHide={() => setShowEnrollmentsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Courses for {selectedStudent?.firstName} {selectedStudent?.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {loadingEnrollments ? (
            <div className="text-center my-3">
              <Spinner animation="border" size="sm" />
              <p>Loading enrollments...</p>
            </div>
          ) : studentEnrollments.length === 0 ? (
            <Alert variant="info">
              This student is not enrolled in any courses.
              <Button
                variant="primary"
                size="sm"
                className="ms-3"
                onClick={() => {
                  setShowEnrollmentsModal(false);
                  handleOpenEnrollModal(selectedStudent);
                }}
              >
                Enroll in a Course
              </Button>
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Course Title</th>
                    <th>Instructor</th>
                    <th>Enrollment Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>{enrollment.courseTitle}</td>
                      <td>{enrollment.instructorName}</td>
                      <td>
                        {new Date(
                          enrollment.enrollmentDate,
                        ).toLocaleDateString()}
                      </td>
                      <td>
                        <Badge
                          bg={
                            enrollment.status === "Completed"
                              ? "success"
                              : "primary"
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setShowDropCourseModal(true);
                          }}
                          title="Drop from course"
                        >
                          <FaUnlink /> Drop
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEnrollmentsModal(false)}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowEnrollmentsModal(false);
              handleOpenEnrollModal(selectedStudent);
            }}
          >
            <FaBookmark className="me-2" /> Enroll in Another Course
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Drop Course Confirmation Modal */}
      <Modal
        show={showDropCourseModal}
        onHide={() => setShowDropCourseModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Drop Student from Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <p>
            Are you sure you want to drop student{" "}
            <strong>
              {selectedStudent?.firstName} {selectedStudent?.lastName}
            </strong>{" "}
            from the course <strong>{selectedEnrollment?.courseTitle}</strong>?
          </p>

          <Alert variant="warning">
            <strong>Warning:</strong> This will remove the student from the
            course and delete all their progress data for this course. This
            action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDropCourseModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDropFromCourse}
            disabled={processingAction}
          >
            {processingAction ? "Dropping..." : "Drop from Course"}
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

export default StudentManagement;
