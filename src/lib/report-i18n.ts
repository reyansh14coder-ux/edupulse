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
  },
};
