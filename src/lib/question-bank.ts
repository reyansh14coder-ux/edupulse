export type BankQuestion = {
  chapter: string;
  q: string;
  options: string[];
  answer: number;
};

export const SUBJECTS = [
  "English",
  "Hindi",
  "Mathematics",
  "Science",
  "Social Science",
  "Computer Science",
] as const;

export const SYLLABUS: Record<string, string[]> = {
  English: [
    "Grammar & Usage",
    "Reading Comprehension",
    "Writing Skills",
    "Poetry",
    "Prose",
    "Vocabulary",
  ],
  Hindi: ["गद्य", "पद्य", "व्याकरण", "रचनात्मक लेखन", "अपठित गद्यांश"],
  Mathematics: [
    "Number Systems",
    "Algebraic Expressions",
    "Linear Equations",
    "Geometry & Shapes",
    "Data Handling",
    "Mensuration",
  ],
  Science: [
    "Matter & Materials",
    "Force & Motion",
    "Life Processes",
    "Light & Sound",
    "Environment",
    "Electricity Basics",
  ],
  "Social Science": [
    "History – Ancient India",
    "Geography – Our Earth",
    "Civics – Democracy",
    "Economics Basics",
    "History – Medieval India",
  ],
  "Computer Science": [
    "Computer Fundamentals",
    "Input & Output Devices",
    "Introduction to Programming",
    "Internet & Safety",
    "Spreadsheets Basics",
  ],
};

export const BANK: Record<string, BankQuestion[]> = {
  Mathematics: [
    {
      chapter: "Number Systems",
      q: "Which of the following is an irrational number?",
      options: ["0.333…", "√2", "7/8", "2.5"],
      answer: 1,
    },
    {
      chapter: "Number Systems",
      q: "The smallest natural number is:",
      options: ["0", "1", "−1", "0.5"],
      answer: 1,
    },
    {
      chapter: "Algebraic Expressions",
      q: "Simplify: 3x + 5x − 2x",
      options: ["6x", "8x", "4x", "10x"],
      answer: 0,
    },
    {
      chapter: "Algebraic Expressions",
      q: "The exponent (power) in the term 7a⁵ is:",
      options: ["7", "5", "a", "12"],
      answer: 1,
    },
    {
      chapter: "Linear Equations",
      q: "If 2x + 6 = 14, then x =",
      options: ["4", "8", "10", "2"],
      answer: 0,
    },
    {
      chapter: "Geometry & Shapes",
      q: "The sum of the interior angles of a triangle is:",
      options: ["90°", "180°", "270°", "360°"],
      answer: 1,
    },
    {
      chapter: "Data Handling",
      q: "The middle value of sorted data is called the:",
      options: ["mean", "median", "mode", "range"],
      answer: 1,
    },
    {
      chapter: "Mensuration",
      q: "Area of a rectangle with length 8 cm and breadth 5 cm:",
      options: ["13 cm²", "26 cm²", "40 cm²", "45 cm²"],
      answer: 2,
    },
  ],
  Science: [
    {
      chapter: "Matter & Materials",
      q: "Which state of matter has a definite volume but no definite shape?",
      options: ["Solid", "Liquid", "Gas", "Plasma"],
      answer: 1,
    },
    {
      chapter: "Force & Motion",
      q: "The SI unit of force is:",
      options: ["Joule", "Newton", "Watt", "Pascal"],
      answer: 1,
    },
    {
      chapter: "Force & Motion",
      q: "A body at rest stays at rest unless acted upon by an external force. This is:",
      options: [
        "Newton's first law of motion",
        "Newton's second law of motion",
        "Newton's third law of motion",
        "Law of gravitation",
      ],
      answer: 0,
    },
    {
      chapter: "Life Processes",
      q: "Which organ pumps blood throughout the human body?",
      options: ["Lungs", "Brain", "Heart", "Liver"],
      answer: 2,
    },
    {
      chapter: "Life Processes",
      q: "Plants prepare their own food by the process of:",
      options: ["Respiration", "Photosynthesis", "Transpiration", "Digestion"],
      answer: 1,
    },
    {
      chapter: "Light & Sound",
      q: "Sound cannot travel through:",
      options: ["Air", "Water", "Vacuum", "Steel"],
      answer: 2,
    },
    {
      chapter: "Environment",
      q: "Which gas is most responsible for the greenhouse effect on Earth?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
      answer: 2,
    },
    {
      chapter: "Electricity Basics",
      q: "The SI unit of electric current is:",
      options: ["Volt", "Ampere", "Ohm", "Watt"],
      answer: 1,
    },
  ],
  English: [
    {
      chapter: "Grammar & Usage",
      q: "Choose the correct past tense of 'go':",
      options: ["goed", "gone", "went", "going"],
      answer: 2,
    },
    {
      chapter: "Grammar & Usage",
      q: "Identify the adjective: 'The clever fox jumped.'",
      options: ["clever", "fox", "jumped", "the"],
      answer: 0,
    },
    {
      chapter: "Vocabulary",
      q: "Choose the synonym of 'abundant':",
      options: ["scarce", "plentiful", "rare", "limited"],
      answer: 1,
    },
    {
      chapter: "Vocabulary",
      q: "Choose the antonym of 'ancient':",
      options: ["modern", "old", "historic", "aged"],
      answer: 0,
    },
    {
      chapter: "Reading Comprehension",
      q: "In a story, the 'climax' refers to the:",
      options: [
        "beginning of the story",
        "highest point of tension",
        "final paragraph",
        "setting of the story",
      ],
      answer: 1,
    },
    {
      chapter: "Poetry",
      q: "A group of lines in a poem is called a:",
      options: ["stanza", "paragraph", "chapter", "sentence"],
      answer: 0,
    },
    {
      chapter: "Writing Skills",
      q: "A formal letter to a newspaper editor should begin with:",
      options: ["Dear friend,", "Sir/Madam,", "Hey,", "What's up,"],
      answer: 1,
    },
    {
      chapter: "Prose",
      q: "'He ran like the wind' is an example of:",
      options: ["simile", "metaphor", "personification", "alliteration"],
      answer: 0,
    },
  ],
  Hindi: [
    {
      chapter: "व्याकरण",
      q: "‘सुंदर’ शब्द का समानार्थी शब्द है:",
      options: ["रूपवान", "कुरूप", "साधारण", "असुंदर"],
      answer: 0,
    },
    {
      chapter: "व्याकरण",
      q: "‘ने’ किस विभक्ति का चिह्न है?",
      options: ["पंचमी", "तृतीया", "षष्ठी", "सप्तमी"],
      answer: 2,
    },
    {
      chapter: "व्याकरण",
      q: "‘विद्यालय’ शब्द में कौन-सा समास है?",
      options: ["तत्पुरुष", "कर्मधारय", "द्वंद्व", "बहुव्रीहि"],
      answer: 1,
    },
    {
      chapter: "गद्य",
      q: "निम्न में से गद्य रचना कौन-सी है?",
      options: ["कविता", "निबंध", "गीत", "श्लोक"],
      answer: 1,
    },
    {
      chapter: "पद्य",
      q: "‘मुख चंद्रमा सा’ में कौन-सा अलंकार है?",
      options: ["अनुप्रास", "उपमा", "यमक", "श्लेष"],
      answer: 1,
    },
    {
      chapter: "पद्य",
      q: "तुकांत अर्थात्:",
      options: [
        "अंत में एक जैसी ध्वनि",
        "शब्दों का दोहराव",
        "अनुप्रास",
        "भाव की आवृत्ति",
      ],
      answer: 0,
    },
    {
      chapter: "रचनात्मक लेखन",
      q: "औपचारिक पत्र में प्रेषक का पता कहाँ लिखा जाता है?",
      options: ["बाएँ ओर ऊपर", "दाएँ ओर ऊपर", "नीचे बीच में", "विषय के ठीक बाद"],
      answer: 1,
    },
    {
      chapter: "अपठित गद्यांश",
      q: "अपठित गद्यांश का अर्थ है:",
      options: [
        "पहले पढ़ा हुआ गद्यांश",
        "नया/अनदेखा गद्यांश",
        "संवाद-आधारित रचना",
        "काव्य-रचना",
      ],
      answer: 1,
    },
  ],
  "Social Science": [
    {
      chapter: "History – Ancient India",
      q: "The Indus Valley Civilization flourished along the banks of the:",
      options: ["Ganga", "Indus", "Brahmaputra", "Yamuna"],
      answer: 1,
    },
    {
      chapter: "History – Ancient India",
      q: "Who was the founder of Buddhism?",
      options: ["Mahavira", "Gautama Buddha", "Ashoka", "Chandragupta"],
      answer: 1,
    },
    {
      chapter: "History – Medieval India",
      q: "The Delhi Sultanate began with which ruler?",
      options: [
        "Qutbuddin Aibak",
        "Ibrahim Lodi",
        "Balban",
        "Alauddin Khalji",
      ],
      answer: 0,
    },
    {
      chapter: "Geography – Our Earth",
      q: "The imaginary line dividing Earth into Northern and Southern hemispheres is the:",
      options: ["Prime Meridian", "Equator", "Tropic of Cancer", "Date Line"],
      answer: 1,
    },
    {
      chapter: "Geography – Our Earth",
      q: "Which is the largest ocean in the world?",
      options: ["Atlantic", "Indian", "Arctic", "Pacific"],
      answer: 3,
    },
    {
      chapter: "Civics – Democracy",
      q: "In a democracy, ultimate power rests with:",
      options: ["the king", "the people", "the army", "the courts"],
      answer: 1,
    },
    {
      chapter: "Civics – Democracy",
      q: "The Constitution of India was adopted on:",
      options: ["15 August 1947", "26 January 1950", "26 November 1949", "2 October 1950"],
      answer: 2,
    },
    {
      chapter: "Economics Basics",
      q: "Inflation means:",
      options: [
        "a general rise in prices",
        "a fall in prices",
        "a rise in exports only",
        "stable prices",
      ],
      answer: 0,
    },
  ],
  "Computer Science": [
    {
      chapter: "Computer Fundamentals",
      q: "CPU stands for:",
      options: [
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Program Utility",
        "Control Panel Unit",
      ],
      answer: 0,
    },
    {
      chapter: "Computer Fundamentals",
      q: "Which of the following is non-volatile memory?",
      options: ["RAM", "ROM", "Cache", "Registers"],
      answer: 1,
    },
    {
      chapter: "Input & Output Devices",
      q: "Which of these is an output device?",
      options: ["Keyboard", "Mouse", "Printer", "Scanner"],
      answer: 2,
    },
    {
      chapter: "Introduction to Programming",
      q: "A step-by-step set of instructions to solve a problem is called an:",
      options: ["algorithm", "compiler", "variable", "interpreter"],
      answer: 0,
    },
    {
      chapter: "Introduction to Programming",
      q: "In Python, which symbol starts a single-line comment?",
      options: ["#", "//", "--", "/*"],
      answer: 0,
    },
    {
      chapter: "Internet & Safety",
      q: "A website URL starting with HTTPS means the connection is:",
      options: ["encrypted and secure", "very slow", "offline", "open to all"],
      answer: 0,
    },
    {
      chapter: "Spreadsheets Basics",
      q: "In a spreadsheet, the intersection of a row and a column is called a:",
      options: ["cell", "field", "record", "sheet"],
      answer: 0,
    },
    {
      chapter: "Spreadsheets Basics",
      q: "Which function is used to add a range of values in a spreadsheet?",
      options: ["SUM", "COUNT", "SORT", "MERGE"],
      answer: 0,
    },
  ],
};
