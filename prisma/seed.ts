import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { BANK, SYLLABUS, SUBJECTS as AI_SUBJECTS } from "../src/lib/question-bank";

const db = new PrismaClient();

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261016);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const SUBJECTS = [...AI_SUBJECTS];

const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, day));

async function main() {
  console.log("Clearing data...");
  await db.recommendation.deleteMany();
  await db.quizAttempt.deleteMany();
  await db.quiz.deleteMany();
  await db.chapter.deleteMany();
  await db.counselingSession.deleteMany();
  await db.guidanceNote.deleteMany();
  await db.homeworkSubmission.deleteMany();
  await db.homework.deleteMany();
  await db.score.deleteMany();
  await db.assessment.deleteMany();
  await db.attendance.deleteMany();
  await db.parentLink.deleteMany();
  await db.teacherAssignment.deleteMany();
  await db.student.deleteMany();
  await db.schoolClass.deleteMany();
  await db.user.deleteMany();

  const pw = await hash("demo123", 10);

  console.log("Creating users...");
  const admin = await db.user.create({
    data: {
      name: "Dr. Kavita Iyer",
      email: "admin@Vidyora.in",
      password: pw,
      role: "ADMIN",
      title: "Principal",
      phone: "+91 98220 11223",
    },
  });

  const teacherDefs = [
    { name: "Anjali Sharma", email: "teacher@Vidyora.in", subject: "Mathematics", title: "PGT Mathematics" },
    { name: "Rajesh Kumar", email: "rajesh.kumar@vidyaniketan.edu.in", subject: "Science", title: "PGT Science" },
    { name: "Priya Verma", email: "priya.verma@vidyaniketan.edu.in", subject: "English", title: "TGT English" },
    { name: "Suresh Iyer", email: "suresh.iyer@vidyaniketan.edu.in", subject: "Social Science", title: "TGT Social Science" },
    { name: "Meena Joshi", email: "meena.joshi@vidyaniketan.edu.in", subject: "Hindi", title: "TGT Hindi" },
    { name: "Vikram Singh", email: "vikram.singh@vidyaniketan.edu.in", subject: "Computer Science", title: "TGT Computer Science" },
  ];

  const teachers: { id: string; subject: string; name: string }[] = [];
  for (const t of teacherDefs) {
    const u = await db.user.create({
      data: {
        name: t.name,
        email: t.email,
        title: t.title,
        password: pw,
        role: "TEACHER",
        phone: "+91 98" + Math.floor(100000000 + rand() * 899999999),
      },
    });
    teachers.push({ id: u.id, subject: t.subject, name: t.name });
  }

  console.log("Creating classes & assignments...");
  const classNames = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const classes: Awaited<ReturnType<typeof db.schoolClass.create>>[] = [];
  for (const name of classNames) {
    classes.push(
      await db.schoolClass.create({
        data: { name, section: "A", year: "2026-27", board: "CBSE" },
      })
    );
    for (const subj of SUBJECTS) {
      await db.chapter.createMany({
        data: (SYLLABUS[subj] ?? []).map((title, i) => ({
          classId: classes[classes.length - 1].id,
          subject: subj,
          title,
          order: i + 1,
        })),
      });
    }
  }
  for (const cls of classes) {
    for (const t of teachers) {
      await db.teacherAssignment.create({
        data: { teacherId: t.id, classId: cls.id, subject: t.subject },
      });
    }
  }

  console.log("Creating students & parents...");
  const roster: { [cls: string]: string[] } = {
    "Class 6": [
      "Aarav Patel",
      "Diya Reddy",
      "Kabir Singh",
      "Ananya Gupta",
      "Vihaan Sharma",
      "Sara Khan",
    ],
    "Class 7": [
      "Arjun Nair",
      "Ishita Bose",
      "Rohan Mehta",
      "Kavya Rao",
      "Aditya Joshi",
      "Meera Pillai",
    ],
    "Class 8": [
      "Dev Malhotra",
      "Riya Chatterjee",
      "Aryan Tiwari",
      "Nisha Yadav",
      "Tanish Deshmukh",
      "Zoya Ahmed",
    ],
    "Class 9": [
      "Aditi Kulkarni",
      "Siddharth Rao",
      "Pooja Nair",
      "Karan Chopra",
      "Shreya Bansal",
      "Manav Trivedi",
    ],
    "Class 10": [
      "Aisha Sheikh",
      "Nikhil Menon",
      "Harini Subramanian",
      "Yash Agarwal",
      "Tanya Kapoor",
      "Raghav Dutta",
    ],
  };

  const parentNames = [
    "Rakesh Patel", "Sunita Reddy", "Gurpreet Singh", "Neha Gupta",
    "Manish Sharma", "Farah Khan", "Suresh Nair", "Dipanwita Bose",
    "Amit Mehta", "Lakshmi Rao", "Deepak Joshi", "Anitha Pillai",
    "Rohit Malhotra", "Sharmila Chatterjee", "Vineet Tiwari", "Sushma Yadav",
    "Sanjay Deshmukh", "Nazma Ahmed", "Prakash Kulkarni", "Geeta Rao",
    "Mohan Nair", "Rajiv Chopra", "Vandana Bansal", "Hemant Trivedi",
    "Imran Sheikh", "Padma Menon", "Ravi Subramanian", "Pooja Agarwal",
    "Arvind Kapoor", "Mitali Dutta",
  ];

  type SeedStudent = {
    id: string;
    userId: string;
    name: string;
    classId: string;
    className: string;
    roll: number;
    parentId: string;
  };
  const students: SeedStudent[] = [];
  let pIdx = 0;
  let rollTotal = 1;

  for (const cls of classes) {
    const names = roster[cls.name];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const isDemo = name === "Aarav Patel";
      const first = name.split(" ")[0].toLowerCase();
      const last = name.split(" ")[1].toLowerCase();
      const email = isDemo
        ? "student@Vidyora.in"
        : `${first}.${last}@students.Vidyora.in`;
      const u = await db.user.create({
        data: {
          name,
          email,
          password: pw,
          role: "STUDENT",
          phone: "+91 9" + Math.floor(100000000 + rand() * 899999999),
        },
      });
      const st = await db.student.create({
        data: {
          userId: u.id,
          classId: cls.id,
          rollNo: i + 1,
          admissionNo: `VNP/2026/${String(rollTotal++).padStart(3, "0")}`,
        },
      });

      const parentName = isDemo ? "Rakesh Patel" : parentNames[pIdx];
      pIdx++;
      const parentEmail = isDemo
        ? "parent@Vidyora.in"
        : `${parentName.split(" ")[0].toLowerCase()}.${parentName
            .split(" ")[1]
            .toLowerCase()}@families.Vidyora.in`;
      const parent = await db.user.create({
        data: {
          name: parentName,
          email: parentEmail,
          password: pw,
          role: "PARENT",
          phone: "+91 9" + Math.floor(100000000 + rand() * 899999999),
        },
      });
      await db.parentLink.create({
        data: { parentId: parent.id, studentId: st.id },
      });
      if (isDemo) {
        const mother = await db.user.create({
          data: {
            name: "Sunita Patel",
            email: "sunita.patel@families.Vidyora.in",
            password: pw,
            role: "PARENT",
          },
        });
        await db.parentLink.create({
          data: { parentId: mother.id, studentId: st.id },
        });
      }

      students.push({
        id: st.id,
        userId: u.id,
        name,
        classId: cls.id,
        className: `${cls.name} ${cls.section}`,
        roll: i + 1,
        parentId: parent.id,
      });
    }
  }

  console.log("Creating attendance (Aug–Oct 2026)...");
  const attendanceRows: {
    studentId: string;
    date: Date;
    status: string;
  }[] = [];
  const start = Date.UTC(2026, 7, 3);
  const end = Date.UTC(2026, 9, 16);
  const holidays = new Set([Date.UTC(2026, 9, 2)]); // Gandhi Jayanti
  for (let t = start; t <= end; t += 864e5) {
    const dt = new Date(t);
    const day = dt.getUTCDay();
    if (day === 0 || day === 6) continue;
    if (holidays.has(t)) continue;
    for (const s of students) {
      const r = rand();
      let status = "PRESENT";
      if (r < 0.05) status = "ABSENT";
      else if (r < 0.1) status = "LATE";
      attendanceRows.push({ studentId: s.id, date: dt, status });
    }
  }
  await db.attendance.createMany({ data: attendanceRows });

  console.log("Creating assessments & scores...");
  const scoreRows: {
    assessmentId: string;
    studentId: string;
    marks: number;
  }[] = [];
  const abilities = new Map<string, number>();
  const affinities = new Map<string, number>();
  for (const s of students) {
    let base = 0.55 + rand() * 0.35;
    if (s.name === "Aarav Patel") base = 0.72;
    if (rand() < 0.15) base = 0.38 + rand() * 0.14; // a few struggling students
    abilities.set(s.id, base);
    for (const subj of SUBJECTS) {
      affinities.set(
        s.id + subj,
        (rand() - 0.5) * 0.3 + (subj === "Computer Science" ? 0.06 : 0)
      );
    }
  }

  const quizDates: { [si: number]: number } = { 0: 13, 1: 14, 2: 15, 3: 16, 4: 13, 5: 14 };
  const assessmentIds: string[] = [];

  for (const cls of classes) {
    for (let si = 0; si < SUBJECTS.length; si++) {
      const subject = SUBJECTS[si];
      const defs = [
        { title: `Unit Test 1 – ${subject}`, type: "UNIT_TEST", date: d(2026, 7, 10 + (si % 5)), max: 25 },
        { title: `Unit Test 2 – ${subject}`, type: "UNIT_TEST", date: d(2026, 8, 14 + (si % 4)), max: 25 },
        { title: `Mid-Term Exam – ${subject}`, type: "EXAM", date: d(2026, 9, 5 + (si % 4)), max: 100 },
        { title: `Weekly Quiz – ${subject}`, type: "QUIZ", date: d(2026, 9, quizDates[si]), max: 20 },
      ];
      for (const def of defs) {
        const a = await db.assessment.create({
          data: {
            title: def.title,
            type: def.type,
            classId: cls.id,
            subject,
            date: def.date,
            maxMarks: def.max,
          },
        });
        assessmentIds.push(a.id);
        const clsStudents = students.filter((s) => s.classId === cls.id);
        for (const st of clsStudents) {
          let ability = abilities.get(st.id)!;
          const aff = affinities.get(st.id + subject)!;
          // Aarav: declining math story
          let eff = ability + aff;
          if (st.name === "Aarav Patel" && subject === "Mathematics") {
            if (def.type === "UNIT_TEST" && def.date < d(2026, 9, 1)) eff = 0.78;
            else if (def.type === "UNIT_TEST") eff = 0.5;
            else if (def.type === "EXAM") eff = 0.46;
            else eff = 0.4;
          }
          eff += (rand() - 0.5) * 0.16;
          const ratio = Math.max(0.15, Math.min(1, eff));
          const marks = Math.round(def.max * ratio * 2) / 2;
          scoreRows.push({ assessmentId: a.id, studentId: st.id, marks });
        }
      }
    }
  }
  await db.score.createMany({ data: scoreRows });

  console.log("Creating homework & submissions...");
  const hwSubmissions: {
    homeworkId: string;
    studentId: string;
    status: string;
    submittedOn: Date | null;
  }[] = [];
  let hwCount = 0;
  for (const cls of classes) {
    for (const subject of SUBJECTS) {
      const teacher = teachers.find((t) => t.subject === subject)!;
      const defs = [
        {
          kind: "HOMEWORK",
          title: `${subject} worksheet – concept revision`,
          description:
            "Solve the attached worksheet, review the highlighted examples and bring your answers to class for discussion.",
          assigned: d(2026, 8, 20),
          due: d(2026, 8, 27),
        },
        {
          kind: "ASSIGNMENT",
          title: `${subject} – practice questions (Chapter 4)`,
          description:
            "Complete questions 1–15 from Chapter 4 and prepare a short summary of key terms.",
          assigned: d(2026, 9, 8),
          due: d(2026, 9, 15),
        },
        {
          kind: "PROJECT",
          title: `${subject} – project / activity work`,
          description:
            "Work on the assigned activity, paste outputs in your notebook and get it checked in class.",
          assigned: d(2026, 9, 13),
          due: d(2026, 9, 20),
        },
        {
          kind: "HOMEWORK",
          title: `${subject} – revision for mid-term`,
          description:
            "Revise all taught chapters, attempt the sample paper and note down doubts for the doubt-clearing session.",
          assigned: d(2026, 9, 26),
          due: d(2026, 10, 3),
        },
        {
          kind: "ASSIGNMENT",
          title: `${subject} – weekly activity`,
          description:
            "Complete the given exercises neatly, underline important answers and submit before the due date.",
          assigned: d(2026, 9, 13),
          due: d(2026, 9, 20),
        },
      ];
      for (const def of defs) {
        const hw = await db.homework.create({
          data: {
            title: def.title,
            description: def.description,
            kind: def.kind,
            classId: cls.id,
            subject,
            assignedById: teacher.id,
            assignedOn: def.assigned,
            dueDate: def.due,
          },
        });
        hwCount++;
        const clsStudents = students.filter((s) => s.classId === cls.id);
        for (const st of clsStudents) {
          const r = rand();
          const past = def.due.getTime() < Date.now();
          let status: string;
          let submittedOn: Date | null = null;
          if (!past) {
            status = "PENDING";
          } else if (r < 0.72) {
            status = "SUBMITTED";
            submittedOn = new Date(def.due.getTime() - 864e5 * Math.floor(rand() * 3));
          } else if (r < 0.87) {
            status = "LATE";
            submittedOn = new Date(def.due.getTime() + 864e5 * Math.ceil(rand() * 2));
          } else {
            status = "PENDING";
          }
          hwSubmissions.push({
            homeworkId: hw.id,
            studentId: st.id,
            status,
            submittedOn,
          });
        }
      }
    }
  }
  await db.homeworkSubmission.createMany({ data: hwSubmissions });

  console.log("Creating AI quizzes & demo attempt...");
  for (const cls of classes) {
    for (const subject of SUBJECTS) {
      const pool = BANK[subject] ?? [];
      if (pool.length < 5) continue;
      const chapterIdx = classes.indexOf(cls) % (SYLLABUS[subject]?.length ?? 1);
      const chapter = SYLLABUS[subject]?.[chapterIdx] ?? null;
      const questions = [...pool].sort(() => rand() - 0.5).slice(0, 5);
      const quiz = await db.quiz.create({
        data: {
          title: `${subject} – ${chapter} (Practice Quiz)`,
          classId: cls.id,
          subject,
          chapter,
          questions: JSON.stringify(questions),
          createdById: teachers.find((t) => t.subject === subject)?.id ?? null,
        },
      });

      if (cls.name === "Class 6" && (subject === "Mathematics" || subject === "English")) {
        const who =
          subject === "Mathematics"
            ? students.find((s) => s.name === "Aarav Patel")
            : students.find((s) => s.name === "Diya Reddy");
        if (who) {
          const answers = questions.map((qq) =>
            rand() < (subject === "Mathematics" ? 0.5 : 0.85) ? qq.answer : (qq.answer + 1) % 4
          );
          let sc = 0;
          const detail = questions.map((qq, qi) => {
            const ok = answers[qi] === qq.answer;
            if (ok) sc++;
            return { picked: answers[qi], correct: ok };
          });
          await db.quizAttempt.create({
            data: {
              quizId: quiz.id,
              studentId: who.id,
              score: sc,
              total: questions.length,
              detail: JSON.stringify(detail),
            },
          });
          const a = await db.assessment.create({
            data: {
              title: `Quiz · ${quiz.title}`,
              type: "QUIZ",
              classId: cls.id,
              subject,
              date: d(2026, 9, 14),
              maxMarks: questions.length,
            },
          });
          await db.score.create({
            data: { assessmentId: a.id, studentId: who.id, marks: sc },
          });
        }
      }
    }
  }

  console.log("Creating guidance & counseling...");
  const aarav = students.find((s) => s.name === "Aarav Patel")!;
  const anjali = teachers.find((t) => t.subject === "Mathematics")!;
  const rajesh = teachers.find((t) => t.subject === "Science")!;

  await db.guidanceNote.createMany({
    data: [
      {
        studentId: aarav.id,
        authorId: anjali.id,
        category: "ACADEMIC",
        title: "Mathematics needs structured revision",
        body: "Aarav's math scores have moved from 72% to 44% over the last month. Recommend 30 minutes of daily practice on algebra basics, one solved example per topic, and a short re-test after two weeks to measure improvement.",
      },
      {
        studentId: aarav.id,
        authorId: rajesh.id,
        category: "WELLNESS",
        title: "Participation improving in Science lab",
        body: "Noticed better participation during science activities. Encouraging him to ask more questions in class will build confidence further.",
      },
      {
        studentId: students.find((s) => s.name === "Dev Malhotra")!.id,
        authorId: anjali.id,
        category: "ACADEMIC",
        title: "Strong performance – stretch goals suggested",
        body: "Dev consistently scores above 85%. Suggest Olympiad-level practice problems to keep him challenged.",
      },
      {
        studentId: students.find((s) => s.name === "Nisha Yadav")!.id,
        authorId: admin.id,
        category: "BEHAVIORAL",
        title: "Frequent late arrivals",
        body: "Nisha has arrived late 4 times this month. A quick parent conversation about routine and punctuality is recommended.",
      },
      {
        studentId: students.find((s) => s.name === "Kabir Singh")!.id,
        authorId: admin.id,
        category: "CAREER",
        title: "Interest in computers – guidance shared",
        body: "Kabir shows genuine interest in computer science. Shared information about school coding club and future stream selection (Science with CS) options.",
      },
    ],
  });

  await db.counselingSession.createMany({
    data: [
      {
        studentId: aarav.id,
        counselorId: anjali.id,
        scheduledFor: new Date(Date.now() + 2 * 864e5),
        status: "SCHEDULED",
        notes: "Discuss mathematics recovery plan with parents.",
      },
      {
        studentId: students.find((s) => s.name === "Nisha Yadav")!.id,
        counselorId: admin.id,
        scheduledFor: new Date(Date.now() - 3 * 864e5),
        status: "COMPLETED",
        notes: "Punctuality improvement plan agreed with parents.",
      },
      {
        studentId: students.find((s) => s.name === "Kabir Singh")!.id,
        counselorId: admin.id,
        scheduledFor: new Date(Date.now() + 5 * 864e5),
        status: "SCHEDULED",
        notes: "Career interest assessment – coding club and stream options.",
      },
      {
        studentId: students.find((s) => s.name === "Meera Pillai")!.id,
        counselorId: rajesh.id,
        scheduledFor: new Date(Date.now() + 1 * 864e5),
        status: "SCHEDULED",
        notes: "Confidence building – encourage class participation.",
      },
    ],
  });

  console.log("Creating AI recommendations...");
  const seedRecs: {
    studentName: string;
    kind: string;
    title: string;
    body: string;
    context?: string;
  }[] = [
    {
      studentName: "Aarav Patel",
      kind: "SUBJECT_SUPPORT",
      title: "Extra practice needed in Mathematics",
      body: "Recent average in Mathematics is 51%. Syllabus chapters to start with: Number Systems, Algebraic Expressions. Revise these for 30 minutes daily, then attempt the AI practice quiz — the new result will update Aarav's progress analysis.",
      context: "Mathematics",
    },
    {
      studentName: "Aarav Patel",
      kind: "QUIZ_SUGGESTION",
      title: "AI practice quiz ready: Mathematics",
      body: "A personalized 5-question quiz has been prepared for Mathematics based on the class syllabus and recent performance. Chapters: Number Systems, Algebraic Expressions, Linear Equations. Attempt it from the Quizzes section — the score is added straight into the progress history.",
      context: "Mathematics",
    },
    {
      studentName: "Nisha Yadav",
      kind: "ATTENDANCE",
      title: "Attendance is below the required 75%",
      body: "Overall attendance needs attention with recent absences recorded. Missing classes directly affects concept continuity. Please ensure regular attendance and inform the class teacher of planned absences.",
    },
    {
      studentName: "Dev Malhotra",
      kind: "STRENGTH",
      title: "Mathematics is a clear strength",
      body: "Consistently scoring above 85% in Mathematics. Try harder challenge questions or school-level competitions to stay engaged while others catch up.",
      context: "Mathematics",
    },
  ];
  await db.recommendation.createMany({
    data: seedRecs.map((r) => {
      const st = students.find((s) => s.name === r.studentName)!;
      return {
        studentId: st.id,
        kind: r.kind,
        title: r.title,
        body: r.body,
        context: r.context ?? null,
        status: "NEW",
      };
    }),
  });

  const counts = {
    users: await db.user.count(),
    students: await db.student.count(),
    attendance: await db.attendance.count(),
    assessments: await db.assessment.count(),
    scores: await db.score.count(),
    homework: await db.homework.count(),
    submissions: await db.homeworkSubmission.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
