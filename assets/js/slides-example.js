/* The built-in example lesson (Year 4 equivalent fractions). Also shows Claude the exact format to reply in. */
export default {
 "title": "Equivalent fractions",
 "year": "Year 4",
 "subject": "Maths",
 "minutes": 45,
 "objective": "To recognise and show families of equivalent fractions.",
 "successCriteria": [
  "I can explain what equivalent means.",
  "I can use a fraction wall to find equivalent fractions.",
  "I can multiply the numerator and denominator by the same number."
 ],
 "keywords": [
  {
   "word": "numerator",
   "meaning": "The top number. It tells us how many parts we have."
  },
  {
   "word": "denominator",
   "meaning": "The bottom number. It tells us how many equal parts the whole is split into."
  },
  {
   "word": "equivalent",
   "meaning": "Equal in value, even if it looks different."
  },
  {
   "word": "fraction wall",
   "meaning": "A diagram that shows one whole split into different fractions."
  }
 ],
 "slides": [
  {
   "type": "title",
   "title": "Equivalent fractions",
   "minutes": 2,
   "respond": "none",
   "say": "Welcome, fraction detectives! Today we will find fractions that look different but are worth exactly the same. Read the success criteria with me."
  },
  {
   "type": "starter",
   "title": "Quick fire fractions",
   "minutes": 3,
   "respond": "chat",
   "say": "Answer each question in the chat, but wait until I say go so everyone has thinking time.",
   "questions": [
    {
     "q": "A pizza is cut into 4 equal slices and 1 is eaten. What fraction is left?",
     "a": "3/4"
    },
    {
     "q": "Which is bigger: 1/2 or 1/4?",
     "a": "1/2"
    },
    {
     "q": "How many quarters make one whole?",
     "a": "4"
    },
    {
     "q": "What is half of 8?",
     "a": "4"
    }
   ]
  },
  {
   "type": "hook",
   "title": "Would you rather…",
   "minutes": 3,
   "respond": "talk",
   "say": "Give pupils 30 seconds to decide, then take three answers. Draw out that both amounts are the same, because that is today's big idea.",
   "prompt": "Would you rather have 1/2 of a chocolate bar or 2/4 of the same chocolate bar?",
   "detail": "Be ready to explain your choice."
  },
  {
   "type": "vocab",
   "title": "Key words",
   "minutes": 2,
   "respond": "none",
   "say": "Say each word together. Ask: which number tells us how many equal parts there are?"
  },
  {
   "type": "teach",
   "title": "Same amount, different names",
   "minutes": 6,
   "respond": "none",
   "say": "Show a fraction wall. Point out that 1/2 lines up exactly with 2/4 and 4/8. Ask: what do you notice about the numerators and denominators?",
   "points": [
    "Equivalent fractions are worth the same amount.",
    "1/2, 2/4 and 4/8 all cover the same part of a whole.",
    "On a fraction wall, equivalent fractions line up exactly.",
    "Multiply the numerator and the denominator by the same number to make an equivalent fraction."
   ],
   "example": "1/2 = 2/4 = 4/8, because each one covers half of the whole."
  },
  {
   "type": "example",
   "title": "I do: find a fraction equal to 2/3",
   "minutes": 5,
   "respond": "none",
   "say": "Think aloud as you model each step. Stress the rule: whatever we do to the bottom, we do to the top.",
   "problem": "Find a fraction equivalent to 2/3 with a denominator of 6.",
   "steps": [
    "Look at the denominators: 3 needs to become 6.",
    "3 × 2 = 6, so we multiplied by 2.",
    "Do the same to the numerator: 2 × 2 = 4."
   ],
   "answer": "2/3 = 4/6"
  },
  {
   "type": "practice",
   "title": "We do: your turn",
   "minutes": 5,
   "respond": "show",
   "say": "Pupils write each answer on paper and hold it up on 'show me'. Look out for anyone who multiplies only the denominator.",
   "questions": [
    {
     "q": "1/2 = ?/6",
     "a": "3/6"
    },
    {
     "q": "1/4 = ?/8",
     "a": "2/8"
    },
    {
     "q": "3/5 = ?/10",
     "a": "6/10"
    },
    {
     "q": "2/3 = ?/9",
     "a": "6/9"
    }
   ]
  },
  {
   "type": "hinge",
   "title": "Check point",
   "minutes": 3,
   "respond": "vote",
   "say": "Everyone votes at the same time. If fewer than four in five choose D, reteach with the fraction wall before moving on.",
   "question": "Which fraction is NOT equivalent to 1/2?",
   "options": [
    "2/4",
    "3/6",
    "4/8",
    "3/5"
   ],
   "answer": 3,
   "why": "3/5 is more than a half. Half of 5 is 2.5, not 3."
  },
  {
   "type": "talk",
   "title": "Talk time",
   "minutes": 3,
   "respond": "talk",
   "say": "Pairs discuss, then two pupils share. Model the counter-example: adding 1 to the top and bottom of 1/2 gives 2/3, which is bigger than 1/2.",
   "prompt": "Sam says: 'You can make an equivalent fraction by adding the same number to the top and the bottom.' Is Sam right?",
   "starter": "I think Sam is … because …"
  },
  {
   "type": "tasks",
   "title": "Choose your challenge",
   "minutes": 8,
   "respond": "show",
   "say": "Pupils choose a starting level and move up when they are ready. Check in with the mild group first.",
   "mild": [
    "Use the fraction wall to find two fractions equal to 1/2.",
    "Complete: 1/3 = ?/6"
   ],
   "spicy": [
    "Complete: 3/4 = ?/12 and 2/5 = ?/20",
    "Write three fractions equivalent to 2/3."
   ],
   "hot": [
    "Find a fraction equivalent to 4/6 with a denominator of 3. Explain how you know.",
    "Ali says 5/10 and 6/12 are equivalent. Prove whether he is right."
   ]
  },
  {
   "type": "exit",
   "title": "Exit ticket",
   "minutes": 3,
   "respond": "chat",
   "say": "Pupils send their answers to you privately if your platform allows. Note who needs support next lesson.",
   "questions": [
    {
     "q": "Complete: 1/5 = ?/10",
     "a": "2/10"
    },
    {
     "q": "True or false: 2/6 = 1/3",
     "a": "True"
    },
    {
     "q": "Write one fraction equivalent to 3/4.",
     "a": "For example 6/8 or 9/12"
    }
   ]
  },
  {
   "type": "reflect",
   "title": "Reflect",
   "minutes": 2,
   "respond": "react",
   "say": "Finish with a thumbs reaction for confidence. Celebrate one great explanation you heard today.",
   "prompts": [
    "Today I learned …",
    "I am still wondering …",
    "My confidence with equivalent fractions is …"
   ]
  }
 ],
 "plan": {
  "overview": "Pupils discover that fractions can look different but be equal in value. They use a fraction wall first, then multiply the numerator and denominator by the same number.",
  "keyQuestions": [
   "How do you know these two fractions are equal?",
   "What do you notice about the numerators and denominators?",
   "Can you find another fraction that belongs in this family?",
   "Why does adding the same number to the top and bottom not work?"
  ],
  "misconceptions": [
   "Changing only the denominator.",
   "Adding the same number to the numerator and the denominator.",
   "Thinking a bigger denominator always means a bigger fraction."
  ],
  "support": "Give a printed fraction wall and start with halves and quarters.",
  "challenge": "Ask pupils to simplify fractions by dividing, for example 6/8 = 3/4.",
  "resources": [
   "Fraction wall (printed or on screen)",
   "Paper or mini whiteboards",
   "Pens"
  ]
 }
};
