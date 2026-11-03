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
  await db.surveyResponse.deleteMany();
  await db.survey.deleteMany();
  await db.learningResource.deleteMany();
  await db.healthIncident.deleteMany();
  await db.purchaseRequest.deleteMany();
  await db.vendor.deleteMany();
  await db.expense.deleteMany();
  await db.budgetLine.deleteMany();
  await db.appraisal.deleteMany();
  await db.payrollRecord.deleteMany();
  await db.jobApplication.deleteMany();
  await db.vacancy.deleteMany();
  await db.examOpportunity.deleteMany();
  await db.chatMessage.deleteMany();
  await db.helpdeskTicket.deleteMany();
  await db.admissionEnquiry.deleteMany();
  await db.staffProfile.deleteMany();
  await db.visitorLog.deleteMany();
  await db.galleryPhoto.deleteMany();
  await db.transportRoute.deleteMany();
  await db.leaveRequest.deleteMany();
  await db.schoolEvent.deleteMany();
  await db.bookIssue.deleteMany();
  await db.libraryBook.deleteMany();
  await db.feePayment.deleteMany();
  await db.feeInvoice.deleteMany();
  await db.feeHead.deleteMany();
  await db.lessonPlan.deleteMany();
  await db.substitution.deleteMany();
  await db.timetableSlot.deleteMany();
  await db.recommendation.deleteMany();
  await db.studentActivity.deleteMany();
  await db.teacherWeeklyReport.deleteMany();
  await db.parentQuery.deleteMany();
  await db.competitionApplication.deleteMany();
  await db.competition.deleteMany();
  await db.notice.deleteMany();
  await db.studentFeedback.deleteMany();
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
      email: "admin@vidyora.in",
      password: pw,
      role: "ADMIN",
      title: "Principal",
      phone: "+91 98220 11223",
    },
  });

  const teacherDefs = [
    { name: "Anjali Sharma", email: "teacher@vidyora.in", subject: "Mathematics", title: "PGT Mathematics" },
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
        ? "student@vidyora.in"
        : `${first}.${last}@students.vidyora.in`;
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
        ? "parent@vidyora.in"
        : `${parentName.split(" ")[0].toLowerCase()}.${parentName
            .split(" ")[1]
            .toLowerCase()}@families.vidyora.in`;
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
            email: "sunita.patel@families.vidyora.in",
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
          const ability = abilities.get(st.id)!;
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

      if (subject === "Mathematics" || subject === "English") {
        const who =
          subject === "Mathematics"
            ? students.find((s) => s.name === "Aarav Patel")
            : students.find((s) => s.name === "Diya Reddy");
        if (who) {
          const accuracy = subject === "Mathematics" ? [0.55, 0.2] : [0.8, 0.5];
          let firstScore = 0;
          for (const [attemptIdx, acc] of accuracy.entries()) {
            const targetQuiz =
              attemptIdx === 0
                ? quiz
                : await db.quiz.create({
                    data: {
                      title: `${subject} – ${chapter} (Revision Quiz)`,
                      classId: cls.id,
                      subject,
                      chapter,
                      questions: JSON.stringify(questions),
                      createdById: quiz.createdById,
                    },
                  });
            const answers = questions.map((qq) =>
              rand() < acc ? qq.answer : (qq.answer + 1) % 4
            );
            let sc = 0;
            const detail = questions.map((qq, qi) => {
              const ok = answers[qi] === qq.answer;
              if (ok) sc++;
              return { picked: answers[qi], correct: ok };
            });
            if (attemptIdx === 0) firstScore = sc;
            await db.quizAttempt.create({
              data: {
                quizId: targetQuiz.id,
                studentId: who.id,
                score: sc,
                total: questions.length,
                detail: JSON.stringify(detail),
              },
            });
          }
          if (cls.name === "Class 6") {
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
              data: { assessmentId: a.id, studentId: who.id, marks: firstScore },
            });
          }
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

  console.log("Creating notices, competitions & activities...");
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayIdx);

  await db.notice.createMany({
    data: [
      {
        title: "Half-yearly exam timetable released",
        body: "The half-yearly examination timetable for Classes 6-10 is now published. Exams begin next Monday. Check the notice board in your student dashboard daily for updates from the school office.",
        audience: "ALL",
        createdById: admin.id,
        authorName: admin.name,
        createdAt: new Date(now.getTime() - 2 * 864e5),
      },
      {
        title: "Inter-house quiz registrations open",
        body: "Registrations for the Inter-house Quiz Competition are open till Friday. Students interested in Science, Mathematics or General Knowledge can apply from the Competitions section.",
        audience: "STUDENT",
        createdById: admin.id,
        authorName: admin.name,
        createdAt: new Date(now.getTime() - 864e5),
      },
    ],
  });

  await db.competition.create({
    data: {
      title: "Inter-house Science Quiz 2026",
      body: "Teams of two will compete across Science, Mathematics and General Knowledge rounds. Open to Classes 6-10. Apply with a short note on why you want to participate — selected teams get two extra practice sessions with their subject teacher.",
      deadline: new Date(now.getTime() + 5 * 864e5),
      createdById: rajesh.id,
      authorName: rajesh.name,
    },
  });

  const activityNames = ["Aarav Patel", "Diya Reddy", "Kabir Singh", "Dev Malhotra", "Nisha Yadav", "Aditi Kulkarni"];
  for (const name of activityNames) {
    const st = students.find((s) => s.name === name)!;
    await db.studentActivity.createMany({
      data: [
        {
          studentId: st.id,
          kind: "ACTIVITY",
          title: "Inter-house Kabaddi practice",
          note: "Representing the school team in the upcoming inter-house tournament.",
          date: new Date(now.getTime() - 2 * 864e5),
        },
        {
          studentId: st.id,
          kind: "BEHAVIOUR",
          title: "Helped a classmate with homework",
          note: "Noticed guiding a friend through maths homework during lunch break — positive, cooperative behaviour.",
          date: new Date(now.getTime() - 3 * 864e5),
        },
      ],
    });
  }

  await db.teacherWeeklyReport.createMany({
    data: [
      {
        teacherId: anjali.id,
        weekOf: monday,
        body: "Completed Algebra revision with Class 9 and Class 10; Class 10 board-prep mock test scheduled for Friday. Aarav Patel needs extra practice on algebra basics — a short revision plan was shared with his parents.",
      },
      {
        teacherId: rajesh.id,
        weekOf: monday,
        body: "Conducted Science lab sessions for Classes 8-10. Hand-in-hand activity participation improved this week. Inter-house Science Quiz announced — registration closes Friday.",
      },
    ],
  });

  await db.studentFeedback.createMany({
    data: [
      {
        studentId: students.find((s) => s.name === "Nisha Yadav")!.id,
        category: "SUGGESTION",
        subject: "Facilities",
        body: "The science lab is often full during lunch break. Could one free period be kept open for curious students to run small experiments?",
      },
      {
        studentId: students.find((s) => s.name === "Aarav Patel")!.id,
        category: "COMPLAINT",
        subject: "Transport",
        body: "School bus route 4 has been arriving 15 minutes late for the past week, which makes me miss the morning assembly.",
        status: "REVIEWED",
      },
    ],
  });

  await db.parentQuery.createMany({
    data: [
      {
        parentId: students.find((s) => s.name === "Aarav Patel")!.parentId,
        studentId: students.find((s) => s.name === "Aarav Patel")!.id,
        recipient: "TEACHER",
        subject: "Mathematics",
        body: "How should Aarav revise algebra at home before the half-yearly exam? He gets stuck on word problems.",
        status: "ANSWERED",
        reply: "Please ask him to attempt the practice questions in the My Plan section daily for 30 minutes and mark the ones he gets wrong — I will review them in class this week.",
        repliedById: anjali.id,
      },
      {
        parentId: students.find((s) => s.name === "Dev Malhotra")!.parentId,
        studentId: students.find((s) => s.name === "Dev Malhotra")!.id,
        recipient: "PRINCIPAL",
        subject: "Transport",
        body: "Will the school bus route near Ashok Nagar get a stop closer to the colony? It is a long walk for younger children.",
        status: "OPEN",
      },
    ],
  });

  console.log("Creating ERP demo data (timetable, fees, library, HRMS, finance)...");
  const tBy = (s: string) => teachers.find((t) => t.subject === s)!.id;
  const periodTime = (p: number) => {
    const start = 8 * 60 + (p - 1) * 50;
    const end = start + 45;
    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    return { start: fmt(start), end: fmt(end) };
  };
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let ci = 0; ci < classes.length; ci++) {
    const cls = classes[ci];
    for (const day of days) {
      for (let p = 1; p <= 8; p++) {
        const subject = SUBJECTS[(p + ci + days.indexOf(day)) % SUBJECTS.length];
        const { start, end } = periodTime(p);
        await db.timetableSlot.create({
          data: {
            classId: cls.id,
            day,
            period: p,
            startTime: start,
            endTime: end,
            subject,
            room: p === 7 && subject === "Science" ? "Lab 1" : `Room ${100 + ci}`,
            teacherId: tBy(subject),
          },
        });
      }
    }
  }
  await db.substitution.create({
    data: {
      classId: classes[2].id,
      date: new Date(now.getTime() + 864e5),
      period: 3,
      subject: "Science",
      originalTeacherId: rajesh.id,
      substituteTeacherId: teachers.find((t) => t.subject === "English")!.id,
      reason: "Rajesh Kumar on medical leave",
    },
  });

  await db.lessonPlan.createMany({
    data: [
      {
        teacherId: anjali.id,
        classId: classes[3].id,
        subject: "Mathematics",
        weekOf: monday,
        chapter: "Polynomials",
        objectives: "Understand degrees of polynomials\nFactorise using identities\nSolve textbook exercise 2.1-2.3",
        activities: "Warm-up quiz on identities\nPair work on factorisation\nBoard worked examples",
        resources: "NCERT Class 9 Maths ch.2, https://www.youtube.com/results?search_query=class+9+polynomials",
        status: "SUBMITTED",
      },
      {
        teacherId: rajesh.id,
        classId: classes[2].id,
        subject: "Science",
        weekOf: monday,
        chapter: "Crop Production & Management",
        objectives: "List agricultural practices\nExplain irrigation methods\nDescribe manures and fertilisers",
        activities: "Video clip on modern farming\nGroup discussion on crop rotation\nLabel-the-diagram worksheet",
        resources: "NCERT Class 8 Science ch.1",
        status: "SUBMITTED",
      },
    ],
  });

  const feeHeads = await db.feeHead.createMany({
    data: [
      { name: "Tuition Fee", amount: 2500, frequency: "MONTHLY", description: "Monthly tuition for all grades" },
      { name: "Transport Fee", amount: 1200, frequency: "MONTHLY", description: "Bus route charges" },
      { name: "Laboratory Fee", amount: 800, frequency: "QUARTERLY", description: "Science & computer lab" },
      { name: "Examination Fee", amount: 500, frequency: "ONE_TIME", description: "Half-yearly exam fee" },
    ],
  });
  const tuitionHead = (await db.feeHead.findUnique({ where: { name: "Tuition Fee" } }))!;
  for (let i = 0; i < 8 && i < students.length; i++) {
    const st = students[i];
    const paid = i % 2 === 0;
    const inv = await db.feeInvoice.create({
      data: {
        studentId: st.id,
        headId: tuitionHead.id,
        title: "Tuition Fee — November 2026",
        amount: 2500,
        dueDate: new Date(2026, 10, 10),
        status: paid ? "PAID" : i === 7 ? "OVERDUE" : "PENDING",
        paidOn: paid ? new Date(2026, 10, 5 + i) : null,
      },
    });
    if (paid) {
      await db.feePayment.create({
        data: {
          studentId: st.id,
          headId: tuitionHead.id,
          invoiceId: inv.id,
          amount: 2500,
          period: "2026-11",
          mode: i % 4 === 0 ? "UPI" : "CASH",
          receiptNo: `RCP-${2600 + i}`,
          recordedById: admin.id,
          paidOn: new Date(2026, 10, 5 + i),
        },
      });
    }
  }
  void feeHeads;

  const books = await db.libraryBook.createMany({
    data: [
      { title: "Wings of Fire", author: "A.P.J. Abdul Kalam", category: "Biography", copies: 3, available: 2, shelf: "B-1" },
      { title: "Malgudi Days", author: "R.K. Narayan", category: "Fiction", copies: 4, available: 4, shelf: "F-2" },
      { title: "NCERT Mathematics Class 9", author: "NCERT", category: "Reference", copies: 10, available: 8, shelf: "R-1" },
      { title: "The Jungle Book", author: "Rudyard Kipling", category: "Fiction", copies: 2, available: 1, shelf: "F-1" },
      { title: "Science Experiments for Kids", author: "Pallavi Gogoi", category: "Science", copies: 2, available: 2, shelf: "S-3" },
      { title: "Atlas of the World", author: "Oxford", category: "Reference", copies: 1, available: 1, shelf: "R-4" },
      { title: "Panchatantra Tales", author: "Vishnu Sharma", category: "Fiction", copies: 5, available: 5, shelf: "F-3" },
      { title: "Computer Basics", author: "Subham Dutta", category: "Technology", copies: 2, available: 2, shelf: "T-1" },
    ],
  });
  const bookList = await db.libraryBook.findMany();
  await db.bookIssue.createMany({
    data: [
      {
        bookId: bookList[0].id,
        studentId: students[0].id,
        issuedOn: new Date(now.getTime() - 15 * 864e5),
        dueOn: new Date(now.getTime() - 1 * 864e5),
        status: "OVERDUE",
      },
      {
        bookId: bookList[2].id,
        studentId: students[1].id,
        issuedOn: new Date(now.getTime() - 3 * 864e5),
        dueOn: new Date(now.getTime() + 11 * 864e5),
        status: "ISSUED",
      },
    ],
  });
  void books;

  await db.schoolEvent.createMany({
    data: [
      { title: "Annual Sports Day", description: "Track & field events, house races and prize distribution at the main ground.", date: new Date(2026, 11, 12, 9), kind: "EVENT", audience: "ALL", location: "School Ground" },
      { title: "Winter Break", description: "School closed for winter vacation.", date: new Date(2026, 11, 24), kind: "HOLIDAY", audience: "ALL" },
      { title: "Parent–Teacher Meeting", description: "Class-wise PTM slots — report cards and progress discussions.", date: new Date(2026, 10, 22, 10), kind: "MEETING", audience: "PARENT", location: "Respective classrooms" },
      { title: "Science Exhibition", description: "Working models by Classes 8-10 in the assembly hall. Parents welcome.", date: new Date(2026, 11, 5, 9), kind: "EVENT", audience: "ALL", location: "Assembly Hall" },
      { title: "Half-Yearly Exams Begin", description: "Classes 6-10 half-yearly examinations commence.", date: new Date(2026, 11, 1), kind: "EXAM", audience: "STUDENT" },
    ],
  });

  await db.leaveRequest.createMany({
    data: [
      { kind: "STUDENT", studentId: students[2].id, from: new Date(2026, 10, 6), to: new Date(2026, 10, 7), reason: "Family function out of town.", status: "PENDING" },
      { kind: "STUDENT", studentId: students[4].id, from: new Date(2026, 10, 3), to: new Date(2026, 10, 3), reason: "Fever and doctor's advice to rest.", status: "APPROVED", reviewedById: admin.id, note: "Get well soon — class notes shared by classmates." },
      { kind: "STAFF", staffId: teachers[4].id, from: new Date(2026, 10, 12), to: new Date(2026, 10, 13), reason: "Personal work.", status: "PENDING" },
    ],
  });

  const route1 = await db.transportRoute.create({
    data: {
      name: "Route 1 — North Circuit",
      busNo: "MH-12-AB-4410",
      driver: "Ramesh Pawar",
      phone: "+91 98765 40011",
      timing: "Pick-up 7:10 AM · Drop 3:40 PM",
      stops: "Ashok Nagar\nGreen Park\nCity Library\nSchool Gate",
    },
  });
  await db.transportRoute.create({
    data: {
      name: "Route 2 — South Circuit",
      busNo: "MH-12-CD-9921",
      driver: "Sunita Devi",
      phone: "+91 98765 40022",
      timing: "Pick-up 7:25 AM · Drop 3:55 PM",
      stops: "Station Road\nLake View\nMarket Square\nSchool Gate",
    },
  });
  await db.student.update({ where: { id: students[0].id }, data: { transportRouteId: route1.id } });
  await db.student.update({ where: { id: students[1].id }, data: { transportRouteId: route1.id } });

  const gallerySeeds = [
    { title: "Science Exhibition 2025", album: "Events", caption: "Working models by Class 9 on renewable energy." },
    { title: "Sports Day Rehearsal", album: "Sports", caption: "House relay practice on the main ground." },
    { title: "Library Week", album: "Academics", caption: "Students sharing their favourite reads." },
    { title: "Independence Day Assembly", album: "Events", caption: "Flag hoisting and cultural performances." },
    { title: "Art & Craft Corner", album: "Clubs", caption: "Diwali rangoli and poster-making workshop." },
    { title: "Computer Lab Session", album: "Academics", caption: "Typing and scratch programming practice." },
  ];
  await db.galleryPhoto.createMany({
    data: gallerySeeds.map((g, i) => ({
      ...g,
      url: `https://picsum.photos/seed/vidyora${i + 1}/640/420`,
      takenOn: new Date(now.getTime() - (i + 2) * 7 * 864e5),
      uploadedById: admin.id,
    })),
  });

  await db.visitorLog.createMany({
    data: [
      { name: "Mr. Suresh Gupta", phone: "+91 99887 76655", purpose: "Admission enquiry for Class 6", host: "Front Office", inTime: new Date(now.getTime() - 2 * 36e5), status: "INSIDE" },
      { name: "Dr. Meera Kulkarni", phone: "+91 99887 11223", purpose: "Annual health check-up camp coordination", host: "Principal", inTime: new Date(now.getTime() - 26 * 36e5), outTime: new Date(now.getTime() - 24 * 36e5), status: "OUT" },
    ],
  });

  for (let i = 0; i < teachers.length; i++) {
    await db.staffProfile.create({
      data: {
        userId: teachers[i].id,
        employeeId: `EMP-${100 + i + 1}`,
        qualification: i % 2 === 0 ? "M.Sc., B.Ed." : "M.A., B.Ed.",
        experience: `${6 + i * 2} years`,
        joinedOn: new Date(2015 + i, 5, 1 + i),
        bio: `Experienced ${teachers[i].subject} teacher committed to concept-first learning and regular student feedback.`,
        emergencyPhone: "+91 98765 400" + (10 + i),
      },
    });
  }

  await db.helpdeskTicket.createMany({
    data: [
      { raisedById: students[0].userId, role: "STUDENT", studentId: students[0].id, subject: "Duplicate charge on transport fee", body: "I was charged the transport fee twice for October. Please check and refund the extra payment.", category: "FEES", status: "OPEN" },
      { raisedById: teachers[0].id, role: "TEACHER", subject: "Projector in Room 102 not working", body: "The projector in Room 102 has been flickering since Monday. Please raise a maintenance request.", category: "FACILITIES", status: "ANSWERED", reply: "Maintenance visit scheduled for tomorrow morning — the AV technician will swap the lamp.", repliedById: admin.id },
    ],
  });

  await db.chatMessage.createMany({
    data: [
      { fromId: admin.id, toId: teachers[0].id, body: "Please submit this week's class report by Friday evening." },
      { fromId: teachers[0].id, toId: admin.id, body: "Will do — mock test scores are being compiled today." },
      { fromId: admin.id, classId: classes[0].id, body: "Reminder: Science exhibition registrations close this Thursday." },
    ],
  });

  await db.admissionEnquiry.createMany({
    data: [
      { name: "Riya Deshmukh", phone: "+91 98200 11111", email: "riya.parent@example.com", grade: "Class 6", message: "Looking for admission for my daughter — CBSE curriculum.", status: "NEW" },
      { name: "Amitabh Joshi", phone: "+91 98200 22222", grade: "Class 9", message: "Transferring from ICSE school mid-year. Need seat availability.", status: "FOLLOW_UP" },
      { name: "Farhan Qureshi", phone: "+91 98200 33333", email: "farhan.q@example.com", grade: "Class 7", message: "Enquiry about transport facility and fee structure.", status: "ADMITTED" },
    ],
  });

  const survey = await db.survey.create({
    data: {
      title: "Lunch menu feedback",
      question: "How satisfied are you with the mid-day lunch menu this month?",
      options: JSON.stringify(["Love it", "It's okay", "Needs improvement"]),
      audience: "STUDENT",
      closesOn: new Date(now.getTime() + 10 * 864e5),
    },
  });
  await db.surveyResponse.createMany({
    data: [
      { surveyId: survey.id, respondentId: students[0].userId, choice: 0 },
      { surveyId: survey.id, respondentId: students[1].userId, choice: 1 },
      { surveyId: survey.id, respondentId: students[3].userId, choice: 2 },
    ],
  });

  await db.examOpportunity.createMany({
    data: [
      { name: "NTSE (National Talent Search Exam)", body: "Stage-1 state-level scholarship exam for Class 10 students. Covers MAT, SAT and an interview. Coaching material available with the maths and science departments.", examOn: new Date(2027, 1, 20), deadline: new Date(2026, 11, 15), classes: "Class 10", link: "https://www.google.com/search?q=NTSE+exam" },
      { name: "International Mathematics Olympiad (IMO)", body: "Annual Olympiad conducted by SOF. School-level round open to all classes — registers through the maths department.", examOn: new Date(2026, 11, 12), deadline: new Date(2026, 10, 30), classes: "Classes 6-10", link: "https://www.google.com/search?q=SOF+IMO" },
      { name: "National Science Olympiad (NSO)", body: "Science Olympiad foundation's flagship exam. syllabus-aligned with NCERT — practice papers in the library reference section.", examOn: new Date(2026, 11, 20), deadline: new Date(2026, 11, 5), classes: "Classes 6-10", link: "https://www.google.com/search?q=SOF+NSO" },
    ],
  });

  const vacancy1 = await db.vacancy.create({
    data: { title: "TGT — Biology", department: "Science", subjects: "Biology, General Science", vacancies: 1, description: "Two-year experience preferred; must be comfortable with lab-based teaching for Classes 8-10.", status: "OPEN" },
  });
  const vacancy2 = await db.vacancy.create({
    data: { title: "Primary Teacher — English", department: "Primary", subjects: "English", vacancies: 2, description: "For Classes 1-5. NTT/B.El.Ed. with strong phonics foundation.", status: "OPEN" },
  });
  await db.jobApplication.createMany({
    data: [
      { vacancyId: vacancy1.id, name: "Dr. Neha Rao", phone: "+91 99111 22334", email: "neha.rao@example.com", qualification: "Ph.D. Biology, B.Ed.", experience: "8 years", resumeNote: "Currently PGT Biology at Green Valley School; published 2 research papers.", status: "SHORTLISTED" },
      { vacancyId: vacancy1.id, name: "Aakash Verma", phone: "+91 99111 55667", email: "aakash.v@example.com", qualification: "M.Sc. Life Sciences, B.Ed.", experience: "3 years", resumeNote: "Taught NSO/Olympiad batches; strong lab supervision experience.", status: "NEW" },
      { vacancyId: vacancy2.id, name: "Shalini Pathak", phone: "+91 99111 88990", qualification: "B.El.Ed., NTT", experience: "5 years", resumeNote: "Phonics-certified; ran after-school reading club for 3 years.", status: "NEW" },
    ],
  });

  for (let i = 0; i < teachers.length; i++) {
    const basic = 32000 + i * 3500;
    const allowances = 4000;
    const deductions = basic * 0.08;
    await db.payrollRecord.create({
      data: {
        staffId: teachers[i].id,
        month: "2026-10",
        basic,
        allowances,
        deductions: Math.round(deductions),
        net: Math.round(basic + allowances - deductions),
        status: i < 4 ? "PAID" : "DRAFT",
        paidOn: i < 4 ? new Date(2026, 9, 28) : null,
      },
    });
  }
  await db.appraisal.createMany({
    data: [
      { staffId: anjali.id, period: "2026 H1", rating: 4.6, strengths: "Consistent board results, excellent parent communication.", improvements: "Could integrate more digital tools in class." },
      { staffId: rajesh.id, period: "2026 H1", rating: 4.3, strengths: "Hands-on lab sessions and olympiad mentoring.", improvements: "Documentation of lesson plans can be more timely." },
    ],
  });

  await db.budgetLine.createMany({
    data: [
      { category: "Salaries", planned: 4200000, year: "2026-27" },
      { category: "Utilities", planned: 480000, year: "2026-27" },
      { category: "Transport", planned: 650000, year: "2026-27" },
      { category: "Maintenance", planned: 350000, year: "2026-27" },
      { category: "Library & Labs", planned: 300000, year: "2026-27" },
      { category: "Events & Activities", planned: 250000, year: "2026-27" },
    ],
  });
  await db.expense.createMany({
    data: [
      { category: "Salaries", title: "October payroll — teaching staff", amount: 238000, vendor: "Internal", spentOn: new Date(2026, 9, 28) },
      { category: "Utilities", title: "Electricity bill — October", amount: 41200, vendor: "MSEDCL", spentOn: new Date(2026, 9, 18) },
      { category: "Transport", title: "Bus diesel & maintenance", amount: 56500, vendor: "City Fuel Co.", spentOn: new Date(2026, 9, 12) },
      { category: "Library & Labs", title: "Science lab reagents restock", amount: 18750, vendor: "SciLab Supplies", spentOn: new Date(2026, 9, 8) },
      { category: "Events & Activities", title: "Sports day trophies & medals", amount: 12400, vendor: "Trophy House", spentOn: new Date(2026, 9, 30) },
      { category: "Maintenance", title: "Monsoon roof repairs", amount: 27800, vendor: "Sharma Contractors", spentOn: new Date(2026, 8, 22) },
    ],
  });
  await db.vendor.createMany({
    data: [
      { name: "MSEDCL", category: "Utilities", phone: "+91 1912" },
      { name: "SciLab Supplies", category: "Library & Labs", phone: "+91 98220 55443" },
      { name: "City Fuel Co.", category: "Transport", phone: "+91 98220 66778" },
    ],
  });
  await db.purchaseRequest.createMany({
    data: [
      { title: "10 new desktop computers for the computer lab", category: "Library & Labs", amount: 350000, requestedByName: teachers[5].name, status: "PENDING" },
      { title: "Bus tyre replacement — Route 2", category: "Transport", amount: 48000, requestedByName: "Transport In-charge", status: "APPROVED" },
    ],
  });

  await db.healthIncident.createMany({
    data: [
      { studentId: students[1].id, title: "Mild sprain during PE", note: "Ice pack applied; rested in the infirmary for 30 minutes. Parent informed.", severity: "MINOR", date: new Date(now.getTime() - 4 * 864e5) },
      { title: "First-aid drill conducted", note: "Whole-school evacuation + first-aid awareness drill completed in 6 minutes.", severity: "INFO", date: new Date(now.getTime() - 20 * 864e5) },
    ],
  });

  await db.learningResource.createMany({
    data: [
      { subject: "Mathematics", chapter: "Polynomials", title: "Class 9 Polynomials — full chapter", url: "https://www.youtube.com/results?search_query=class+9+polynomials+cbse", kind: "VIDEO" },
      { subject: "Science", chapter: "Crop Production & Management", title: "Agriculture practices explained", url: "https://www.youtube.com/results?search_query=class+8+crop+production", kind: "VIDEO" },
      { subject: "English", chapter: "The Fun They Had", title: "Chapter summary & discussion", url: "https://www.youtube.com/results?search_query=the+fun+they+had+class+9", kind: "VIDEO" },
      { subject: "Social Science", chapter: "The French Revolution", title: "Animated French Revolution timeline", url: "https://www.youtube.com/results?search_query=french+revolution+class+9", kind: "VIDEO" },
    ],
  });

  const counts = {
    users: await db.user.count(),
    students: await db.student.count(),
    attendance: await db.attendance.count(),
    assessments: await db.assessment.count(),
    scores: await db.score.count(),
    homework: await db.homework.count(),
    submissions: await db.homeworkSubmission.count(),
    timetableSlots: await db.timetableSlot.count(),
    feeInvoices: await db.feeInvoice.count(),
    libraryBooks: await db.libraryBook.count(),
    events: await db.schoolEvent.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
