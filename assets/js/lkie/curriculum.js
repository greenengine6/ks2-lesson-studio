/* lkie.like curriculum map: every KS2 subject, as Framework > Subject > Year (or band) > Strand > Objective.
   Maths follows the Cambridge Primary curriculum, as Rabinder's school does: Cambridge's own learning objectives and
   codes (for example 6Nf.13), word for word, Stages 3 to 6 for Years 3 to 6 (see the maths section). The other
   subjects still use short, stable codes of this site's own (for example SC4-LT-1) on statements taken from the
   National Curriculum in England, lightly shortened (Crown copyright, Open Government Licence v3.0). Bahasa Melayu
   follows the KSSR skill areas, Mandarin, French and Spanish follow the KS2 languages programme of study, RE follows
   the RE Council's national framework (your locally agreed syllabus decides), and PSHE follows the statutory
   Relationships and Health Education guidance.

   The engine is only ever shown a short list of codes picked here for the topic, and anything it returns that is not
   on that list is thrown away, so a lesson can never carry an invented curriculum code.

   Row format: [code, years, strand, statement]. years: '3' '4' '5' '6', '34' (Years 3-4), '56' (Years 5-6), 'KS2'. */

export const FRAMEWORKS = {
  cambridge: { name: 'Cambridge Primary Mathematics (0096)', short: 'Cambridge', stages: true },
  england: { name: 'National Curriculum in England (2014)', short: 'NC England' },
  rshe: { name: 'Relationships and Health Education, statutory guidance (England)', short: 'RSHE' },
  re: { name: 'RE Council national framework (2013) · your agreed syllabus decides', short: 'RE framework' },
  languages: { name: 'National Curriculum in England: languages at KS2', short: 'NC Languages' },
  kssr: { name: 'KSSR Bahasa Melayu (Malaysia): skill areas', short: 'KSSR' }
};

export const SUBJECTS = [
  { id: 'english', name: 'English', group: 'Core', fw: 'england' },
  { id: 'maths', name: 'Maths', group: 'Core', fw: 'cambridge' },
  { id: 'science', name: 'Science', group: 'Core', fw: 'england' },
  { id: 'computing', name: 'Computing (ICT)', group: 'Foundation', fw: 'england' },
  { id: 'history', name: 'History', group: 'Foundation', fw: 'england' },
  { id: 'geography', name: 'Geography', group: 'Foundation', fw: 'england' },
  { id: 'art', name: 'Art and design', group: 'Foundation', fw: 'england' },
  { id: 'dt', name: 'Design and technology', group: 'Foundation', fw: 'england' },
  { id: 'music', name: 'Music', group: 'Foundation', fw: 'england' },
  { id: 'pe', name: 'Physical education', group: 'Foundation', fw: 'england' },
  { id: 'pshe', name: 'PSHE and RSHE', group: 'Foundation', fw: 'rshe' },
  { id: 're', name: 'Religious education', group: 'Foundation', fw: 're' },
  { id: 'bm', name: 'Bahasa Melayu', group: 'Languages', fw: 'kssr', lang: 'ms' },
  { id: 'mandarin', name: 'Mandarin', group: 'Languages', fw: 'languages', lang: 'zh' },
  { id: 'french', name: 'French', group: 'Languages', fw: 'languages', lang: 'fr' },
  { id: 'spanish', name: 'Spanish', group: 'Languages', fw: 'languages', lang: 'es' }
];
export const SUBJECT_BY_ID = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));

/* ---------------- Maths: Cambridge Primary Mathematics (0096), Stages 3 to 6 ----------------
   Rabinder's school plans maths from the Cambridge Primary curriculum (Vik, 11 Nov 2026: "i dont want england. i want
   cambridge"), so these are Cambridge's own learning objectives and codes, word for word from the Cambridge Primary
   Mathematics Curriculum Framework (0096), version 1.1 (first teaching September 2021), checked against the framework
   on 11 Nov 2026. Sub-points are joined with "; ". Stage 3 to 6 match Years 3 to 6. Copyright UCLES (Cambridge
   University Press & Assessment): registered centres may copy the framework for their own internal use. */
const MATHS = [
  // Stage 3 (Year 3)
  ['3Nc.01', '3', 'Counting and sequences', 'Estimate the number of objects or people (up to 1000).'],
  ['3Nc.02', '3', 'Counting and sequences', 'Count on and count back in steps of constant size: 1-digit numbers, tens or hundreds, starting from any number (from 0 to 1000).'],
  ['3Nc.03', '3', 'Counting and sequences', 'Use knowledge of even and odd numbers up to 10 to recognise and sort numbers.'],
  ['3Nc.04', '3', 'Counting and sequences', 'Recognise the use of an object to represent an unknown quantity in addition and subtraction calculations.'],
  ['3Nc.05', '3', 'Counting and sequences', 'Recognise and extend linear sequences, and describe the term-to-term rule.'],
  ['3Nc.06', '3', 'Counting and sequences', 'Extend spatial patterns formed from adding and subtracting a constant.'],
  ['3Ni.01', '3', 'Integers and powers', 'Recite, read and write number names and whole numbers (from 0 to 1000).'],
  ['3Ni.02', '3', 'Integers and powers', 'Understand the commutative and associative properties of addition, and use these to simplify calculations.'],
  ['3Ni.03', '3', 'Integers and powers', 'Recognise complements of 100 and complements of multiples of 10 or 100 (up to 1000).'],
  ['3Ni.04', '3', 'Integers and powers', 'Estimate, add and subtract whole numbers with up to three digits (regrouping of ones or tens).'],
  ['3Ni.05', '3', 'Integers and powers', 'Understand and explain the relationship between multiplication and division.'],
  ['3Ni.06', '3', 'Integers and powers', 'Understand and explain the commutative and distributive properties of multiplication, and use these to simplify calculations.'],
  ['3Ni.07', '3', 'Integers and powers', 'Know 1, 2, 3, 4, 5, 6, 8, 9 and 10 times tables.'],
  ['3Ni.08', '3', 'Integers and powers', 'Estimate and multiply whole numbers up to 100 by 2, 3, 4 and 5.'],
  ['3Ni.09', '3', 'Integers and powers', 'Estimate and divide whole numbers up to 100 by 2, 3, 4 and 5.'],
  ['3Ni.10', '3', 'Integers and powers', 'Recognise multiples of 2, 5 and 10 (up to 1000).'],
  ['3Nm.01', '3', 'Money', 'Interpret money notation for currencies that use a decimal point.'],
  ['3Nm.02', '3', 'Money', 'Add and subtract amounts of money to give change.'],
  ['3Np.01', '3', 'Place value, ordering and rounding', 'Understand and explain that the value of each digit is determined by its position in that number (up to 3-digit numbers).'],
  ['3Np.02', '3', 'Place value, ordering and rounding', 'Use knowledge of place value to multiply whole numbers by 10.'],
  ['3Np.03', '3', 'Place value, ordering and rounding', 'Compose, decompose and regroup 3-digit numbers, using hundreds, tens and ones.'],
  ['3Np.04', '3', 'Place value, ordering and rounding', 'Understand the relative size of quantities to compare and order 3-digit positive numbers, using the symbols =, > and <.'],
  ['3Np.05', '3', 'Place value, ordering and rounding', 'Round 3-digit numbers to the nearest 10 or 100.'],
  ['3Nf.01', '3', 'Fractions, decimals, percentages, ratio and proportion', 'Understand and explain that fractions are several equal parts of an object or shape and all the parts, taken together, equal one whole.'],
  ['3Nf.02', '3', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that the relationship between the whole and the parts depends on the relative size of each, regardless of their shape or orientation.'],
  ['3Nf.03', '3', 'Fractions, decimals, percentages, ratio and proportion', 'Understand and explain that fractions can describe equal parts of a quantity or set of objects.'],
  ['3Nf.04', '3', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that a fraction can be represented as a division of the numerator by the denominator (half, quarter and three-quarters).'],
  ['3Nf.05', '3', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that fractions (half, quarter, three-quarters, third and tenth) can act as operators.'],
  ['3Nf.06', '3', 'Fractions, decimals, percentages, ratio and proportion', 'Recognise that two fractions can have an equivalent value (halves, quarters, fifths and tenths).'],
  ['3Nf.07', '3', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate, add and subtract fractions with the same denominator (within one whole).'],
  ['3Nf.08', '3', 'Fractions, decimals, percentages, ratio and proportion', 'Use knowledge of equivalence to compare and order unit fractions and fractions with the same denominator, using the symbols =, > and <.'],
  ['3Gt.01', '3', 'Time', 'Choose the appropriate unit of time for familiar activities.'],
  ['3Gt.02', '3', 'Time', 'Read and record time accurately in digital notation (12-hour) and on analogue clocks.'],
  ['3Gt.03', '3', 'Time', 'Interpret and use the information in timetables (12-hour clock).'],
  ['3Gt.04', '3', 'Time', 'Understand the difference between a time and a time interval. Find time intervals between the same units in days, weeks, months and years.'],
  ['3Gg.01', '3', 'Geometrical reasoning, shapes and measurements', 'Identify, describe, classify, name and sketch 2D shapes by their properties. Differentiate between regular and irregular polygons.'],
  ['3Gg.02', '3', 'Geometrical reasoning, shapes and measurements', 'Estimate and measure lengths in centimetres (cm), metres (m) and kilometres (km). Understand the relationship between units.'],
  ['3Gg.03', '3', 'Geometrical reasoning, shapes and measurements', 'Understand that perimeter is the total distance around a 2D shape and can be calculated by adding lengths, and area is how much space a 2D shape occupies within its boundary.'],
  ['3Gg.04', '3', 'Geometrical reasoning, shapes and measurements', 'Draw lines, rectangles and squares. Estimate, measure and calculate the perimeter of a shape, using appropriate metric units, and area on a square grid.'],
  ['3Gg.05', '3', 'Geometrical reasoning, shapes and measurements', 'Identify, describe, sort, name and sketch 3D shapes by their properties.'],
  ['3Gg.06', '3', 'Geometrical reasoning, shapes and measurements', 'Estimate and measure the mass of objects in grams (g) and kilograms (kg). Understand the relationship between units.'],
  ['3Gg.07', '3', 'Geometrical reasoning, shapes and measurements', 'Estimate and measure capacity in millilitres (ml) and litres (l), and understand their relationships.'],
  ['3Gg.08', '3', 'Geometrical reasoning, shapes and measurements', 'Recognise pictures, drawings and diagrams of 3D shapes.'],
  ['3Gg.09', '3', 'Geometrical reasoning, shapes and measurements', 'Identify both horizontal and vertical lines of symmetry on 2D shapes and patterns.'],
  ['3Gg.10', '3', 'Geometrical reasoning, shapes and measurements', 'Compare angles with a right angle. Recognise that a straight line is equivalent to two right angles or a half turn.'],
  ['3Gg.11', '3', 'Geometrical reasoning, shapes and measurements', 'Use instruments that measure length, mass, capacity and temperature.'],
  ['3Gp.01', '3', 'Position and transformation', 'Interpret and create descriptions of position, direction and movement, including reference to cardinal points.'],
  ['3Gp.02', '3', 'Position and transformation', 'Sketch the reflection of a 2D shape in a horizontal or vertical mirror line, including where the mirror line is the edge of the shape.'],
  ['3Ss.01', '3', 'Statistics', 'Conduct an investigation to answer non-statistical and statistical questions (categorical and discrete data).'],
  ['3Ss.02', '3', 'Statistics', 'Record, organise and represent categorical and discrete data. Choose and explain which representation to use in a given situation: Venn and Carroll diagrams; tally charts and frequency tables; pictograms and bar charts.'],
  ['3Ss.03', '3', 'Statistics', 'Interpret data, identifying similarities and variations, within data sets, to answer non-statistical and statistical questions and discuss conclusions.'],
  ['3Sp.01', '3', 'Probability', 'Use familiar language associated with chance to describe events, including \'it will happen\', \'it will not happen\', \'it might happen\'.'],
  ['3Sp.02', '3', 'Probability', 'Conduct chance experiments, and present and describe the results.'],
  // Stage 4 (Year 4)
  ['4Nc.01', '4', 'Counting and sequences', 'Count on and count back in steps of constant size: 1-digit numbers, tens, hundreds or thousands, starting from any number, and extending beyond zero to include negative numbers.'],
  ['4Nc.02', '4', 'Counting and sequences', 'Recognise and explain generalisations when adding and subtracting combinations of even and odd numbers.'],
  ['4Nc.03', '4', 'Counting and sequences', 'Recognise the use of objects, shapes or symbols to represent unknown quantities in addition and subtraction calculations.'],
  ['4Nc.04', '4', 'Counting and sequences', 'Recognise and extend linear and non-linear sequences, and describe the term-to-term rule.'],
  ['4Nc.05', '4', 'Counting and sequences', 'Recognise and extend the spatial pattern of square numbers.'],
  ['4Ni.01', '4', 'Integers and powers', 'Read and write number names and whole numbers greater than 1000 and less than 0.'],
  ['4Ni.02', '4', 'Integers and powers', 'Estimate, add and subtract whole numbers with up to three digits.'],
  ['4Ni.03', '4', 'Integers and powers', 'Understand the associative property of multiplication, and use this to simplify calculations.'],
  ['4Ni.04', '4', 'Integers and powers', 'Know all times tables from 1 to 10.'],
  ['4Ni.05', '4', 'Integers and powers', 'Estimate and multiply whole numbers up to 1000 by 1-digit whole numbers.'],
  ['4Ni.06', '4', 'Integers and powers', 'Estimate and divide whole numbers up to 100 by 1-digit whole numbers.'],
  ['4Ni.07', '4', 'Integers and powers', 'Understand the relationship between multiples and factors.'],
  ['4Ni.08', '4', 'Integers and powers', 'Use knowledge of factors and multiples to understand tests of divisibility by 2, 5, 10, 25, 50 and 100.'],
  ['4Np.01', '4', 'Place value, ordering and rounding', 'Understand and explain that the value of each digit in numbers is determined by its position in that number.'],
  ['4Np.02', '4', 'Place value, ordering and rounding', 'Use knowledge of place value to multiply and divide whole numbers by 10 and 100.'],
  ['4Np.03', '4', 'Place value, ordering and rounding', 'Compose, decompose and regroup whole numbers.'],
  ['4Np.04', '4', 'Place value, ordering and rounding', 'Understand the relative size of quantities to compare and order positive and negative numbers, using the symbols =, > and <.'],
  ['4Np.05', '4', 'Place value, ordering and rounding', 'Round numbers to the nearest 10, 100, 1000, 10 000 or 100 000.'],
  ['4Nf.01', '4', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that the more parts a whole is divided into, the smaller the parts become.'],
  ['4Nf.02', '4', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that a fraction can be represented as a division of the numerator by the denominator (unit fractions and three-quarters).'],
  ['4Nf.03', '4', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that unit fractions can act as operators.'],
  ['4Nf.04', '4', 'Fractions, decimals, percentages, ratio and proportion', 'Recognise that two proper fractions can have an equivalent value.'],
  ['4Nf.05', '4', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate, add and subtract fractions with the same denominator.'],
  ['4Nf.06', '4', 'Fractions, decimals, percentages, ratio and proportion', 'Understand percentage as the number of parts in each hundred, and use the percentage symbol (%).'],
  ['4Nf.07', '4', 'Fractions, decimals, percentages, ratio and proportion', 'Use knowledge of equivalence to compare and order proper fractions, using the symbols =, > and <.'],
  ['4Gt.01', '4', 'Time', 'Understand the direct relationship between units of time, and convert between them.'],
  ['4Gt.02', '4', 'Time', 'Read and record time accurately in digital notation (12- and 24-hour) and on analogue clocks.'],
  ['4Gt.03', '4', 'Time', 'Interpret and use the information in timetables (12- and 24-hour clock).'],
  ['4Gt.04', '4', 'Time', 'Find time intervals between different units: days, weeks, months and years; seconds, minutes and hours that do not bridge through 60.'],
  ['4Gg.01', '4', 'Geometrical reasoning, shapes and measurements', 'Investigate what shapes can be made if two or more shapes are combined, and analyse their properties, including reference to tessellation.'],
  ['4Gg.02', '4', 'Geometrical reasoning, shapes and measurements', 'Estimate and measure perimeter and area of 2D shapes, understanding that two areas can be added together to calculate the area of a compound shape.'],
  ['4Gg.03', '4', 'Geometrical reasoning, shapes and measurements', 'Draw rectangles and squares on square grids, and measure their perimeter and area. Derive and use formulae to calculate areas and perimeters of rectangles and squares.'],
  ['4Gg.04', '4', 'Geometrical reasoning, shapes and measurements', 'Estimate the area of irregular shapes on a square grid (whole and part squares).'],
  ['4Gg.05', '4', 'Geometrical reasoning, shapes and measurements', 'Identify 2D faces of 3D shapes, and describe their properties.'],
  ['4Gg.06', '4', 'Geometrical reasoning, shapes and measurements', 'Match nets to their corresponding 3D shapes.'],
  ['4Gg.07', '4', 'Geometrical reasoning, shapes and measurements', 'Identify all horizontal, vertical and diagonal lines of symmetry on 2D shapes and patterns.'],
  ['4Gg.08', '4', 'Geometrical reasoning, shapes and measurements', 'Estimate, compare and classify angles, using geometric vocabulary including acute, right and obtuse.'],
  ['4Gg.09', '4', 'Geometrical reasoning, shapes and measurements', 'Use knowledge of fractions to read and interpret a measuring scale.'],
  ['4Gp.01', '4', 'Position and transformation', 'Interpret and create descriptions of position, direction and movement, including reference to cardinal and ordinal points, and their notations.'],
  ['4Gp.02', '4', 'Position and transformation', 'Understand that position can be described using coordinate notation. Read and plot coordinates in the first quadrant (with the aid of a grid).'],
  ['4Gp.03', '4', 'Position and transformation', 'Reflect 2D shapes in a horizontal or vertical mirror line, including where the mirror line is the edge of the shape, on square grids.'],
  ['4Ss.01', '4', 'Statistics', 'Plan and conduct an investigation to answer statistical questions, considering what data to collect (categorical and discrete data).'],
  ['4Ss.02', '4', 'Statistics', 'Record, organise and represent categorical and discrete data. Choose and explain which representation to use in a given situation: Venn and Carroll diagrams; tally charts and frequency tables; pictograms and bar charts; dot plots (one dot per count).'],
  ['4Ss.03', '4', 'Statistics', 'Interpret data, identifying similarities and variations, within and between data sets, to answer statistical questions. Discuss conclusions, considering the sources of variation.'],
  ['4Sp.01', '4', 'Probability', 'Use language associated with chance to describe familiar events, including reference to maybe, likely, certain, impossible.'],
  ['4Sp.02', '4', 'Probability', 'Conduct chance experiments, using small and large numbers of trials, and present and describe the results using the language of probability.'],
  // Stage 5 (Year 5)
  ['5Nc.01', '5', 'Counting and sequences', 'Count on and count back in steps of constant size, and extend beyond zero to include negative numbers.'],
  ['5Nc.02', '5', 'Counting and sequences', 'Recognise the use of objects, shapes or symbols to represent two unknown quantities in addition and subtraction calculations.'],
  ['5Nc.03', '5', 'Counting and sequences', 'Use the relationship between repeated addition of a constant and multiplication to find any term of a linear sequence.'],
  ['5Nc.04', '5', 'Counting and sequences', 'Recognise and extend the spatial pattern of square and triangular numbers.'],
  ['5Ni.01', '5', 'Integers and powers', 'Estimate, add and subtract integers, including where one integer is negative.'],
  ['5Ni.02', '5', 'Integers and powers', 'Understand which law of arithmetic to apply to simplify calculations.'],
  ['5Ni.03', '5', 'Integers and powers', 'Understand that the four operations follow a particular order.'],
  ['5Ni.04', '5', 'Integers and powers', 'Estimate and multiply whole numbers up to 1000 by 1-digit or 2-digit whole numbers.'],
  ['5Ni.05', '5', 'Integers and powers', 'Estimate and divide whole numbers up to 1000 by 1-digit whole numbers.'],
  ['5Ni.06', '5', 'Integers and powers', 'Understand and explain the difference between prime and composite numbers.'],
  ['5Ni.07', '5', 'Integers and powers', 'Use knowledge of factors and multiples to understand tests of divisibility by 4 and 8.'],
  ['5Ni.08', '5', 'Integers and powers', 'Use knowledge of multiplication to recognise square numbers (from 1 to 100).'],
  ['5Np.01', '5', 'Place value, ordering and rounding', 'Understand and explain the value of each digit in decimals (tenths and hundredths).'],
  ['5Np.02', '5', 'Place value, ordering and rounding', 'Use knowledge of place value to multiply and divide whole numbers by 10, 100 and 1000.'],
  ['5Np.03', '5', 'Place value, ordering and rounding', 'Use knowledge of place value to multiply and divide decimals by 10 and 100.'],
  ['5Np.04', '5', 'Place value, ordering and rounding', 'Compose, decompose and regroup numbers, including decimals (tenths and hundredths).'],
  ['5Np.05', '5', 'Place value, ordering and rounding', 'Round numbers with one decimal place to the nearest whole number.'],
  ['5Nf.01', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that a fraction can be represented as a division of the numerator by the denominator (unit fractions, three-quarters, tenths and hundredths).'],
  ['5Nf.02', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that proper fractions can act as operators.'],
  ['5Nf.03', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Recognise that improper fractions and mixed numbers can have an equivalent value.'],
  ['5Nf.04', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Recognise that proper fractions, decimals (one decimal place) and percentages can have equivalent values.'],
  ['5Nf.05', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate, add and subtract fractions with the same denominator and denominators that are multiples of each other.'],
  ['5Nf.06', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate, multiply and divide unit fractions by a whole number.'],
  ['5Nf.07', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Recognise percentages of shapes, and write percentages as a fraction with denominator 100.'],
  ['5Nf.08', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Understand the relative size of quantities to compare and order numbers with one decimal place, proper fractions with the same denominator and percentages, using the symbols =, > and <.'],
  ['5Nf.09', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate, add and subtract numbers with the same number of decimal places.'],
  ['5Nf.10', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate and multiply numbers with one decimal place by 1-digit whole numbers.'],
  ['5Nf.11', '5', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that: a proportion compares part to whole; a ratio compares part to part of two or more quantities.'],
  ['5Gt.01', '5', 'Time', 'Understand time intervals less than one second.'],
  ['5Gt.02', '5', 'Time', 'Compare times between time zones in digital notation (12- and 24-hour) and on analogue clocks.'],
  ['5Gt.03', '5', 'Time', 'Find time intervals in seconds, minutes and hours that bridge through 60.'],
  ['5Gt.04', '5', 'Time', 'Recognise that a time interval can be expressed as a decimal, or in mixed units.'],
  ['5Gg.01', '5', 'Geometrical reasoning, shapes and measurements', 'Identify, describe, classify and sketch isosceles, equilateral or scalene triangles, including reference to angles and symmetrical properties.'],
  ['5Gg.02', '5', 'Geometrical reasoning, shapes and measurements', 'Estimate and measure perimeter and area of 2D shapes, understanding that shapes with the same perimeter can have different areas and vice versa.'],
  ['5Gg.03', '5', 'Geometrical reasoning, shapes and measurements', 'Draw compound shapes that can be divided into rectangles and squares. Estimate, measure and calculate their perimeter and area.'],
  ['5Gg.04', '5', 'Geometrical reasoning, shapes and measurements', 'Identify, describe and sketch 3D shapes in different orientations.'],
  ['5Gg.05', '5', 'Geometrical reasoning, shapes and measurements', 'Identify and sketch different nets for a cube.'],
  ['5Gg.06', '5', 'Geometrical reasoning, shapes and measurements', 'Use knowledge of reflective symmetry to identify and complete symmetrical patterns.'],
  ['5Gg.07', '5', 'Geometrical reasoning, shapes and measurements', 'Estimate, compare and classify angles, using geometric vocabulary including acute, right, obtuse and reflex.'],
  ['5Gg.08', '5', 'Geometrical reasoning, shapes and measurements', 'Know that the sum of the angles on a straight line is 180°, and use this to calculate missing angles on a straight line.'],
  ['5Gp.01', '5', 'Position and transformation', 'Compare the relative position of coordinates (with or without the aid of a grid).'],
  ['5Gp.02', '5', 'Position and transformation', 'Use knowledge of 2D shapes and coordinates to plot points to form lines and shapes in the first quadrant (with the aid of a grid).'],
  ['5Gp.03', '5', 'Position and transformation', 'Translate 2D shapes, identifying the corresponding points between the original and the translated image, on square grids.'],
  ['5Gp.04', '5', 'Position and transformation', 'Reflect 2D shapes in both horizontal and vertical mirror lines to create patterns on square grids.'],
  ['5Ss.01', '5', 'Statistics', 'Plan and conduct an investigation to answer a set of related statistical questions, considering what data to collect (categorical, discrete and continuous data).'],
  ['5Ss.02', '5', 'Statistics', 'Record, organise and represent categorical, discrete and continuous data. Choose and explain which representation to use in a given situation: Venn and Carroll diagrams; tally charts and frequency tables; bar charts; waffle diagrams; frequency diagrams for continuous data; line graphs; dot plots (one dot per data point).'],
  ['5Ss.03', '5', 'Statistics', 'Understand that the mode and median are ways to describe and summarise data sets. Find and interpret the mode and the median, and consider their appropriateness for the context.'],
  ['5Ss.04', '5', 'Statistics', 'Interpret data, identifying patterns, within and between data sets, to answer statistical questions. Discuss conclusions, considering the sources of variation.'],
  ['5Sp.01', '5', 'Probability', 'Use the language associated with likelihood to describe and compare likelihood and risk of familiar events, including those with equally likely outcomes.'],
  ['5Sp.02', '5', 'Probability', 'Recognise that some outcomes are equally likely to happen and some outcomes are more (or less) likely to happen, when doing practical activities.'],
  ['5Sp.03', '5', 'Probability', 'Conduct chance experiments or simulations, using small and large numbers of trials, and present and describe the results using the language of probability.'],
  // Stage 6 (Year 6)
  ['6Nc.01', '6', 'Counting and sequences', 'Count on and count back in steps of constant size, including fractions and decimals, and extend beyond zero to include negative numbers.'],
  ['6Nc.02', '6', 'Counting and sequences', 'Recognise the use of letters to represent quantities that vary in addition and subtraction calculations.'],
  ['6Nc.03', '6', 'Counting and sequences', 'Use the relationship between repeated addition of a constant and multiplication to find and use a position-to-term rule.'],
  ['6Nc.04', '6', 'Counting and sequences', 'Use knowledge of square numbers to generate terms in a sequence, given its position.'],
  ['6Ni.01', '6', 'Integers and powers', 'Estimate, add and subtract integers.'],
  ['6Ni.02', '6', 'Integers and powers', 'Use knowledge of laws of arithmetic and order of operations to simplify calculations.'],
  ['6Ni.03', '6', 'Integers and powers', 'Understand that brackets can be used to alter the order of operations.'],
  ['6Ni.04', '6', 'Integers and powers', 'Estimate and multiply whole numbers up to 10 000 by 1-digit or 2-digit whole numbers.'],
  ['6Ni.05', '6', 'Integers and powers', 'Estimate and divide whole numbers up to 1000 by 1-digit or 2-digit whole numbers.'],
  ['6Ni.06', '6', 'Integers and powers', 'Understand common multiples and common factors.'],
  ['6Ni.07', '6', 'Integers and powers', 'Use knowledge of factors and multiples to understand tests of divisibility by 3, 6 and 9.'],
  ['6Ni.08', '6', 'Integers and powers', 'Use knowledge of multiplication and square numbers to recognise cube numbers (from 1 to 125).'],
  ['6Np.01', '6', 'Place value, ordering and rounding', 'Understand and explain the value of each digit in decimals (tenths, hundredths and thousandths).'],
  ['6Np.02', '6', 'Place value, ordering and rounding', 'Use knowledge of place value to multiply and divide whole numbers and decimals by 10, 100 and 1000.'],
  ['6Np.03', '6', 'Place value, ordering and rounding', 'Compose, decompose and regroup numbers, including decimals (tenths, hundredths and thousandths).'],
  ['6Np.04', '6', 'Place value, ordering and rounding', 'Round numbers with two decimal places to the nearest tenth or whole number.'],
  ['6Nf.01', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that a fraction can be represented as a division of the numerator by the denominator (proper and improper fractions).'],
  ['6Nf.02', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Understand that proper and improper fractions can act as operators.'],
  ['6Nf.03', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Use knowledge of equivalence to write fractions in their simplest form.'],
  ['6Nf.04', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Recognise that fractions, decimals (one or two decimal places) and percentages can have equivalent values.'],
  ['6Nf.05', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate, add and subtract fractions with different denominators.'],
  ['6Nf.06', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate, multiply and divide proper fractions by whole numbers.'],
  ['6Nf.07', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Recognise percentages (1%, and multiples of 5% up to 100%) of shapes and whole numbers.'],
  ['6Nf.08', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Understand the relative size of quantities to compare and order numbers with one or two decimal places, proper fractions with different denominators and percentages, using the symbols =, > and <.'],
  ['6Nf.09', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate, add and subtract numbers with the same or different number of decimal places.'],
  ['6Nf.10', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate and multiply numbers with one or two decimal places by 1-digit and 2-digit whole numbers.'],
  ['6Nf.11', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Estimate and divide numbers with one or two decimal places by whole numbers.'],
  ['6Nf.12', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Understand the relationship between two quantities when they are in direct proportion.'],
  ['6Nf.13', '6', 'Fractions, decimals, percentages, ratio and proportion', 'Use knowledge of equivalence to understand and use equivalent ratios.'],
  ['6Gt.01', '6', 'Time', 'Convert between time intervals expressed as a decimal and in mixed units.'],
  ['6Gg.01', '6', 'Geometrical reasoning, shapes and measurements', 'Identify, describe, classify and sketch quadrilaterals, including reference to angles, symmetrical properties, parallel sides and diagonals.'],
  ['6Gg.02', '6', 'Geometrical reasoning, shapes and measurements', 'Know the parts of a circle: centre; radius; diameter; circumference.'],
  ['6Gg.03', '6', 'Geometrical reasoning, shapes and measurements', 'Use knowledge of area of rectangles to estimate and calculate the area of right-angled triangles.'],
  ['6Gg.04', '6', 'Geometrical reasoning, shapes and measurements', 'Identify, describe and sketch compound 3D shapes.'],
  ['6Gg.05', '6', 'Geometrical reasoning, shapes and measurements', 'Understand the difference between capacity and volume.'],
  ['6Gg.06', '6', 'Geometrical reasoning, shapes and measurements', 'Identify and sketch different nets for cubes, cuboids, prisms and pyramids.'],
  ['6Gg.07', '6', 'Geometrical reasoning, shapes and measurements', 'Understand the relationship between area of 2D shapes and surface area of 3D shapes.'],
  ['6Gg.08', '6', 'Geometrical reasoning, shapes and measurements', 'Identify rotational symmetry in familiar shapes, patterns or images with maximum order 4. Describe rotational symmetry as \'order x\'.'],
  ['6Gg.09', '6', 'Geometrical reasoning, shapes and measurements', 'Classify, estimate, measure and draw angles.'],
  ['6Gg.10', '6', 'Geometrical reasoning, shapes and measurements', 'Know that the sum of the angles in a triangle is 180°, and use this to calculate missing angles in a triangle.'],
  ['6Gg.11', '6', 'Geometrical reasoning, shapes and measurements', 'Construct circles of a specified radius or diameter.'],
  ['6Gp.01', '6', 'Position and transformation', 'Read and plot coordinates including integers, fractions and decimals, in all four quadrants (with the aid of a grid).'],
  ['6Gp.02', '6', 'Position and transformation', 'Use knowledge of 2D shapes and coordinates to plot points to form lines and shapes in all four quadrants.'],
  ['6Gp.03', '6', 'Position and transformation', 'Translate 2D shapes, identifying the corresponding points between the original and the translated image, on coordinate grids.'],
  ['6Gp.04', '6', 'Position and transformation', 'Reflect 2D shapes in a given mirror line (vertical, horizontal and diagonal), on square grids.'],
  ['6Gp.05', '6', 'Position and transformation', 'Rotate shapes 90° around a vertex (clockwise or anticlockwise).'],
  ['6Ss.01', '6', 'Statistics', 'Plan and conduct an investigation and make predictions for a set of related statistical questions, considering what data to collect (categorical, discrete and continuous data).'],
  ['6Ss.02', '6', 'Statistics', 'Record, organise and represent categorical, discrete and continuous data. Choose and explain which representation to use in a given situation: Venn and Carroll diagrams; tally charts and frequency tables; bar charts; waffle diagrams and pie charts; frequency diagrams for continuous data; line graphs; scatter graphs; dot plots.'],
  ['6Ss.03', '6', 'Statistics', 'Understand that the mode, median, mean and range are ways to describe and summarise data sets. Find and interpret the mode (including bimodal data), median, mean and range, and consider their appropriateness for the context.'],
  ['6Ss.04', '6', 'Statistics', 'Interpret data, identifying patterns, within and between data sets, to answer statistical questions. Discuss conclusions, considering the sources of variation, and check predictions.'],
  ['6Sp.01', '6', 'Probability', 'Use the language associated with probability and proportion to describe and compare possible outcomes.'],
  ['6Sp.02', '6', 'Probability', 'Identify when two events can happen at the same time and when they cannot, and know that the latter are called \'mutually exclusive\'.'],
  ['6Sp.03', '6', 'Probability', 'Recognise that some probabilities can only be modelled through experiments using a large number of trials.'],
  ['6Sp.04', '6', 'Probability', 'Conduct chance experiments or simulations, using small and large numbers of trials. Predict, analyse and describe the frequency of outcomes using the language of probability.']
];

/* ---------------- Science ---------------- */
const SCIENCE = [
  ['SC3-PL-1', '3', 'Plants', 'identify and describe the functions of the roots, stem or trunk, leaves and flowers of flowering plants'],
  ['SC3-PL-2', '3', 'Plants', 'explore what plants need for life and growth (air, light, water, nutrients from soil, room to grow)'],
  ['SC3-PL-3', '3', 'Plants', 'investigate the way in which water is transported within plants'],
  ['SC3-PL-4', '3', 'Plants', 'explore the part flowers play in the life cycle of flowering plants: pollination, seed formation and seed dispersal'],
  ['SC3-AH-1', '3', 'Animals, including humans', 'identify that animals, including humans, need the right types and amount of nutrition from what they eat'],
  ['SC3-AH-2', '3', 'Animals, including humans', 'identify that humans and some other animals have skeletons and muscles for support, protection and movement'],
  ['SC3-RO-1', '3', 'Rocks', 'compare and group different kinds of rocks by their appearance and simple physical properties'],
  ['SC3-RO-2', '3', 'Rocks', 'describe in simple terms how fossils are formed; recognise that soils are made from rocks and organic matter'],
  ['SC3-LI-1', '3', 'Light', 'recognise that we need light to see things, that dark is the absence of light, and that light is reflected from surfaces'],
  ['SC3-LI-2', '3', 'Light', 'recognise that light from the sun can be dangerous and how to protect our eyes'],
  ['SC3-LI-3', '3', 'Light', 'recognise that shadows form when light from a light source is blocked by an opaque object, and find patterns in shadow size'],
  ['SC3-FM-1', '3', 'Forces and magnets', 'compare how things move on different surfaces; notice that magnetic forces can act at a distance'],
  ['SC3-FM-2', '3', 'Forces and magnets', 'observe how magnets attract or repel each other and attract some materials and not others'],
  ['SC3-FM-3', '3', 'Forces and magnets', 'describe magnets as having two poles and predict whether two magnets will attract or repel'],
  ['SC4-LT-1', '4', 'Living things and their habitats', 'recognise that living things can be grouped in a variety of ways and use classification keys'],
  ['SC4-LT-2', '4', 'Living things and their habitats', 'recognise that environments can change and that this can sometimes pose dangers to living things'],
  ['SC4-AH-1', '4', 'Animals, including humans', 'describe the simple functions of the basic parts of the digestive system in humans'],
  ['SC4-AH-2', '4', 'Animals, including humans', 'identify the different types of teeth in humans and their simple functions'],
  ['SC4-AH-3', '4', 'Animals, including humans', 'construct and interpret food chains, identifying producers, predators and prey'],
  ['SC4-SM-1', '4', 'States of matter', 'compare and group materials as solids, liquids or gases'],
  ['SC4-SM-2', '4', 'States of matter', 'observe that some materials change state when heated or cooled, and find the temperature in °C'],
  ['SC4-SM-3', '4', 'States of matter', 'identify the part played by evaporation and condensation in the water cycle'],
  ['SC4-SO-1', '4', 'Sound', 'identify how sounds are made by vibrating and that vibrations travel through a medium to the ear'],
  ['SC4-SO-2', '4', 'Sound', 'find patterns between pitch and the object that made it, and between volume and the strength of the vibrations'],
  ['SC4-SO-3', '4', 'Sound', 'recognise that sounds get fainter as the distance from the sound source increases'],
  ['SC4-EL-1', '4', 'Electricity', 'identify common appliances that run on electricity'],
  ['SC4-EL-2', '4', 'Electricity', 'construct a simple series circuit and name its parts: cells, wires, bulbs, switches and buzzers'],
  ['SC4-EL-3', '4', 'Electricity', 'identify whether a lamp will light in a series circuit and how a switch opens and closes a circuit'],
  ['SC4-EL-4', '4', 'Electricity', 'recognise some common conductors and insulators, and associate metals with being good conductors'],
  ['SC5-LT-1', '5', 'Living things and their habitats', 'describe the differences in the life cycles of a mammal, an amphibian, an insect and a bird'],
  ['SC5-LT-2', '5', 'Living things and their habitats', 'describe the life process of reproduction in some plants and animals'],
  ['SC5-AH-1', '5', 'Animals, including humans', 'describe the changes as humans develop to old age'],
  ['SC5-MA-1', '5', 'Properties and changes of materials', 'compare and group everyday materials by hardness, solubility, transparency, conductivity and response to magnets'],
  ['SC5-MA-2', '5', 'Properties and changes of materials', 'know that some materials dissolve to form a solution, and describe how to recover a substance from a solution'],
  ['SC5-MA-3', '5', 'Properties and changes of materials', 'decide how mixtures might be separated, including filtering, sieving and evaporating'],
  ['SC5-MA-4', '5', 'Properties and changes of materials', 'give reasons, based on fair tests, for the uses of everyday materials, including metals, wood and plastic'],
  ['SC5-MA-5', '5', 'Properties and changes of materials', 'show that dissolving, mixing and changes of state are reversible, and that burning makes new materials and is not usually reversible'],
  ['SC5-ES-1', '5', 'Earth and space', 'describe the movement of the Earth and other planets relative to the Sun in the solar system'],
  ['SC5-ES-2', '5', 'Earth and space', 'describe the movement of the Moon relative to the Earth'],
  ['SC5-ES-3', '5', 'Earth and space', 'describe the Sun, Earth and Moon as approximately spherical bodies'],
  ['SC5-ES-4', '5', 'Earth and space', "use the idea of the Earth's rotation to explain day and night and the sun's apparent movement across the sky"],
  ['SC5-FO-1', '5', 'Forces', 'explain that unsupported objects fall towards the Earth because of the force of gravity'],
  ['SC5-FO-2', '5', 'Forces', 'identify the effects of air resistance, water resistance and friction'],
  ['SC5-FO-3', '5', 'Forces', 'recognise that levers, pulleys and gears allow a smaller force to have a greater effect'],
  ['SC6-LT-1', '6', 'Living things and their habitats', 'describe how living things are classified into broad groups, including micro-organisms, plants and animals'],
  ['SC6-LT-2', '6', 'Living things and their habitats', 'give reasons for classifying plants and animals based on specific characteristics'],
  ['SC6-AH-1', '6', 'Animals, including humans', 'identify and name the main parts of the human circulatory system and the functions of the heart, blood vessels and blood'],
  ['SC6-AH-2', '6', 'Animals, including humans', 'recognise the impact of diet, exercise, drugs and lifestyle on the way the body functions'],
  ['SC6-AH-3', '6', 'Animals, including humans', 'describe how nutrients and water are transported within animals, including humans'],
  ['SC6-EI-1', '6', 'Evolution and inheritance', 'recognise that living things have changed over time and that fossils give information about living things from millions of years ago'],
  ['SC6-EI-2', '6', 'Evolution and inheritance', 'recognise that offspring vary and are not identical to their parents'],
  ['SC6-EI-3', '6', 'Evolution and inheritance', 'identify how animals and plants are adapted to suit their environment and that adaptation may lead to evolution'],
  ['SC6-LI-1', '6', 'Light', 'recognise that light appears to travel in straight lines and use this to explain how we see objects'],
  ['SC6-LI-2', '6', 'Light', 'use the idea that light travels in straight lines to explain why shadows have the same shape as the objects that cast them'],
  ['SC6-EL-1', '6', 'Electricity', 'associate the brightness of a lamp or volume of a buzzer with the number and voltage of cells in the circuit'],
  ['SC6-EL-2', '6', 'Electricity', 'compare and explain how components work, and use recognised symbols to draw a simple circuit'],
  ['SC34-WS-1', '34', 'Working scientifically', 'ask relevant questions and set up simple practical enquiries, comparative and fair tests'],
  ['SC34-WS-2', '34', 'Working scientifically', 'make careful observations and accurate measurements using standard units and equipment such as thermometers'],
  ['SC34-WS-3', '34', 'Working scientifically', 'gather, record, classify and present data using drawings, labelled diagrams, keys, bar charts and tables'],
  ['SC34-WS-4', '34', 'Working scientifically', 'use results to draw simple conclusions, make predictions, suggest improvements and raise further questions'],
  ['SC56-WS-1', '56', 'Working scientifically', 'plan different types of scientific enquiries, recognising and controlling variables where necessary'],
  ['SC56-WS-2', '56', 'Working scientifically', 'take measurements with increasing accuracy and precision, taking repeat readings when appropriate'],
  ['SC56-WS-3', '56', 'Working scientifically', 'record data using scientific diagrams, classification keys, tables, scatter graphs, bar and line graphs'],
  ['SC56-WS-4', '56', 'Working scientifically', 'report findings, including conclusions, causal relationships and how far the results can be trusted; identify evidence that supports or refutes ideas']
];

/* ---------------- English ---------------- */
const ENGLISH = [
  ['EN-SL-1', 'KS2', 'Spoken language', 'listen and respond appropriately; ask relevant questions to extend understanding'],
  ['EN-SL-2', 'KS2', 'Spoken language', 'articulate and justify answers, arguments and opinions'],
  ['EN-SL-3', 'KS2', 'Spoken language', 'give well-structured descriptions, explanations and narratives for different purposes'],
  ['EN-SL-4', 'KS2', 'Spoken language', 'participate in discussions, presentations, performances, role play, improvisations and debates'],
  ['EN-SL-5', 'KS2', 'Spoken language', 'consider and evaluate different viewpoints, building on the contributions of others'],
  ['EN34-WR-1', '34', 'Reading: word reading', 'apply knowledge of root words, prefixes and suffixes to read aloud and understand new words'],
  ['EN34-RC-1', '34', 'Reading: comprehension', 'listen to and discuss a wide range of fiction, poetry, plays, non-fiction and reference books'],
  ['EN34-RC-2', '34', 'Reading: comprehension', 'become familiar with fairy stories, myths and legends, and retell some of these orally'],
  ['EN34-RC-3', '34', 'Reading: comprehension', 'prepare poems and play scripts to read aloud and perform, using intonation, tone, volume and action'],
  ['EN34-RC-4', '34', 'Reading: comprehension', 'discuss words and phrases that capture the reader’s interest and imagination; recognise different forms of poetry'],
  ['EN34-RC-5', '34', 'Reading: comprehension', 'check that the text makes sense, ask questions and explain the meaning of words in context'],
  ['EN34-RC-6', '34', 'Reading: comprehension', 'draw inferences about characters’ feelings, thoughts and motives, and justify them with evidence'],
  ['EN34-RC-7', '34', 'Reading: comprehension', 'predict what might happen from details stated and implied'],
  ['EN34-RC-8', '34', 'Reading: comprehension', 'identify main ideas drawn from more than one paragraph and summarise these'],
  ['EN34-RC-9', '34', 'Reading: comprehension', 'retrieve and record information from non-fiction'],
  ['EN56-WR-1', '56', 'Reading: word reading', 'apply knowledge of root words, prefixes and suffixes (morphology and etymology) to read and understand new words'],
  ['EN56-RC-1', '56', 'Reading: comprehension', 'read and discuss modern fiction, fiction from our literary heritage, and books from other cultures and traditions'],
  ['EN56-RC-2', '56', 'Reading: comprehension', 'identify and discuss themes and conventions; make comparisons within and across books'],
  ['EN56-RC-3', '56', 'Reading: comprehension', 'learn a wider range of poetry by heart; prepare poems and plays to perform'],
  ['EN56-RC-4', '56', 'Reading: comprehension', 'draw inferences about characters’ feelings, thoughts and motives, and justify them with evidence'],
  ['EN56-RC-5', '56', 'Reading: comprehension', 'summarise the main ideas from more than one paragraph, identifying key supporting details'],
  ['EN56-RC-6', '56', 'Reading: comprehension', 'discuss and evaluate how authors use language, including figurative language, and its impact on the reader'],
  ['EN56-RC-7', '56', 'Reading: comprehension', 'distinguish between statements of fact and opinion'],
  ['EN56-RC-8', '56', 'Reading: comprehension', 'retrieve, record and present information from non-fiction'],
  ['EN56-RC-9', '56', 'Reading: comprehension', 'explain their understanding through formal presentations and debates, giving reasoned justifications for views'],
  ['EN34-SP-1', '34', 'Writing: spelling', 'use further prefixes and suffixes, spell further homophones and words that are often misspelt'],
  ['EN34-SP-2', '34', 'Writing: spelling', 'place the possessive apostrophe accurately with regular and irregular plurals'],
  ['EN56-SP-1', '56', 'Writing: spelling', 'use further prefixes and suffixes, words with silent letters, and homophones and other words often confused'],
  ['EN56-SP-2', '56', 'Writing: spelling', 'use dictionaries and a thesaurus to check spelling and meaning'],
  ['EN34-HW-1', '34', 'Writing: handwriting', 'use the diagonal and horizontal strokes needed to join letters; increase legibility and consistency'],
  ['EN56-HW-1', '56', 'Writing: handwriting', 'write legibly, fluently and with increasing speed'],
  ['EN34-CO-1', '34', 'Writing: composition', 'plan writing by discussing similar writing and recording ideas'],
  ['EN34-CO-2', '34', 'Writing: composition', 'draft by rehearsing sentences orally, building a varied vocabulary and range of sentence structures'],
  ['EN34-CO-3', '34', 'Writing: composition', 'organise paragraphs around a theme; in narratives create settings, characters and plot; in non-fiction use headings'],
  ['EN34-CO-4', '34', 'Writing: composition', 'evaluate and edit writing, proof-read for errors, and read their writing aloud'],
  ['EN56-CO-1', '56', 'Writing: composition', 'plan by identifying the audience and purpose, choosing the right form and using models'],
  ['EN56-CO-2', '56', 'Writing: composition', 'describe settings, characters and atmosphere and integrate dialogue to convey character and advance the action'],
  ['EN56-CO-3', '56', 'Writing: composition', 'précis longer passages and use a wide range of devices to build cohesion within and across paragraphs'],
  ['EN56-CO-4', '56', 'Writing: composition', 'use organisational and presentational devices such as headings, bullet points and underlining'],
  ['EN56-CO-5', '56', 'Writing: composition', 'evaluate and edit: improve vocabulary, grammar and punctuation, keep tense consistent and choose the right register'],
  ['EN3-GP-1', '3', 'Grammar and punctuation', 'express time, place and cause using conjunctions, adverbs and prepositions (when, before, after, so, because)'],
  ['EN3-GP-2', '3', 'Grammar and punctuation', 'form nouns using prefixes (super–, anti–, auto–) and use a or an correctly'],
  ['EN3-GP-3', '3', 'Grammar and punctuation', 'use paragraphs to group related material, and headings and sub-headings'],
  ['EN3-GP-4', '3', 'Grammar and punctuation', 'use the present perfect form of verbs instead of the simple past'],
  ['EN3-GP-5', '3', 'Grammar and punctuation', 'use inverted commas to punctuate direct speech'],
  ['EN4-GP-1', '4', 'Grammar and punctuation', 'tell the difference between plural and possessive –s, and use apostrophes to mark plural possession'],
  ['EN4-GP-2', '4', 'Grammar and punctuation', 'use Standard English verb forms instead of local spoken forms'],
  ['EN4-GP-3', '4', 'Grammar and punctuation', 'expand noun phrases with adjectives, nouns and preposition phrases'],
  ['EN4-GP-4', '4', 'Grammar and punctuation', 'use fronted adverbials, with a comma after them'],
  ['EN4-GP-5', '4', 'Grammar and punctuation', 'use paragraphs to organise ideas around a theme and choose nouns or pronouns to aid cohesion'],
  ['EN4-GP-6', '4', 'Grammar and punctuation', 'use inverted commas and other punctuation to indicate direct speech'],
  ['EN5-GP-1', '5', 'Grammar and punctuation', 'convert nouns or adjectives into verbs with suffixes (–ate, –ise, –ify) and use verb prefixes (dis–, de–, mis–, over–, re–)'],
  ['EN5-GP-2', '5', 'Grammar and punctuation', 'use relative clauses beginning with who, which, where, when, whose or that'],
  ['EN5-GP-3', '5', 'Grammar and punctuation', 'indicate degrees of possibility using adverbs (perhaps, surely) or modal verbs (might, should, will, must)'],
  ['EN5-GP-4', '5', 'Grammar and punctuation', 'build cohesion within and across paragraphs using adverbials of time, place and number'],
  ['EN5-GP-5', '5', 'Grammar and punctuation', 'use brackets, dashes or commas to indicate parenthesis, and commas to clarify meaning'],
  ['EN6-GP-1', '6', 'Grammar and punctuation', 'tell informal from formal vocabulary and structures, including the subjunctive'],
  ['EN6-GP-2', '6', 'Grammar and punctuation', 'understand how words are related as synonyms and antonyms'],
  ['EN6-GP-3', '6', 'Grammar and punctuation', 'use the passive to affect the presentation of information in a sentence'],
  ['EN6-GP-4', '6', 'Grammar and punctuation', 'link ideas across paragraphs using repetition, grammatical connections and ellipsis; use layout devices'],
  ['EN6-GP-5', '6', 'Grammar and punctuation', 'use the semi-colon, colon and dash between independent clauses, colons and semi-colons in lists, and hyphens to avoid ambiguity']
];

/* ---------------- Computing, history, geography, art, D&T, music, PE (KS2 programmes of study) ---------------- */
const COMPUTING = [
  ['CO-1', 'KS2', 'Programming', 'design, write and debug programs that accomplish specific goals, including controlling or simulating physical systems; solve problems by decomposing them'],
  ['CO-2', 'KS2', 'Programming', 'use sequence, selection and repetition in programs; work with variables and forms of input and output'],
  ['CO-3', 'KS2', 'Programming', 'use logical reasoning to explain how simple algorithms work and to detect and correct errors in algorithms and programs'],
  ['CO-4', 'KS2', 'Networks and the internet', 'understand computer networks, including the internet, the services they provide such as the world wide web, and the opportunities for communication and collaboration'],
  ['CO-5', 'KS2', 'Searching and evaluating', 'use search technologies effectively, appreciate how results are selected and ranked, and be discerning in evaluating digital content'],
  ['CO-6', 'KS2', 'Creating with software', 'select, use and combine software on a range of devices to create programs, systems and content, including collecting, analysing and presenting data'],
  ['CO-7', 'KS2', 'Online safety', 'use technology safely, respectfully and responsibly; recognise acceptable and unacceptable behaviour; know ways to report concerns about content and contact']
];
const HISTORY = [
  ['HI-1', 'KS2', 'British history', 'changes in Britain from the Stone Age to the Iron Age'],
  ['HI-2', 'KS2', 'British history', 'the Roman Empire and its impact on Britain'],
  ['HI-3', 'KS2', 'British history', 'Britain’s settlement by Anglo-Saxons and Scots'],
  ['HI-4', 'KS2', 'British history', 'the Viking and Anglo-Saxon struggle for the Kingdom of England to the time of Edward the Confessor'],
  ['HI-5', 'KS2', 'British history', 'a local history study'],
  ['HI-6', 'KS2', 'British history', 'a study of an aspect or theme in British history beyond 1066'],
  ['HI-7', 'KS2', 'World history', 'the achievements of the earliest civilizations: Ancient Sumer, the Indus Valley, Ancient Egypt or the Shang Dynasty of Ancient China'],
  ['HI-8', 'KS2', 'World history', 'Ancient Greece: Greek life and achievements and their influence on the western world'],
  ['HI-9', 'KS2', 'World history', 'a non-European society: early Islamic civilization (Baghdad c. AD 900), Mayan civilization c. AD 900, or Benin (West Africa) c. AD 900-1300'],
  ['HI-SK-1', 'KS2', 'Historical skills', 'develop a chronologically secure knowledge of British, local and world history, noting connections, contrasts and trends over time'],
  ['HI-SK-2', 'KS2', 'Historical skills', 'ask and answer historically valid questions about change, cause, similarity and difference, and significance'],
  ['HI-SK-3', 'KS2', 'Historical skills', 'understand how our knowledge of the past is constructed from a range of sources']
];
const GEOGRAPHY = [
  ['GE-LK-1', 'KS2', 'Locational knowledge', 'locate the world’s countries, focusing on Europe (including Russia) and North and South America, their regions, features and major cities'],
  ['GE-LK-2', 'KS2', 'Locational knowledge', 'name and locate counties and cities of the United Kingdom, their features (hills, mountains, coasts and rivers) and land use'],
  ['GE-LK-3', 'KS2', 'Locational knowledge', 'identify latitude, longitude, the Equator, hemispheres, the Tropics, the Arctic and Antarctic Circles, the Prime Meridian and time zones'],
  ['GE-PK-1', 'KS2', 'Place knowledge', 'compare the human and physical geography of a region of the UK, a region in Europe and a region in North or South America'],
  ['GE-HP-1', 'KS2', 'Physical geography', 'describe and understand climate zones, biomes and vegetation belts, rivers, mountains, volcanoes, earthquakes and the water cycle'],
  ['GE-HP-2', 'KS2', 'Human geography', 'describe and understand types of settlement and land use, economic activity including trade links, and the distribution of natural resources'],
  ['GE-SK-1', 'KS2', 'Geographical skills', 'use maps, atlases, globes and digital mapping to locate countries and describe features'],
  ['GE-SK-2', 'KS2', 'Geographical skills', 'use the eight points of a compass, four- and six-figure grid references, symbols and keys, including Ordnance Survey maps'],
  ['GE-SK-3', 'KS2', 'Fieldwork', 'use fieldwork to observe, measure, record and present features of the local area, using sketch maps, plans, graphs and digital technologies']
];
const ART = [
  ['AD-1', 'KS2', 'Sketchbooks', 'create sketchbooks to record observations and use them to review and revisit ideas'],
  ['AD-2', 'KS2', 'Techniques', 'improve mastery of drawing, painting and sculpture with a range of materials, such as pencil, charcoal, paint and clay'],
  ['AD-3', 'KS2', 'Artists and designers', 'learn about great artists, architects and designers in history']
];
const DT = [
  ['DT-DE-1', 'KS2', 'Design', 'use research to develop design criteria for innovative, functional, appealing products for particular users'],
  ['DT-DE-2', 'KS2', 'Design', 'generate, develop, model and communicate ideas through discussion, annotated sketches, diagrams, prototypes and pattern pieces'],
  ['DT-MK-1', 'KS2', 'Make', 'select and use a wider range of tools and equipment to cut, shape, join and finish accurately'],
  ['DT-MK-2', 'KS2', 'Make', 'select and use materials and components, including construction materials, textiles and ingredients, by their properties'],
  ['DT-EV-1', 'KS2', 'Evaluate', 'investigate and analyse existing products and evaluate their own ideas against design criteria'],
  ['DT-EV-2', 'KS2', 'Evaluate', 'understand how key events and individuals in design and technology have helped shape the world'],
  ['DT-TK-1', 'KS2', 'Technical knowledge', 'strengthen, stiffen and reinforce more complex structures'],
  ['DT-TK-2', 'KS2', 'Technical knowledge', 'use mechanical systems (gears, pulleys, cams, levers and linkages) and electrical systems (series circuits with switches, bulbs, buzzers and motors)'],
  ['DT-TK-3', 'KS2', 'Technical knowledge', 'apply computing to program, monitor and control products'],
  ['DT-CN-1', 'KS2', 'Cooking and nutrition', 'understand and apply the principles of a healthy and varied diet; prepare and cook mainly savoury dishes'],
  ['DT-CN-2', 'KS2', 'Cooking and nutrition', 'understand seasonality and know where and how ingredients are grown, reared, caught and processed']
];
const MUSIC = [
  ['MU-1', 'KS2', 'Performing', 'play and perform in solo and ensemble contexts, using voices and instruments with accuracy, fluency, control and expression'],
  ['MU-2', 'KS2', 'Composing', 'improvise and compose music using the inter-related dimensions of music (pitch, duration, dynamics, tempo, timbre, texture, structure)'],
  ['MU-3', 'KS2', 'Listening', 'listen with attention to detail and recall sounds with increasing aural memory'],
  ['MU-4', 'KS2', 'Notation', 'use and understand staff and other musical notations'],
  ['MU-5', 'KS2', 'Appreciating', 'appreciate a wide range of live and recorded music from different traditions and from great composers and musicians'],
  ['MU-6', 'KS2', 'History of music', 'develop an understanding of the history of music']
];
const PE = [
  ['PE-1', 'KS2', 'Games', 'use running, jumping, throwing and catching in isolation and in combination'],
  ['PE-2', 'KS2', 'Games', 'play competitive games, modified where appropriate, and apply basic principles of attacking and defending'],
  ['PE-3', 'KS2', 'Gymnastics and athletics', 'develop flexibility, strength, technique, control and balance'],
  ['PE-4', 'KS2', 'Dance', 'perform dances using a range of movement patterns'],
  ['PE-5', 'KS2', 'Outdoor and adventurous', 'take part in outdoor and adventurous activity challenges individually and in a team'],
  ['PE-6', 'KS2', 'Evaluating', 'compare performances with previous ones and demonstrate improvement to achieve a personal best'],
  ['PE-SW-1', 'KS2', 'Swimming and water safety', 'swim competently over at least 25 metres, use a range of strokes and perform safe self-rescue']
];

/* ---------------- PSHE (statutory Relationships and Health Education, by the end of primary) ---------------- */
const PSHE = [
  ['RS-1', 'KS2', 'Families and people who care for me', 'families give love, security and stability; families can look different and all deserve respect'],
  ['RS-2', 'KS2', 'Caring friendships', 'how to make and keep friends, and how to tell when a friendship makes them feel unhappy or uncomfortable'],
  ['RS-3', 'KS2', 'Respectful relationships', 'respect others, even when they are very different; know what bullying is, its impact and how to get help'],
  ['RS-4', 'KS2', 'Online relationships', 'people sometimes behave differently online, including pretending to be someone they are not; how to stay safe and respectful online'],
  ['RS-5', 'KS2', 'Being safe', 'what is appropriate contact, how to ask for help for themselves or others, and to keep trying until they are heard'],
  ['HE-1', 'KS2', 'Mental wellbeing', 'mental wellbeing is part of daily life; how to talk about feelings and simple self-care such as sleep, time outdoors and hobbies'],
  ['HE-2', 'KS2', 'Internet safety and harms', 'the benefits and risks of the internet, rationing screen time, and how to report worries'],
  ['HE-3', 'KS2', 'Physical health and fitness', 'the benefits of regular exercise and an active lifestyle'],
  ['HE-4', 'KS2', 'Healthy eating', 'what makes a healthy diet and the risks of unhealthy eating'],
  ['HE-5', 'KS2', 'Drugs, alcohol and tobacco', 'the facts about legal and illegal harmful substances and their risks, including smoking and alcohol'],
  ['HE-6', 'KS2', 'Health and prevention', 'sun safety, good sleep, dental health, hygiene and how germs spread'],
  ['HE-7', 'KS2', 'Basic first aid', 'how to make a clear call to the emergency services and basic first aid for common injuries'],
  ['HE-8', 'KS2', 'Changing adolescent body', 'key facts about puberty and the changing body, from about age 9 to 11']
];

/* ---------------- RE (RE Council national framework 2013, KS2; the agreed syllabus decides content) ---------------- */
const RE = [
  ['RE-A1', 'KS2', 'Know about religions and worldviews', 'describe celebrations, worship, pilgrimages and rituals that mark important points in life, and reflect on their significance'],
  ['RE-A2', 'KS2', 'Know about religions and worldviews', 'describe links between stories and other aspects of the communities studied, responding to sources of wisdom'],
  ['RE-A3', 'KS2', 'Know about religions and worldviews', 'explore and describe beliefs, symbols and actions to understand different ways of life and ways of expressing meaning'],
  ['RE-B1', 'KS2', 'Express ideas and insights', 'explain, with reasons, the meanings and significance of religions and worldviews to individuals and communities'],
  ['RE-B2', 'KS2', 'Express ideas and insights', 'understand the challenges of commitment to a community of faith or belief, and why belonging can be valuable'],
  ['RE-B3', 'KS2', 'Express ideas and insights', 'explore similarities and differences within and between religions and worldviews'],
  ['RE-C1', 'KS2', 'Gain and use skills', 'discuss their own and others’ views on questions about belonging, meaning, purpose and truth'],
  ['RE-C2', 'KS2', 'Gain and use skills', 'consider how diverse communities can live together for the wellbeing of all, with respect for others'],
  ['RE-C3', 'KS2', 'Gain and use skills', 'discuss ethical questions about what is right and wrong, just and fair, and express their own ideas clearly']
];

/* ---------------- Languages: KS2 programme of study (applies to Mandarin, French and Spanish) ---------------- */
const LANGUAGES = [
  ['LA-1', 'KS2', 'Listening', 'listen attentively to spoken language and show understanding by joining in and responding'],
  ['LA-2', 'KS2', 'Sounds and patterns', 'explore the patterns and sounds of language through songs and rhymes, and link spelling, sound and meaning'],
  ['LA-3', 'KS2', 'Speaking', 'engage in conversations; ask and answer questions; express opinions and respond to those of others; seek clarification and help'],
  ['LA-4', 'KS2', 'Speaking', 'speak in sentences using familiar vocabulary, phrases and basic language structures'],
  ['LA-5', 'KS2', 'Pronunciation', 'develop accurate pronunciation and intonation when reading aloud or using familiar words and phrases'],
  ['LA-6', 'KS2', 'Speaking', 'present ideas and information orally to a range of audiences'],
  ['LA-7', 'KS2', 'Reading', 'read carefully and show understanding of words, phrases and simple writing'],
  ['LA-8', 'KS2', 'Reading', 'appreciate stories, songs, poems and rhymes in the language'],
  ['LA-9', 'KS2', 'Vocabulary', 'broaden vocabulary and understand new words, including by using a dictionary'],
  ['LA-10', 'KS2', 'Writing', 'write phrases from memory and adapt them to create new sentences that express ideas clearly'],
  ['LA-11', 'KS2', 'Writing', 'describe people, places, things and actions orally and in writing'],
  ['LA-12', 'KS2', 'Grammar', 'understand basic grammar of the language, including key patterns, high-frequency verbs and how it compares with English']
];
/* Extra skill focus for Mandarin (a school focus, not a statutory statement). */
const MANDARIN = [
  ['ZH-1', 'KS2', 'Mandarin focus: pinyin and tones', 'read and say pinyin with the four tones and the neutral tone accurately'],
  ['ZH-2', 'KS2', 'Mandarin focus: characters', 'recognise and write common characters with the correct stroke order, using radicals as clues to meaning'],
  ['ZH-3', 'KS2', 'Mandarin focus: sentence patterns', 'use measure words and simple sentence patterns such as 我有…, 我喜欢…, 这是…']
];

/* ---------------- Bahasa Melayu: KSSR skill areas (statements in Malay, with an English gloss) ---------------- */
const BM = [
  ['BM-MB-1', 'KS2', 'Kemahiran Mendengar dan Bertutur', 'mendengar dan memberikan respons kepada pelbagai bahan dengan betul (listen and respond correctly to different texts)'],
  ['BM-MB-2', 'KS2', 'Kemahiran Mendengar dan Bertutur', 'bertutur untuk menyampaikan maklumat, idea dan pendapat dengan sopan (speak politely to share information, ideas and opinions)'],
  ['BM-MB-3', 'KS2', 'Kemahiran Mendengar dan Bertutur', 'bercerita dan menceritakan semula dengan sebutan dan intonasi yang betul (tell and retell stories with correct pronunciation and intonation)'],
  ['BM-BC-1', 'KS2', 'Kemahiran Membaca', 'membaca kuat dengan sebutan, intonasi dan kelancaran yang betul (read aloud fluently with correct pronunciation and intonation)'],
  ['BM-BC-2', 'KS2', 'Kemahiran Membaca', 'membaca dan memahami perkataan, frasa, ayat dan petikan (read and understand words, phrases, sentences and passages)'],
  ['BM-BC-3', 'KS2', 'Kemahiran Membaca', 'membaca, memahami dan memberikan respons kepada bahan sastera dan bukan sastera (read and respond to literary and non-literary texts)'],
  ['BM-TL-1', 'KS2', 'Kemahiran Menulis', 'menulis perkataan, frasa dan ayat dengan ejaan dan tanda baca yang betul (write words, phrases and sentences with correct spelling and punctuation)'],
  ['BM-TL-2', 'KS2', 'Kemahiran Menulis', 'membina dan menulis ayat tunggal dan ayat majmuk (build and write simple and compound sentences)'],
  ['BM-TL-3', 'KS2', 'Kemahiran Menulis', 'menghasilkan penulisan berpandu dan karangan pendek (write guided texts and short compositions)'],
  ['BM-SB-1', 'KS2', 'Aspek Seni Bahasa', 'menghasilkan dan mempersembahkan karya kreatif seperti pantun, syair, sajak dan lagu (create and perform pantun, syair, poems and songs)'],
  ['BM-SB-2', 'KS2', 'Aspek Seni Bahasa', 'memahami dan menggunakan peribahasa, simpulan bahasa dan bahasa kiasan (understand and use proverbs, idioms and figurative language)'],
  ['BM-TB-1', 'KS2', 'Aspek Tatabahasa', 'memahami dan menggunakan golongan kata: kata nama, kata kerja, kata adjektif dan kata tugas (word classes)'],
  ['BM-TB-2', 'KS2', 'Aspek Tatabahasa', 'memahami dan menggunakan imbuhan awalan, akhiran, apitan dan sisipan (affixes)'],
  ['BM-TB-3', 'KS2', 'Aspek Tatabahasa', 'menggunakan kata ganti nama, penjodoh bilangan dan kata sendi nama dengan betul (pronouns, numeral classifiers and prepositions)'],
  ['BM-TB-4', 'KS2', 'Aspek Tatabahasa', 'memahami dan membina ayat tunggal, ayat majmuk, ayat aktif dan ayat pasif (simple, compound, active and passive sentences)']
];

const ROWS = { maths: MATHS, science: SCIENCE, english: ENGLISH, computing: COMPUTING, history: HISTORY, geography: GEOGRAPHY, art: ART, dt: DT, music: MUSIC, pe: PE, pshe: PSHE, re: RE, bm: BM, mandarin: LANGUAGES.concat(MANDARIN), french: LANGUAGES, spanish: LANGUAGES };
const toObj = (r) => ({ code: r[0], years: r[1], strand: r[2], text: r[3] });
export const objectivesFor = (subjectId) => (ROWS[subjectId] || []).map(toObj);
const BY_CODE = new Map();
Object.values(ROWS).forEach((rows) => rows.forEach((r) => BY_CODE.set(r[0], toObj(r))));
export const objective = (code) => BY_CODE.get(code) || null;
export const yearNum = (year) => { const m = /(\d)/.exec(String(year || '')); return m ? m[1] : ''; };
export function fits(o, y) { return !y || o.years === 'KS2' || o.years === y || (o.years.length === 2 && o.years.includes(y)); }
export const isStageCode = (code) => /^[1-6][A-Z][a-z]\.\d{2}$/.test(String(code || ''));      // a Cambridge Primary code
export const yearsLabel = (o) => (o.years === 'KS2' ? 'KS2' : o.years.length === 2 ? 'Years ' + o.years[0] + '-' + o.years[1] : (isStageCode(o.code) ? 'Stage ' : 'Year ') + o.years);
export const strandsFor = (subjectId, year) => {
  const y = yearNum(year), seen = new Set();
  return objectivesFor(subjectId).filter((o) => fits(o, y) && !seen.has(o.strand) && seen.add(o.strand)).map((o) => o.strand);
};

/* ---------------- matching a topic to objectives ---------------- */
const STOP = new Set('a an the and or of to in on for with without using use including their them they how what which that this these those from by as at be is are was were our my your lesson lessons year years ks2 about into all some more most other than then also can will should would could do does did make making learn learning teach teaching today pupils children class unit number numbers'.split(' '));
/* Everyday teacher words mapped onto the words the curriculum uses. */
const SYN = {
  'times table': 'timestable multiply', 'times tables': 'timestable multiply', times: 'multiply multiplication', multiply: 'multiplication', share: 'divide division', sharing: 'divide division',
  'take away': 'subtract subtraction', minus: 'subtract subtraction', plus: 'add addition', sum: 'add addition', 'rounding off': 'round', 'round off': 'round', rounding: 'round', estimate: 'estimate round',
  amounts: 'quantities amounts', amount: 'quantities amounts', percent: 'per cent percentages', percentage: 'per cent percentages', clock: 'time clocks', clocks: 'time', money: 'money pounds pence change', coins: 'money', shape: 'shapes', '2d': '2-d shapes', '3d': '3-d shapes',
  graph: 'graphs charts', graphs: 'graphs charts', chart: 'charts', tally: 'tables data', data: 'data', decimal: 'decimals decimal', fraction: 'fractions', angle: 'angles', degrees: 'angles degrees', symmetry: 'symmetry symmetric',
  coordinates: 'coordinates grid quadrant', negative: 'negative numbers integers', 'place value': 'place value digit', perimeter: 'perimeter', area: 'area', volume: 'volume capacity', mass: 'mass weight', weight: 'mass', length: 'length measure',
  'roman numerals': 'roman numerals', prime: 'prime', factors: 'factors factor', multiples: 'multiples', ratio: 'ratio ratios proportion', algebra: 'algebra formulae equation', mean: 'mean average', average: 'mean average',
  'pie chart': 'pie charts', 'column addition': 'columnar addition formal written add regroup whole digits', 'column subtraction': 'columnar subtraction formal written subtract regroup whole digits', 'long division': 'long division divide whole 2-digit', 'long multiplication': 'long multiplication multiply whole 2-digit', 'short division': 'divide whole 1-digit', squares: 'square', cubes: 'cube',
  magnet: 'magnets magnetic', circuit: 'electricity circuit', circuits: 'electricity circuit', battery: 'cells electricity', batteries: 'cells', conductors: 'conductors insulators', teeth: 'teeth', digestion: 'digestive', 'food chain': 'food chains producers predators prey', 'food chains': 'food chains producers predators prey',
  planets: 'earth space solar system sun moon', planet: 'earth space solar system', 'solar system': 'earth space solar system', space: 'earth space', skeleton: 'skeletons muscles', bones: 'skeletons', habitat: 'habitats living things', classification: 'classified classification keys',
  evolution: 'evolution inheritance adapted', adaptation: 'adapted adaptation', fossil: 'fossils', rock: 'rocks soils', soil: 'soils', 'water cycle': 'water cycle evaporation condensation', evaporation: 'evaporation', condensation: 'condensation', melting: 'change state heated',
  solids: 'solids liquids gases states', 'states of matter': 'states matter solids liquids gases', shadow: 'shadows light', mirror: 'reflected light', reflection: 'reflected reflection', gravity: 'gravity', friction: 'friction', 'air resistance': 'air resistance',
  plant: 'plants flowering', flower: 'flowers pollination', seed: 'seed dispersal', heart: 'circulatory heart blood', blood: 'circulatory blood', 'life cycle': 'life cycles', 'life cycles': 'life cycles', materials: 'materials properties', dissolve: 'dissolve solution', 'fair test': 'fair tests enquiries',
  vibration: 'vibrations', pitch: 'pitch', experiment: 'enquiries fair tests', investigation: 'enquiries',
  'fronted adverbials': 'fronted adverbials', 'relative clauses': 'relative clauses', 'expanded noun phrases': 'noun phrases expanded', apostrophe: 'apostrophes possessive', 'inverted commas': 'inverted commas direct speech', speech: 'direct speech inverted commas',
  'speech marks': 'inverted commas direct speech', paragraph: 'paragraphs', conjunction: 'conjunctions', prefix: 'prefixes', suffix: 'suffixes', homophone: 'homophones', 'modal verbs': 'modal verbs possibility', passive: 'passive', semicolon: 'semi-colon',
  parenthesis: 'parenthesis brackets dashes', inference: 'inferences', infer: 'inferences', predict: 'predict', prediction: 'predict', summarise: 'summarise summarising', poetry: 'poetry poems', poem: 'poetry poems', poems: 'poetry poems',
  persuasive: 'audience purpose', 'non-fiction': 'non-fiction', myth: 'myths legends', legend: 'myths legends', 'fairy tale': 'fairy stories', 'fairy tales': 'fairy stories', narrative: 'narratives settings characters plot', story: 'narratives characters settings plot',
  character: 'characters', setting: 'settings', handwriting: 'handwriting join', spelling: 'spelling spell', dictionary: 'dictionaries', simile: 'figurative language', metaphor: 'figurative language', debate: 'debates discussions', fact: 'fact opinion', opinion: 'fact opinion',
  coding: 'programs algorithms sequence', code: 'programs', programming: 'programs', scratch: 'programs sequence selection repetition', algorithm: 'algorithms', debug: 'debug errors', debugging: 'debug errors', loop: 'repetition', loops: 'repetition',
  variable: 'variables', 'if statements': 'selection', internet: 'networks internet', network: 'networks', 'online safety': 'safely respectfully responsibly report concerns', 'e-safety': 'safely respectfully responsibly', search: 'search technologies', spreadsheet: 'data software',
  romans: 'roman empire britain', roman: 'roman empire', vikings: 'viking anglo-saxon', 'anglo-saxons': 'anglo-saxons scots settlement', 'anglo saxons': 'anglo-saxons scots settlement', 'stone age': 'stone age iron age', 'iron age': 'iron age', 'bronze age': 'stone age iron age',
  egypt: 'ancient egypt earliest civilizations', egyptians: 'ancient egypt', greeks: 'ancient greece', greece: 'ancient greece', maya: 'mayan', mayans: 'mayan', benin: 'benin west africa', baghdad: 'early islamic civilization baghdad', 'indus valley': 'indus valley',
  'shang dynasty': 'shang dynasty ancient china', sumer: 'ancient sumer', 'local history': 'local history', 'world war': 'british history beyond 1066 theme', ww2: 'british history beyond 1066 theme', victorians: 'british history beyond 1066 theme', tudors: 'british history beyond 1066 theme',
  volcano: 'volcanoes earthquakes', volcanoes: 'volcanoes earthquakes', earthquake: 'volcanoes earthquakes', river: 'rivers', mountain: 'mountains', biome: 'biomes vegetation belts climate zones', rainforest: 'biomes vegetation belts climate zones', climate: 'climate zones',
  map: 'maps atlases globes', maps: 'maps atlases globes', compass: 'compass grid references', 'grid references': 'grid references', europe: 'europe countries', 'south america': 'north south america', 'north america': 'north south america', uk: 'united kingdom counties cities',
  settlement: 'settlement land use', trade: 'trade links economic activity', fieldwork: 'fieldwork', latitude: 'latitude longitude equator', 'time zones': 'time zones', malaysia: 'countries region',
  drawing: 'drawing sketchbooks', sketch: 'sketchbooks drawing', sketching: 'sketchbooks drawing', portrait: 'drawing painting techniques', portraits: 'drawing painting techniques', collage: 'techniques materials', printing: 'techniques materials', colour: 'painting techniques', painting: 'painting', sculpture: 'sculpture clay', artist: 'great artists', artists: 'great artists', architect: 'architects', composer: 'composers', composers: 'composers', rhythm: 'compose dimensions perform', notation: 'notations staff',
  singing: 'voices perform', song: 'voices perform', instrument: 'instruments', cooking: 'cooking nutrition diet savoury dishes', recipe: 'cooking nutrition', gears: 'gears pulleys cams levers mechanical', structures: 'structures strengthen', textiles: 'textiles materials', bridge: 'structures strengthen',
  gymnastics: 'gymnastics flexibility balance', athletics: 'athletics running jumping throwing', dance: 'dances', swimming: 'swim strokes', football: 'competitive games attacking defending', netball: 'competitive games', badminton: 'competitive games', orienteering: 'outdoor adventurous',
  friendship: 'caring friendships', friends: 'caring friendships', bullying: 'respectful relationships bullying', family: 'families', 'mental health': 'mental wellbeing', feelings: 'mental wellbeing feelings', wellbeing: 'mental wellbeing', 'first aid': 'first aid emergency',
  diet: 'healthy eating diet', drugs: 'drugs alcohol tobacco', puberty: 'puberty changing body', 'screen time': 'internet screen time', hygiene: 'hygiene germs',
  festival: 'celebrations', festivals: 'celebrations', celebration: 'celebrations', worship: 'worship', pilgrimage: 'pilgrimages', christianity: 'religions worldviews', islam: 'religions worldviews', hinduism: 'religions worldviews', sikhism: 'religions worldviews',
  buddhism: 'religions worldviews', judaism: 'religions worldviews', eid: 'celebrations', diwali: 'celebrations', christmas: 'celebrations', 'chinese new year': 'celebrations', vaisakhi: 'celebrations', ethics: 'ethical right wrong',
  pantun: 'pantun', syair: 'syair', sajak: 'sajak', peribahasa: 'peribahasa', imbuhan: 'imbuhan', 'kata nama': 'golongan kata nama', 'kata kerja': 'golongan kata kerja', 'kata adjektif': 'golongan kata adjektif', karangan: 'karangan', membaca: 'membaca', bertutur: 'bertutur',
  ayat: 'ayat', 'penjodoh bilangan': 'penjodoh bilangan', 'kata ganti nama': 'kata ganti nama', 'ayat pasif': 'ayat pasif', 'ayat majmuk': 'ayat majmuk', cerita: 'bercerita',
  greetings: 'conversations familiar phrases', greeting: 'conversations familiar phrases', colours: 'vocabulary describe', food: 'vocabulary', animals: 'vocabulary describe', pets: 'vocabulary describe', weather: 'vocabulary describe', hobbies: 'opinions vocabulary', classroom: 'vocabulary phrases',
  pinyin: 'pinyin tones', tones: 'pinyin tones', characters: 'characters stroke order', 'stroke order': 'characters stroke order', 'measure words': 'measure words sentence patterns'
};
const VERB = { addition: 'add', subtraction: 'subtract', multiplication: 'multiply', division: 'divide', regrouping: 'regroup', translation: 'translate', translations: 'translate', reflection: 'reflect', reflections: 'reflect', rotation: 'rotate', rotations: 'rotate', estimation: 'estimate', construction: 'construct' };
function stem(w) {
  if (VERB[w]) return VERB[w];
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && /(ches|shes|xes|sses)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  return w;
}
const words = (t) => String(t || '').toLowerCase().replace(/[’']/g, '').replace(/\btimes?[ -]tables?\b/g, 'timestable').split(/[^a-z0-9À-ɏ一-鿿-]+/).filter((w) => w && !STOP.has(w));
function tokens(t) { return new Set(words(t).map(stem)); }
function expand(topic) {
  const low = ' ' + String(topic || '').toLowerCase() + ' ', out = new Map();
  tokens(topic).forEach((w) => out.set(w, 1));
  Object.keys(SYN).forEach((k) => { if (low.includes(' ' + k + ' ') || low.includes(' ' + k + 's ') || low.includes(' ' + k + ',')) tokens(SYN[k]).forEach((w) => { if (!out.has(w)) out.set(w, 0.7); }); });
  return out;
}
const IDX = new Map();
function indexed(o) {
  if (!IDX.has(o.code)) IDX.set(o.code, { strand: tokens(o.strand), text: tokens(o.text) });
  return IDX.get(o.code);
}
/* The best-fitting objectives for a topic, most relevant first. Neighbouring years count a little less, so a
   Year 5 class doing Roman numerals still finds the Year 4 and Year 5 statements. */
export function match(subjectId, year, topic, n) {
  const y = yearNum(year), q = expand(topic), low = String(topic || '').toLowerCase();
  if (!q.size) return [];
  const scored = objectivesFor(subjectId).map((o) => {
    const ix = indexed(o), sw = ix.strand.size > 3 ? 1.5 : 3;                  // a long strand name ("Fractions, decimals, percentages, ratio and proportion") says less about one statement
    let s = 0;
    q.forEach((w8, w) => { if (ix.strand.has(w)) s += sw * (w8 < 1 ? w8 * 0.6 : w8); if (ix.text.has(w)) s += 2 * w8; });   // a related word in a strand name counts least
    if (!s) return null;
    const head = o.strand.toLowerCase().split(/[:,]/)[0].trim();
    if (low && head && new RegExp('(^|[^a-z])' + head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])').test(low)) s += 2;
    if (fits(o, y)) s += 2;
    else if (y && /^\d$/.test(o.years) && Math.abs(Number(o.years) - Number(y)) === 1) s -= 1.5;
    else if (y) s -= 4;
    return s > 0 ? Object.assign({ score: Math.round(s * 10) / 10 }, o) : null;
  }).filter(Boolean);
  if (!scored.length) {
    // a small subject (art, music, D&T, PE, computing, RE…): offer its whole programme so the engine can still choose
    const all = objectivesFor(subjectId).filter((o) => fits(o, y));
    return all.length && all.length <= 15 ? all.slice(0, n || 8).map((o) => Object.assign({ score: 0 }, o)) : [];
  }
  return scored.sort((a, b) => b.score - a.score || a.code.localeCompare(b.code)).slice(0, n || 8);
}
/* Only codes from the list we sent are kept. */
export function keepCodes(codes, allowed) {
  const ok = new Set((allowed || []).map((o) => o.code || o));
  const real = new Map(Array.from(ok).map((c) => [String(c).toUpperCase(), c]));             // Cambridge codes have small letters (6Nf.13)
  return Array.from(new Set((Array.isArray(codes) ? codes : []).map((c) => real.get(String(c || '').trim().toUpperCase())).filter(Boolean))).slice(0, 3);
}
