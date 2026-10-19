type ImprovePlan = {
  tricks: string[];
  practice: string[];
  video: { title: string; url: string };
};

const VIDEOS: Record<string, { title: string; url: string }> = {
  "Number Systems": {
    title: "Class 6 Maths — Number Systems (full chapter)",
    url: "https://www.youtube.com/watch?v=WjwX1FUOTUY",
  },
  "Algebraic Expressions": {
    title: "Class 6 Maths — Algebraic Expressions (full chapter)",
    url: "https://www.youtube.com/watch?v=nVcZFJp29mg",
  },
  "Linear Equations": {
    title: "Class 6 Maths — Linear Equations (lecture)",
    url: "https://www.youtube.com/watch?v=cUJXeBz9cK4",
  },
  "Geometry & Shapes": {
    title: "Class 6 Maths — Lines, Angles & Shapes",
    url: "https://www.youtube.com/watch?v=d8DCtY_Zy_w",
  },
  "Mensuration": {
    title: "Class 6 Maths — Perimeter & Area (complete chapter)",
    url: "https://www.youtube.com/watch?v=QdtqCjoLiQc",
  },
  "Data Handling": {
    title: "Class 6 Maths — Data Handling (mean, median, mode)",
    url: "https://www.youtube.com/results?search_query=class+6+maths+data+handling+mean+median+mode+explained",
  },
  "Matter & Materials": {
    title: "Class 6 Science — Matter & its states",
    url: "https://www.youtube.com/watch?v=GKl7CxE6-x8",
  },
  "Force & Motion": {
    title: "Class 6 Science — Force & Motion (full chapter)",
    url: "https://www.youtube.com/watch?v=gUGVnrOrhWg",
  },
  "Life Processes": {
    title: "Class 6 Science — Life Processes / Plants (full chapter)",
    url: "https://www.youtube.com/watch?v=WmSsRCiFWuk",
  },
  "Light & Sound": {
    title: "Class 6 Science — Light & Sound",
    url: "https://www.youtube.com/results?search_query=class+6+science+light+sound+reflection+explained",
  },
  Environment: {
    title: "Class 6 Science — Environment & greenhouse effect",
    url: "https://www.youtube.com/results?search_query=class+6+science+environment+greenhouse+effect+explained",
  },
  "Electricity Basics": {
    title: "Class 6 Science — Electricity basics (current, units)",
    url: "https://www.youtube.com/results?search_query=class+6+science+electricity+basics+current+unit+explained",
  },
  "Grammar & Usage": {
    title: "Class 6 English Grammar — tenses & parts of speech",
    url: "https://www.youtube.com/results?search_query=class+6+english+grammar+tenses+explained",
  },
  Vocabulary: {
    title: "Class 6 English — Synonyms & Antonyms",
    url: "https://www.youtube.com/results?search_query=class+6+english+synonyms+antonyms+tricks",
  },
  "Reading Comprehension": {
    title: "Class 6 English — Reading comprehension tricks",
    url: "https://www.youtube.com/results?search_query=class+6+english+reading+comprehension+passage+tricks",
  },
  Poetry: {
    title: "Class 6 English — Poetic devices (stanza, rhyme)",
    url: "https://www.youtube.com/results?search_query=class+6+english+poetic+devices+explained",
  },
  "Writing Skills": {
    title: "Class 6 English — Formal letter & essay writing",
    url: "https://www.youtube.com/results?search_query=class+6+english+formal+letter+writing+format",
  },
  Prose: {
    title: "Class 6 English — Figures of speech (simile, metaphor)",
    url: "https://www.youtube.com/results?search_query=class+6+english+simile+metaphor+figures+of+speech",
  },
  व्याकरण: {
    title: "कक्षा 6 हिंदी व्याकरण — समानार्थी, विभक्ति, समास",
    url: "https://www.youtube.com/results?search_query=class+6+hindi+vyakaran+samanarthak+vibhakti+samas",
  },
  गद्य: {
    title: "कक्षा 6 हिंदी गद्य — रचना के प्रकार",
    url: "https://www.youtube.com/results?search_query=class+6+hindi+gadya+ nibndh+ratnatmak+lekhan",
  },
  पद्य: {
    title: "कक्षा 6 हिंदी पद्य — अलंकार व तुकांत",
    url: "https://www.youtube.com/results?search_query=class+6+hindi+padya+alankar+explained",
  },
  "रचनात्मक लेखन": {
    title: "कक्षा 6 हिंदी — औपचारिक पत्र लेखन",
    url: "https://www.youtube.com/results?search_query=class+6+hindi+formal+letter+writing+format",
  },
  "अपठित गद्यांश": {
    title: "कक्षा 6 हिंदी — अपठित गद्यांश हल करने की विधि",
    url: "https://www.youtube.com/results?search_query=class+6+hindi+apathit+gadyansh+trick",
  },
  "History – Ancient India": {
    title: "Class 6 Social Science — Ancient India",
    url: "https://www.youtube.com/results?search_query=class+6+social+science+ancient+india+indus+valley+explained",
  },
  "History – Medieval India": {
    title: "Class 6 Social Science — Medieval India",
    url: "https://www.youtube.com/results?search_query=class+6+social+science+medieval+india+delhi+sultanate",
  },
  "Geography – Our Earth": {
    title: "Class 6 Geography — Our Earth (latitudes, oceans)",
    url: "https://www.youtube.com/results?search_query=class+6+geography+our+earth+equator+oceans+explained",
  },
  "Civics – Democracy": {
    title: "Class 6 Civics — Democracy & Constitution",
    url: "https://www.youtube.com/results?search_query=class+6+civics+democracy+constitution+explained",
  },
  "Economics Basics": {
    title: "Class 6 Economics — Basics (inflation, goods)",
    url: "https://www.youtube.com/results?search_query=class+6+economics+basics+inflation+explained",
  },
  "Computer Fundamentals": {
    title: "Class 6 Computer — Fundamentals (CPU, memory)",
    url: "https://www.youtube.com/results?search_query=class+6+computer+fundamentals+cpu+memory+explained",
  },
  "Input & Output Devices": {
    title: "Class 6 Computer — Input & Output devices",
    url: "https://www.youtube.com/results?search_query=class+6+computer+input+output+devices+explained",
  },
  "Introduction to Programming": {
    title: "Class 6 Programming — Algorithms & basics",
    url: "https://www.youtube.com/results?search_query=class+6+programming+algorithm+basics+for+kids",
  },
  "Internet & Safety": {
    title: "Class 6 Computer — Internet & safety (HTTPS)",
    url: "https://www.youtube.com/results?search_query=class+6+internet+safety+https+explained",
  },
  "Spreadsheets Basics": {
    title: "Class 6 Computer — Spreadsheets (cells, SUM)",
    url: "https://www.youtube.com/results?search_query=class+6+spreadsheet+cell+sum+function+tutorial",
  },
};

const STRATEGIES: Record<string, { tricks: string[]; practice: string[] }> = {
  "Number Systems": {
    tricks: [
      "Irrational = non-terminating, non-repeating decimal — √2, √3 never convert to p/q. Any √ of a non-square number is irrational.",
      "Natural numbers start at 1 (not 0); whole numbers start at 0; integers add negatives. Picture the sets as nested boxes.",
      "Compare big numbers digit-by-digit from the left; more digits = bigger number.",
    ],
    practice: [
      "Sort 8 given numbers (fractions, decimals, roots) from smallest to largest.",
      "Classify 10 numbers as rational / irrational with one-line reasons.",
      "Place numbers on a number line, including −3 to +3.",
    ],
  },
  "Algebraic Expressions": {
    tricks: [
      "Only 'like terms' combine — 3x + 5x = 8x, but 3x + 5y stays as is (same variable + same power).",
      "Exponent of a term = power on the variable only (7a⁵ → exponent is 5, not 12).",
      "Expand brackets by distributing: 2(x+3) = 2x + 6. Then collect like terms.",
    ],
    practice: [
      "Simplify 6 expressions by adding/subtracting like terms.",
      "Identify coefficient, variable and exponent in 8 given terms.",
      "Translate word statements (\"5 more than a number\") into expressions.",
    ],
  },
  "Linear Equations": {
    tricks: [
      "Isolate x: move numbers to the other side, flipping the sign (2x+6=14 → 2x=8 → x=4).",
      "Always check by substituting the answer back — LHS must equal RHS.",
      "One-step equations first (x+a=b), then two-step (ax+b=c). Balance like a scale.",
    ],
    practice: [
      "Solve 10 two-step equations and verify each answer.",
      "Word problems that convert directly to ax+b=c.",
      "Spot the error in 3 worked solutions (find the wrong step).",
    ],
  },
  "Geometry & Shapes": {
    tricks: [
      "Triangle interior angles always sum to 180° — mark the known two, subtract from 180.",
      "Angle types by size: acute <90°, right =90°, obtuse >90°, straight =180°. Draw and label before solving.",
      "Straight-line angles add to 180°; full-circle angles add to 360°.",
    ],
    practice: [
      "Find the missing angle in 8 figures (triangles, lines, crossed lines).",
      "Classify 10 angles and 6 quadrilaterals by properties.",
      "Draw a triangle with given two angles using a protractor.",
    ],
  },
  "Data Handling": {
    tricks: [
      "Mean = sum ÷ count; Median = middle after sorting (average the two middle if even count); Mode = most frequent.",
      "Always sort before median — skipping this is the #1 mistake.",
      "Range = largest − smallest. Read bar/pictograph graphs by counting units carefully.",
    ],
    practice: [
      "Find mean, median, mode for 6 small data sets.",
      "Read a bar graph and answer 5 questions (max, min, difference).",
      "Represent given data as a tally table + bar graph.",
    ],
  },
  Mensuration: {
    tricks: [
      "Perimeter of rectangle = 2×(l+b) — it's the boundary (add all sides), area = l×b (inside region).",
      "Square: perimeter = 4×side, area = side². Units: perimeter = cm, area = cm² — never mix.",
      "Draw the shape, write the formula, substitute, then unit — every single time.",
    ],
    practice: [
      "Find perimeter & area of 6 rectangles/squares with given dimensions.",
      "Two word problems: fencing (perimeter) vs tiling (area).",
      "Find missing side when perimeter/area is given.",
    ],
  },
  "Matter & Materials": {
    tricks: [
      "Solid = definite shape+volume; Liquid = definite volume, no shape; Gas = neither. Remember via 'particles packing' — tight → solid.",
      "State changes by heat: melt/evaporate (heat in), condense/freeze (heat out).",
      "Differentiate properties (hardness, transparency, conductivity) with daily examples.",
    ],
    practice: [
      "Classify 12 everyday substances into solid/liquid/gas with reason.",
      "Name the state change in 8 pictures (ice→water, etc.).",
      "Compare two materials for a given use (why plastic for a bucket?).",
    ],
  },
  "Force & Motion": {
    tricks: [
      "SI units: force = Newton (N), speed = m/s, distance = metre. Unit questions = pure recall — flashcard them.",
      "Newton's laws in one line each: (1) inertia — body stays as it is, (2) F=ma, (3) every action has equal opposite reaction.",
      "Balanced forces = no change in motion; unbalanced = speed or direction changes.",
    ],
    practice: [
      "Match 10 quantities to their SI units.",
      "Identify which of 8 statements matches Newton's 1st/2nd/3rd law.",
      "Calculate speed = distance ÷ time in 5 numericals.",
    ],
  },
  "Life Processes": {
    tricks: [
      "Function → organ/system mapping: pump = heart, breathe = lungs, food prep = stomach/intestine, think = brain.",
      "Plants: photosynthesis (make food, needs sunlight+CO₂+chlorophyll) vs respiration (release energy). stomata = gas exchange.",
      "Remember processes as sequences (digestion: mouth → oesophagus → stomach → small intestine → large intestine).",
    ],
    practice: [
      "Match organs to functions (10 pairs).",
      "Write the photosynthesis equation and label inputs/outputs.",
      "5 MCQs on nutrition modes (autotroph/heterotroph) and excretion.",
    ],
  },
  "Light & Sound": {
    tricks: [
      "Sound needs a medium — cannot travel through vacuum (space is silent). Light CAN travel through vacuum.",
      "Reflection: angle of incidence = angle of reflection; image in a plane mirror is virtual and laterally inverted.",
      "Light travels in straight lines (rectilinear propagation) — shadows form because of it.",
    ],
    practice: [
      "8 MCQs on mediums of sound transmission.",
      "Draw ray diagrams for reflection in a plane mirror (2 cases).",
      "Real-life applications: why hospitals use white boards, why elephants use infrasound.",
    ],
  },
  Environment: {
    tricks: [
      "Greenhouse gases = CO₂, methane, water vapour — NOT oxygen. Oxygen doesn't trap heat.",
      "Ozone (O₃) blocks UV; CFCs destroy ozone. Link cause → effect chains.",
      "Food chains: producer → primary consumer → secondary → decomposer. Arrows show energy flow direction.",
    ],
    practice: [
      "Arrange 4 food chains and identify producers/consumers.",
      "6 MCQs on greenhouse gases and ozone layer.",
      "Two short-answer: effects of deforestation, 3R rules (reduce reuse recycle).",
    ],
  },
  "Electricity Basics": {
    tricks: [
      "Unit ladder: Volt (potential), Ampere (current), Ohm (resistance), Watt (power). V-A-O-W order with mnemonic.",
      "Conductors (metals) vs insulators (plastic, wood, air) — sort by whether charges can move.",
      "Series = same current, add resistances; Parallel = same voltage across each.",
    ],
    practice: [
      "Match 8 quantities to units and instruments (ammeter/voltmeter).",
      "Classify 12 materials as conductor or insulator.",
      "Simple numericals: V=IR with one unknown (3 problems).",
    ],
  },
  "Grammar & Usage": {
    tricks: [
      "Tense timeline: past/present/future → continuous (-ing), perfect (has/had), perfect continuous. Fix the time word first.",
      "Adjective describes a noun — cover the word and ask 'which/what kind?'.",
      "Irregular verbs (go→went→gone) don't take -ed — maintain a personal list of 15 common ones.",
    ],
    practice: [
      "Fill 12 blanks with correct tense forms.",
      "Underline adjectives/adverbs in 8 sentences with reasons.",
      "Rewrite 6 sentences correcting one error each.",
    ],
  },
  Vocabulary: {
    tricks: [
      "Synonym = same meaning; think of the word in a sentence, then swap — meaning must survive.",
      "Antonym = opposite. Prefixes help: un-, in-, im-, dis- (happy→unhappy).",
      "Build word families: ancient → modern (opposite), ancient → old (synonym).",
    ],
    practice: [
      "10 synonym + 10 antonym MCQs under 3 minutes.",
      "Complete 6 analogy pairs (big:small :: fast:?).",
      "Use 5 new words in original sentences.",
    ],
  },
  "Reading Comprehension": {
    tricks: [
      "Read questions FIRST, then skim the passage for answer sentences — saves time.",
      "Answer only from the passage; never use outside knowledge. Underline the exact line.",
      "Story arc: beginning → rising action → climax (highest tension) → falling action → end.",
    ],
    practice: [
      "One passage with 5 detail + 2 inference questions (timed 10 min).",
      "Find the author's mood in 3 short extracts.",
      "Write a 2-line summary of a short story in your own words.",
    ],
  },
  Poetry: {
    tricks: [
      "Stanza = group of lines (like a paragraph in prose). Count lines to identify the form.",
      "Rhyme scheme: label each line's end sound (A, B, C…) — repeated sounds get the same letter.",
      "Figures of speech by look: simile uses like/as; metaphor says IS; personification gives human action.",
    ],
    practice: [
      "Identify rhyme scheme of 2 short poems.",
      "Name the figure of speech in 8 examples.",
      "Explain 2 lines in your own words (poetic meaning).",
    ],
  },
  "Writing Skills": {
    tricks: [
      "Formal letter layout: sender's address top-left, date, receiver's address, subject line, salutation (Sir/Madam), body in 3 parts, closing (Yours faithfully).",
      "Body = introduction (why writing) → details (facts/examples) → request/close. One idea per paragraph.",
      "Formal tone: no slang, no contractions (don't → do not).",
    ],
    practice: [
      "Draft a formal letter to the editor (100–120 words) with correct layout.",
      "Write 8 sentences of an essay on 'My School' with an opening + closing.",
      "Re-write 4 informal sentences in formal tone.",
    ],
  },
  Prose: {
    tricks: [
      "Simile = like/as comparison; Metaphor = direct 'is' comparison; Personification = human action to non-human; Alliteration = same starting sound.",
      "Cover the two compared things — if it says 'like', it's a simile.",
      "Read one line aloud: repeated opening sounds = alliteration.",
    ],
    practice: [
      "Name the device in 10 sentences.",
      "Convert 4 similes into metaphors (and back).",
      "Find 3 figures of speech in your current chapter.",
    ],
  },
  व्याकरण: {
    tricks: [
      "विभक्ति चिह्न याद रखें: का/के/की (द्वितीया-अनुकरण नहीं — संबंध), ने (षष्ठी), से (तृतीया/चतुर्थी), को (चतुर्थी), में (सप्तमी)।",
      "समास पहचानें: दो अर्थों के योग का विभाजन करो — तत्पुरुष (प्रथम पद प्रधान, जैसे राजपुत्र), कर्मधारय (द्वितीय पद प्रधान, जैसे नीलकमल)।",
      "समानार्थी/विलोम शब्द जोड़े में याद करें — परीक्षा में सीधे पूछे जाते हैं।",
    ],
    practice: [
      "5 वाक्यों में सही विभक्ति चुनें।",
      "10 शब्दों के समानार्थी व विलोम लिखें।",
      "4 शब्दों में समास-विभाजन करें।",
    ],
  },
  गद्य: {
    tricks: [
      "गद्य = वह रचना जो वाक्यों में लिखी जाती है (निबंध, कहानी, यात्रा-वृत्तांत) — कविता नहीं।",
      "प्रश्न का उत्तर केवल दिए गए गद्यांश में ढूँढ़ो — बाहर की जानकारी मत जोड़ो।",
      "मुख्य भाव/शीर्षक निकालने के लिए पहला व अंतिम वाक्य विशेष ध्यान से पढ़ो।",
    ],
    practice: [
      "एक गद्यांश पढ़कर 5 प्रश्नों के उत्तर लिखें (समय सीमा 10 मिनट)।",
      "दिए गए वाक्यों में से उचित शीर्षक चुनें (6 प्रश्न)।",
      "कथन का सार 2 वाक्यों में लिखें।",
    ],
  },
  पद्य: {
    tricks: [
      "अलंकार पहचानें: उपमा (लक्षण+उपमान में 'सा/जैसे'), अनुप्रास (आरंभ में एक ही ध्वनि), यमक (शब्द का पुनरुक्तार्थ)।",
      "तुकांत = पंक्ति के अंत में एक जैसी ध्वनि (rhyme)।",
      "अलंकार का उदाहरण ढूँढ़ते समय लक्षण और उपमान दोनों को अंडरलाइन करो।",
    ],
    practice: [
      "6 उदाहरणों में अलंकार का नाम लिखें।",
      "2 कविताओं की पंक्तियों का भाव स्पष्ट करें।",
      "तुकांत वाली पंक्तियाँ पहचानें (4 कविताओं से)।",
    ],
  },
  "रचनात्मक लेखन": {
    tricks: [
      "औपचारिक पत्र: प्रेषक का पता बाएँ ऊपर, फिर तिथि, फिर प्राप्तकर्ता का पता, विषय पंक्ति, संबोधन (महोदय/महोदया), 3 भाग में मुख्य विषय, अंत में भवदीय/भवदीया।",
      "विषय पंक्ति सदैव संक्षिप्त व स्पष्ट रखें।",
      "निबंध की रूपरेखा: भूमिका → विस्तार (2–3 अनुच्छेद) → निष्कर्ष।",
    ],
    practice: [
      "औपचारिक पत्र लिखें (प्रारूप सहित, 100–120 शब्द)।",
      "अनौपचारिक संदेश को औपचारिक में बदलें (4 वाक्य)।",
      "'मेरा विद्यालय' विषय पर 5 वाक्यों का अनुच्छेद।",
    ],
  },
  "अपठित गद्यांश": {
    tricks: [
      "पहले प्रश्न पढ़ो, फिर गद्यांश स्किम करो — उत्तर वहीं मिलेगा, बाहर की जानकारी नहीं।",
      "अपठित = 'नया/अनदेखा' — इसलिए केवल दिए गए पाठ के आधार पर ही उत्तर दो।",
      "शीर्षक चुनते समय पूरे गद्यांश का मुख्य भाव देखो, न कि किसी एक वाक्य को।",
    ],
    practice: [
      "2 गद्यांशों पर 4–4 प्रश्नों के उत्तर लिखें (10 मिनट)।",
      "दिए गए 4 शीर्षकों में से उचित चुनें।",
      "गद्यांश का सार 1 वाक्य में लिखें।",
    ],
  },
  "History – Ancient India": {
    tricks: [
      "Timeline पक्का करो: Indus Valley (≈3300 BCE) → Vedic → Mahajanapadas → Buddha/Mahavira → Mauryas.",
      "लोकेशन + व्यक्ति जोड़कर याद करो: सिंधु नदी → हड़प्पा; बुद्ध → बोधगया; अशोक → कौसल (पाटलिपुत्र)।",
      "स्रोत-आधारित प्रश्न: मुद्रा/सील, वेद, शिलालेख — कौन-सा स्रोत किस जानकारी देता है।",
    ],
    practice: [
      "5 शासक–राजधानी–वंश के मैच करें।",
      "समयरेखा पर 8 घटनाएँ सही क्रम में लगाएँ।",
      "हड़प्पा सभ्यता की 5 विशेषताएँ लिखें।",
    ],
  },
  "History – Medieval India": {
    tricks: [
      "Delhi Sultanate वंश क्रम: Mamluk (Qutbuddin Aibak) → Khilji → Tughlaq → Sayyid → Lodi → Mughal.",
      "'पहला' प्रश्न बार-बार आते हैं: पहला सुल्तान = कुतबुद्दीन ऐबक, पहला मुग़ल = बाबर।",
      "क्रूर/सुधारक शासक के कार्य जोड़कर याद करो (अलाउद्दीन खिलजी = मूल्य नियंत्रण, शेरशाह = सड़क/रुपया)।",
    ],
    practice: [
      "सुल्तान–वंश के 8 मैच करें।",
      "क्रमबद्ध करें: 6 शासकों को सही कालक्रम में लगाएँ।",
      "2 लघु उत्तर: बाबर की विशेषता, शेरशाह के सुधार।",
    ],
  },
  "Geography – Our Earth": {
    tricks: [
      "रेखाएँ याद रखो: Equator (0°, उत्तर-दक्षिण विभाजक), Prime Meridian (0°, पूर्व-पश्चिम), Tropic of Cancer 23.5°N (भारत से गुज़रती है)।",
      "महासागर आकार क्रम: Pacific > Atlantic > Indian > Arctic (P-A-I-A)।",
      "घटना ↔ स्थान जोड़ो: हिमालय = वलियाँ, गंगा = अवसादी मैदान, थार = मरुस्थल।",
    ],
    practice: [
      "8 नक़्शा प्रश्न: महासागर, अक्षांश/देशांतर, मुख्य भू-भाग पहचानें।",
      "मैच करें: 6 नदियाँ → सहायक नदियाँ।",
      "घटना का कारण बताइए (2 लघु उत्तर)।",
    ],
  },
  "Civics – Democracy": {
    tricks: [
      "लोकतंत्र का अर्थ = सत्ता जनता के पास; चुनाव = प्रतिनिधि चुनने का माध्यम।",
      "तिथि-आधारित तथ्य: संविधान अंगीकृत = 26 नवंबर 1949 (लागू 26 जनवरी 1950), स्वतंत्रता = 15 अगस्त 1947।",
      "संस्थाएँ: संसद (कानून), सरकार (नीति), न्यायपालिका (न्याय) — कौन क्या करता है।",
    ],
    practice: [
      "6 तथ्यपरक प्रश्न (तिथियाँ, अनुच्छेद)।",
      "मैच: संस्था → कार्य (5 जोड़े)।",
      "लोकतंत्र के 2 गुण व 2 सीमाएँ लिखें।",
    ],
  },
  "Economics Basics": {
    tricks: [
      "Inflation = कीमतों का सामान्य स्तर बढ़ना (माँग बढ़ी/आपूर्ति घटी)। कमी के विपरीत याद रखो।",
      "Goods: consumer (उपयोग) vs producer (उत्पादन); free goods (हवा) vs economic goods (पानी/कोयला)।",
      "बजट, कर, मुद्रा — रोज़मर्रा के उदाहरणों से जोड़कर समझो।",
    ],
    practice: [
      "8 MCQs: मुद्रास्फीति, वस्तुएँ, कर।",
      "2 स्थितियों में सही शब्द चुनें (चुनौती/अवसर)।",
      "5 शब्दों के अर्थ लिखें।",
    ],
  },
  "Computer Fundamentals": {
    tricks: [
      "CPU = Central Processing Unit (मस्तिष्क); ROM = non-volatile (बंद करो भी तो डेटा रहता है), RAM = volatile (बिजली जाते ही खाली)।",
      "Hardware (भौतिक: कीबोर्ड, मॉनिटर) vs Software (कार्यक्रम: OS, browser) — हाथ से छू सकते हो = hardware।",
      "Memory ladder: bit → byte → KB → MB → GB → TB (×1024)।",
    ],
    practice: [
      "10 MCQs: full forms, memory, units।",
      "मैच करें: 6 उपकरण → उनकी श्रेणी।",
      "RAM vs ROM की 3 भिन्नताएँ लिखें।",
    ],
  },
  "Input & Output Devices": {
    tricks: [
      "Input = डेटा जाता है अंदर (keyboard, mouse, scanner, mic); Output = बाहर आता है (monitor, printer, speaker)।",
      "Storage: input नहीं output नहीं — अलग श्रेणी है (HDD, pen drive)।",
      "Auxiliary: pointing devices (mouse, joystick, trackball)।",
    ],
    practice: [
      "12 उपकरणों को input/output/storage में वर्गीकृत करें।",
      "5 MCQs: उदाहरण से नाम पहचानें।",
      "1 संक्षिप्त प्रश्न: output क्यों ज़रूरी है।",
    ],
  },
  "Introduction to Programming": {
    tricks: [
      "Algorithm = चरण-दर-चरण निर्देश (व्यंजका नहीं — भाषा ज़रूरी नहीं); program = कंप्यूटर भाषा में लिखा गया।",
      "Python: # = single-line comment, // नहीं; indentation = block।",
      "Flow: input → process → output → storage (IPOS)।",
    ],
    practice: [
      "दिए कार्य के लिए 5-चरण का algorithm लिखें (चाय बनाना)।",
      "8 MCQs: full forms, comment symbols, flow।",
      "2 वाक्यों में compiler vs interpreter का अंतर।",
    ],
  },
  "Internet & Safety": {
    tricks: [
      "HTTPS = encrypted/secure (S = Secure); HTTP में नहीं। URL में S देखो।",
      "Phishing = नकली लिंक से चोरी; strong password = लंबा + अक्षर/अंक/चिह्न मिश्रित।",
      "Safe browsing: personal detail कभी शेयर नहीं, unknown attachment नहीं खोलना।",
    ],
    practice: [
      "6 MCQs: HTTPS, phishing, password safety।",
      "4 सुरक्षित/असुरक्षित स्थितियाँ चुनें।",
      "1 संक्षिप्त उत्तर: सार्वजनिक Wi-Fi पर सावधानी।",
    ],
  },
  "Spreadsheets Basics": {
    tricks: [
      "Cell = row + column का चौकोन (B5 = दूसरी column, पाँचवीं row)।",
      "=SUM(A1:A5) लिखते समय ध्यान: colon (:) = range, comma (,) = अलग-अलग cells।",
      "Formula हमेशा = से शुरू; text कोशिका में नंबर नहीं जोड़ता।",
    ],
    practice: [
      "6 MCQs: cell address, functions (SUM/COUNT/SORT)।",
      "दिए 5 अंकों का औसत व योग formula से लिखें।",
      "B3–D3 range पहचानने वाले 4 प्रश्न।",
    ],
  },
};

const SUBJECT_FALLBACK: Record<string, { tricks: string[]; practice: string[] }> = {
  Mathematics: {
    tricks: [
      "Formula लिखो → substitute → unit लिखो — हर numerical में यही 3-step।",
      "कठिन प्रश्न को छोटे भागों में तोड़ो और एक समय में एक ही चरण करो।",
      "गलतियों का एक नोटबुक रखो — एक ही तरह की गलती दोबारा नहीं होगी।",
    ],
    practice: [
      "रोज़ 10 मिश्रित प्रश्न (पिछले अध्याय + नया)।",
      "पिछले पेपर की गलतियाँ दोबारा हल करें।",
      "एक अभ्यास क्विज़ लें और स्कोर सुधारें।",
    ],
  },
  Science: {
    tricks: [
      "अवधारणा → उदाहरण → समीकरण/रेखाचित्र — परीक्षा में उदाहरण से अंक मिलते हैं।",
      "यूनिट व सूत्र अलग रंग से याद करो; रटने से पहले क्यों समझो।",
      "रोज़ 10 मिनट पिछले अध्याय दोहराओ — विज्ञान में भुलावा सबसे बड़ी समस्या।",
    ],
    practice: [
      "10 MCQs रोज़ (पिछला + नया)।",
      "रेखाचित्र 2 बार खुद बनाकर लेबल करें।",
      "प्रयोग/सूत्र के 5 लघु उत्तर लिखें।",
    ],
  },
  English: {
    tricks: [
      "नियम पहले, फिर उदाहरण — गलती का कारण लिखो तो याद रहेगा।",
      "रोज़ 10 नए शब्द: अर्थ + वाक्य के साथ।",
      "लेखन में प्रारूप (format) पहले, भाषा बाद में।",
    ],
    practice: [
      "10 व्याकरण MCQs रोज़।",
      "5 शब्दों के वाक्य बनाएँ।",
      "सप्ताह में 1 लेखन (पत्र/निबंध)।",
    ],
  },
  "Social Science": {
    tricks: [
      "तिथि-स्थान-व्यक्ति त्रिकोण जोड़कर याद करो; नक़्शे पर अभ्यास करो।",
      "क्रम (timeline) बनाओ — कालक्रम से प्रश्न आसान हो जाते हैं।",
      "रोज़ 5 तथ्य दोहराओ, सप्ताह में एक बार पूरा अध्याय।",
    ],
    practice: [
      "8 मैच-प्रश्न रोज़।",
      "नक़्शा कार्य: 4 स्थान चिह्नित करें।",
      "2 लघु उत्तर लिखें (कारण-परिणाम)।",
    ],
  },
  "Computer Science": {
    tricks: [
      "Full form + कार्य जोड़कर याद करो — सिर्फ नाम नहीं।",
      "कीवर्ड/संकेतक (#, =) अलग से लिखो; अभ्यास ही कुंजी है।",
      "स्क्रीन पर खुद करके देखो — तकनीक अभ्यास से सीखो।",
    ],
    practice: [
      "10 MCQs: full forms, units, devices।",
      "1 spreadsheet formula लिखकर जाँचें।",
      "5-चरण का algorithm लिखें।",
    ],
  },
};

const GENERIC = {
  tricks: [
    "गलती वाले प्रश्न का भाग 1 याद करो — कौन-सा कदम गलत हुआ, वहीं से सुधारो।",
    "एक ही तरह के 5 प्रश्न लगातार हल करो — pattern अपने आप समझ आएगा।",
    "रोज़ 15 मिनट इसी अध्याय को दो; 1 हफ़्ते में अंतर दिखेगा।",
  ],
  practice: [
    "अध्याय के 10 MCQs, समय सीमा के साथ।",
    "पिछली क्विज़ के गलत प्रश्न दोबारा हल करें।",
    "टीचर से 2 डाउट पूछकर फिर अभ्यास क्विज़ लें।",
  ],
};

function searchVideo(subject: string, chapter: string) {
  return {
    title: `Watch: ${subject} — ${chapter} explained (video lessons)`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${subject} ${chapter} class 6 explained`
    )}`,
  };
}

export function improveFor(subject: string, chapter: string): ImprovePlan {
  const strategy =
    STRATEGIES[chapter] ?? SUBJECT_FALLBACK[subject] ?? GENERIC;
  return {
    tricks: strategy.tricks,
    practice: strategy.practice,
    video: VIDEOS[chapter] ?? searchVideo(subject, chapter),
  };
}
