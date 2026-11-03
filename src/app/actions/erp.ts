"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const str = (fd: FormData, k: string, max = 400) =>
  String(fd.get(k) ?? "").trim().slice(0, max);
const num = (fd: FormData, k: string, fallback = 0) => {
  const v = Number(fd.get(k));
  return Number.isFinite(v) ? v : fallback;
};
const dateOf = (fd: FormData, k: string) => {
  const v = str(fd, k, 40);
  return v ? new Date(v) : null;
};

// ===== Timetable =====

export async function upsertTimetableSlotAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const classId = str(formData, "classId", 40);
  const day = str(formData, "day", 10);
  const period = num(formData, "period", 1);
  const subject = str(formData, "subject", 80);
  if (!classId || !subject || period < 1) return;
  const startTime = str(formData, "startTime", 10) || "08:00";
  const endTime = str(formData, "endTime", 10) || "08:45";
  const room = str(formData, "room", 40) || null;
  const teacherId = str(formData, "teacherId", 40) || null;

  await db.timetableSlot.upsert({
    where: { classId_day_period: { classId, day, period } },
    update: { subject, startTime, endTime, room, teacherId },
    create: { classId, day, period, subject, startTime, endTime, room, teacherId },
  });
  revalidatePath("/admin/timetable");
  revalidatePath("/student/timetable");
  revalidatePath("/teacher/timetable");
}

export async function deleteTimetableSlotAction(id: string) {
  await requireSession(["ADMIN"]);
  await db.timetableSlot.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/timetable");
}

export async function createSubstitutionAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const classId = str(formData, "classId", 40);
  const date = dateOf(formData, "date");
  const period = num(formData, "period", 1);
  const subject = str(formData, "subject", 80);
  const originalTeacherId = str(formData, "originalTeacherId", 40);
  const substituteTeacherId = str(formData, "substituteTeacherId", 40);
  if (!classId || !date || !subject || !originalTeacherId || !substituteTeacherId) return;
  if (originalTeacherId === substituteTeacherId) return;

  await db.substitution.create({
    data: {
      classId,
      date,
      period,
      subject,
      originalTeacherId,
      substituteTeacherId,
      reason: str(formData, "reason", 300) || null,
    },
  });
  revalidatePath("/admin/substitutions");
  revalidatePath("/teacher/timetable");
}

// ===== Lesson plans =====

export async function createLessonPlanAction(formData: FormData) {
  const session = await requireSession(["TEACHER"]);
  const classId = str(formData, "classId", 40);
  const subject = str(formData, "subject", 80);
  const weekOf = dateOf(formData, "weekOf");
  const chapter = str(formData, "chapter", 160);
  const objectives = str(formData, "objectives", 2000);
  const activities = str(formData, "activities", 2000);
  if (!classId || !subject || !weekOf || !chapter || !objectives) return;

  await db.lessonPlan.upsert({
    where: {
      teacherId_classId_subject_weekOf: {
        teacherId: session.sub,
        classId,
        subject,
        weekOf,
      },
    },
    update: { chapter, objectives, activities, resources: str(formData, "resources", 600) || null },
    create: {
      teacherId: session.sub,
      classId,
      subject,
      weekOf,
      chapter,
      objectives,
      activities,
      resources: str(formData, "resources", 600) || null,
    },
  });
  revalidatePath("/teacher/lesson-plans");
  revalidatePath("/admin/lesson-plans");
}

export async function updateLessonPlanStatusAction(id: string, status: string) {
  await requireSession(["ADMIN"]);
  if (!["SUBMITTED", "APPROVED", "REVISION"].includes(status)) return;
  await db.lessonPlan.update({ where: { id }, data: { status } }).catch(() => {});
  revalidatePath("/admin/lesson-plans");
  revalidatePath("/teacher/lesson-plans");
}

// ===== Fees =====

export async function createFeeHeadAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const name = str(formData, "name", 80);
  const amount = num(formData, "amount");
  if (!name || amount <= 0) return;
  const frequency = str(formData, "frequency", 20) || "MONTHLY";
  await db.feeHead.upsert({
    where: { name },
    update: { amount, frequency, description: str(formData, "description", 300) || null },
    create: { name, amount, frequency, description: str(formData, "description", 300) || null },
  });
  revalidatePath("/admin/fees");
}

export async function createFeeInvoiceAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const studentId = str(formData, "studentId", 40);
  const title = str(formData, "title", 160);
  const amount = num(formData, "amount");
  const dueDate = dateOf(formData, "dueDate");
  if (!studentId || !title || amount <= 0 || !dueDate) return;
  const headId = str(formData, "headId", 40) || null;

  await db.feeInvoice.create({
    data: { studentId, headId, title, amount, dueDate },
  });
  revalidatePath("/admin/fees");
}

async function settleInvoice(invoiceId: string, mode: string, recorderId: string) {
  const inv = await db.feeInvoice.findUnique({ where: { id: invoiceId } });
  if (!inv || inv.status === "PAID") return false;
  const count = await db.feePayment.count();
  await db.feePayment.create({
    data: {
      studentId: inv.studentId,
      headId: inv.headId,
      invoiceId: inv.id,
      amount: inv.amount,
      period: inv.title.slice(0, 40),
      mode,
      receiptNo: `RCP-${2600 + count + 1}`,
      recordedById: recorderId,
    },
  });
  await db.feeInvoice.update({
    where: { id: inv.id },
    data: { status: "PAID", paidOn: new Date() },
  });
  return true;
}

export async function markInvoicePaidAction(formData: FormData) {
  const session = await requireSession(["ADMIN"]);
  const invoiceId = str(formData, "invoiceId", 40);
  const mode = str(formData, "mode", 20) || "CASH";
  if (!invoiceId) return;
  await settleInvoice(invoiceId, mode, session.sub);
  revalidatePath("/admin/fees");
}

export async function payInvoiceAction(formData: FormData) {
  const session = await requireSession(["STUDENT", "PARENT"]);
  const invoiceId = str(formData, "invoiceId", 40);
  if (!invoiceId) return;
  const inv = await db.feeInvoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return;
  if (session.role === "STUDENT") {
    const mine = await db.student.findUnique({ where: { userId: session.sub } });
    if (!mine || mine.id !== inv.studentId) return;
  } else {
    const link = await db.parentLink.findFirst({
      where: { parentId: session.sub, studentId: inv.studentId },
    });
    if (!link) return;
  }
  const mode = str(formData, "mode", 20) || "UPI";
  await settleInvoice(invoiceId, mode, session.sub);
  revalidatePath("/student/fees");
  revalidatePath("/parent/fees");
}

// ===== Library =====

export async function addBookAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const title = str(formData, "title", 160);
  const author = str(formData, "author", 120);
  if (!title || !author) return;
  const copies = Math.max(1, num(formData, "copies", 1));
  await db.libraryBook.create({
    data: {
      title,
      author,
      isbn: str(formData, "isbn", 40) || null,
      category: str(formData, "category", 60) || "General",
      shelf: str(formData, "shelf", 20) || null,
      copies,
      available: copies,
    },
  });
  revalidatePath("/admin/library");
  revalidatePath("/student/library");
}

export async function issueBookAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const bookId = str(formData, "bookId", 40);
  const studentId = str(formData, "studentId", 40);
  if (!bookId || !studentId) return;
  const book = await db.libraryBook.findUnique({ where: { id: bookId } });
  if (!book || book.available < 1) return;

  const dueOn = new Date(Date.now() + 14 * 864e5);
  await db.bookIssue.create({ data: { bookId, studentId, dueOn } });
  await db.libraryBook.update({
    where: { id: bookId },
    data: { available: { decrement: 1 } },
  });
  revalidatePath("/admin/library");
  revalidatePath("/student/library");
}

export async function returnBookAction(id: string) {
  await requireSession(["ADMIN"]);
  const issue = await db.bookIssue.findUnique({ where: { id } });
  if (!issue || issue.status === "RETURNED") return;
  await db.bookIssue.update({
    where: { id },
    data: { status: "RETURNED", returnedOn: new Date() },
  });
  await db.libraryBook.update({
    where: { id: issue.bookId },
    data: { available: { increment: 1 } },
  });
  revalidatePath("/admin/library");
  revalidatePath("/student/library");
}

// ===== Events =====

export async function createEventAction(formData: FormData) {
  const session = await requireSession(["ADMIN"]);
  const title = str(formData, "title", 160);
  const date = dateOf(formData, "date");
  if (!title || !date) return;
  await db.schoolEvent.create({
    data: {
      title,
      description: str(formData, "description", 800) || null,
      date,
      kind: str(formData, "kind", 20) || "EVENT",
      audience: str(formData, "audience", 20) || "ALL",
      location: str(formData, "location", 120) || null,
      createdById: session.sub,
    },
  });
  revalidatePath("/admin/events");
  revalidatePath("/student/events");
  revalidatePath("/parent/events");
}

// ===== Leave =====

export async function createStudentLeaveAction(formData: FormData) {
  const session = await requireSession(["STUDENT", "PARENT"]);
  const from = dateOf(formData, "from");
  const to = dateOf(formData, "to");
  const reason = str(formData, "reason", 500);
  if (!from || !to || !reason) return;
  let studentId = str(formData, "studentId", 40);
  if (session.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: session.sub } });
    if (!student) return;
    studentId = student.id;
  } else if (studentId) {
    const link = await db.parentLink.findFirst({
      where: { parentId: session.sub, studentId },
    });
    if (!link) return;
  } else {
    return;
  }
  await db.leaveRequest.create({
    data: { kind: "STUDENT", studentId, from, to, reason },
  });
  revalidatePath("/student/leave");
  revalidatePath("/parent/leave");
  revalidatePath("/admin/leave");
}

export async function createStaffLeaveAction(formData: FormData) {
  const session = await requireSession(["TEACHER"]);
  const from = dateOf(formData, "from");
  const to = dateOf(formData, "to");
  const reason = str(formData, "reason", 500);
  if (!from || !to || !reason) return;
  await db.leaveRequest.create({
    data: { kind: "STAFF", staffId: session.sub, from, to, reason },
  });
  revalidatePath("/teacher/leave");
  revalidatePath("/admin/leave");
}

export async function reviewLeaveAction(formData: FormData) {
  const session = await requireSession(["ADMIN"]);
  const id = str(formData, "id", 40);
  const status = str(formData, "status", 20);
  if (!id || !["APPROVED", "REJECTED"].includes(status)) return;
  await db.leaveRequest
    .update({
      where: { id },
      data: { status, reviewedById: session.sub, note: str(formData, "note", 300) || null },
    })
    .catch(() => {});
  revalidatePath("/admin/leave");
  revalidatePath("/student/leave");
  revalidatePath("/teacher/leave");
}

// ===== Transport =====

export async function addTransportRouteAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const name = str(formData, "name", 120);
  const busNo = str(formData, "busNo", 40);
  const driver = str(formData, "driver", 120);
  const timing = str(formData, "timing", 160);
  const stops = str(formData, "stops", 600);
  if (!name || !busNo || !driver || !timing || !stops) return;
  await db.transportRoute.create({
    data: { name, busNo, driver, phone: str(formData, "phone", 40) || null, timing, stops },
  });
  revalidatePath("/admin/transport");
}

export async function assignStudentTransportAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const studentId = str(formData, "studentId", 40);
  const routeId = str(formData, "routeId", 40);
  if (!studentId) return;
  await db.student.update({
    where: { id: studentId },
    data: { transportRouteId: routeId || null },
  });
  revalidatePath("/admin/transport");
}

// ===== Gallery =====

export async function addGalleryPhotoAction(formData: FormData) {
  const session = await requireSession(["ADMIN"]);
  const title = str(formData, "title", 160);
  const url = str(formData, "url", 600);
  if (!title || !url) return;
  await db.galleryPhoto.create({
    data: {
      title,
      url,
      caption: str(formData, "caption", 300) || null,
      album: str(formData, "album", 60) || "General",
      takenOn: dateOf(formData, "takenOn") ?? new Date(),
      uploadedById: session.sub,
    },
  });
  revalidatePath("/admin/gallery");
  revalidatePath("/student/gallery");
  revalidatePath("/parent/gallery");
}

// ===== Visitors =====

export async function visitorCheckInAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const name = str(formData, "name", 120);
  const purpose = str(formData, "purpose", 300);
  if (!name || !purpose) return;
  await db.visitorLog.create({
    data: {
      name,
      phone: str(formData, "phone", 40) || null,
      purpose,
      host: str(formData, "host", 120) || "Front Office",
    },
  });
  revalidatePath("/admin/visitors");
}

export async function visitorCheckOutAction(id: string) {
  await requireSession(["ADMIN"]);
  await db.visitorLog
    .update({ where: { id }, data: { status: "OUT", outTime: new Date() } })
    .catch(() => {});
  revalidatePath("/admin/visitors");
}

// ===== Helpdesk =====

export async function createTicketAction(formData: FormData) {
  const session = await requireSession(["STUDENT", "PARENT", "TEACHER", "ADMIN"]);
  const subject = str(formData, "subject", 160);
  const body = str(formData, "body", 1500);
  if (!subject || !body) return;
  let studentId: string | null = null;
  if (session.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: session.sub } });
    studentId = student?.id ?? null;
  }
  await db.helpdeskTicket.create({
    data: {
      raisedById: session.sub,
      role: session.role,
      studentId,
      subject,
      body,
      category: str(formData, "category", 40) || "GENERAL",
    },
  });
  revalidatePath("/admin/helpdesk");
  revalidatePath("/student/helpdesk");
  revalidatePath("/teacher/helpdesk");
  revalidatePath("/parent/helpdesk");
}

export async function replyTicketAction(formData: FormData) {
  const session = await requireSession(["ADMIN"]);
  const id = str(formData, "id", 40);
  const reply = str(formData, "reply", 1500);
  if (!id || !reply) return;
  await db.helpdeskTicket
    .update({ where: { id }, data: { reply, status: "ANSWERED", repliedById: session.sub } })
    .catch(() => {});
  revalidatePath("/admin/helpdesk");
}

export async function closeTicketAction(id: string) {
  await requireSession(["ADMIN"]);
  await db.helpdeskTicket.update({ where: { id }, data: { status: "CLOSED" } }).catch(() => {});
  revalidatePath("/admin/helpdesk");
}

// ===== Chat =====

export async function sendChatMessageAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER", "PARENT", "STUDENT"]);
  const body = str(formData, "body", 800);
  if (!body) return;
  const toId = str(formData, "toId", 40) || null;
  const classId = str(formData, "classId", 40) || null;

  if (toId && toId !== session.sub) {
    const recipient = await db.user.findUnique({ where: { id: toId }, select: { role: true } });
    if (!recipient) return;
    const allowed =
      session.role === "ADMIN" ||
      (["STUDENT", "PARENT"].includes(session.role) && ["ADMIN", "TEACHER"].includes(recipient.role)) ||
      (session.role === "TEACHER" && ["ADMIN", "TEACHER", "STUDENT"].includes(recipient.role));
    if (!allowed) return;
  } else if (!classId) {
    return;
  }
  if (classId && !["ADMIN", "TEACHER"].includes(session.role)) return;

  await db.chatMessage.create({
    data: { fromId: session.sub, toId: toId && toId !== session.sub ? toId : null, classId: classId || null, body },
  });
  revalidatePath("/admin/chat");
  revalidatePath("/teacher/chat");
  revalidatePath("/student/chat");
  revalidatePath("/parent/chat");
}

// ===== Admissions =====

export async function createAdmissionEnquiryAction(formData: FormData) {
  const name = str(formData, "name", 120);
  const phone = str(formData, "phone", 40);
  const grade = str(formData, "grade", 40);
  if (!name || !phone || !grade) return;
  await db.admissionEnquiry.create({
    data: {
      name,
      phone,
      email: str(formData, "email", 160) || null,
      grade,
      message: str(formData, "message", 800) || null,
    },
  });
  revalidatePath("/admin/admissions");
}

export async function updateAdmissionStatusAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const id = str(formData, "id", 40);
  const status = str(formData, "status", 20);
  if (!id || !["NEW", "FOLLOW_UP", "ADMITTED", "REJECTED"].includes(status)) return;
  await db.admissionEnquiry.update({ where: { id }, data: { status } }).catch(() => {});
  revalidatePath("/admin/admissions");
}

// ===== Surveys =====

export async function createSurveyAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const title = str(formData, "title", 160);
  const question = str(formData, "question", 500);
  const rawOptions = str(formData, "options", 600);
  if (!title || !question) return;
  const options = rawOptions
    .split(/\n|,/)
    .map((o) => o.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (options.length < 2) return;
  await db.survey.create({
    data: {
      title,
      question,
      options: JSON.stringify(options),
      audience: str(formData, "audience", 20) || "ALL",
      closesOn: dateOf(formData, "closesOn"),
    },
  });
  revalidatePath("/admin/surveys");
  revalidatePath("/student/survey");
  revalidatePath("/parent/survey");
}

export async function respondSurveyAction(formData: FormData) {
  const session = await requireSession(["STUDENT", "PARENT", "TEACHER", "ADMIN"]);
  const surveyId = str(formData, "surveyId", 40);
  const choice = num(formData, "choice", -1);
  if (!surveyId || choice < 0) return;
  await db.surveyResponse.upsert({
    where: { surveyId_respondentId: { surveyId, respondentId: session.sub } },
    update: { choice },
    create: { surveyId, respondentId: session.sub, choice },
  });
  revalidatePath("/student/survey");
  revalidatePath("/parent/survey");
  revalidatePath("/admin/surveys");
}

// ===== Exams =====

export async function createExamAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const name = str(formData, "name", 160);
  const body = str(formData, "body", 1200);
  if (!name || !body) return;
  await db.examOpportunity.create({
    data: {
      name,
      body,
      examOn: dateOf(formData, "examOn"),
      deadline: dateOf(formData, "deadline"),
      classes: str(formData, "classes", 80) || null,
      link: str(formData, "link", 400) || null,
    },
  });
  revalidatePath("/admin/exams");
  revalidatePath("/student/exams");
  revalidatePath("/parent/exams");
}

// ===== HRMS =====

export async function createVacancyAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const title = str(formData, "title", 160);
  const department = str(formData, "department", 120);
  if (!title || !department) return;
  await db.vacancy.create({
    data: {
      title,
      department,
      subjects: str(formData, "subjects", 200) || null,
      vacancies: Math.max(1, num(formData, "vacancies", 1)),
      description: str(formData, "description", 1200) || null,
    },
  });
  revalidatePath("/admin/careers");
}

export async function applyJobAction(formData: FormData) {
  const vacancyId = str(formData, "vacancyId", 40);
  const name = str(formData, "name", 120);
  const phone = str(formData, "phone", 40);
  if (!vacancyId || !name || !phone) return;
  await db.jobApplication.create({
    data: {
      vacancyId,
      name,
      phone,
      email: str(formData, "email", 160) || null,
      qualification: str(formData, "qualification", 200) || null,
      experience: str(formData, "experience", 80) || null,
      resumeNote: str(formData, "resumeNote", 800) || null,
    },
  });
  revalidatePath("/admin/careers");
}

export async function updateApplicationStatusAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const id = str(formData, "id", 40);
  const status = str(formData, "status", 20);
  if (!id || !["NEW", "SHORTLISTED", "HIRED", "REJECTED"].includes(status)) return;
  await db.jobApplication.update({ where: { id }, data: { status } }).catch(() => {});
  revalidatePath("/admin/careers");
}

export async function addPayrollAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const staffId = str(formData, "staffId", 40);
  const month = str(formData, "month", 20);
  const basic = num(formData, "basic");
  if (!staffId || !month || basic <= 0) return;
  const allowances = num(formData, "allowances");
  const deductions = num(formData, "deductions");
  const net = Math.round(basic + allowances - deductions);
  await db.payrollRecord.upsert({
    where: { staffId_month: { staffId, month } },
    update: { basic, allowances, deductions, net },
    create: { staffId, month, basic, allowances, deductions, net },
  });
  revalidatePath("/admin/payroll");
}

export async function markPayrollPaidAction(id: string) {
  await requireSession(["ADMIN"]);
  await db.payrollRecord
    .update({ where: { id }, data: { status: "PAID", paidOn: new Date() } })
    .catch(() => {});
  revalidatePath("/admin/payroll");
}

export async function createAppraisalAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const staffId = str(formData, "staffId", 40);
  const period = str(formData, "period", 40);
  const rating = num(formData, "rating", 0);
  if (!staffId || !period || rating <= 0 || rating > 5) return;
  await db.appraisal.create({
    data: {
      staffId,
      period,
      rating,
      strengths: str(formData, "strengths", 800) || null,
      improvements: str(formData, "improvements", 800) || null,
    },
  });
  revalidatePath("/admin/appraisals");
}

// ===== Finance =====

export async function addBudgetLineAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const category = str(formData, "category", 80);
  const year = str(formData, "year", 20) || "2026-27";
  const planned = num(formData, "planned");
  if (!category || planned <= 0) return;
  await db.budgetLine.upsert({
    where: { category_year: { category, year } },
    update: { planned },
    create: { category, year, planned },
  });
  revalidatePath("/admin/budget");
  revalidatePath("/admin/finance");
}

export async function addExpenseAction(formData: FormData) {
  const session = await requireSession(["ADMIN"]);
  const category = str(formData, "category", 80);
  const title = str(formData, "title", 200);
  const amount = num(formData, "amount");
  if (!category || !title || amount <= 0) return;
  await db.expense.create({
    data: {
      category,
      title,
      amount,
      vendor: str(formData, "vendor", 120) || null,
      spentOn: dateOf(formData, "spentOn") ?? new Date(),
      recordedById: session.sub,
    },
  });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/finance");
}

export async function addVendorAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const name = str(formData, "name", 120);
  const category = str(formData, "category", 80);
  if (!name || !category) return;
  await db.vendor.create({
    data: { name, category, phone: str(formData, "phone", 40) || null },
  });
  revalidatePath("/admin/vendors");
  revalidatePath("/admin/finance");
}

export async function createPurchaseRequestAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const title = str(formData, "title", 200);
  const category = str(formData, "category", 80);
  const amount = num(formData, "amount");
  if (!title || !category || amount <= 0) return;
  await db.purchaseRequest.create({
    data: {
      title,
      category,
      amount,
      requestedById: session.sub,
      requestedByName: session.name,
    },
  });
  revalidatePath("/admin/procurement");
  revalidatePath("/teacher");
}

export async function reviewPurchaseAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const id = str(formData, "id", 40);
  const status = str(formData, "status", 20);
  if (!id || !["APPROVED", "REJECTED"].includes(status)) return;
  await db.purchaseRequest.update({ where: { id }, data: { status } }).catch(() => {});
  revalidatePath("/admin/procurement");
}

// ===== Health =====

export async function addHealthIncidentAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const title = str(formData, "title", 200);
  if (!title) return;
  await db.healthIncident.create({
    data: {
      studentId: str(formData, "studentId", 40) || null,
      title,
      note: str(formData, "note", 800) || null,
      severity: str(formData, "severity", 20) || "MINOR",
      date: dateOf(formData, "date") ?? new Date(),
    },
  });
  revalidatePath("/admin/health");
}

// ===== Learning resources =====

export async function addLearningResourceAction(formData: FormData) {
  await requireSession(["ADMIN", "TEACHER"]);
  const subject = str(formData, "subject", 80);
  const chapter = str(formData, "chapter", 160);
  const title = str(formData, "title", 200);
  const url = str(formData, "url", 600);
  if (!subject || !chapter || !title || !url) return;
  await db.learningResource.create({
    data: { subject, chapter, title, url, kind: str(formData, "kind", 20) || "VIDEO" },
  });
  revalidatePath("/admin/resources");
  revalidatePath("/student/resources");
}

// ===== Staff profiles =====

export async function upsertStaffProfileAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const userId = str(formData, "userId", 40);
  if (!userId) return;
  const joinedOn = dateOf(formData, "joinedOn");
  await db.staffProfile.upsert({
    where: { userId },
    update: {
      employeeId: str(formData, "employeeId", 40) || null,
      qualification: str(formData, "qualification", 200) || null,
      experience: str(formData, "experience", 80) || null,
      joinedOn,
      bio: str(formData, "bio", 1000) || null,
      emergencyPhone: str(formData, "emergencyPhone", 40) || null,
    },
    create: {
      userId,
      employeeId: str(formData, "employeeId", 40) || null,
      qualification: str(formData, "qualification", 200) || null,
      experience: str(formData, "experience", 80) || null,
      joinedOn,
      bio: str(formData, "bio", 1000) || null,
      emergencyPhone: str(formData, "emergencyPhone", 40) || null,
    },
  });
  revalidatePath("/admin/staff");
}
