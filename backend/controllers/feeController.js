const FeeSetting = require("../models/FeeSetting");
const FeePayment = require("../models/FeePayment");
const Student = require("../models/Student");

const CLASS_LIST = [
  "Playgroup",
  "Nursery",
  "Prep",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

const PAYMENT_METHODS = [
  "Cash",
  "Bank",
  "EasyPaisa",
  "JazzCash",
];

/* =========================================
   HELPERS
========================================= */

// Students module mein class "5" ho sakti hai,
// aur Fees module mein "Class 5".
// Dono formats support honge.
const getClassVariants = (className) => {
  const value = String(className || "").trim();

  const stripped = value.replace(/^Class\s*/i, "");

  const fullClassName =
    ["Playgroup", "Nursery", "Prep"].includes(stripped)
      ? stripped
      : `Class ${stripped}`;

  return [
    ...new Set([
      value,
      stripped,
      fullClassName,
    ]),
  ];
};

const isValidMonth = (value) => {
  return /^\d{4}-\d{2}$/.test(
    String(value || "")
  );
};

/* =========================================
   FEE SETTINGS
========================================= */

const getFeeSettings = async (req, res) => {
  try {
    const settings = await FeeSetting.find()
      .sort({
        className: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get Fee Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee settings.",
    });
  }
};

const saveFeeSetting = async (req, res) => {
  try {
    const {
      className,
      monthlyFee,
      dueDay,
    } = req.body;

    if (
      !className ||
      !CLASS_LIST.includes(className)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid class is required.",
      });
    }

    const fee = Number(monthlyFee);
    const day = Number(dueDay);

    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid monthly fee is required.",
      });
    }

    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 28
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Due day must be between 1 and 28.",
      });
    }

    const setting =
      await FeeSetting.findOneAndUpdate(
        {
          className,
        },
        {
          className,
          monthlyFee: fee,
          dueDay: day,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Fee setting saved successfully.",
      setting,
    });
  } catch (error) {
    console.error("Save Fee Setting Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save fee setting.",
    });
  }
};

/* =========================================
   DELETE FEE SETTING
   Student records / payments are NOT deleted.
========================================= */

const deleteFeeSetting = async (req, res) => {
  try {
    const className = String(
      req.params.className || ""
    ).trim();

    if (
      !className ||
      !CLASS_LIST.includes(className)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid class is required.",
      });
    }

    const setting = await FeeSetting.findOne({
      className,
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message:
          "Fee setting not found for this class.",
      });
    }

    await FeeSetting.deleteOne({
      _id: setting._id,
    });

    return res.status(200).json({
      success: true,
      message: `Fee setting for ${className} deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete Fee Setting Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete fee setting.",
    });
  }
};

/* =========================================
   COLLECTION LIST
========================================= */

const getCollection = async (req, res) => {
  try {
    const {
      className,
      month,
    } = req.query;

    if (
      !className ||
      !CLASS_LIST.includes(className)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid class is required.",
      });
    }

    if (!isValidMonth(month)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid month is required (YYYY-MM).",
      });
    }

    const setting = await FeeSetting.findOne({
      className,
    }).lean();

    const students = await Student.find({
      className: {
        $in: getClassVariants(className),
      },
    })
      .sort({
        rollNo: 1,
        name: 1,
      })
      .lean();

    const payments = await FeePayment.find({
      className,
      month,
    }).lean();

    const paymentMap = {};

    payments.forEach((payment) => {
      paymentMap[String(payment.student)] = payment;
    });

    const settingFee = setting?.monthlyFee ?? 0;

    const dueDay = setting?.dueDay ?? 10;

    const now = new Date();

    const list = students.map((student) => {
      const payment =
        paymentMap[String(student._id)];

      const netPayable = payment
        ? Number(payment.monthlyFee || 0) -
          Number(payment.discount || 0)
        : settingFee;

      let status = "Pending";

      if (payment) {
        const due =
          Number(payment.monthlyFee || 0) -
          Number(payment.discount || 0);

        status =
          Number(payment.paidAmount || 0) >= due
            ? "Paid"
            : "Partial";
      } else {
        const [year, monthNumber] = month
          .split("-")
          .map(Number);

        const dueDate = new Date(
          year,
          monthNumber - 1,
          dueDay
        );

        const lateCutoff = new Date(dueDate);

        lateCutoff.setDate(
          lateCutoff.getDate() + 3
        );

        if (now > lateCutoff) {
          status = "Late";
        }
      }

      return {
        _id: student._id,
        paymentId: payment?._id || null,

        className,
        rollNo: student.rollNo || "",
        name: student.name || "",
        fatherName: student.fatherName || "",
        phone: student.phone || "",

        monthlyFee:
          payment?.monthlyFee ?? settingFee,

        discount: payment?.discount ?? 0,

        paidAmount: payment?.paidAmount ?? 0,

        method: payment?.method || "",
        notes: payment?.notes || "",

        receiptNo: payment?.receiptNo || "",

        paidAt: payment?.paidAt || null,

        netPayable,
        status,
      };
    });

    const stats = {
      total: list.length,

      paid: list.filter(
        (student) => student.status === "Paid"
      ).length,

      partial: list.filter(
        (student) => student.status === "Partial"
      ).length,

      pending: list.filter(
        (student) =>
          student.status === "Pending" ||
          student.status === "Late"
      ).length,

      late: list.filter(
        (student) => student.status === "Late"
      ).length,

      collected: list.reduce(
        (sum, student) =>
          sum + Number(student.paidAmount || 0),
        0
      ),

      expected: list.reduce(
        (sum, student) =>
          sum + Number(student.netPayable || 0),
        0
      ),
    };

    return res.status(200).json({
      success: true,
      className,
      month,
      dueDay,
      hasSetting: Boolean(setting),
      students: list,
      stats,
    });
  } catch (error) {
    console.error("Get Collection Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch collection.",
    });
  }
};

/* =========================================
   COLLECT / UPDATE PAYMENT
========================================= */

const collectFee = async (req, res) => {
  try {
    const {
      studentId,
      month,
      discount,
      paidAmount,
      method,
      notes,
    } = req.body;

    if (!studentId || !isValidMonth(month)) {
      return res.status(400).json({
        success: false,
        message:
          "Student and valid month are required.",
      });
    }

    const student = await Student.findById(
      studentId
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const studentClass = String(
      student.className || ""
    ).trim();

    const feeClassName = CLASS_LIST.includes(
      studentClass
    )
      ? studentClass
      : `Class ${studentClass.replace(
          /^Class\s*/i,
          ""
        )}`;

    if (!CLASS_LIST.includes(feeClassName)) {
      return res.status(400).json({
        success: false,
        message:
          "Student has an invalid class for fee collection.",
      });
    }

    const setting = await FeeSetting.findOne({
      className: feeClassName,
    }).lean();

    if (!setting) {
      return res.status(400).json({
        success: false,
        message: `No fee setting for ${feeClassName}. Set it in Fee Settings first.`,
      });
    }

    const fee = Number(setting.monthlyFee);

    const disc = Math.max(
      0,
      Number(discount) || 0
    );

    const paid = Math.max(
      0,
      Number(paidAmount) || 0
    );

    if (disc > fee) {
      return res.status(400).json({
        success: false,
        message:
          "Discount cannot be more than monthly fee.",
      });
    }

    if (paid <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Paid amount must be greater than zero.",
      });
    }

    if (paid > fee - disc) {
      return res.status(400).json({
        success: false,
        message:
          "Paid amount is more than payable fee.",
      });
    }

    if (!PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid payment method is required.",
      });
    }

    const existing = await FeePayment.findOne({
      student: studentId,
      month,
    });

    let receiptNo;

    if (existing) {
      receiptNo = existing.receiptNo;
    } else {
      const prefix = `FSS-${month.replace(
        "-",
        ""
      )}`;

      const count = await FeePayment.countDocuments({
        receiptNo: {
          $regex: `^${prefix}`,
        },
      });

      receiptNo = `${prefix}-${String(
        count + 1
      ).padStart(4, "0")}`;
    }

    const payment =
      await FeePayment.findOneAndUpdate(
        {
          student: studentId,
          month,
        },
        {
          student: studentId,
          studentName: student.name,
          className: feeClassName,

          month,
          monthlyFee: fee,
          discount: disc,
          paidAmount: paid,

          method,
          notes: notes?.trim() || "",

          receiptNo,

          paidAt: new Date(),
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Fee saved successfully.",
      payment,
    });
  } catch (error) {
    console.error("Collect Fee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save fee.",
    });
  }
};

/* =========================================
   DELETE STUDENT FEE PAYMENT
========================================= */

const deleteFeePayment = async (req, res) => {
  try {
    const payment = await FeePayment.findById(
      req.params.id
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found.",
      });
    }

    await FeePayment.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Fee record deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Fee Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete fee record.",
    });
  }
};

/* =========================================
   STUDENT FEE HISTORY
========================================= */

const getStudentHistory = async (req, res) => {
  try {
    const payments = await FeePayment.find({
      student: req.params.studentId,
    })
      .sort({
        month: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error(
      "Get Student History Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee history.",
    });
  }
};

module.exports = {
  getFeeSettings,
  saveFeeSetting,
  deleteFeeSetting,

  getCollection,
  collectFee,
  deleteFeePayment,
  getStudentHistory,
};