const Student = require("../models/Student");

const VALID_CLASSES = [
  "Playgroup",
  "Nursery",
  "Prep",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];

const MAX_PROFILE_PHOTO_LENGTH = 4500000;

const cleanString = (value) =>
  typeof value === "string" ? value.trim() : "";

const getProfilePhoto = (value) => {
  const photo = cleanString(value);

  if (!photo) {
    return { photo: "" };
  }

  if (photo.length > MAX_PROFILE_PHOTO_LENGTH) {
    return { error: "Profile photo is too large. Please use a photo under 2MB." };
  }

  const isDataImage = /^data:image\/(?:png|jpe?g|webp);base64,/i.test(photo);
  const isImageUrl = /^https?:\/\/\S+$/i.test(photo);

  if (!isDataImage && !isImageUrl) {
    return { error: "Profile photo format is not valid." };
  }

  return { photo };
};

// ========================================
// GET ALL STUDENTS
// ========================================

const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get Students Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};

// ========================================
// GET SINGLE STUDENT
// ========================================

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Get Student Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch student",
    });
  }
};

// ========================================
// CREATE STUDENT
// ========================================

const createStudent = async (req, res) => {
  try {
    const {
      rollNo,
      admissionNo,
      name,
      fatherName,
      gender,
      dateOfBirth,
      className,
      phone,
      address,
      admissionDate,
      status,
      profilePhoto,
    } = req.body;

    const rollNoValue = cleanString(rollNo);
    const admissionNoValue = cleanString(admissionNo);
    const nameValue = cleanString(name);
    const fatherNameValue = cleanString(fatherName);
    const genderValue = cleanString(gender);
    const classNameValue = cleanString(className);

    if (
      !rollNoValue ||
      !nameValue ||
      !fatherNameValue ||
      !genderValue ||
      !classNameValue ||
      !admissionDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required student fields",
      });
    }

    if (!VALID_CLASSES.includes(classNameValue)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid class selected. Choose Playgroup, Nursery, Prep, or Class 1-10.",
      });
    }

    const profilePhotoResult = getProfilePhoto(profilePhoto);

    if (profilePhotoResult.error) {
      return res.status(400).json({
        success: false,
        message: profilePhotoResult.error,
      });
    }

    const existingRollNo = await Student.findOne({
      rollNo: rollNoValue,
    });

    if (existingRollNo) {
      return res.status(409).json({
        success: false,
        message: "Roll number already exists",
      });
    }

    if (admissionNoValue) {
      const existingAdmission = await Student.findOne({
        admissionNo: admissionNoValue,
      });

      if (existingAdmission) {
        return res.status(409).json({
          success: false,
          message: "Admission number already exists",
        });
      }
    }

    const student = await Student.create({
      rollNo: rollNoValue,
      admissionNo: admissionNoValue || "",
      name: nameValue,
      fatherName: fatherNameValue,
      gender: genderValue,
      dateOfBirth: dateOfBirth || null,
      className: classNameValue,
      phone: cleanString(phone),
      address: cleanString(address),
      admissionDate,
      status: status || "Active",
      profilePhoto: profilePhotoResult.photo || "",
    });

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    console.error("Create Student Error:", error);

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors || {})
        .map((item) => item.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: message || "Student validation failed",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Roll number or admission number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create student",
    });
  }
};

// ========================================
// UPDATE STUDENT
// ========================================

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const {
      rollNo,
      admissionNo,
      name,
      fatherName,
      gender,
      dateOfBirth,
      className,
      phone,
      address,
      admissionDate,
      status,
      profilePhoto,
    } = req.body;

    if (rollNo !== undefined) {
      const rollNoValue = cleanString(rollNo);

      if (!rollNoValue) {
        return res.status(400).json({
          success: false,
          message: "Roll number is required",
        });
      }

      student.rollNo = rollNoValue;
    }

    if (admissionNo !== undefined) {
      student.admissionNo = cleanString(admissionNo);
    }

    if (name !== undefined) {
      student.name = cleanString(name);
    }

    if (fatherName !== undefined) {
      student.fatherName = cleanString(fatherName);
    }

    if (gender !== undefined) {
      student.gender = cleanString(gender);
    }

    if (dateOfBirth !== undefined) {
      student.dateOfBirth = dateOfBirth || null;
    }

    if (className !== undefined) {
      const classNameValue = cleanString(className);

      if (!VALID_CLASSES.includes(classNameValue)) {
        return res.status(400).json({
          success: false,
          message: "Invalid class selected",
        });
      }

      student.className = classNameValue;
    }

    if (phone !== undefined) {
      student.phone = cleanString(phone);
    }

    if (address !== undefined) {
      student.address = cleanString(address);
    }

    if (admissionDate !== undefined) {
      student.admissionDate = admissionDate;
    }

    if (status !== undefined) {
      student.status = status;
    }

    if (profilePhoto !== undefined) {
      const profilePhotoResult = getProfilePhoto(profilePhoto);

      if (profilePhotoResult.error) {
        return res.status(400).json({
          success: false,
          message: profilePhotoResult.error,
        });
      }

      student.profilePhoto = profilePhotoResult.photo || "";
    }

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    console.error("Update Student Error:", error);

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors || {})
        .map((item) => item.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: message || "Student validation failed",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Roll number or admission number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update student",
    });
  }
};

// ========================================
// DELETE STUDENT
// ========================================

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await Student.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete Student Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete student",
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};