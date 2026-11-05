const Teacher = require("../models/Teacher");

const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Get Teachers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch teachers",
    });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("Get Teacher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch teacher",
    });
  }
};

const createTeacher = async (req, res) => {
  try {
    const {
      name,
      fatherName,
      gender,
      qualification,
      phone,
      address,
      joiningDate,
      salary,
      profilePhoto,
    } = req.body;

    // teacherId, dateOfBirth, email, status, subject removed
    if (
      !name ||
      !fatherName ||
      !gender ||
      !qualification ||
      !phone ||
      !joiningDate ||
      salary === undefined ||
      salary === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required teacher fields",
      });
    }

    const teacher = await Teacher.create({
      name: name.trim(),
      fatherName: fatherName.trim(),
      gender,
      qualification: qualification.trim(),
      phone: phone.trim(),
      address: address?.trim() || "",
      joiningDate,
      salary: Number(salary),
      profilePhoto: profilePhoto || "",
    });

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      teacher,
    });
  } catch (error) {
    console.error("Create Teacher Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate value found. Phone number may already exist.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create teacher",
    });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const {
      name,
      fatherName,
      gender,
      qualification,
      phone,
      address,
      joiningDate,
      salary,
      profilePhoto,
    } = req.body;

    if (name !== undefined) {
      teacher.name = name.trim();
    }

    if (fatherName !== undefined) {
      teacher.fatherName = fatherName.trim();
    }

    if (gender !== undefined) {
      teacher.gender = gender;
    }

    if (qualification !== undefined) {
      teacher.qualification = qualification.trim();
    }

    if (phone !== undefined) {
      teacher.phone = phone.trim();
    }

    if (address !== undefined) {
      teacher.address = address.trim();
    }

    if (joiningDate !== undefined) {
      teacher.joiningDate = joiningDate;
    }

    if (salary !== undefined && salary !== "") {
      teacher.salary = Number(salary);
    }

    if (profilePhoto !== undefined) {
      teacher.profilePhoto = profilePhoto;
    }

    await teacher.save();

    return res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      teacher,
    });
  } catch (error) {
    console.error("Update Teacher Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate value found. Phone number may already exist.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update teacher",
    });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    await Teacher.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Delete Teacher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete teacher",
    });
  }
};

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};