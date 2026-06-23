/**
 * Year 7 curriculum manifest — all 31 VC2M Level 7 codes.
 * Source: VCAA Victorian Curriculum v2.0, VC2_ASExtract-CD-Elab-CCP_23-06-2026.csv
 * Verified by VCAA. Codes use AC9M-style filenames; VC2M equivalent noted per entry.
 *
 * This file is the single source of truth for navigation, content loading,
 * and the strand/substrand browser. Add Year 8–10 strands here when ready.
 */

export interface SubstrandMeta {
  code: string           // AC9M-style code used as JSON filename
  vcCode: string         // Victorian Curriculum v2 code
  label: string          // short student-facing label
  description: string    // one-line description for card
  difficulty?: string    // optional: 'Foundation' | 'Core' | 'Extension'
}

export interface StrandMeta {
  slug: string           // URL segment: /year/7/[slug]
  label: string
  colour: string         // Tailwind-compatible hex
  substrands: SubstrandMeta[]
}

export interface YearMeta {
  year: number
  strands: StrandMeta[]
}

export const YEAR_7: YearMeta = {
  year: 7,
  strands: [
    {
      slug: 'number',
      label: 'Number',
      colour: '#2563EB',
      substrands: [
        { code: 'AC9M7N01', vcCode: 'VC2M7N01', label: 'Squares & Square Roots',           description: 'Perfect squares, square roots and their relationships' },
        { code: 'AC9M7N02', vcCode: 'VC2M7N02', label: 'Index Notation',                    description: 'Powers of 10, prime factorisation using exponent notation' },
        { code: 'AC9M7N03', vcCode: 'VC2M7N03', label: 'Equivalent Fractions',              description: 'Equivalent fractions, simplest form, number lines' },
        { code: 'AC9M7N04', vcCode: 'VC2M7N04', label: 'Rounding & Estimation',             description: 'Rounding decimals; estimating and checking computations' },
        { code: 'AC9M7N05', vcCode: 'VC2M7N05', label: 'Multiply & Divide Fractions',       description: 'Efficient strategies for multiplying and dividing fractions and decimals' },
        { code: 'AC9M7N06', vcCode: 'VC2M7N06', label: 'Four Operations with Fractions',    description: 'Add, subtract, multiply and divide positive fractions and decimals' },
        { code: 'AC9M7N07', vcCode: 'VC2M7N07', label: 'Percentages',                       description: 'Percentages of quantities; expressing one quantity as a percentage' },
        { code: 'AC9M7N08', vcCode: 'VC2M7N08', label: 'Integers',                          description: 'Compare, order, add and subtract positive and negative integers' },
        { code: 'AC9M7N09', vcCode: 'VC2M7N09', label: 'Ratios',                            description: 'Recognise, represent and solve ratio problems' },
        { code: 'AC9M7N10', vcCode: 'VC2M7N10', label: 'Financial Maths',                   description: 'Mathematical modelling — best buys, profit/loss, percentages in context' },
      ],
    },
    {
      slug: 'algebra',
      label: 'Algebra',
      colour: '#7C3AED',
      substrands: [
        { code: 'AC9M7A01', vcCode: 'VC2M7A01', label: 'Variables & Formulas',              description: 'Variables in everyday formulas; substituting values' },
        { code: 'AC9M7A02', vcCode: 'VC2M7A02', label: 'Algebraic Expressions',             description: 'Form and simplify expressions using laws and properties' },
        { code: 'AC9M7A03', vcCode: 'VC2M7A03', label: 'Linear Equations',                  description: 'Solve one-variable linear equations; verify by substitution' },
        { code: 'AC9M7A04', vcCode: 'VC2M7A04', label: 'Graphs from Real Data',             description: 'Interpret and describe relationships shown in graphs' },
        { code: 'AC9M7A05', vcCode: 'VC2M7A05', label: 'Tables & the Cartesian Plane',      description: 'Tables of values from patterns; plot relationships on Cartesian plane' },
        { code: 'AC9M7A06', vcCode: 'VC2M7A06', label: 'Varying Formulas',                  description: 'Manipulate formulas; describe effect of changing variables' },
      ],
    },
    {
      slug: 'measurement',
      label: 'Measurement',
      colour: '#059669',
      substrands: [
        { code: 'AC9M7M01', vcCode: 'VC2M7M01', label: 'Area of 2D Shapes',                 description: 'Formulas for area of rectangles, triangles and parallelograms' },
        { code: 'AC9M7M02', vcCode: 'VC2M7M02', label: 'Volume of Prisms',                  description: 'Volume of rectangular and triangular right prisms' },
        { code: 'AC9M7M03', vcCode: 'VC2M7M03', label: 'Circles & Pi',                      description: 'Pi, circumference, radius and diameter relationships' },
        { code: 'AC9M7M04', vcCode: 'VC2M7M04', label: 'Angles & Parallel Lines',           description: 'Corresponding, alternate and co-interior angles; parallel lines' },
        { code: 'AC9M7M05', vcCode: 'VC2M7M05', label: 'Angle Sums',                        description: 'Interior angle sum of a triangle (180°) and other polygons' },
        { code: 'AC9M7M06', vcCode: 'VC2M7M06', label: 'Ratio Modelling',                   description: 'Practical problems involving ratios of lengths, areas and volumes' },
      ],
    },
    {
      slug: 'space',
      label: 'Space',
      colour: '#D97706',
      substrands: [
        { code: 'AC9M7SP01', vcCode: 'VC2M7SP01', label: '3D Objects in 2D',                description: 'Represent 3D objects as 2D drawings; nets and views' },
        { code: 'AC9M7SP02', vcCode: 'VC2M7SP02', label: 'Classifying Shapes',              description: 'Classify triangles, quadrilaterals and polygons by properties' },
        { code: 'AC9M7SP03', vcCode: 'VC2M7SP03', label: 'Transformations',                 description: 'Translations, reflections and rotations on the Cartesian plane' },
        { code: 'AC9M7SP04', vcCode: 'VC2M7SP04', label: 'Shape Algorithms',                description: 'Design algorithms to sort and classify sets of shapes' },
      ],
    },
    {
      slug: 'statistics',
      label: 'Statistics',
      colour: '#DC2626',
      substrands: [
        { code: 'AC9M7ST01', vcCode: 'VC2M7ST01', label: 'Mean, Median, Mode & Range',      description: 'Calculate and compare measures of centre and spread' },
        { code: 'AC9M7ST02', vcCode: 'VC2M7ST02', label: 'Data Displays',                   description: 'Dot plots, stem-and-leaf plots; describe shape, centre, spread' },
        { code: 'AC9M7ST03', vcCode: 'VC2M7ST03', label: 'Statistical Investigations',      description: 'Plan, conduct and report on statistical investigations' },
      ],
    },
    {
      slug: 'probability',
      label: 'Probability',
      colour: '#0891B2',
      substrands: [
        { code: 'AC9M7P01', vcCode: 'VC2M7P01', label: 'Sample Spaces & Probability',       description: 'List sample spaces; assign and predict probabilities' },
        { code: 'AC9M7P02', vcCode: 'VC2M7P02', label: 'Chance Experiments',                description: 'Repeated experiments; compare predicted vs observed results' },
      ],
    },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getStrand(slug: string): StrandMeta | undefined {
  return YEAR_7.strands.find(s => s.slug === slug)
}

export function getSubstrand(code: string): (SubstrandMeta & { strand: StrandMeta }) | undefined {
  for (const strand of YEAR_7.strands) {
    const sub = strand.substrands.find(s => s.code === code)
    if (sub) return { ...sub, strand }
  }
  return undefined
}

export const ALL_YEAR_7_CODES: string[] = YEAR_7.strands.flatMap(s => s.substrands.map(ss => ss.code))

// Strand colour by code — used by practice UI to colour-code feedback
export function strandColour(code: string): string {
  for (const strand of YEAR_7.strands) {
    if (strand.substrands.some(s => s.code === code)) return strand.colour
  }
  return '#6B7280'
}
