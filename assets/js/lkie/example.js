/* lkie.like's finished example: a whole Year 6 (Cambridge Stage 6) maths pack on circles, written and checked by hand
   to the standard of the Chalkie reference deck: Starter, Main and Plenary, an exact drawing on every maths slide,
   worked examples one step at a time, every question followed by its answer, and real Malaysian examples. It shows
   what a pack looks like before anyone makes one, and opens instantly (no engine call). */
export default {
 "input": {
  "year": "Year 6",
  "subject": "maths",
  "subjectName": "Maths",
  "topic": "Circles: radius, diameter and circumference",
  "minutes": 45,
  "mode": "online",
  "codes": [
   "6Gg.02",
   "6Gg.11"
  ]
 },
 "title": "Circles: radius, diameter and circumference",
 "objective": "To know the parts of a circle and use the fact that the diameter is twice the radius.",
 "successCriteria": [
  "I can name the centre, radius, diameter and circumference.",
  "I can find the diameter from the radius, and the radius from the diameter.",
  "I can draw a circle with a given radius."
 ],
 "bigQuestion": "Why is the diameter of every circle exactly twice its radius?",
 "codes": [
  "6Gg.02",
  "6Gg.11"
 ],
 "vocab": [
  {
   "word": "centre",
   "meaning": "The point in the middle, the same distance from every point on the edge.",
   "example": "The compass point stays on the centre."
  },
  {
   "word": "radius",
   "meaning": "A straight line from the centre to the edge. Plural: radii.",
   "example": "The radius of the roti canai is 11 cm."
  },
  {
   "word": "diameter",
   "meaning": "A straight line from edge to edge that goes through the centre.",
   "example": "The diameter is twice the radius."
  },
  {
   "word": "circumference",
   "meaning": "The distance all the way round a circle.",
   "example": "We wrapped a string round the kompang to find its circumference."
  }
 ],
 "slides": [
  {
   "layout": "title",
   "phase": "starter",
   "title": "Circles: radius, diameter and circumference",
   "say": "Today we become circle experts. By the end you will name every part of a circle and work out a diameter or a radius in seconds.",
   "visual": "The Eye on Malaysia Ferris wheel lit up at night.",
   "media": {
    "wiki": "Eye on Malaysia",
    "image": "",
    "video": "how to draw a circle with a compass for kids"
   },
   "respond": "none",
   "minutes": 1
  },
  {
   "layout": "goals",
   "phase": "starter",
   "title": "Learning goals",
   "goals": [
    {
     "verb": "Identify",
     "text": "the centre, radius, diameter and circumference of any circle."
    },
    {
     "verb": "Calculate",
     "text": "the diameter from the radius, and the radius from the diameter."
    },
    {
     "verb": "Draw",
     "text": "a circle with a given radius, using compasses."
    }
   ],
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "radius",
     "diameter"
    ]
   },
   "say": "Read the three goals with me. We will tick them off as we go.",
   "visual": "A circle with its centre, a radius and a diameter.",
   "respond": "none",
   "minutes": 1
  },
  {
   "layout": "recap",
   "phase": "starter",
   "title": "Quick recap: doubling and halving",
   "questions": [
    {
     "q": "Double 7",
     "a": "14"
    },
    {
     "q": "Half of 18",
     "a": "9"
    },
    {
     "q": "Double 4.5",
     "a": "9"
    },
    {
     "q": "Half of 25",
     "a": "12.5"
    }
   ],
   "say": "Circles need quick doubling and halving. Type your answers in the chat.",
   "visual": "Four quick questions.",
   "respond": "chat",
   "minutes": 3
  },
  {
   "layout": "think",
   "phase": "starter",
   "title": "Spot the circles",
   "prompt": "Look at this kompang. Where can you see circles? Why do you think drums, wheels and plates are round?",
   "reveal": [
    "The drum skin, the frame and the rim are all circles.",
    "Wheels are round so they roll smoothly.",
    "A circle is the same distance across, through its centre, in every direction."
   ],
   "say": "Give pupils 30 seconds to talk, then take two or three ideas before you show the answers.",
   "visual": "A kompang drum.",
   "media": {
    "wiki": "Kompang",
    "image": "kompang drum",
    "video": ""
   },
   "respond": "talk",
   "minutes": 2
  },
  {
   "layout": "think",
   "phase": "starter",
   "title": "What is a circle?",
   "prompt": "Aisyah stands in the middle of the school field holding one end of a 2-metre rope. Wei Jie holds the other end tight and walks all the way round her. What shape does his path make?",
   "reveal": [
    "A circle!",
    "Every point of his path is exactly 2 metres from Aisyah.",
    "Aisyah is the centre. The rope is the radius."
   ],
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "radius"
    ],
    "radius": "2 m"
   },
   "say": "Act it out with a skipping rope if you are in class. Online, draw it as they describe it.",
   "visual": "A circle with its centre and a 2 m radius.",
   "respond": "talk",
   "minutes": 2
  },
  {
   "layout": "vocab",
   "phase": "main",
   "title": "Key words",
   "words": [
    "centre",
    "radius",
    "diameter",
    "circumference"
   ],
   "diagrams": [
    {
     "type": "circle",
     "parts": [
      "centre"
     ],
     "highlight": "centre"
    },
    {
     "type": "circle",
     "parts": [
      "centre",
      "radius"
     ],
     "highlight": "radius"
    },
    {
     "type": "circle",
     "parts": [
      "centre",
      "diameter"
     ],
     "highlight": "diameter"
    },
    {
     "type": "circle",
     "parts": [
      "circumference"
     ],
     "highlight": "circumference"
    }
   ],
   "say": "Say each word with me. Point to each part in the air with your finger.",
   "visual": "Four circles, each showing one part.",
   "respond": "none",
   "minutes": 3
  },
  {
   "layout": "concept",
   "phase": "main",
   "title": "The radius",
   "points": [
    "A radius goes from the centre to the edge.",
    "Every radius of a circle is the same length.",
    "We write r for radius."
   ],
   "definition": "Radius (r): the distance from the centre to the edge of a circle.",
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "radius"
    ],
    "radii": 4,
    "radius": "5 cm"
   },
   "say": "However many radii we draw, they are all 5 cm. That is what makes it a circle.",
   "visual": "A circle with four equal radii.",
   "respond": "react",
   "minutes": 2
  },
  {
   "layout": "concept",
   "phase": "main",
   "title": "The diameter",
   "points": [
    "A diameter goes from edge to edge.",
    "It must pass through the centre.",
    "We write d for diameter."
   ],
   "mistake": "A line across a circle is not a diameter unless it passes through the centre. The line below the centre is called a chord.",
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "diameter",
     "chord"
    ],
    "diameter": "10 cm",
    "highlight": "diameter"
   },
   "say": "Show me with your arms: a diameter through the middle of your body, edge to edge.",
   "visual": "A circle with a diameter through the centre and a chord below it.",
   "respond": "react",
   "minutes": 2
  },
  {
   "layout": "rule",
   "phase": "main",
   "title": "Diameter and radius",
   "rule": "d = 2 × r",
   "cards": [
    {
     "big": "d",
     "name": "Diameter",
     "text": "Double the radius: d = 2 × r"
    },
    {
     "big": "r",
     "name": "Radius",
     "text": "Half the diameter: r = d ÷ 2"
    }
   ],
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "radius",
     "diameter"
    ],
    "radius": "6 cm",
    "diameter": "12 cm"
   },
   "say": "Two radii side by side make one diameter. So we double to find the diameter and halve to find the radius.",
   "visual": "A circle with a 6 cm radius and a 12 cm diameter.",
   "respond": "react",
   "minutes": 2
  },
  {
   "layout": "guided",
   "phase": "main",
   "title": "Finding the diameter",
   "problem": "A roti canai has a radius of 11 cm. What is its diameter?",
   "steps": [
    {
     "math": "d = 2 × r",
     "text": "Write the rule that links diameter and radius."
    },
    {
     "math": "d = 2 × 11",
     "text": "Put in the radius."
    },
    {
     "math": "d = 22 cm",
     "text": "Work it out and write the units."
    }
   ],
   "answer": "The diameter is 22 cm.",
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "radius",
     "diameter"
    ],
    "radius": "11 cm",
    "diameter": "?",
    "highlight": "diameter"
   },
   "say": "I do this one. Watch each step, then you do the next one.",
   "visual": "A circle with an 11 cm radius and the diameter marked with a question mark.",
   "respond": "show",
   "minutes": 3
  },
  {
   "layout": "try",
   "phase": "main",
   "title": "Quick calculation",
   "question": "The ceiling fan in our classroom is 120 cm across, measured through the centre. How long is one blade, from the centre to the tip?",
   "answer": "60 cm",
   "working": "120 cm is the diameter, so r = d ÷ 2 = 120 ÷ 2 = 60 cm.",
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "radius",
     "diameter"
    ],
    "diameter": "120 cm",
    "radius": "?",
    "highlight": "radius"
   },
   "say": "We do this one together. Is 120 cm the radius or the diameter? How do you know?",
   "visual": "A circle with a 120 cm diameter and the radius marked with a question mark.",
   "respond": "show",
   "minutes": 2
  },
  {
   "layout": "guided",
   "phase": "main",
   "title": "Finding the radius",
   "problem": "Mei Ling's kompang is 35 cm across, through the centre. What is its radius?",
   "steps": [
    {
     "math": "r = d ÷ 2",
     "text": "Write the rule for the radius."
    },
    {
     "math": "r = 35 ÷ 2",
     "text": "Put in the diameter."
    },
    {
     "math": "r = 17.5 cm",
     "text": "Half of 35 is 17 and a half."
    }
   ],
   "answer": "The radius is 17.5 cm.",
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "radius",
     "diameter"
    ],
    "diameter": "35 cm",
    "radius": "?",
    "highlight": "radius"
   },
   "say": "An odd diameter gives a radius with a half. That is fine: 17.5 cm.",
   "visual": "A circle with a 35 cm diameter.",
   "respond": "show",
   "minutes": 2
  },
  {
   "layout": "gallery",
   "phase": "main",
   "title": "Circles all around us",
   "intro": "In every circle, the diameter is double the radius.",
   "items": [
    {
     "name": "CD",
     "lines": [
      "Diameter: 12 cm",
      "Radius: 6 cm"
     ],
     "wiki": "Compact disc",
     "image": "compact disc"
    },
    {
     "name": "Roti canai",
     "lines": [
      "Diameter: about 22 cm",
      "Radius: about 11 cm"
     ],
     "wiki": "Roti canai",
     "image": ""
    },
    {
     "name": "Bicycle wheel",
     "lines": [
      "Diameter: about 66 cm",
      "Radius: about 33 cm"
     ],
     "wiki": "Bicycle wheel",
     "image": ""
    }
   ],
   "say": "Which of these have you seen today? Each diameter is double its radius.",
   "visual": "A CD, a roti canai and a bicycle wheel.",
   "respond": "talk",
   "minutes": 2
  },
  {
   "layout": "concept",
   "phase": "main",
   "title": "The circumference",
   "points": [
    "The circumference is the distance all the way round.",
    "It is the perimeter of a circle.",
    "We measure it in cm or m."
   ],
   "example": "Wrap a string round a kompang, then measure the string: that length is its circumference.",
   "definition": "Circumference: the distance all the way round a circle.",
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "circumference"
    ],
    "highlight": "circumference"
   },
   "say": "Trace the circumference in the air with your finger: all the way round, back to the start.",
   "visual": "A circle with its circumference highlighted.",
   "respond": "react",
   "minutes": 2
  },
  {
   "layout": "match",
   "phase": "main",
   "title": "Match the circle words",
   "pairs": [
    {
     "term": "Centre",
     "meaning": "The point in the middle of a circle"
    },
    {
     "term": "Radius",
     "meaning": "From the centre to the edge"
    },
    {
     "term": "Diameter",
     "meaning": "From edge to edge, through the centre"
    },
    {
     "term": "Circumference",
     "meaning": "The distance all the way round"
    }
   ],
   "say": "Type each word with its letter, for example: Radius B.",
   "visual": "Four words and four meanings.",
   "respond": "chat",
   "minutes": 2
  },
  {
   "layout": "check",
   "phase": "main",
   "title": "Hinge question",
   "question": "A circle has a diameter of 16 cm. What is its radius?",
   "options": [
    "32 cm",
    "8 cm",
    "16 cm",
    "4 cm"
   ],
   "answer": 1,
   "why": "The radius is half the diameter: 16 ÷ 2 = 8 cm. 32 cm doubles instead of halving, 16 cm mixes up radius and diameter, and 4 cm halves twice.",
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "radius",
     "diameter"
    ],
    "diameter": "16 cm",
    "radius": "?"
   },
   "say": "Vote with A, B, C or D. If many choose A, go back to the rule card.",
   "visual": "A circle with a 16 cm diameter.",
   "respond": "vote",
   "minutes": 2
  },
  {
   "layout": "concept",
   "phase": "main",
   "title": "Drawing a circle",
   "points": [
    "Open the compasses to the radius on a ruler.",
    "Put the point on the centre and keep it still.",
    "Turn the pencil all the way round."
   ],
   "mistake": "Opening the compasses to the diameter makes a circle twice as big. Always use the radius.",
   "diagram": {
    "type": "circle",
    "parts": [
     "centre",
     "radius"
    ],
    "radius": "4 cm"
   },
   "say": "Model it on the visualiser: draw a circle with a radius of 4 cm, then pupils draw one with a radius of 3 cm.",
   "visual": "A circle drawn with a 4 cm radius.",
   "respond": "show",
   "minutes": 2
  },
  {
   "layout": "independent",
   "phase": "main",
   "title": "Your turn",
   "support": [
    "A circle has a radius of 4 cm. What is its diameter?",
    "A circle has a diameter of 10 cm. What is its radius?"
   ],
   "core": [
    "A plate has a radius of 13 cm. What is its diameter?",
    "A clock face is 30 cm across. What is its radius?",
    "Priya says: radius 12 cm, so the diameter is 6 cm. What is her mistake?"
   ],
   "stretch": [
    "Three equal circles fit exactly side by side in a rectangle 24 cm long. What is the radius of each circle?",
    "A circle fits exactly inside a square with sides of 14 cm. What are its diameter and radius?"
   ],
   "answers": "Support: 8 cm; 5 cm. Core: 26 cm; 15 cm; Priya halved instead of doubling, so the diameter is 24 cm. Stretch: each diameter is 24 ÷ 3 = 8 cm, so each radius is 4 cm; diameter 14 cm, radius 7 cm.",
   "diagram": {
    "type": "shape",
    "shape": "rectangle",
    "w": 24,
    "h": 8,
    "circles": 3,
    "labels": {
     "w": "24 cm",
     "h": "?"
    }
   },
   "say": "Choose your level. Hold your work up to the camera when you finish.",
   "visual": "Three circles in a row inside a 24 cm rectangle.",
   "respond": "show",
   "minutes": 6
  },
  {
   "layout": "talk",
   "phase": "main",
   "title": "Talk to a partner",
   "prompt": "Arjun says a circle has only one diameter. Is he right?",
   "starter": "I think Arjun is right/wrong because …",
   "say": "Listen for: a circle has endless diameters, all the same length.",
   "visual": "",
   "respond": "talk",
   "minutes": 1
  },
  {
   "layout": "plenary",
   "phase": "plenary",
   "title": "Key rules",
   "points": [
    "The radius goes from the centre to the edge.",
    "The diameter goes edge to edge through the centre: d = 2 × r.",
    "The radius is half the diameter: r = d ÷ 2.",
    "The circumference is the distance all the way round."
   ],
   "prompt": "Which word was hardest to remember, and how will you remember it?",
   "say": "Read the four rules together, then pupils answer the question with a partner.",
   "visual": "",
   "respond": "react",
   "minutes": 1
  },
  {
   "layout": "truefalse",
   "phase": "plenary",
   "title": "Exit check",
   "statement": "If you double the radius of a circle, its diameter also doubles.",
   "answer": true,
   "why": "d = 2 × r, so a radius twice as long gives a diameter twice as long. A radius of 3 cm gives a diameter of 6 cm; a radius of 6 cm gives 12 cm.",
   "say": "Vote true or false, then ask one pupil to explain with numbers.",
   "visual": "",
   "respond": "vote",
   "minutes": 1
  },
  {
   "layout": "exit",
   "phase": "plenary",
   "title": "Exit ticket",
   "questions": [
    {
     "q": "A circle has a radius of 7 cm. What is its diameter?",
     "a": "14 cm"
    },
    {
     "q": "A circle has a diameter of 30 cm. What is its radius?",
     "a": "15 cm"
    },
    {
     "q": "What is the distance all the way round a circle called?",
     "a": "The circumference"
    }
   ],
   "say": "Type your three answers in the chat before you leave.",
   "visual": "",
   "respond": "chat",
   "minutes": 1
  }
 ],
 "activities": [
  {
   "name": "Circle hunt",
   "minutes": 10,
   "grouping": "pairs",
   "steps": [
    "Find three circles in the classroom or at home.",
    "Measure each diameter with a ruler, through the centre.",
    "Work out each radius by halving.",
    "Share your best find with the class."
   ],
   "resources": "Rulers, a tape measure, mini whiteboards"
  },
  {
   "name": "Compass circles",
   "minutes": 8,
   "grouping": "individual",
   "steps": [
    "Draw a circle with a radius of 3 cm.",
    "Draw one with a diameter of 10 cm (set the compasses to 5 cm).",
    "Label the centre, a radius and a diameter on each.",
    "Check a partner's circles with a ruler."
   ],
   "resources": "Compasses, rulers, sharp pencils"
  }
 ],
 "teacher": {
  "overview": "Pupils learn the parts of a circle (centre, radius, diameter and circumference) and use the fact that the diameter is twice the radius. They find diameters and radii in real objects and draw circles with compasses.",
  "misconceptions": [
   "Mixing up the radius and the diameter.",
   "Thinking any line across a circle is a diameter, even when it misses the centre.",
   "Halving when they should double, or the other way round.",
   "Opening the compasses to the diameter instead of the radius."
  ],
  "support": "Give a printed circle with the centre marked and labels to stick on. Use whole-number radii only.",
  "stretch": "Circles inside rectangles and squares: three equal circles in a row, or one circle inside a square.",
  "assessment": "Listen for pupils using radius and diameter correctly and explaining why the diameter is double the radius. If many choose A or C in the hinge question, return to the rule card before the independent task.",
  "briefing": "This lesson is about naming the parts of a circle and using one big idea: the diameter is twice the radius. Start with the quick doubling and halving recap, because pupils will need both in every calculation. The kompang and the rope puzzle build the idea that a circle is every point the same distance from the centre, so take your time on the rope: the rope is the radius and Aisyah is the centre. When you teach the diameter, make a big deal of the centre: the most common mistake is calling any line across a circle a diameter. The rule card is the heart of the lesson. Two radii side by side make a diameter, so we double to find the diameter and halve to find the radius. Model the roti canai example step by step, then let pupils lead the ceiling fan question with you. Watch the hinge question closely. If pupils pick 32 cm, they doubled instead of halving; if they pick 16 cm, they have mixed up the two words. Before the independent task, model drawing a circle with compasses, and remind them to open the compasses to the radius. Finish with the true or false check: pupils should explain it with numbers, not just a guess."
 },
 "worksheet": {
  "title": "Circles: radius and diameter",
  "instructions": "Show your working. Remember: diameter = 2 × radius.",
  "scaffolded": [
   {
    "type": "fill",
    "text": "The ___ goes from the centre to the edge of a circle.",
    "answers": [
     "radius"
    ],
    "bank": [
     "radius",
     "diameter",
     "centre"
    ],
    "skill": "recall",
    "marks": 1
   },
   {
    "type": "mcq",
    "q": "Which line goes from edge to edge through the centre?",
    "options": [
     "radius",
     "diameter",
     "circumference",
     "centre"
    ],
    "answer": 1,
    "why": "The diameter crosses the whole circle through the centre.",
    "skill": "recall",
    "marks": 1
   },
   {
    "type": "short",
    "q": "A circle has a radius of 3 cm. What is its diameter?",
    "answer": "6 cm",
    "hint": "Double the radius.",
    "skill": "apply",
    "marks": 1
   },
   {
    "type": "short",
    "q": "A circle has a diameter of 8 cm. What is its radius?",
    "answer": "4 cm",
    "hint": "Halve the diameter.",
    "skill": "apply",
    "marks": 1
   },
   {
    "type": "truefalse",
    "statement": "Every radius of a circle is the same length.",
    "answer": true,
    "because": "Every point on the edge is the same distance from the centre.",
    "skill": "reason",
    "marks": 1
   },
   {
    "type": "match",
    "q": "Match each word to its meaning.",
    "pairs": [
     [
      "centre",
      "the middle point"
     ],
     [
      "radius",
      "centre to edge"
     ],
     [
      "diameter",
      "edge to edge through the centre"
     ],
     [
      "circumference",
      "the distance all the way round"
     ]
    ],
    "skill": "recall",
    "marks": 1
   }
  ],
  "standard": [
   {
    "type": "short",
    "q": "A circle has a radius of 9 cm. What is its diameter?",
    "answer": "18 cm",
    "skill": "apply",
    "marks": 1
   },
   {
    "type": "short",
    "q": "A bicycle wheel has a diameter of 64 cm. What is its radius?",
    "answer": "32 cm",
    "skill": "apply",
    "marks": 1
   },
   {
    "type": "mcq",
    "q": "A plate has a diameter of 26 cm. What is its radius?",
    "options": [
     "52 cm",
     "13 cm",
     "26 cm",
     "6.5 cm"
    ],
    "answer": 1,
    "why": "Halve the diameter: 26 ÷ 2 = 13 cm.",
    "skill": "apply",
    "marks": 1
   },
   {
    "type": "truefalse",
    "statement": "A line across a circle is always a diameter.",
    "answer": false,
    "because": "It is only a diameter if it passes through the centre.",
    "skill": "reason",
    "marks": 1
   },
   {
    "type": "fill",
    "text": "The diameter is ___ times the radius.",
    "answers": [
     "2"
    ],
    "bank": [
     "2",
     "3",
     "4"
    ],
    "skill": "recall",
    "marks": 1
   },
   {
    "type": "spot",
    "q": "Spot the mistake and correct it.",
    "work": "Radius 15 cm, so diameter = 15 ÷ 2 = 7.5 cm",
    "mistake": "It halves the radius instead of doubling it.",
    "fix": "Diameter = 2 × 15 = 30 cm",
    "skill": "reason",
    "marks": 2
   },
   {
    "type": "order",
    "q": "Put these circles in order of size, smallest first.",
    "items": [
     "radius 2 cm",
     "diameter 6 cm",
     "radius 4 cm",
     "diameter 10 cm"
    ],
    "skill": "apply",
    "marks": 2
   },
   {
    "type": "short",
    "q": "A clock face is 28 cm across, through the centre. What is its radius?",
    "answer": "14 cm",
    "skill": "apply",
    "marks": 1
   }
  ],
  "stretch": [
   {
    "type": "short",
    "q": "A circle has a radius of 4.5 cm. What is its diameter?",
    "answer": "9 cm",
    "skill": "apply",
    "marks": 1
   },
   {
    "type": "short",
    "q": "A circle has a diameter of 17 cm. What is its radius?",
    "answer": "8.5 cm",
    "skill": "apply",
    "marks": 1
   },
   {
    "type": "short",
    "q": "Three equal circles fit exactly side by side in a rectangle 36 cm long. What is the radius of each circle?",
    "answer": "6 cm",
    "hint": "Each diameter is 36 ÷ 3.",
    "skill": "reason",
    "marks": 2
   },
   {
    "type": "short",
    "q": "A circle fits exactly inside a square with sides of 20 cm. What is the radius of the circle?",
    "answer": "10 cm",
    "skill": "reason",
    "marks": 2
   },
   {
    "type": "odd",
    "q": "Which is the odd one out? Why?",
    "items": [
     "radius 6 cm",
     "diameter 12 cm",
     "radius 12 cm",
     "12 cm across, through the centre"
    ],
    "answer": 2,
    "why": "The others all describe the same circle. A radius of 12 cm makes a circle twice as big.",
    "skill": "reason",
    "marks": 2
   },
   {
    "type": "truefalse",
    "statement": "If you halve the diameter of a circle, its radius is halved too.",
    "answer": true,
    "because": "r = d ÷ 2, so a diameter half as long gives a radius half as long.",
    "skill": "reason",
    "marks": 1
   },
   {
    "type": "spot",
    "q": "Spot the mistake and correct it.",
    "work": "Diameter 50 cm, so radius = 50 × 2 = 100 cm",
    "mistake": "It doubles the diameter instead of halving it.",
    "fix": "Radius = 50 ÷ 2 = 25 cm",
    "skill": "reason",
    "marks": 2
   },
   {
    "type": "short",
    "q": "Two circles touch on the outside. Their centres are 10 cm apart. One circle has a radius of 4 cm. What is the radius of the other?",
    "answer": "6 cm",
    "hint": "The distance between the centres is the two radii added together.",
    "skill": "reason",
    "marks": 2
   }
  ]
 }
};
