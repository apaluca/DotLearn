import { useState } from "react";
import { Card, Button, Badge, Modal, ProgressBar } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaArrowRight,
  FaSignOutAlt,
} from "react-icons/fa";

function CourseCard({
  course,
  isEnrolled,
  isCompleted,
  isInstructor,
  enrollmentId,
  onEnrollmentChange,
  showProgress = false,
}) {
  const [showDropConfirm, setShowDropConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const enrollInCourse = async () => {
    try {
      setIsProcessing(true);
      const response = await axios.post("/api/enrollments", {
        courseId: course.id,
      });

      if (onEnrollmentChange) {
        onEnrollmentChange("enroll", course.id, response.data);
      }
    } catch (err) {
      if (
        err.response?.status === 400 &&
        err.response?.data?.message?.includes("Already enrolled")
      ) {
        if (onEnrollmentChange) {
          onEnrollmentChange("enroll", course.id);
        }
      } else {
        console.error(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const dropCourse = async () => {
    try {
      setIsProcessing(true);

      if (enrollmentId) {
        await axios.delete(`/api/enrollments/${enrollmentId}`);

        if (onEnrollmentChange) {
          onEnrollmentChange("drop", course.id);
        }

        setShowDropConfirm(false);
      } else {
        throw new Error("Enrollment information not found");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="h-100 border-0 shadow-sm">
        <Card.Body>
          <h5 className="card-title mb-2">{course.title}</h5>
          <p className="text-muted small mb-3 d-flex align-items-center">
            <FaChalkboardTeacher className="me-1" /> {course.instructorName}
          </p>

          <p
            className="card-text mb-3"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              height: "4.5rem",
            }}
          >
            {course.description}
          </p>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <Badge
              bg={
                isEnrolled ? (isCompleted ? "success" : "primary") : "secondary"
              }
            >
              {isEnrolled ? (
                isCompleted ? (
                  "Completed"
                ) : (
                  "Enrolled"
                )
              ) : (
                <FaUsers className="me-1" />
              )}
              {!isEnrolled && (
                <span>{course.enrollmentCount || 0} students</span>
              )}
            </Badge>

            {isInstructor && <Badge bg="info">Instructor</Badge>}
          </div>

          {showProgress && course.progressPercentage !== undefined && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small>Progress</small>
                <small>{Math.round(course.progressPercentage)}%</small>
              </div>
              <ProgressBar
                now={course.progressPercentage}
                variant={
                  course.progressPercentage >= 100
                    ? "success"
                    : course.progressPercentage > 50
                      ? "info"
                      : "primary"
                }
                style={{ height: "8px" }}
              />
            </div>
          )}
        </Card.Body>
        <Card.Footer className="bg-white border-top-0 pt-0">
          <div className="d-grid gap-2">
            <Button
              as={Link}
              to={`/courses/${course.id}`}
              variant={
                isEnrolled
                  ? isCompleted
                    ? "outline-primary"
                    : "primary"
                  : "primary"
              }
              className="d-flex align-items-center justify-content-center"
            >
              {isEnrolled
                ? isCompleted
                  ? "Review Course"
                  : "Continue Learning"
                : "View Course"}
              <FaArrowRight className="ms-2" />
            </Button>

            {!isInstructor && isEnrolled && (
              <Button
                variant="outline-danger"
                onClick={() => setShowDropConfirm(true)}
                disabled={isProcessing}
                size="sm"
              >
                <FaSignOutAlt className="me-1" /> Drop Course
              </Button>
            )}

            {!isInstructor && !isEnrolled && (
              <Button
                variant="outline-primary"
                onClick={enrollInCourse}
                disabled={isProcessing}
                size="sm"
              >
                {isProcessing ? "Enrolling..." : "Enroll Now"}
              </Button>
            )}
          </div>
        </Card.Footer>
      </Card>

      {/* Drop Course Confirmation Modal */}
      <Modal
        show={showDropConfirm}
        onHide={() => setShowDropConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Drop Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to drop <strong>{course.title}</strong>?
          </p>
          <p className="text-danger mb-0">All your progress will be lost.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDropConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={dropCourse} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Drop Course"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default CourseCard;
