const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const FeePayment = require("../models/FeePayment");
const Attendance = require("../models/Attendance");
const Timetable = require("../models/Timetable");
const Result = require("../models/Result");

const SCHOOL_TIMEZONE = "Asia/Karachi";

const CLASS_ORDER = [
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

/* =========================================
   HELPERS
========================================= */

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const normalizeStatus = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const getSchoolTodayKey = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type) =>
    parts.find((item) => item.type === type)?.value;

  return `${getPart("year")}-${getPart(
    "month"
  )}-${getPart("day")}`;
};

const getSchoolDayName = () => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: SCHOOL_TIMEZONE,
  }).format(new Date());
};

const getDateKey = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);

    if (match) {
      return match[1];
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type) =>
    parts.find((item) => item.type === type)?.value;

  return `${getPart("year")}-${getPart(
    "month"
  )}-${getPart("day")}`;
};

const getLastMonths = (count = 6) => {
  const todayKey = getSchoolTodayKey();

  const [currentYear, currentMonth] = todayKey
    .split("-")
    .map(Number);

  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;

    const date = new Date(
      Date.UTC(
        currentYear,
        currentMonth - 1 - offset,
        1,
        12
      )
    );

    const year = date.getUTCFullYear();

    const month = String(
      date.getUTCMonth() + 1
    ).padStart(2, "0");

    return {
      key: `${year}-${month}`,

      month: date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),

      admissions: 0,
    };
  });
};

const getLastDays = (count = 7) => {
  const todayKey = getSchoolTodayKey();

  const [year, month, day] = todayKey
    .split("-")
    .map(Number);

  const today = new Date(
    Date.UTC(year, month - 1, day, 12)
  );

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);

    date.setUTCDate(
      today.getUTCDate() - (count - 1 - index)
    );

    const key = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0"),
    ].join("-");

    return {
      key,

      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      }),

      Present: 0,
      Absent: 0,
      Late: 0,
      Leave: 0,
    };
  });
};

const getClassOrder = (className) => {
  const value = String(className || "")
    .replace(/^Class\s*/i, "")
    .trim();

  const index = CLASS_ORDER.indexOf(value);

  return index === -1 ? 999 : index;
};

/* =========================================
   DASHBOARD
========================================= */

const getDashboardStats = async (req, res) => {
  try {
    const todayName = getSchoolDayName();

    const timetablePromise =
      todayName === "Sunday"
        ? Promise.resolve([])
        : Timetable.find({
            day: new RegExp(`^${todayName}$`, "i"),
          })
            .sort({
              startTime: 1,
            })
            .limit(10)
            .lean();

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalClasses,
      activeClasses,
      studentsForCharts,
      feePayments,
      attendanceRecords,
      results,
      recentStudents,
      todayTimetable,
    ] = await Promise.all([
      Student.countDocuments(),

      Student.countDocuments({
        status: new RegExp("^Active$", "i"),
      }),

      Teacher.countDocuments(),

      Teacher.countDocuments({
        status: new RegExp("^Active$", "i"),
      }),

      Class.countDocuments(),

      Class.countDocuments({
        status: new RegExp("^Active$", "i"),
      }),

      Student.find()
        .select(
          "className admissionDate createdAt"
        )
        .lean(),

      /*
        IMPORTANT:
        Dashboard ab old Fee model use nahi karta.
        Sirf FeePayment collection se actual collected
        payments aur fee chart banega.
      */
      FeePayment.find()
        .select(
          [
            "student",
            "studentName",
            "className",
            "month",
            "monthlyFee",
            "discount",
            "paidAmount",
            "method",
            "receiptNo",
            "paidAt",
            "createdAt",
          ].join(" ")
        )
        .lean(),

      Attendance.find()
        .select("date status")
        .lean(),

      Result.find()
        .select(
          "percentage obtainedMarks totalMarks status"
        )
        .lean(),

      Student.find()
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .select(
          [
            "studentId",
            "admissionNo",
            "rollNo",
            "name",
            "fatherName",
            "className",
            "status",
            "admissionDate",
            "profilePhoto",
            "createdAt",
          ].join(" ")
        )
        .lean(),

      timetablePromise,
    ]);
/* =========================================
   VALID FEE PAYMENTS ONLY
   Deleted students ki purani payments
   Dashboard par show nahi hongi.
========================================= */

const existingStudentIds = new Set(
  studentsForCharts.map((student) =>
    String(student._id)
  )
);

const validFeePayments = feePayments.filter(
  (payment) =>
    existingStudentIds.has(
      String(payment.student)
    )
);
    /* =========================================
       FEE PAYMENT TOTALS
    ========================================= */

    const feeTotals = {
      totalFee: 0,
      collected: 0,
      outstanding: 0,
    };

    const feeChartMap = {
      Paid: 0,
      Partial: 0,
      Unpaid: 0,
      Overdue: 0,
    };

   validFeePayments.forEach((payment) => {
      const monthlyFee = toNumber(
        payment.monthlyFee
      );

      const discount = toNumber(payment.discount);

      const paidAmount = toNumber(
        payment.paidAmount
      );

      const payableAmount = Math.max(
        monthlyFee - discount,
        0
      );

      const remainingAmount = Math.max(
        payableAmount - paidAmount,
        0
      );

      feeTotals.totalFee += payableAmount;
      feeTotals.collected += paidAmount;
      feeTotals.outstanding += remainingAmount;

      /*
        FeePayment sirf tab banti hai jab payment
        save hoti hai. Isliye no payment record =
        dashboard collection mein count nahi hoga.
      */
      if (
        payableAmount > 0 &&
        paidAmount >= payableAmount
      ) {
        feeChartMap.Paid += 1;
      } else if (paidAmount > 0) {
        feeChartMap.Partial += 1;
      } else {
        feeChartMap.Unpaid += 1;
      }
    });

    const feeChart = Object.entries(feeChartMap).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    /* =========================================
       ATTENDANCE TOTALS / CHART
    ========================================= */

    const attendanceDetails = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
    };

    const attendanceChart = getLastDays(7);

    const attendanceLookup = new Map(
      attendanceChart.map((item) => [
        item.key,
        item,
      ])
    );

    attendanceRecords.forEach((record) => {
      const status = normalizeStatus(record.status);

      const dateKey = getDateKey(record.date);

      attendanceDetails.total += 1;

      if (status === "present") {
        attendanceDetails.present += 1;
      }

      if (status === "absent") {
        attendanceDetails.absent += 1;
      }

      if (status === "late") {
        attendanceDetails.late += 1;
      }

      if (status === "leave") {
        attendanceDetails.leave += 1;
      }

      const dayEntry = attendanceLookup.get(dateKey);

      if (!dayEntry) return;

      if (status === "present") {
        dayEntry.Present += 1;
      }

      if (status === "absent") {
        dayEntry.Absent += 1;
      }

      if (status === "late") {
        dayEntry.Late += 1;
      }

      if (status === "leave") {
        dayEntry.Leave += 1;
      }
    });

    const attendancePercentage =
      attendanceDetails.total > 0
        ? Number(
            (
              (attendanceDetails.present /
                attendanceDetails.total) *
              100
            ).toFixed(1)
          )
        : 0;

    /* =========================================
       MONTHLY ADMISSION CHART
    ========================================= */

    const admissionChart = getLastMonths(6);

    const admissionLookup = new Map(
      admissionChart.map((item) => [
        item.key,
        item,
      ])
    );

    studentsForCharts.forEach((student) => {
      const dateKey = getDateKey(
        student.admissionDate || student.createdAt
      );

      if (!dateKey) return;

      const monthKey = dateKey.slice(0, 7);

      const monthEntry =
        admissionLookup.get(monthKey);

      if (monthEntry) {
        monthEntry.admissions += 1;
      }
    });

    /* =========================================
       STUDENTS BY CLASS CHART
    ========================================= */

    const classMap = new Map();

    studentsForCharts.forEach((student) => {
      const className = String(
        student.className || ""
      ).trim();

      if (!className) return;

      classMap.set(
        className,
        (classMap.get(className) || 0) + 1
      );
    });

    const classChart = Array.from(classMap.entries())
      .map(([name, students]) => ({
        name,
        students,
      }))
      .sort((first, second) => {
        const firstOrder = getClassOrder(first.name);

        const secondOrder = getClassOrder(
          second.name
        );

        if (firstOrder !== secondOrder) {
          return firstOrder - secondOrder;
        }

        return first.name.localeCompare(
          second.name,
          undefined,
          {
            numeric: true,
          }
        );
      });

    /* =========================================
       EXAM RESULTS
    ========================================= */

    let totalPercentage = 0;
    let percentageCount = 0;
    let pass = 0;
    let fail = 0;

    results.forEach((result) => {
      let percentage = null;

      if (
        result.percentage !== null &&
        result.percentage !== undefined &&
        result.percentage !== ""
      ) {
        const savedPercentage = Number(
          result.percentage
        );

        if (Number.isFinite(savedPercentage)) {
          percentage = savedPercentage;
        }
      }

      if (
        percentage === null &&
        toNumber(result.totalMarks) > 0
      ) {
        percentage =
          (toNumber(result.obtainedMarks) /
            toNumber(result.totalMarks)) *
          100;
      }

      if (percentage !== null) {
        totalPercentage += percentage;
        percentageCount += 1;
      }

      const resultStatus = normalizeStatus(
        result.status
      );

      if (resultStatus === "pass") {
        pass += 1;
      }

      if (resultStatus === "fail") {
        fail += 1;
      }
    });

    const resultSummary = {
      count: results.length,
      pass,
      fail,

      average:
        percentageCount > 0
          ? Number(
              (
                totalPercentage /
                percentageCount
              ).toFixed(1)
            )
          : null,
    };

    /* =========================================
       TODAY TIMETABLE
    ========================================= */

    const activeTimetable = todayTimetable
      .filter((item) => {
        const status = normalizeStatus(item.status);

        return !status || status === "active";
      })
      .map((item) => ({
        _id: item._id,

        subjectName:
          item.subjectName ||
          item.subject ||
          "Subject",

        className: item.className || "",
        startTime: item.startTime || "",
        endTime: item.endTime || "",
      }));

    /* =========================================
       FINAL RESPONSE
    ========================================= */

    return res.status(200).json({
      success: true,

      stats: {
        totalStudents,
        activeStudents,

        inactiveStudents: Math.max(
          totalStudents - activeStudents,
          0
        ),

        totalTeachers,
        activeTeachers,

        inactiveTeachers: Math.max(
          totalTeachers - activeTeachers,
          0
        ),

        totalClasses,
        activeClasses,

        inactiveClasses: Math.max(
          totalClasses - activeClasses,
          0
        ),

        totalFee: feeTotals.totalFee,
        feeCollection: feeTotals.collected,
        outstandingFees: feeTotals.outstanding,

        attendance: attendancePercentage,
        attendanceDetails,
      },

      charts: {
        admissions: admissionChart,
        fees: feeChart,
        attendance: attendanceChart,
        classes: classChart,
        results: resultSummary,
      },

      recentStudents: recentStudents || [],
      todayTimetable: activeTimetable || [],
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard data.",
    });
  }
};

module.exports = {
  getDashboardStats,
};