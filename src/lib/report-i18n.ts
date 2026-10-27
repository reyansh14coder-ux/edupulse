export type Lang = "en" | "hi" | "mr";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
];

const LOCALE: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

export function localeOf(lang: Lang) {
  return LOCALE[lang] ?? "en-IN";
}

export function isLang(v: string | undefined): v is Lang {
  return v === "en" || v === "hi" || v === "mr";
}

type Copy = {
  title: string;
  sub: string;
  period: string;
  summaryTitle: string;
  overall: string;
  attendanceWeek: string;
  present: string;
  assessmentsWeek: string;
  homeworkDue: string;
  highlights: string;
  concerns: string;
  assessmentsTable: string;
  absences: string;
  focus: string;
  notes: string;
  plans: string;
  noPlans: string;
  emptyHighlights: string;
  emptyConcerns: string;
  noAssessments: string;
  back: string;
  share: string;
  shared: (n: number) => string;
  print: string;
  footer: string;
  delta: string;
  noDelta: string;
  summary: (
    name: string,
    overall: number,
    att: number,
    concerns: number,
    healthy: string
  ) => string;
  hBest: (pct: number, subject: string, title: string) => string;
  hPerfect: string;
  hPresentAll: string;
  hSteady: string;
  cWorst: (subject: string, title: string, pct: number) => string;
  cAbsent: (n: number) => string;
  cPending: (n: number) => string;
  focusLine: (subject: string, avg: number) => string;
  focusNone: string;
  aiSummaryTitle: string;
  adviceLabel: string;
  studiesLabel: string;
  achievements: string;
  focusAreas: string;
  subjectsTitle: string;
  subjectsSub: string;
  teacherAdvice: string;
  noTeacherAdvice: string;
  studiesLine: (a: number, subj: number, sub: number, tot: number) => string;
  aTop: (subject: string, avg: number) => string;
  aImproving: (subject: string) => string;
  aAttendance: (pct: number) => string;
  aGoals: (n: number) => string;
  aNone: string;
  fWeak: (subject: string, avg: number) => string;
  fGaps: (n: number, chapters: string) => string;
  fDecline: (subject: string) => string;
  focusOk: string;
  adviceLine: (subject: string | null, avg: number | null) => string;
  sRec: (
    subject: string,
    avg: number,
    level: "excellent" | "good" | "revise" | "urgent"
  ) => string;
  trendUp: string;
  trendDown: string;
  sGaps: (chapters: string) => string;
  noSubjects: string;
  sAction: (
    subject: string,
    chapter: string | null,
    level: "excellent" | "good" | "revise" | "urgent"
  ) => string;
  behaviourTitle: string;
  behaviourEmpty: string;
  activitiesTitle: string;
  activitiesEmpty: string;
  askQuery: string;
  askQuerySub: string;
  diveBtn: string;
  diveUp: string;
  diveDown: string;
  diveFlat: string;
  diveTests: (n: number) => string;
  diveFocus: string;
  diveLoading: (subject: string) => string;
  diveError: string;
  diveRetry: string;
};

export const REPORT_COPY: Record<Lang, Copy> = {
  en: {
    title: "Weekly progress report",
    sub: "Generated automatically every week from attendance, assessments and submitted work.",
    period: "Reporting period",
    summaryTitle: "Summary for parents",
    overall: "Overall average",
    attendanceWeek: "Attendance this week",
    present: "present",
    assessmentsWeek: "Assessments this week",
    homeworkDue: "homework items due",
    highlights: "Highlights",
    concerns: "Needs attention",
    assessmentsTable: "This week's assessments",
    absences: "Absences this week",
    focus: "Suggested focus for next week",
    notes: "Teacher & counselor notes",
    plans: "Teacher-shared next-step plans",
    noPlans: "No next-step plans shared yet — the teacher will share them after review.",
    emptyHighlights: "A steady week overall.",
    emptyConcerns: "No concerns this week — keep supporting the routine.",
    noAssessments: "No graded assessments this week.",
    back: "Back to overview",
    share: "Share with co-parent",
    shared: (n) =>
      `Shared with ${n} linked parent account(s) — recorded in the privacy audit log.`,
    print: "Print / Save PDF",
    footer: "Sent automatically to parents every Monday · Powered by Vidyora analysis",
    delta: "vs last week",
    noDelta: "No previous week data yet",
    summary: (name, overall, att, concerns, healthy) =>
      `${name} is currently averaging ${overall}% across all assessments with ${att}% attendance this week. ` +
      (concerns
        ? `${concerns} area(s) need attention — see concerns below.`
        : healthy),
    hBest: (pct, subject, title) =>
      `Scored ${pct}% in ${subject} (${title}).`,
    hPerfect: "Perfect or near-perfect attendance this week.",
    hPresentAll: "Present all week — consistent routine.",
    hSteady: "No graded assessments this week — steady practice continues.",
    cWorst: (subject, title, pct) =>
      `${subject} (${title}) needs revision — ${pct}%.`,
    cAbsent: (n) => `Absent on ${n} days this week.`,
    cPending: (n) => `${n} homework item(s) still pending submission.`,
    focusLine: (subject, avg) =>
      `Revise ${subject} fundamentals (currently averaging ${avg}%) and complete pending homework before the next unit test.`,
    focusNone: "Keep up the balanced routine across all subjects.",
    aiSummaryTitle: "Overall summary & AI recommendations",
    adviceLabel: "One thing to do this week",
    studiesLabel: "Studies so far",
    achievements: "Achievements",
    focusAreas: "Where to focus more",
    subjectsTitle: "Subject-wise summaries & recommendations",
    subjectsSub: "All-time averages, weekly trend and AI advice per subject",
    teacherAdvice: "Teacher & counselor recommendations",
    noTeacherAdvice:
      "No teacher or counselor notes yet — notes will appear here as they are shared.",
    studiesLine: (a, subj, sub, tot) =>
      `${a} assessment(s) across ${subj} subject(s) so far, with ${sub} of ${tot} homework items submitted.`,
    aTop: (subject, avg) =>
      `${subject} is the strongest subject — ${avg}% average across all assessments.`,
    aImproving: (subject) =>
      `${subject} scores have been improving steadily in recent assessments.`,
    aAttendance: (pct) =>
      `${pct}% attendance — a strong, consistent routine.`,
    aGoals: (n) =>
      `${n} personal goal(s) completed — self-driven improvement.`,
    aNone:
      "No standout achievement recorded this period — steady work continues.",
    fWeak: (subject, avg) =>
      `${subject} is the weakest subject (avg ${avg}%) and needs the most focused time.`,
    fGaps: (n, chapters) =>
      `${n} quiz chapter(s) below 75% accuracy: ${chapters}.`,
    fDecline: (subject) =>
      `${subject} results have dipped lately — revise before the next test.`,
    focusOk:
      "No major weak area detected — keep the current weekly routine going.",
    adviceLine: (subject, avg) =>
      subject && avg !== null
        ? `Focus most on ${subject} (avg ${avg}%): revise its basics for 30 minutes daily, solve the listed weak-chapter question types, and watch the linked video lessons. Keep the other subjects on the same weekly routine.`
        : `Maintain the current weekly routine — attempt one practice quiz every week to keep every subject sharp.`,
    sRec: (subject, avg, level) => {
      if (level === "excellent")
        return `${subject} is a strength (${avg}%) — try challenge and Olympiad-style questions to stay ahead.`;
      if (level === "good")
        return `${subject} is on track (${avg}%) — revise once a week and attempt mixed practice to stay above 80%.`;
      if (level === "revise")
        return `${subject} needs revision (${avg}%) — redo textbook examples, then solve 10 similar questions daily this week.`;
      return `${subject} needs immediate support (${avg}%) — clear the basics with the teacher, watch the chapter video, then take the practice quiz again.`;
    },
    trendUp: " Trend is improving.",
    trendDown: " Trend is declining — act early.",
    sGaps: (chapters) => ` Weak chapters: ${chapters}.`,
    noSubjects: "No subject scores recorded yet.",
    sAction: (subject, chapter, level) => {
      const focus = chapter ? `${subject} — ${chapter}` : subject;
      if (level === "excellent")
        return `Ask your child to teach you one tricky ${focus} concept this week — explaining it aloud locks in learning.`;
      if (level === "good")
        return `Revise ${focus} together for 15 minutes before the next test — two short sessions beat one long one.`;
      if (level === "revise")
        return `Help your child re-solve 10 questions from ${focus} this week and check the ones they got wrong together.`;
      return `Spend 15 minutes daily this week on ${focus} basics — start with the chapter video, then one practice quiz together.`;
    },
    behaviourTitle: "Behaviour & wellbeing this week",
    behaviourEmpty: "No behaviour notes recorded this week.",
    activitiesTitle: "Extracurricular activities this week",
    activitiesEmpty: "No activities logged this week.",
    askQuery: "Have a question for the school?",
    askQuerySub: "Send a query — teachers and admin reply right here.",
    diveBtn: "Dive deeper",
    diveUp: "improving",
    diveDown: "recover soon",
    diveFlat: "steady",
    diveTests: (n) => `${n} test${n === 1 ? "" : "s"}`,
    diveFocus: "Next focus",
    diveLoading: (subject) => `Analysing ${subject} data…`,
    diveError:
      "Analysis could not be loaded right now. The summary above still works.",
    diveRetry: "Try again",
  },
  hi: {
    title: "साप्ताहिक प्रगति रिपोर्ट",
    sub: "उपस्थिति, मूल्यांकन और जमा कार्य से हर हफ़्ते अपने-आप तैयार होने वाली रिपोर्ट।",
    period: "रिपोर्ट अवधि",
    summaryTitle: "अभिभावकों के लिए सारांश",
    overall: "कुल औसत",
    attendanceWeek: "इस हफ़्ते उपस्थिति",
    present: "उपस्थित",
    assessmentsWeek: "इस हफ़्ते मूल्यांकन",
    homeworkDue: "होमवर्क देय",
    highlights: "उपलब्धियाँ",
    concerns: "ध्यान देने योग्य",
    assessmentsTable: "इस हफ़्ते के मूल्यांकन",
    absences: "इस हफ़्ते अनुपस्थिति",
    focus: "अगले हफ़्ते का सुझाया गया लक्ष्य",
    notes: "शिक्षक व परामर्शदाता की टिप्पणियाँ",
    plans: "शिक्षक द्वारा साझा की गई अगली-चरण योजनाएँ",
    noPlans: "अभी कोई योजना साझा नहीं हुई — समीक्षा के बाद शिक्षक साझा करेंगे।",
    emptyHighlights: "यह हफ़्ता सामान्य और स्थिर रहा।",
    emptyConcerns: "इस हफ़्ते कोई चिंता नहीं — दिनचर्या ऐसे ही बनाए रखें।",
    noAssessments: "इस हफ़्ते कोई ग्रेडेड मूल्यांकन नहीं।",
    back: "अवलोकन पर वापस",
    share: "सह-अभिभावक के साथ साझा करें",
    shared: (n) =>
      `${n} लिंक अभिभावक खाते(ओं) के साथ साझा — गोपनीयता ऑडिट लॉग में दर्ज।`,
    print: "प्रिंट / PDF सेव करें",
    footer: "हर सोमवार अभिभावकों को स्वतः भेजा जाता है · Vidyora विश्लेषण द्वारा",
    delta: "पिछले हफ़्ते से",
    noDelta: "अभी पिछले हफ़्ते का डेटा नहीं",
    summary: (name, overall, att, concerns, healthy) =>
      `${name} इस समय सभी मूल्यांकनों में ${overall}% औसत और इस हफ़्ते ${att}% उपस्थिति के साथ है। ` +
      (concerns
        ? `${concerns} बिंदुओं पर ध्यान चाहिए — नीचे देखें।`
        : healthy),
    hBest: (pct, subject, title) =>
      `${subject} (${title}) में ${pct}% अंक मिले।`,
    hPerfect: "इस हफ़्ते उपस्थिति लगभग पूर्ण रही।",
    hPresentAll: "पूरे हफ़्ते उपस्थित — नियमित दिनचर्या बनी रही।",
    hSteady: "इस हफ़्ते कोई ग्रेडेड मूल्यांकन नहीं — अभ्यास जारी है।",
    cWorst: (subject, title, pct) =>
      `${subject} (${title}) का दोहरान ज़रूरी — ${pct}%।`,
    cAbsent: (n) => `इस हफ़्ते ${n} दिन अनुपस्थित रहे।`,
    cPending: (n) => `${n} होमवर्क अभी जमा नहीं हुए।`,
    focusLine: (subject, avg) =>
      `${subject} की मूल बातें दोहराएँ (वर्तमान औसत ${avg}%) और अगली यूनिट टेस्ट से पहले बाकी होमवर्क पूरा करें।`,
    focusNone: "सभी विषयों में संतुलित दिनचर्या बनाए रखें।",
    aiSummaryTitle: "समग्र सारांश व AI सुझाव",
    adviceLabel: "इस सप्ताह के लिए एक काम",
    studiesLabel: "अब तक की पढ़ाई",
    achievements: "उपलब्धियाँ",
    focusAreas: "और ध्यान देने योग्य बिंदु",
    subjectsTitle: "विषयवार सारांश व AI सुझाव",
    subjectsSub: "कुल औसत, हफ़्ते की प्रवृत्ति और हर विषय के लिए AI सलाह",
    teacherAdvice: "शिक्षक व परामर्शदाता की सिफ़ारिशें",
    noTeacherAdvice:
      "अभी शिक्षक या परामर्शदाता की कोई टिप्पणी नहीं — जैसे ही साझा होगी यहाँ दिखेगी।",
    studiesLine: (a, subj, sub, tot) =>
      `अब तक ${subj} विषय(ओं) में ${a} मूल्यांकन, और ${tot} में से ${sub} होमवर्क जमा।`,
    aTop: (subject, avg) =>
      `${subject} सबसे मज़बूत विषय है — सभी मूल्यांकनों में ${avg}% औसत।`,
    aImproving: (subject) =>
      `${subject} के अंक हाल के मूल्यांकनों में लगातार बेहतर हो रहे हैं।`,
    aAttendance: (pct) =>
      `${pct}% उपस्थिति — मज़बूत व नियमित दिनचर्या।`,
    aGoals: (n) =>
      `${n} व्यक्तिगत लक्ष्य पूरे — आत्म-प्रेरित सुधार।`,
    aNone:
      "इस अवधि में कोई विशेष उपलब्धि दर्ज नहीं — नियमित प्रयास जारी है।",
    fWeak: (subject, avg) =>
      `${subject} सबसे कमज़ोर विषय है (औसत ${avg}%) और सबसे अधिक केंद्रित समय चाहिए।`,
    fGaps: (n, chapters) =>
      `${n} क्विज़ अध्याय 75% से नीचे: ${chapters}।`,
    fDecline: (subject) =>
      `${subject} के परिणाम हाल में गिरे हैं — अगली परीक्षा से पहले दोहराएँ।`,
    focusOk:
      "कोई बड़ा कमज़ोर क्षेत्र नहीं मिला — मौजूदा साप्ताहिक दिनचर्या बनाए रखें।",
    adviceLine: (subject, avg) =>
      subject && avg !== null
        ? `${subject} पर सबसे अधिक ध्यान दें (औसत ${avg}%): रोज़ 30 मिनट मूल बातें दोहराएँ, ऊपर दिए कमज़ोर अध्यायों के प्रश्न-प्रकार हल करें और दिए गए वीडियो देखें। बाकी विषयों में वही साप्ताहिक दिनचर्या रखें।`
        : `मौजूदा साप्ताहिक दिनचर्या बनाए रखें — हर हफ़्ते एक अभ्यास क्विज़ दें ताकि हर विषय मज़बूत रहे।`,
    sRec: (subject, avg, level) => {
      if (level === "excellent")
        return `${subject} आपकी ताकत है (${avg}%) — आगे रहने के लिए चैलेंज व ओलंपियाड-स्तर के प्रश्न हल करें।`;
      if (level === "good")
        return `${subject} ठीक चल रहा है (${avg}%) — हफ़्ते में एक बार दोहराएँ और 80% से ऊपर रहने के लिए मिश्रित अभ्यास करें।`;
      if (level === "revise")
        return `${subject} का दोहरान ज़रूरी है (${avg}%) — पाठ्यपुस्तक के उदाहरण फिर हल करें, इस हफ़्ते रोज़ 10 समान प्रश्न करें।`;
      return `${subject} को तुरंत सहारा चाहिए (${avg}%) — शिक्षक से मूल बातें स्पष्ट कराएँ, अध्याय वीडियो देखें, फिर अभ्यास क्विज़ दोबारा दें।`;
    },
    trendUp: " प्रवृत्ति बेहतर हो रही है।",
    trendDown: " प्रवृत्ति गिर रही है — जल्दी कदम उठाएँ।",
    sGaps: (chapters) => ` कमज़ोर अध्याय: ${chapters}।`,
    noSubjects: "अभी कोई विषय-अंक दर्ज नहीं।",
    sAction: (subject, chapter, level) => {
      const focus = chapter ? `${subject} — ${chapter}` : subject;
      if (level === "excellent")
        return `इस हफ़्ते बच्चे से ${focus} का एक कठिन संकल्पना आपको समझाने को कहें — बोलकर समझाने से पढ़ाई पक्की होती है।`;
      if (level === "good")
        return `अगले टेस्ट से पहले ${focus} साथ में 15 मिनट दोहराएँ — दो छोटे सत्र एक लंबे सत्र से बेहतर हैं।`;
      if (level === "revise")
        return `इस हफ़्ते ${focus} के 10 प्रश्न दोबारा हल करने में मदद करें और ग़लतियाँ साथ में देखें।`;
      return `इस हफ़्ते रोज़ 15 मिनट ${focus} की मूल बातों पर दें — पहले अध्याय वीडियो, फिर साथ में एक अभ्यास क्विज़।`;
    },
    behaviourTitle: "इस हफ़्ते व्यवहार व स्वास्थ्य",
    behaviourEmpty: "इस हफ़्ते कोई व्यवहार टिप्पणी दर्ज नहीं।",
    activitiesTitle: "इस हफ़्ते पाठ्यक्रमेतर गतिविधियाँ",
    activitiesEmpty: "इस हफ़्ते कोई गतिविधि दर्ज नहीं।",
    askQuery: "स्कूल से कोई प्रश्न है?",
    askQuerySub: "प्रश्न भेजें — शिक्षक व प्रशासन यहीं उत्तर देंगे।",
    diveBtn: "और गहराई से देखें",
    diveUp: "सुधार हो रहा है",
    diveDown: "जल्दी सुधारें",
    diveFlat: "स्थिर",
    diveTests: (n) => `${n} परीक्षण`,
    diveFocus: "अगला फोकस",
    diveLoading: (subject) => `${subject} का विश्लेषण हो रहा है…`,
    diveError: "विश्लेषण अभी उपलब्ध नहीं है। ऊपर का सारांश फिर भी काम करता है।",
    diveRetry: "दोबारा कोशिश करें",
  },
  mr: {
    title: "साप्ताहिक प्रगती अहवाल",
    sub: "उपस्थिती, मूल्यांकन व सादर केलेल्या कामांवरून दर आठवड्याला आपोआप तयार होणारा अहवाल.",
    period: "अहवाल कालावधी",
    summaryTitle: "पालकांसाठी सारांश",
    overall: "एकूण सरासरी",
    attendanceWeek: "या आठवड्यातील उपस्थिती",
    present: "उपस्थित",
    assessmentsWeek: "या आठवड्यातील मूल्यांकन",
    homeworkDue: "गृहकार्य देय",
    highlights: "यशोगाथा",
    concerns: "लक्ष देण्यायोग्य",
    assessmentsTable: "या आठवड्याची मूल्यांकने",
    absences: "या आठवड्यातील गैरहजेरी",
    focus: "पुढील आठवड्यासाठी सुचवलेले लक्ष्य",
    notes: "शिक्षक व समुपदेशकांच्या टिपा",
    plans: "शिक्षकांनी शेअर केलेल्या पुढील-टप्प्याच्या योजना",
    noPlans: "अद्याप कोणतीही योजना शेअर केलेली नाही — पुनरावलोकनानंतर शिक्षक शेअर करतील.",
    emptyHighlights: "आठवडा सामान्य व स्थिर राहिला.",
    emptyConcerns: "या आठवड्यात कोणतीही चिंता नाही — नियमितता कायम ठेवा.",
    noAssessments: "या आठवड्यात ग्रेडेड मूल्यांकन नाही.",
    back: "आढाव्याकडे परत",
    share: "सह-पालकांनी शेअर करा",
    shared: (n) =>
      `${n} जोडलेल्या पालक खात्यांनी शेअर — गोपनीयता ऑडिट लॉगमध्ये नोंदवले.`,
    print: "प्रिंट / PDF जतन करा",
    footer: "दर सोमवारी पालकांना आपोआप पाठवले जाते · Vidyora विश्लेषणाद्वारे",
    delta: "मागील आठवड्यापेक्षा",
    noDelta: "अद्याप मागील आठवड्याचा डेटा नाही",
    summary: (name, overall, att, concerns, healthy) =>
      `${name} सध्या सर्व मूल्यांकनांमध्ये ${overall}% सरासरी आणि या आठवड्यात ${att}% उपस्थिती ठेवत आहे. ` +
      (concerns
        ? `${concerns} बाबींना लक्ष देणे आवश्यक — खाली पहा.`
        : healthy),
    hBest: (pct, subject, title) =>
      `${subject} (${title}) मध्ये ${pct}% गुण मिळाले.`,
    hPerfect: "या आठवड्यात उपस्थिती जवळजवळ पूर्ण राहिली.",
    hPresentAll: "संपूर्ण आठवडा उपस्थित — नियमित दिनचर्या कायम राहिली.",
    hSteady: "या आठवड्यात ग्रेडेड मूल्यांकन नाही — सराव सुरू आहे.",
    cWorst: (subject, title, pct) =>
      `${subject} (${title}) पुन्हा पाहणे आवश्यक — ${pct}%.`,
    cAbsent: (n) => `या आठवड्यात ${n} दिवस गैरहजेरी.`,
    cPending: (n) => `${n} गृहकार्य अद्याप सादर झालेले नाही.`,
    focusLine: (subject, avg) =>
      `${subject} मधील मूलभूत गोष्टी पुन्हा पाहा (सधीली सरासरी ${avg}%) आणि पुढील युनिट चाचणीपूर्वी उरलेले गृहकार्य पूर्ण करा.`,
    focusNone: "सर्व विषयांमध्ये संतुलित दिनचर्या कायम ठेवा.",
    aiSummaryTitle: "एकूण सारांश व AI शिफारसी",
    adviceLabel: "या आठवड्यात करावी एक गोष्ट",
    studiesLabel: "आतापर्यंतचा अभ्यास",
    achievements: "यशोगाथा",
    focusAreas: "आणखी लक्ष देण्यायोग्य बाबी",
    subjectsTitle: "विषयनिहाय सारांश व AI शिफारसी",
    subjectsSub: "एकूण सरासरी, आठवड्याची कल आणि प्रत्येक विषयासाठी AI सल्ला",
    teacherAdvice: "शिक्षक व समुपदेशकांच्या शिफारसी",
    noTeacherAdvice:
      "अद्याप शिक्षक किंवा समुपदेशकांच्या टिपा नाहीत — शेअर झाल्यावर इथे दिसतील.",
    studiesLine: (a, subj, sub, tot) =>
      `आतापर्यंत ${subj} विषयांमध्ये ${a} मूल्यांकने, व ${tot} पैकी ${sub} गृहकार्य सादर झाले.`,
    aTop: (subject, avg) =>
      `${subject} सर्वात मजबूत विषय आहे — सर्व मूल्यांकनांमध्ये ${avg}% सरासरी.`,
    aImproving: (subject) =>
      `${subject} चे गुण अलीकडील मूल्यांकनांमध्ये सातत्याने सुधारत आहेत.`,
    aAttendance: (pct) =>
      `${pct}% उपस्थिती — मजबूत व नियमित दिनचर्या.`,
    aGoals: (n) =>
      `${n} वैयक्तिक लक्ष्य पूर्ण — स्वतः-प्रेरित सुधारणा.`,
    aNone:
      "या कालावधीत कोणतेही ठळे यश नोंदवले नाही — नियमित प्रयत्न सुरू आहेत.",
    fWeak: (subject, avg) =>
      `${subject} सर्वात कमकुवत विषय आहे (सरासरी ${avg}%) आणि सर्वाधिक केंद्रित वेळ लागेल.`,
    fGaps: (n, chapters) =>
      `${n} क्विझ धडे 75% खाली: ${chapters}.`,
    fDecline: (subject) =>
      `${subject} चे निकाल अलीकडे खाली आले आहेत — पुढील चाचणीपूर्वी पुन्हा पाहा.`,
    focusOk:
      "कोणताही मोठा कमकुवत भाग सापडला नाही — सध्याची साप्ताहिक दिनचर्या कायम ठेवा.",
    adviceLine: (subject, avg) =>
      subject && avg !== null
        ? `${subject} वर सर्वाधिक लक्ष द्या (सरासरी ${avg}%): रोज ३० मिनिटे मूलभूत गोष्टी पुन्हा पाहा, वर दिलेल्या कमकुवत धड्यांच्या प्रश्नप्रकार सोडवा आणि दिलेले व्हिडिओ पहा. इतर विषयांमध्ये तीच साप्ताहिक दिनचर्या ठेवा.`
        : `सध्याची साप्ताहिक दिनचर्या कायम ठेवा — दर आठवड्याला एक सराव क्विझ द्या, जेणेकरून प्रत्येक विषय मजबूत राहील.`,
    sRec: (subject, avg, level) => {
      if (level === "excellent")
        return `${subject} तुमची ताकद आहे (${avg}%) — पुढे राहण्यासाठी आव्हानकारक व ओलंपियाड-स्तराचे प्रश्न सोडवा.`;
      if (level === "good")
        return `${subject} ठीक चालू आहे (${avg}%) — आठवड्यातून एकदा पुन्हा पाहा आणि ८०% वर राहण्यासाठी मिश्र सराव करा.`;
      if (level === "revise")
        return `${subject} पुन्हा पाहणे आवश्यक आहे (${avg}%) — पाठ्यपुस्तकातील उदाहरणे पुन्हा सोडवा, या आठवड्यात रोज १० समान प्रश्न करा.`;
      return `${subject} ला लगेच मदत हवी आहे (${avg}%) — शिक्षकांकडून मूलभूत गोष्टी स्पष्ट करा, धडा व्हिडिओ पहा, मग सराव क्विझ पुन्हा द्या.`;
    },
    trendUp: " कल सुधारत आहे.",
    trendDown: " कल खाली पडत आहे — लवकर उपाय करा.",
    sGaps: (chapters) => ` कमकुवत धडे: ${chapters}.`,
    noSubjects: "अद्याप कोणतेही विषयगुण नोंदवलेले नाहीत.",
    sAction: (subject, chapter, level) => {
      const focus = chapter ? `${subject} — ${chapter}` : subject;
      if (level === "excellent")
        return `या आठवड्यात मुलाला/मुलीला ${focus} मधील एक कठीण संकल्पना तुम्हाला समजावून सांगा — म्हणून समजावलेले शिक्षण टिकते.`;
      if (level === "good")
        return `पुढील चाचणीपूर्वी ${focus} सोबत १५ मिनिटे पुन्हा पाहा — दोन छोट्या सत्रांपेक्षा एक लांब सत्र चांगले.`;
      if (level === "revise")
        return `या आठवड्यात ${focus} मधील १० प्रश्न पुन्हा सोडवण्यात मदत करा आणि चुका सोबत तपासा.`;
      return `या आठवड्यात रोज १५ मिनिटे ${focus} मधील मूलभूत गोष्टींवर द्या — आधी धडा व्हिडिओ, मग सोबत एक सराव क्विझ.`;
    },
    behaviourTitle: "या आठवड्यातील वर्तन व निरोगीता",
    behaviourEmpty: "या आठवड्यात वर्तनाच्या कोणत्याही टीपांची नोंद नाही.",
    activitiesTitle: "या आठवड्यातील पाठ्यक्रमेतर क्रियाकलाप",
    activitiesEmpty: "या आठवड्यात कोणताही क्रियाकलाप नोंदवलेला नाही.",
    askQuery: "शाळेबद्दल कोणता प्रश्न आहे?",
    askQuerySub: "प्रश्न पाठवा — शिक्षक व प्रशासन येथेच उत्तर देतील.",
    diveBtn: "अधिक तपासा",
    diveUp: "सुधार होत आहे",
    diveDown: "लवकर सुधार करा",
    diveFlat: "स्थिर",
    diveTests: (n) => `${n} चाचण्या`,
    diveFocus: "पुढील लक्ष",
    diveLoading: (subject) => `${subject} चे विश्लेषण सुरू आहे…`,
    diveError: "विश्लेषण आत्ता उपलब्ध नाही. वरील सारांश तरीही चालू आहे.",
    diveRetry: "पुन्हा प्रयत्न करा",
  },
};
