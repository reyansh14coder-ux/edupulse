"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SYLLABUS } from "@/lib/question-bank";

export async function addClassAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const name = String(formData.get("name") ?? "").trim();
  const section = String(formData.get("section") ?? "A").trim() || "A";
  const year = String(formData.get("year") ?? "2026-27").trim();
  const board = String(formData.get("board") ?? "CBSE").trim() || "CBSE";
  if (!name) throw new Error("Class name is required.");

  const cls = await db.schoolClass.create({
    data: { name, section, year, board },
  });

  const teacherId = String(formData.get("teacherId") ?? "");
  const subject = String(formData.get("subject") ?? "");
  if (teacherId && subject) {
    await db.teacherAssignment.create({
      data: { teacherId, classId: cls.id, subject },
    });
  }

  for (const [subj, chapters] of Object.entries(SYLLABUS)) {
    await db.chapter.createMany({
      data: chapters.map((title, i) => ({
        classId: cls.id,
        subject: subj,
        title,
        order: i + 1,
      })),
    });
  }

  revalidatePath("/admin/setup");
  revalidatePath("/admin");
}

export async function assignTeacherAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const teacherId = String(formData.get("teacherId") ?? "");
  const classId = String(formData.get("classId") ?? "");
  const subject = String(formData.get("subject") ?? "");
  if (!teacherId || !classId || !subject)
    throw new Error("Teacher, class and subject are required.");

  await db.teacherAssignment.upsert({
    where: { teacherId_classId_subject: { teacherId, classId, subject } },
    update: {},
    create: { teacherId, classId, subject },
  });

  revalidatePath("/admin/setup");
}

export async function createTeacherAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const subject = String(formData.get("subject") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || `TGT ${subject}`;
  if (!name || !email) throw new Error("Name and email are required.");

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) throw new Error("A user with this email already exists.");

  await db.user.create({
    data: {
      name,
      email,
      title,
      role: "TEACHER",
      password: await hash("demo123", 10),
    },
  });

  revalidatePath("/admin/setup");
  revalidatePath("/admin/teachers");
}

export async function createStudentAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const name = String(formData.get("name") ?? "").trim();
  const classId = String(formData.get("classId") ?? "");
  const rollRaw = String(formData.get("rollNo") ?? "");
  const parentName = String(formData.get("parentName") ?? "").trim();
  const parentEmail = String(formData.get("parentEmail") ?? "").trim().toLowerCase();
  if (!name || !classId) throw new Error("Name and class are required.");

  const slug = name.toLowerCase().replace(/[^a-z ]/g, "").split(" ").join(".");
  let email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) email = `${slug}@students.vidyora.in`;
  if (await db.user.findUnique({ where: { email } }))
    throw new Error("A user with this email already exists.");

  const cls = await db.schoolClass.findUnique({ where: { id: classId } });
  const count = await db.student.count({ where: { classId } });
  const rollNo = rollRaw ? Number(rollRaw) : count + 1;
  const yearPart = (cls?.year ?? "2026-27").slice(0, 4);
  const admissionNo = `VNP/${yearPart}/${String(1000 + count + 1)}`;

  const pw = await hash("demo123", 10);
  const user = await db.user.create({
    data: { name, email, role: "STUDENT", password: pw },
  });
  const student = await db.student.create({
    data: { userId: user.id, classId, rollNo: Number.isFinite(rollNo) ? rollNo : count + 1, admissionNo },
  });

  if (parentName) {
    const pEmail =
      parentEmail ||
      `${parentName.toLowerCase().replace(/[^a-z ]/g, "").split(" ").join(".")}@families.vidyora.in`;
    let parent = await db.user.findUnique({ where: { email: pEmail } });
    if (!parent) {
      parent = await db.user.create({
        data: {
          name: parentName,
          email: pEmail,
          role: "PARENT",
          password: await hash("demo123", 10),
        },
      });
    }
    await db.parentLink.create({
      data: { parentId: parent.id, studentId: student.id },
    });
  }

  revalidatePath("/admin/setup");
  revalidatePath("/admin/students");
}

export async function addChapterAction(formData: FormData) {
  await requireSession(["ADMIN"]);
  const classId = String(formData.get("classId") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!classId || !subject || !title)
    throw new Error("Class, subject and chapter title are required.");

  const order = (await db.chapter.count({ where: { classId, subject } })) + 1;
  await db.chapter.upsert({
    where: { classId_subject_title: { classId, subject, title } },
    update: {},
    create: { classId, subject, title, order },
  });

  revalidatePath("/admin/setup");
}
