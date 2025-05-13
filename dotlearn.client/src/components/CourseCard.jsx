import { useState } from "react";
import { Card, Button, Badge, Modal } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaArrowRight,
  FaSignOutAlt,
  FaCheck,
  FaClock,
} from "react-icons/fa";

function CourseCard({
  course,
  isEnrolled,
  isCompleted,
  isInstructor,
  enrollmentId,
  onEnrollmentChange,
}) {
  const [showDropConfirm, setShowDropConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const enrollInCourse = async () => {
    try {
      setIsProcessing(true);
      // Make the API call to enroll
      const response = await axios.post("/api/enrollments", {
        courseId: course.id,
      });

      // Notify parent component to update UI immediately
      if (onEnrollmentChange) {
        onEnrollmentChange("enroll", course.id, response.data);
      }

      alert("Successfully enrolled in the course!");
    } catch (err) {
      // Check if it's "already enrolled" error
      if (
        err.response?.status === 400 &&
        err.response?.data?.message?.includes("Already enrolled")
      ) {
        // Handle already enrolled case - update parent state anyway
        if (onEnrollmentChange) {
          onEnrollmentChange("enroll", course.id);
        }
        alert("You are already enrolled in this course.");
      } else {
        alert(
          err.response?.data?.message ||
            "Failed to enroll in the course. Please try again.",
        );
      }
      console.error(err);
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
        alert("You have successfully dropped the course.");
      } else {
        throw new Error("Enrollment information not found");
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to drop the course. Please try again.",
      );
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to navigate to the appropriate lesson
  const navigateToCourse = async (e) => {
    e.preventDefault(); // Prevent default Link behavior

    // If not enrolled or is instructor, just go to the course page
    if (!isEnrolled || isInstructor) {
      navigate(`/courses/${course.id}`);
      return;
    }

    try {
      // If enrolled, get progress to find the right lesson
      const response = await axios.get(`/api/progress/course/${course.id}`);

      // Find a lesson in progress
      let targetLessonId = null;
      let foundInProgress = false;
      let lastCompletedLessonId = null;

      // Loop through modules to find our target lesson
      for (const module of response.data.modules) {
        for (const lesson of module.lessons) {
          if (lesson.startedAt && !lesson.isCompleted) {
            // Found a lesson in progress
            targetLessonId = lesson.lessonId;
            foundInProgress = true;
            break;
          }

          if (lesson.isCompleted) {
            // Keep track of the last completed lesson
            lastCompletedLessonId = lesson.lessonId;
          }
        }

        if (foundInProgress) break;
      }

      if (targetLessonId) {
        // Navigate to the in-progress lesson
        navigate(`/courses/${course.id}/lesson/${targetLessonId}`);
      } else if (lastCompletedLessonId) {
        // Navigate to the last completed lesson (the course detail will handle finding the next one)
        navigate(`/courses/${course.id}/lesson/${lastCompletedLessonId}`);
      } else {
        // No progress, just go to the course page
        navigate(`/courses/${course.id}`);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
      // Fall back to regular navigation
      navigate(`/courses/${course.id}`);
    }
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Card.Title className="mb-3">{course.title}</Card.Title>
        <Card.Subtitle className="mb-3 text-muted d-flex align-items-center gap-2">
          <FaChalkboardTeacher /> {course.instructorName}
        </Card.Subtitle>
        <Card.Text>
          {course.description?.length > 150
            ? course.description.substring(0, 150) + "..."
            : course.description}
        </Card.Text>

        {course.enrollmentCount !== undefined && (
          <div className="d-flex align-items-center mb-3">
            <FaUsers className="text-muted me-2" />
            <small className="text-muted">
              {course.enrollmentCount} student
              {course.enrollmentCount !== 1 ? "s" : ""} enrolled
            </small>
          </div>
        )}

        {isEnrolled && (
          <Badge bg={isCompleted ? "success" : "primary"} className="mb-2">
            {isCompleted ? "Completed" : "You're enrolled"}
          </Badge>
        )}

        {isInstructor && (
          <Badge bg="info" className="mb-2">
            You're the instructor
          </Badge>
        )}

        {course.status && (
          <div className="d-flex align-items-center mb-2">
            {course.status === "Completed" ? (
              <>
                <FaCheck className="text-success me-1" />
                <small>
                  Completed on:{" "}
                  {new Date(course.completionDate).toLocaleDateString()}
                </small>
              </>
            ) : (
              <>
                <FaClock className="text-muted me-1" />
                <small className="text-muted">
                  Enrolled on:{" "}
                  {new Date(course.enrollmentDate).toLocaleDateString()}
                </small>
              </>
            )}
          </div>
        )}
      </Card.Body>
      <Card.Footer className="bg-white">
        <div className="d-grid gap-2">
          <Button
            onClick={navigateToCourse}
            variant={
              isEnrolled
                ? isCompleted
                  ? "outline-primary"
                  : "success"
                : "primary"
            }
            className="d-flex align-items-center justify-content-center gap-2"
          >
            {isEnrolled
              ? isCompleted
                ? "Review Course"
                : "Continue Learning"
              : "View Course"}
            <FaArrowRight />
          </Button>

          {!isInstructor &&
            (isEnrolled ? (
              <Button
                variant="outline-danger"
                onClick={() => setShowDropConfirm(true)}
                disabled={isProcessing}
                className="d-flex align-items-center justify-content-center gap-2"
              >
                <FaSignOutAlt />{" "}
                {isProcessing ? "Processing..." : "Drop Course"}
              </Button>
            ) : (
              <Button
                variant="outline-primary"
                onClick={enrollInCourse}
                disabled={isProcessing}
              >
                {isProcessing ? "Enrolling..." : "Enroll"}
              </Button>
            ))}
        </div>
      </Card.Footer>

      {/* Drop Course Confirmation Modal */}
      <Modal show={showDropConfirm} onHide={() => setShowDropConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Drop Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to drop the course{" "}
            <strong>{course.title}</strong>?
          </p>
          <p>
            This will remove you from the course and all your progress will be
            lost.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDropConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={dropCourse} disabled={isProcessing}>
            {isProcessing ? "Dropping..." : "Drop Course"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

export default CourseCard;
