import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  Table,
  Badge,
  ProgressBar,
  Alert,
  Spinner,
  Button,
  Form,
  InputGroup,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import axios from "axios";
import {
  FaUsers,
  FaUserGraduate,
  FaArrowLeft,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaCalendarAlt,
  FaChartLine,
  FaFilter,
  FaCheckCircle,
} from "react-icons/fa";

function CourseStudents() {
  const { id } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("lastName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const fetchCourseStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/courses/${id}/students`);

        // Ensure response data has the expected structure
        if (response.data && typeof response.data === "object") {
          // Log data to console for debugging
          console.log("Course students data:", response.data);

          // Make sure numerical values are actual numbers
          const processedData = {
            ...response.data,
            averageProgress:
              typeof response.data.averageProgress === "number"
                ? response.data.averageProgress
                : parseFloat(response.data.averageProgress) || 0,
            completionRate:
              typeof response.data.completionRate === "number"
                ? response.data.completionRate
                : parseFloat(response.data.completionRate) || 0,
            totalStudents:
              typeof response.data.totalStudents === "number"
                ? response.data.totalStudents
                : parseInt(response.data.totalStudents) || 0,
          };

          setCourseData(processedData);
        } else {
          throw new Error("Invalid data format received from server");
        }
      } catch (err) {
        console.error("Error fetching course students:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load student data. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourseStudents();
  }, [id]);

  // Handle sorting
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
    if (!courseData?.students) return [];

    // Filter students
    const filtered = courseData.students.filter((student) => {
      const matchesSearch =
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort students
    return [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Special case for name (combined field)
      if (sortField === "name") {
        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
      }

      // Handle string comparison
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle date comparison
      if (sortField === "enrollmentDate" || sortField === "completionDate") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading student data...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!courseData) {
    return (
      <Container>
        <Alert variant="warning">Course data not found.</Alert>
      </Container>
    );
  }

  const students = getFilteredAndSortedStudents();

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Students - {courseData.courseTitle}</h1>
        <Button
          as={Link}
          to={`/courses/${id}`}
          variant="outline-primary"
          className="d-flex align-items-center gap-2"
        >
          <FaArrowLeft /> Back to Course
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="display-4 text-primary mb-2">
                {courseData.totalStudents}
              </div>
              <div className="d-flex align-items-center justify-content-center">
                <FaUsers className="text-primary me-2" />
                <h5 className="mb-0">Total Students</h5>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="display-4 text-info mb-2">
                {courseData.averageProgress?.toFixed(1) ?? "0.0"}%
              </div>
              <div className="d-flex align-items-center justify-content-center">
                <FaChartLine className="text-info me-2" />
                <h5 className="mb-0">Average Progress</h5>
              </div>
              <ProgressBar
                now={courseData.averageProgress || 0}
                variant="info"
                style={{ height: "8px" }}
                className="mt-3"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="display-4 text-success mb-2">
                {courseData.completionRate?.toFixed(1) ?? "0.0"}%
              </div>
              <div className="d-flex align-items-center justify-content-center">
                <FaCheckCircle className="text-success me-2" />
                <h5 className="mb-0">Completion Rate</h5>
              </div>
              <ProgressBar
                now={courseData.completionRate || 0}
                variant="success"
                style={{ height: "8px" }}
                className="mt-3"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center border-0">
          <h3 className="h5 mb-0">Student List</h3>
          <div className="d-flex gap-2">
            <Form.Select
              size="sm"
              style={{ width: "auto" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">In Progress</option>
              <option value="Completed">Completed</option>
            </Form.Select>
          </div>
        </Card.Header>

        <Card.Body className="py-3">
          <InputGroup className="mb-3">
            <InputGroup.Text className="bg-white">
              <FaSearch className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search students by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0"
            />
          </InputGroup>

          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    style={{ cursor: "pointer" }}
                    className="py-3"
                  >
                    <div className="d-flex align-items-center">
                      Student
                      {sortField === "name" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? (
                            <FaSortAlphaDown size={14} />
                          ) : (
                            <FaSortAlphaUp size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("enrollmentDate")}
                    style={{ cursor: "pointer" }}
                    className="py-3"
                  >
                    <div className="d-flex align-items-center">
                      <FaCalendarAlt className="me-1" /> Enrolled
                      {sortField === "enrollmentDate" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? (
                            <FaSortAlphaDown size={14} />
                          ) : (
                            <FaSortAlphaUp size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    style={{ cursor: "pointer" }}
                    className="py-3"
                  >
                    <div className="d-flex align-items-center">
                      Status
                      {sortField === "status" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? (
                            <FaSortAlphaDown size={14} />
                          ) : (
                            <FaSortAlphaUp size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("progressPercentage")}
                    style={{ cursor: "pointer" }}
                    className="py-3"
                  >
                    <div className="d-flex align-items-center">
                      <FaChartLine className="me-1" /> Progress
                      {sortField === "progressPercentage" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? (
                            <FaSortAlphaDown size={14} />
                          ) : (
                            <FaSortAlphaUp size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.userId}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div
                            className="bg-primary rounded-circle d-flex justify-content-center align-items-center text-white"
                            style={{
                              width: "40px",
                              height: "40px",
                              flexShrink: 0,
                            }}
                          >
                            {student.firstName?.charAt(0) ||
                              student.username.charAt(0)}
                          </div>
                          <div className="ms-3">
                            <div>
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-muted small">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </td>
                      <td>
                        <Badge
                          bg={getStatusBadgeColor(student.status)}
                          className="px-2 py-1"
                        >
                          {student.status === "Active"
                            ? "In Progress"
                            : student.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar
                            now={student.progressPercentage || 0}
                            variant={getProgressVariant(
                              student.progressPercentage,
                            )}
                            style={{
                              height: "8px",
                              width: "80px",
                              flexShrink: 0,
                            }}
                          />
                          <span>
                            {(student.progressPercentage || 0).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      {searchTerm || statusFilter
                        ? "No students match your search criteria"
                        : "No students enrolled in this course"}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

function getStatusBadgeColor(status) {
  switch (status) {
    case "Completed":
      return "success";
    case "Active":
      return "primary";
    default:
      return "info";
  }
}

function getProgressVariant(percentage) {
  if (!percentage) return "danger";
  if (percentage >= 100) return "success";
  if (percentage >= 75) return "info";
  if (percentage >= 50) return "primary";
  if (percentage >= 25) return "warning";
  return "danger";
}

export default CourseStudents;
