const AcademicSession = require("../models/AcademicSession");

const getAcademicSessions = async (req, res) => {
  try {
    const sessions = await AcademicSession.find().sort({
      startDate: -1,
    });

    return res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error(
      "Get Academic Sessions Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch academic sessions",
    });
  }
};

const getActiveAcademicSession = async (
  req,
  res
) => {
  try {
    const session =
      await AcademicSession.findOne({
        status: "Active",
      }).sort({
        startDate: -1,
      });

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "Get Active Academic Session Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch active academic session",
    });
  }
};

const getAcademicSessionById = async (
  req,
  res
) => {
  try {
    const session =
      await AcademicSession.findById(
        req.params.id
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Academic session not found",
      });
    }

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "Get Academic Session Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch academic session",
    });
  }
};

const createAcademicSession = async (
  req,
  res
) => {
  try {
    const {
      sessionName,
      startDate,
      endDate,
      status,
      description,
    } = req.body;

    if (
      !sessionName ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Session name, start date and end date are required",
      });
    }

    if (
      new Date(endDate) <=
      new Date(startDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date must be after start date",
      });
    }

    const existingSession =
      await AcademicSession.findOne({
        sessionName:
          sessionName.trim(),
      });

    if (existingSession) {
      return res.status(409).json({
        success: false,
        message:
          "An academic session with this name already exists",
      });
    }

    const selectedStatus =
      status || "Inactive";

    if (selectedStatus === "Active") {
      await AcademicSession.updateMany(
        {},
        {
          $set: {
            status: "Inactive",
          },
        }
      );
    }

    const session =
      await AcademicSession.create({
        sessionName:
          sessionName.trim(),
        startDate,
        endDate,
        status: selectedStatus,
        description:
          description?.trim() || "",
      });

    return res.status(201).json({
      success: true,
      message:
        "Academic session created successfully",
      session,
    });
  } catch (error) {
    console.error(
      "Create Academic Session Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An academic session with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create academic session",
    });
  }
};

const updateAcademicSession = async (
  req,
  res
) => {
  try {
    const {
      sessionName,
      startDate,
      endDate,
      status,
      description,
    } = req.body;

    if (
      !sessionName ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Session name, start date and end date are required",
      });
    }

    if (
      new Date(endDate) <=
      new Date(startDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date must be after start date",
      });
    }

    const duplicateSession =
      await AcademicSession.findOne({
        sessionName:
          sessionName.trim(),
        _id: {
          $ne: req.params.id,
        },
      });

    if (duplicateSession) {
      return res.status(409).json({
        success: false,
        message:
          "An academic session with this name already exists",
      });
    }

    if (status === "Active") {
      await AcademicSession.updateMany(
        {
          _id: {
            $ne: req.params.id,
          },
        },
        {
          $set: {
            status: "Inactive",
          },
        }
      );
    }

    const session =
      await AcademicSession.findByIdAndUpdate(
        req.params.id,
        {
          sessionName:
            sessionName.trim(),
          startDate,
          endDate,
          status: status || "Inactive",
          description:
            description?.trim() || "",
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Academic session not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Academic session updated successfully",
      session,
    });
  } catch (error) {
    console.error(
      "Update Academic Session Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An academic session with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update academic session",
    });
  }
};

const deleteAcademicSession = async (
  req,
  res
) => {
  try {
    const session =
      await AcademicSession.findById(
        req.params.id
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Academic session not found",
      });
    }

    if (session.status === "Active") {
      return res.status(400).json({
        success: false,
        message:
          "Active academic session cannot be deleted",
      });
    }

    await AcademicSession.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Academic session deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Academic Session Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete academic session",
    });
  }
};

module.exports = {
  getAcademicSessions,
  getActiveAcademicSession,
  getAcademicSessionById,
  createAcademicSession,
  updateAcademicSession,
  deleteAcademicSession,
};