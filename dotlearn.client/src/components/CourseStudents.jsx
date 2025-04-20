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
} from "react-icons/fa";

function CourseStudents() {
  const { id } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("lastName");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const fetchCourseStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/courses/${id}/students`);
        setCourseData(response.data);
      } catch (err) {
        console.error("Error fetching course students:", err);
        setError(
          err.response?.data ||
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
    const filtered = courseData.students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Sort students
    return [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle special case for name (combined field)
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
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading student data...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!courseData) {
    return <Alert variant="warning">Course data not found.</Alert>;
  }

  const students = getFilteredAndSortedStudents();

  return (
    <div>
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
      <div className="row mb-4">
        <div className="col-md-4">
          <Card className="shadow-sm text-center h-100">
            <Card.Body>
              <FaUsers className="text-primary mb-2" size={32} />
              <h5>Total Students</h5>
              <h2>{courseData.totalStudents}</h2>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="shadow-sm text-center h-100">
            <Card.Body>
              <div className="mb-2">
                <ProgressBar
                  now={courseData.averageProgress}
                  variant="info"
                  style={{ height: "20px" }}
                />
              </div>
              <h5>Average Progress</h5>
              <h2>{courseData.averageProgress.toFixed(1)}%</h2>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="shadow-sm text-center h-100">
            <Card.Body>
              <FaUserGraduate className="text-success mb-2" size={32} />
              <h5>Completion Rate</h5>
              <h2>{courseData.completionRate.toFixed(1)}%</h2>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="h5 mb-0">Student List</h3>
            <InputGroup className="w-50">
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    style={{ cursor: "pointer" }}
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
                    onClick={() => handleSort("username")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex align-items-center">
                      Username
                      {sortField === "username" && (
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
                            style={{ width: "40px", height: "40px" }}
                          >
                            {student.firstName?.charAt(0) ||
                              student.username.charAt(0)}
                          </div>
                          <div className="ms-2">
                            <div className="fw-bold">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-muted small">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{student.username}</td>
                      <td>
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </td>
                      <td>
                        <Badge
                          bg={getStatusBadgeColor(student.status)}
                          className="fw-normal"
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar
                            now={student.progressPercentage}
                            variant={getProgressVariant(
                              student.progressPercentage,
                            )}
                            style={{ height: "8px", width: "80px" }}
                          />
                          <span>{student.progressPercentage.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-3">
                      {searchTerm
                        ? "No students match your search"
                        : "No students enrolled in this course"}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

function getStatusBadgeColor(status) {
  switch (status) {
    case "Completed":
      return "success";
    case "Active":
      return "primary";
    case "Dropped":
      return "secondary";
    default:
      return "info";
  }
}

function getProgressVariant(percentage) {
  if (percentage >= 100) return "success";
  if (percentage >= 75) return "info";
  if (percentage >= 50) return "primary";
  if (percentage >= 25) return "warning";
  return "danger";
}

export default CourseStudents;
