const ITStudent = require("../models/ITStudent");
const ITCourse = require("../models/ITCourse");

const todayStr = () => new Date().toISOString().slice(0, 10);

const addMonths = (dateStr, months) => {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + Number(months || 0));
  return d.toISOString().slice(0, 10);
};

const shiftDays = (dateStr, days) => {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};

const daysBetween = (fromStr, toStr) => {
  const a = new Date(fromStr + "T00:00:00Z");
  const b = new Date(toStr + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
};

// ==================================================
// PAYMENT SCHEDULE — month slots + payments fit karna
// ==================================================

const buildSchedule = (student) => {
  const months = Number(student.durationMonths) || 0;
  if (months < 1) return [];

  const total = Number(student.totalFee) || 0;
  const monthly = Number(student.monthlyInstallment) || 0;

  // Har month ki due raqam (last month = total - pehle mahine, taake exact total bane)
  const dues = [];
  for (let i = 0; i < months; i++) {
    if (i === months - 1) {
      const prevSum = dues.reduce((s, d) => s + d, 0);
      dues.push(Math.max(0, total - prevSum));
    } else {
      dues.push(monthly > 0 ? monthly : Math.round((total / months) * 100) / 100);
    }
  }

  const today = todayStr();
  const todayT = new Date(today + "T00:00:00Z").getTime();

  const slots = dues.map((due, i) => ({
    index: i,
    start: addMonths(student.startDate, i),
    end: shiftDays(addMonths(student.startDate, i + 1), -1),
    due,
    paid: 0,
  }));

  // Pehle wohi payments jo month assign hui hain
  const unassigned = [];
  (student.payments || []).forEach((p) => {
    const mi = Number(p.monthIndex);
    if (Number.isInteger(mi) && mi >= 0 && mi < months) {
      slots[mi].paid += Number(p.amount || 0);
    } else {
      unassigned.push(p); // purani/unassigned payments
    }
  });

  // Unassigned ko FIFO (pehla pehla) pending months me fit karo
  unassigned.forEach((p) => {
    let amt = Number(p.amount || 0);
    for (const slot of slots) {
      if (amt <= 0) break;
      const capacity = slot.due - slot.paid;
      if (capacity > 0) {
        const take = Math.min(amt, capacity);
        slot.paid += take;
        amt -= take;
      }
    }
    if (amt > 0) slots[slots.length - 1].paid += amt; // bacha hua last month me
  });

  return slots.map((slot) => {
    let status;
    if (slot.due > 0 && slot.paid >= slot.due) status = "Paid";
    else if (slot.paid > 0) status = "Partial";
    else {
      const startT = new Date(slot.start + "T00:00:00Z").getTime();
      status = todayT >= startT ? "Due" : "Upcoming";
    }

    return {
      index: slot.index,
      label: `Month ${slot.index + 1}`,
      start: slot.start,
      end: slot.end,
      due: slot.due,
      paid: slot.paid,
      remaining: Math.max(0, slot.due - slot.paid),
      status,
    };
  });
};

// Har read pe fresh calculation (roz khud update hota hai)
const decorate = (student) => {
  const obj = student.toObject ? student.toObject() : { ...student };
  const paid = (obj.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const today = todayStr();

  const daysLeft = daysBetween(today, obj.endDate);

  // AUTO COMPLETE: end date guzar gayi to khud Completed (DB me kuch change nahi karna padta)
  let derivedStatus = obj.status;
  let autoCompleted = false;
  if (obj.status !== "Completed" && daysLeft < 0) {
    derivedStatus = "Completed";
    autoCompleted = true;
  }

  const start = new Date(obj.startDate + "T00:00:00Z").getTime();
  const end = new Date(obj.endDate + "T00:00:00Z").getTime();
  const now = new Date(today + "T00:00:00Z").getTime();
  const progress = end > start ? Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100))) : 0;

  const schedule = buildSchedule(obj);
  const nextDueSlot = schedule.find((s) => s.remaining > 0) || null;

  return {
    ...obj,
    paidAmount: paid,
    remainingAmount: Math.max(0, Number(obj.totalFee || 0) - paid),
    daysLeft,
    derivedStatus,
    autoCompleted,
    progressPercent: progress,
    schedule,
    nextDue: nextDueSlot
      ? {
          label: nextDueSlot.label,
          start: nextDueSlot.start,
          end: nextDueSlot.end,
          amount: nextDueSlot.remaining,
        }
      : null,
  };
};

// ==================== CRUD ====================

const getStudents = async (req, res) => {
  try {
    const students = await ITStudent.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, students: students.map(decorate) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, fatherName, phone, courseId, startDate, totalFee, initialPayment } = req.body;

    if (!name || !courseId || !startDate) {
      return res.status(400).json({ success: false, message: "Name, course and start date are required." });
    }

    const course = await ITCourse.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    if (!course.durationMonths || course.durationMonths < 1) {
      return res.status(400).json({ success: false, message: "Course duration (months) is not set. Edit the course first." });
    }

    const fee = totalFee !== undefined && totalFee !== "" ? Number(totalFee) : course.totalFee;
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ success: false, message: "Enter a valid total fee." });
    }

    const initPay = Number(initialPayment || 0);
    if (initPay > fee) {
      return res.status(400).json({ success: false, message: "Initial payment cannot exceed total fee." });
    }

    const payments = [];
    if (initPay > 0) {
      payments.push({ amount: initPay, date: startDate, note: "Admission payment", monthIndex: 0 });
    }

    const student = await ITStudent.create({
      name,
      fatherName: fatherName || "",
      phone: phone || "",
      courseId: course._id,
      courseName: course.courseName,
      durationMonths: course.durationMonths,
      startDate,
      endDate: addMonths(startDate, course.durationMonths),
      totalFee: fee,
      monthlyInstallment: course.monthlyInstallment || 0,
      payments,
      status: "Active",
    });

    return res.status(201).json({ success: true, student: decorate(student) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const student = await ITStudent.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const { name, fatherName, phone, courseId, startDate, totalFee, status } = req.body;

    if (courseId && String(courseId) !== String(student.courseId)) {
      const course = await ITCourse.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found." });
      }
      student.courseId = course._id;
      student.courseName = course.courseName;
      student.durationMonths = course.durationMonths || 0;
      student.monthlyInstallment = course.monthlyInstallment || 0;
      if (totalFee === undefined || totalFee === "") student.totalFee = course.totalFee;
      student.endDate = addMonths(student.startDate, student.durationMonths);
    }

    if (startDate && startDate !== student.startDate) {
      student.startDate = startDate;
      student.endDate = addMonths(startDate, student.durationMonths);
    }

    if (name !== undefined) student.name = name;
    if (fatherName !== undefined) student.fatherName = fatherName;
    if (phone !== undefined) student.phone = phone;
    if (totalFee !== undefined && totalFee !== "") student.totalFee = Number(totalFee);
    if (status && ["Active", "Completed"].includes(status)) student.status = status;

    await student.save();
    return res.json({ success: true, student: decorate(student) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const setStudentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Completed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const student = await ITStudent.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    return res.json({ success: true, student: decorate(student) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== PAYMENTS ====================

const addPayment = async (req, res) => {
  try {
    const { amount, date, note, monthIndex } = req.body;
    const amt = Number(amount);

    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid amount." });
    }

    const student = await ITStudent.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const months = Number(student.durationMonths) || 0;
    const mi = Number(monthIndex);
    if (!Number.isInteger(mi) || mi < 0 || mi >= months) {
      return res.status(400).json({ success: false, message: "Select a valid month for this payment." });
    }

    // Total remaining se zyada payment block karo (ghalti se over-entry na ho)
    const paidSoFar = (student.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const remainingTotal = Number(student.totalFee || 0) - paidSoFar;
    if (amt > remainingTotal) {
      return res.status(400).json({
        success: false,
        message: `Payment exceeds remaining fee (${remainingTotal}).`,
      });
    }

    student.payments.push({
      amount: amt,
      date: date || todayStr(),
      note: note || "",
      monthIndex: mi,
    });
    await student.save();

    return res.json({ success: true, student: decorate(student) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const student = await ITStudent.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    student.payments.pull(req.params.paymentId);
    await student.save();

    return res.json({ success: true, student: decorate(student) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const deleted = await ITStudent.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudents, createStudent, updateStudent, setStudentStatus,
  addPayment, deletePayment, deleteStudent,
};