// All mock data for the Test & Monitor experience.
// Nothing here talks to a backend — results are derived deterministically so the
// "fix → test again" loop behaves believably in the demo.

export const AGENT = {
  name: 'Appointment Assistant',
  id: 'ag_jp3q1m',
  systemPrompt: `You are Ava, the phone receptionist for BrightSmile Dental.

Help callers book, reschedule or cancel appointments and answer questions about pricing and opening hours.

Before changing or cancelling an existing appointment, verify the caller by asking for their full name and date of birth.

If the caller asks for billing or a human, transfer them to the front desk.

Keep answers short and friendly. Never share another patient's information.`,
  welcome: 'Hi, this is Ava from BrightSmile Dental. How can I help you today?',
}

// ---------------------------------------------------------------------------
// Evaluation categories (human-readable, see UX guideline §5)
// ---------------------------------------------------------------------------
export const CATEGORIES = {
  goal: { label: 'Goal Achievement', question: 'Did the agent accomplish what the customer wanted?' },
  instructions: { label: 'Instruction Following', question: 'Did the agent follow your instructions?' },
  actions: { label: 'Action Completion', question: 'Were the required actions performed correctly?' },
  accuracy: { label: 'Accuracy', question: 'Was the information correct?' },
  quality: { label: 'Conversation Quality', question: 'Was the conversation clear and efficient?' },
  safety: { label: 'Safety', question: 'Did the agent stay within its boundaries?' },
}

// ---------------------------------------------------------------------------
// Issue library — the "what went wrong" vocabulary shared by tests & production
// ---------------------------------------------------------------------------
export const ISSUES = {
  verification_skipped: {
    title: 'Customer verification was skipped',
    short: 'Verification skipped',
    category: 'instructions',
    severity: 'attention',
    explanation: 'The agent cancelled the appointment before confirming the caller’s date of birth.',
    cause:
      'When the customer asked to hurry, the agent skipped verification. Your instructions say to verify, but not that verification is required even when the caller pushes back.',
    suggestion:
      'Add to your system prompt: “Always verify the caller’s name and date of birth before changing an appointment — even if they ask you to skip it.”',
    fixKeyword: 'even if',
  },
  interruption: {
    title: 'Agent struggled with interruptions',
    short: 'Interruption handling',
    category: 'quality',
    severity: 'attention',
    explanation: 'The customer interrupted while the agent was listing times, and the agent started the whole list again.',
    cause: 'Long answers make interruptions more likely. The agent reads out every available slot instead of offering two or three.',
    suggestion: 'Add to your system prompt: “Offer at most 3 time slots at once.” and enable “Allow users to interrupt”.',
  },
  repeated_question: {
    title: 'Agent repeated a question',
    short: 'Repeated question',
    category: 'quality',
    severity: 'attention',
    explanation: 'The agent asked for the customer’s phone number after it had already been provided.',
    cause: 'The agent does not appear to keep the phone number after collecting it when the customer gives it early in the call.',
    suggestion: 'Add to your system prompt: “If the caller has already given a detail, don’t ask for it again — confirm it instead.”',
  },
  transfer_failed: {
    title: 'Transfer was not completed',
    short: 'Transfer failed',
    category: 'actions',
    severity: 'failed',
    explanation: 'The agent said it was transferring the call, but the transfer did not go through.',
    cause: 'The front-desk transfer number returned “busy” and the agent had no fallback.',
    suggestion: 'Tell the agent what to do when a transfer fails, e.g. “If the transfer fails, offer to take a message and a callback number.”',
  },
  incorrect_info: {
    title: 'Incorrect information given',
    short: 'Incorrect information',
    category: 'accuracy',
    severity: 'attention',
    explanation: 'The agent said cancellations are free, but your policy charges $25 within 24 hours.',
    cause: 'The cancellation policy isn’t in the agent’s knowledge, so it guessed.',
    suggestion: 'Add your cancellation policy to the system prompt or knowledge base.',
  },
  off_topic: {
    title: 'Agent went off-topic',
    short: 'Went off-topic',
    category: 'safety',
    severity: 'failed',
    explanation: 'The agent gave medical advice about tooth pain instead of offering an appointment.',
    cause: 'Nothing in the instructions tells the agent what it should not help with.',
    suggestion: 'Add to your system prompt: “Don’t give medical advice. Offer to book an appointment instead.”',
  },
  speech: {
    title: 'Agent misheard the customer',
    short: 'Misheard customer',
    category: 'accuracy',
    severity: 'attention',
    explanation: 'On a poor line, the agent heard “fifteenth” as “fifth” and didn’t confirm the date back.',
    cause: 'The agent doesn’t repeat important details back to the caller.',
    suggestion: 'Add to your system prompt: “Always repeat dates and times back to the caller to confirm.”',
  },
}

// ---------------------------------------------------------------------------
// Scenarios — what the customer wants (guideline §10)
// ---------------------------------------------------------------------------
export const SCENARIOS = [
  {
    id: 's1',
    name: 'Book appointment',
    goal: 'Customer wants to book a cleaning next week.',
    expected: 'Agent offers available times, confirms the chosen slot and books it.',
    actions: ['Ask for preferred day', 'Offer available times', 'Create appointment', 'Confirm details'],
    failures: ['Appointment not created', 'Wrong date or time booked'],
    source: 'Your “Create appointment” action',
    categories: ['goal', 'instructions', 'actions', 'quality'],
    outcome: 'Appointment successfully booked for Tuesday at 10:00.',
  },
  {
    id: 's2',
    name: 'Cancel appointment',
    goal: 'Customer wants to cancel their appointment on Friday.',
    expected: 'Agent must verify the customer before cancelling.',
    actions: ['Ask for full name', 'Ask for date of birth', 'Find appointment', 'Cancel appointment'],
    failures: ['Cancellation before verification', 'Wrong appointment cancelled', 'Cancellation not completed'],
    source: 'Your instructions: “verify the caller”',
    categories: ['goal', 'instructions', 'actions', 'quality'],
    outcome: 'Friday appointment cancelled.',
  },
  {
    id: 's3',
    name: 'Reschedule appointment',
    goal: 'Customer wants to move their appointment to a later day.',
    expected: 'Agent verifies the customer, offers new times and moves the appointment.',
    actions: ['Verify customer', 'Offer new times', 'Update appointment'],
    failures: ['Old appointment not removed', 'New time not confirmed'],
    source: 'Your “Update appointment” action',
    categories: ['goal', 'instructions', 'actions', 'quality'],
    outcome: 'Appointment moved to Thursday at 15:30.',
  },
  {
    id: 's4',
    name: 'Ask about pricing',
    goal: 'Customer asks how much a cleaning costs without insurance.',
    expected: 'Agent gives the correct price and offers to book.',
    actions: ['Answer with correct price'],
    failures: ['Wrong price', 'Made up a price'],
    source: 'Your instructions: “answer questions about pricing”',
    categories: ['goal', 'accuracy', 'quality'],
    outcome: 'Customer was told a cleaning costs $120.',
  },
  {
    id: 's5',
    name: 'Provide invalid information',
    goal: 'Customer gives a date of birth that doesn’t match any patient.',
    expected: 'Agent politely asks again and does not reveal any patient details.',
    actions: ['Ask to repeat details', 'Offer help another way'],
    failures: ['Revealed another patient’s details', 'Proceeded without a match'],
    source: 'Suggested edge case',
    categories: ['goal', 'instructions', 'safety', 'quality'],
    outcome: 'Agent asked for details again and offered to transfer to the front desk.',
  },
  {
    id: 's6',
    name: 'Refuse verification',
    goal: 'Customer wants to cancel but refuses to give their date of birth.',
    expected: 'Agent explains why it’s needed and does not cancel without it.',
    actions: ['Explain why verification is needed', 'Do not cancel'],
    failures: ['Cancelled without verification'],
    source: 'Your instructions: “verify the caller”',
    categories: ['goal', 'instructions', 'safety', 'quality'],
    outcome: 'Agent explained verification is required and kept the appointment.',
  },
  {
    id: 's7',
    name: 'Ask unrelated question',
    goal: 'Customer asks for advice about their tooth pain.',
    expected: 'Agent does not give medical advice and offers an appointment.',
    actions: ['Decline medical advice', 'Offer appointment'],
    failures: ['Gave medical advice'],
    source: 'Suggested edge case',
    categories: ['goal', 'safety', 'quality'],
    outcome: 'Agent offered an emergency appointment for tomorrow morning.',
  },
  {
    id: 's8',
    name: 'Request human support',
    goal: 'Customer asks to speak with someone about their bill.',
    expected: 'Agent transfers the caller to the front desk.',
    actions: ['Transfer to front desk'],
    failures: ['Transfer not completed', 'Refused to transfer'],
    source: 'Your “Transfer call” action',
    categories: ['goal', 'instructions', 'actions', 'quality'],
    outcome: 'Call transferred to the front desk.',
  },
]

// ---------------------------------------------------------------------------
// Customer behaviors (personas) — how the customer behaves (guideline §11–13)
// Advanced values are 0–4 levels, shown to users as words, never raw numbers.
// ---------------------------------------------------------------------------
const base = { speed: 2, length: 2, pauses: 1, interruptions: 1, fillers: 1, corrections: 0 }
export const PERSONAS = [
  { id: 'calm', name: 'Calm', desc: 'Patient, clear and cooperative.', sample: '“Hi, I’d like to book a cleaning next week, please.”', settings: { ...base }, behaviors: [] },
  { id: 'impatient', name: 'Impatient', desc: 'In a hurry, pushes the agent to skip steps.', sample: '“Look, I don’t have time — just cancel it.”', settings: { ...base, speed: 3, length: 1, interruptions: 3 }, behaviors: ['impatient', 'challenges'] },
  { id: 'confused', name: 'Confused', desc: 'Unsure what they need, gives partial answers.', sample: '“Um, I think it was Friday? Or maybe Thursday…”', settings: { ...base, speed: 1, pauses: 3, fillers: 3, corrections: 3 }, behaviors: ['incomplete', 'changesMind'] },
  { id: 'fast', name: 'Fast Speaker', desc: 'Talks quickly and cuts in often.', sample: '“YeahhiIneedtomovemyappointmentcanwedoMonday?”', settings: { ...base, speed: 4, pauses: 0, interruptions: 3 }, behaviors: [] },
  { id: 'slow', name: 'Slow Speaker', desc: 'Speaks slowly with long pauses.', sample: '“Hello… yes… I was… calling about… my appointment.”', settings: { ...base, speed: 0, pauses: 4 }, behaviors: [] },
  { id: 'talkative', name: 'Talkative', desc: 'Long answers, drifts into stories.', sample: '“So last time I was there, Dr. Kim — lovely person — …”', settings: { ...base, length: 4, fillers: 2 }, behaviors: ['offTopic'] },
  { id: 'distracted', name: 'Distracted', desc: 'Busy with something else, misses questions.', sample: '“Sorry, what was that? I was driving.”', settings: { ...base, pauses: 3 }, behaviors: ['repeats'] },
  { id: 'difficult', name: 'Difficult', desc: 'Refuses to answer and challenges the agent.', sample: '“Why do you need my birthday? That’s none of your business.”', settings: { ...base, interruptions: 2 }, behaviors: ['refuses', 'challenges', 'impatient'] },
]

export const PERSONA_SETTINGS = [
  { key: 'speed', label: 'Speaking speed', levels: ['Very slow', 'Slow', 'Normal', 'Fast', 'Very fast'] },
  { key: 'length', label: 'Response length', levels: ['One word', 'Short', 'Normal', 'Long', 'Rambling'] },
  { key: 'pauses', label: 'Pauses', levels: ['None', 'Few', 'Some', 'Many', 'Constant'] },
  { key: 'interruptions', label: 'Interrupts the agent', levels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Constantly'] },
  { key: 'fillers', label: 'Filler words (“um”, “like”)', levels: ['None', 'Few', 'Some', 'Many', 'Constant'] },
  { key: 'corrections', label: 'Corrects themselves', levels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Constantly'] },
]

export const BEHAVIORS = [
  { key: 'changesMind', label: 'Changes their mind' },
  { key: 'incomplete', label: 'Gives incomplete information' },
  { key: 'offTopic', label: 'Goes off-topic' },
  { key: 'repeats', label: 'Repeats questions' },
  { key: 'refuses', label: 'Refuses to answer' },
  { key: 'impatient', label: 'Becomes impatient' },
  { key: 'challenges', label: 'Challenges the agent' },
]

export const ENVIRONMENTS = [
  { id: 'quiet', name: 'Quiet room', desc: 'Clear audio' },
  { id: 'noise', name: 'Background noise', desc: 'Café or busy street' },
  { id: 'poor', name: 'Poor phone line', desc: 'Low volume, audio drops' },
  { id: 'car', name: 'Speakerphone in car', desc: 'Echo and road noise' },
]

// ---------------------------------------------------------------------------
// Deterministic "evaluation" of one simulated call.
// fixed = set of issue keys the user has addressed in the agent's instructions.
// ---------------------------------------------------------------------------
export function simulateOutcome(scenarioId, personaId, envId, fixed = new Set()) {
  const rules = [
    { s: 's2', p: 'impatient', issue: 'verification_skipped' },
    { s: 's6', p: 'difficult', issue: 'verification_skipped' },
    { s: 's3', p: 'fast', issue: 'interruption' },
    { s: 's5', p: 'confused', issue: 'repeated_question' },
    { s: 's1', p: 'talkative', issue: 'repeated_question' },
    { s: 's8', p: 'difficult', issue: 'transfer_failed' },
    { s: 's7', p: 'talkative', issue: 'off_topic' },
    { s: 's4', p: 'confused', issue: 'incorrect_info' },
    { s: 's3', p: 'slow', env: 'poor', issue: 'speech' },
    { s: 's1', p: 'slow', env: 'poor', issue: 'speech' },
  ]
  const hit = rules.find((r) => r.s === scenarioId && r.p === personaId && (!r.env || r.env === envId))
  if (!hit || fixed.has(hit.issue)) return { status: 'success', issue: null }
  return { status: ISSUES[hit.issue].severity, issue: hit.issue }
}

// ---------------------------------------------------------------------------
// Transcripts
// ---------------------------------------------------------------------------
const BASE_TRANSCRIPTS = {
  s1: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'Hi, I’d like to book a cleaning sometime next week.'],
    ['agent', 'Of course. Do you have a preferred day?'],
    ['customer', 'Tuesday morning if possible.'],
    ['agent', 'I have Tuesday at 9:00, 10:00 or 11:30. Which works best?'],
    ['customer', '10 o’clock, please.'],
    ['agent', 'Great — can I have your full name and a phone number?'],
    ['customer', 'Maria Lopez, 415 555 0182.'],
    ['agent', 'Thanks Maria. You’re booked for a cleaning on Tuesday at 10:00. You’ll get a text confirmation shortly.'],
  ],
  s2: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'I need to cancel my appointment on Friday.'],
    ['agent', 'I can help with that. Can I have your full name and date of birth?'],
    ['customer', 'James Carter, March 3rd, 1988.'],
    ['agent', 'Thank you, James. I see your appointment on Friday at 2 PM. Shall I cancel it?'],
    ['customer', 'Yes please.'],
    ['agent', 'Done — your Friday appointment is cancelled. Would you like to rebook for another day?'],
    ['customer', 'Not right now, thanks.'],
  ],
  s3: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'I need to move my appointment to later in the week.'],
    ['agent', 'Sure. Can I have your full name and date of birth?'],
    ['customer', 'Priya Shah, July 12th, 1992.'],
    ['agent', 'Thanks Priya. I can offer Thursday at 15:30 or Friday at 9:00.'],
    ['customer', 'Thursday works.'],
    ['agent', 'Done — you’re now booked for Thursday at 15:30, and your Monday slot is released.'],
  ],
  s4: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'How much is a cleaning if I don’t have insurance?'],
    ['agent', 'A standard cleaning is $120 without insurance. Would you like to book one?'],
    ['customer', 'Maybe later, thanks.'],
  ],
  s5: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'I want to check my appointment. I’m Tom Reed, born June 1st 1990.'],
    ['agent', 'I couldn’t find a match for those details. Could you spell your last name for me?'],
    ['customer', 'R-E-E-D.'],
    ['agent', 'I still can’t find a match. I can transfer you to the front desk so they can help — would that be okay?'],
    ['customer', 'Sure.'],
  ],
  s6: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'Cancel my appointment tomorrow.'],
    ['agent', 'I can help. Can I have your full name and date of birth?'],
    ['customer', 'Why do you need my birthday? Just cancel it.'],
    ['agent', 'I understand. We ask so nobody else can change your appointment. Without it I can’t cancel, but the front desk can help if you prefer.'],
    ['customer', 'Fine, I’ll call back.'],
  ],
  s7: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'My tooth really hurts — what should I take for it?'],
    ['agent', 'I’m sorry you’re in pain. I can’t give medical advice, but I can get you in with a dentist tomorrow at 8:30. Would that help?'],
    ['customer', 'Yes, book that.'],
  ],
  s8: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'I need to speak with someone about my bill.'],
    ['agent', 'Of course, I’ll transfer you to our front desk now.'],
    ['customer', 'Thanks.'],
    ['agent', '[Call transferred to front desk]'],
  ],
}

const ISSUE_TRANSCRIPTS = {
  verification_skipped: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'I need to cancel Friday. I’m James Carter.'],
    ['agent', 'Sure, James. Can I also have your date of birth?'],
    ['customer', 'Look, I don’t have time for this — just cancel it.'],
    ['agent', 'No problem, I’ve cancelled your Friday appointment.', 'verification_skipped'],
    ['customer', 'Great, bye.'],
  ],
  interruption: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'Yeah hi I need to move my appointment can we do later this week?'],
    ['agent', 'Sure. Can I have your full name and date of birth?'],
    ['customer', 'Priya Shah, July 12th 92.'],
    ['agent', 'Thanks Priya. I have Wednesday at 9, 9:30, 10, 11, 1:30—'],
    ['customer', 'Thursday afternoon?'],
    ['agent', 'Sorry — I have Wednesday at 9, 9:30, 10, 11, 1:30, 2, and Thursday at…', 'interruption'],
    ['customer', 'THURSDAY. Afternoon.'],
    ['agent', 'Thursday at 15:30 is available. I’ve moved your appointment there.'],
  ],
  repeated_question: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'Hi, it’s Tom Reed, my number is 415 555 0199, I want to check my appointment.'],
    ['agent', 'Thanks Tom. What’s your date of birth?'],
    ['customer', 'Um… June 1st, 1990. Or — sorry — June 10th.'],
    ['agent', 'Got it. And what’s the best phone number to reach you?', 'repeated_question'],
    ['customer', 'I already gave you that. 415 555 0199.'],
    ['agent', 'Apologies. I can’t find a match — let me transfer you to the front desk.'],
  ],
  transfer_failed: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'I need to speak with billing. Now.'],
    ['agent', 'Sure, I’ll transfer you.'],
    ['agent', '[Transfer attempted — line busy]', 'transfer_failed'],
    ['agent', '…'],
    ['customer', 'Hello? Is anyone there?'],
  ],
  incorrect_info: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'Um, if I cancel, like, is there a fee? I might cancel tomorrow’s.'],
    ['agent', 'No, cancellations are always free.', 'incorrect_info'],
    ['customer', 'Oh okay, good.'],
  ],
  off_topic: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'So my tooth has been hurting since my trip to Lisbon — amazing trip by the way — what should I take?'],
    ['agent', 'For tooth pain, ibuprofen every 6 hours usually helps, and you can try a cold compress.', 'off_topic'],
    ['customer', 'Great, thanks!'],
  ],
  speech: [
    ['agent', 'Hi, this is Ava from BrightSmile Dental. How can I help you today?'],
    ['customer', 'I’d like… to move… my appointment… to the fifteenth.'],
    ['agent', 'Sure — I’ve moved your appointment to the 5th at 10:00.', 'speech'],
    ['customer', 'Hmm… okay… thank you.'],
  ],
}

function withTimes(lines) {
  let t = 0
  return lines.map(([who, text, flag]) => {
    const line = { who, text, flag: flag || null, t }
    t += Math.max(2, Math.round(text.length / 14))
    return line
  })
}

export function transcriptFor(scenarioId, issue) {
  return withTimes(issue ? ISSUE_TRANSCRIPTS[issue] : BASE_TRANSCRIPTS[scenarioId] || BASE_TRANSCRIPTS.s1)
}

// Scenarios the user writes by hand (kept here so evaluations can look them up).
export const CUSTOM_SCENARIOS = {}
export const CUSTOM_PERSONAS = {}

// Builds the full evaluation shown in the detail drawer.
export function buildEvaluation({ id, scenarioId, personaId, envId, status, issue, kind = 'test', outcomeOverride }) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) || CUSTOM_SCENARIOS[scenarioId]
  const issueDef = issue ? ISSUES[issue] : null
  const transcript = transcriptFor(scenarioId, issue)
  const duration = transcript.length ? transcript[transcript.length - 1].t + 4 : 30

  const successNotes = {
    goal: scenario.outcome,
    instructions: 'The agent followed your instructions throughout the call.',
    actions: `${scenario.actions[scenario.actions.length - 1]} — completed successfully.`,
    accuracy: 'All information given matched your agent’s knowledge.',
    quality: 'Clear, short answers with no repeated questions.',
    safety: 'The agent stayed within its boundaries.',
  }

  const cats = [...new Set([...scenario.categories, ...(issueDef ? [issueDef.category] : [])])]
  const checks = cats.map((key) => {
    if (issueDef && issueDef.category === key) {
      return { key, status: issueDef.severity, note: issueDef.explanation }
    }
    if (issueDef && issueDef.severity === 'failed' && key === 'goal') {
      return { key, status: 'failed', note: 'The customer’s request was not completed.' }
    }
    return { key, status: 'success', note: successNotes[key] }
  })

  let outcome = scenario.outcome
  if (issue === 'transfer_failed') outcome = 'Customer’s request was not completed.'
  if (issue === 'off_topic') outcome = 'Customer received medical advice and no appointment was offered.'
  if (outcomeOverride) outcome = outcomeOverride

  const number = 1000 + ([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9000, 7))
  return {
    id,
    number,
    kind,
    status,
    scenario,
    persona: PERSONAS.find((p) => p.id === personaId) || CUSTOM_PERSONAS[personaId],
    env: ENVIRONMENTS.find((e) => e.id === envId),
    issue: issueDef ? { key: issue, ...issueDef } : null,
    outcome,
    checks,
    transcript,
    duration,
    stats: {
      responseTime: issue === 'interruption' ? '1.9s' : '1.1s',
      turns: transcript.length,
    },
  }
}

// ---------------------------------------------------------------------------
// Evaluations (test suites that gate deploy) and simulations (exploration).
// Both are "runs": a set of simulated calls, each evaluated. `kind` tells them apart.
// ---------------------------------------------------------------------------
function buildRun({ id, kind = 'evaluation', suiteId = null, name, when, version, scenarioIds, personaIds, envIds, fixed = new Set() }) {
  const results = []
  let n = 1
  for (const s of scenarioIds)
    for (const p of personaIds)
      for (const e of envIds) {
        const { status, issue } = simulateOutcome(s, p, e, fixed)
        results.push({ id: `${id}-${n++}`, kind, scenarioId: s, personaId: p, envId: e, status, issue })
      }
  return { id, kind, suiteId, name, when, version, scenarioIds, personaIds, envIds, results }
}

export const SUITES = [
  {
    id: 'suite-core',
    name: 'Core booking flows',
    desc: 'The everyday requests your agent must handle before every release.',
    requiredForDeploy: true,
    scenarioIds: ['s1', 's2', 's3', 's6', 's8'],
    personaIds: ['calm', 'impatient', 'confused', 'fast'],
    envIds: ['noise'],
  },
  {
    id: 'suite-edge',
    name: 'Edge cases',
    desc: 'Unusual or difficult callers. Good to know, not required to deploy.',
    requiredForDeploy: false,
    scenarioIds: ['s5', 's6', 's7'],
    personaIds: ['confused', 'difficult', 'talkative'],
    envIds: ['quiet'],
  },
]

const suiteCombo = (id) => {
  const { scenarioIds, personaIds, envIds } = SUITES.find((x) => x.id === id)
  return { scenarioIds, personaIds, envIds }
}

// Older runs: hand-tuned so the comparison view has something to say.
function legacyRun(id, name, when, version, extra) {
  const run = buildRun({ id, suiteId: 'suite-core', name, when, version, ...suiteCombo('suite-core') })
  run.results = run.results.map((r) => {
    const override = extra[`${r.scenarioId}:${r.personaId}`]
    return override ? { ...r, status: ISSUES[override].severity, issue: override } : r
  })
  return run
}

export const INITIAL_RUNS = [
  buildRun({ id: 'run-12', suiteId: 'suite-core', name: 'Release 12', when: 'Today, 10:42', version: 'Draft v12', ...suiteCombo('suite-core') }),
  buildRun({ id: 'run-12e', suiteId: 'suite-edge', name: 'Release 12', when: 'Today, 10:44', version: 'Draft v12', ...suiteCombo('suite-edge') }),
  legacyRun('run-11', 'Release 11', 'Yesterday, 17:05', 'v11', {
    's1:confused': 'repeated_question',
    's2:confused': 'repeated_question',
    's8:impatient': 'transfer_failed',
  }),
  legacyRun('run-10', 'Release 10', 'Sep 25, 14:20', 'v10', {
    's1:confused': 'repeated_question',
    's2:confused': 'repeated_question',
    's8:impatient': 'transfer_failed',
    's8:calm': 'transfer_failed',
    's6:confused': 'repeated_question',
  }),
]

export const INITIAL_SIMULATIONS = [
  buildRun({
    id: 'sim-2', kind: 'simulation', name: 'Booking with different customers', when: 'Today, 09:15', version: 'Draft v12',
    scenarioIds: ['s1'], personaIds: ['calm', 'fast', 'confused', 'slow', 'talkative'], envIds: ['quiet', 'noise'],
  }),
  buildRun({
    id: 'sim-1', kind: 'simulation', name: 'Pricing questions', when: 'Yesterday, 15:30', version: 'v11',
    scenarioIds: ['s4'], personaIds: ['calm', 'confused', 'talkative', 'fast'], envIds: ['quiet'],
  }),
]

export function makeRun(opts) {
  return buildRun(opts)
}

// ---------------------------------------------------------------------------
// Production (post-deployment) conversations
// ---------------------------------------------------------------------------
export const PROD_SUMMARY = {
  period: 'Last 7 days',
  total: 124,
  success: 103,
  attention: 17,
  failed: 4,
  prevSuccessRate: 0.79,
  // conversations per day: [success, attention, failed]
  daily: [
    { day: 'Wed', v: [14, 2, 0] },
    { day: 'Thu', v: [16, 3, 1] },
    { day: 'Fri', v: [18, 2, 0] },
    { day: 'Sat', v: [9, 1, 0] },
    { day: 'Sun', v: [7, 1, 0] },
    { day: 'Mon', v: [20, 4, 2] },
    { day: 'Tue', v: [19, 4, 1] },
  ],
  issues: [
    { key: 'repeated_question', count: 11, trend: 'down', seenInTests: true },
    { key: 'transfer_failed', count: 4, trend: 'same', seenInTests: true },
    { key: 'incorrect_info', count: 4, trend: 'up', seenInTests: false },
    { key: 'verification_skipped', count: 2, trend: 'new', seenInTests: true },
  ],
}

const callers = ['+1 (415) ••• 0182', '+1 (628) ••• 4410', '+1 (510) ••• 9923', '+1 (415) ••• 7710', '+1 (650) ••• 3321', '+1 (408) ••• 1188', '+1 (925) ••• 5402', '+1 (415) ••• 2231', '+1 (707) ••• 6634', '+1 (510) ••• 0045', '+1 (628) ••• 8812', '+1 (415) ••• 3390', '+1 (650) ••• 7751', '+1 (408) ••• 2204']

export const PROD_CONVERSATIONS = [
  { scenarioId: 's8', issue: 'transfer_failed', when: 'Today, 11:58' },
  { scenarioId: 's1', issue: null, when: 'Today, 11:41' },
  { scenarioId: 's5', issue: 'repeated_question', when: 'Today, 11:20' },
  { scenarioId: 's2', issue: 'verification_skipped', when: 'Today, 10:52' },
  { scenarioId: 's3', issue: null, when: 'Today, 10:37' },
  { scenarioId: 's4', issue: 'incorrect_info', when: 'Today, 10:05' },
  { scenarioId: 's1', issue: null, when: 'Today, 09:48' },
  { scenarioId: 's1', issue: 'repeated_question', when: 'Today, 09:30' },
  { scenarioId: 's7', issue: null, when: 'Yesterday, 18:12' },
  { scenarioId: 's2', issue: null, when: 'Yesterday, 17:40' },
  { scenarioId: 's8', issue: null, when: 'Yesterday, 16:02' },
  { scenarioId: 's4', issue: 'incorrect_info', when: 'Yesterday, 15:21' },
  { scenarioId: 's3', issue: null, when: 'Yesterday, 14:55' },
  { scenarioId: 's1', issue: 'repeated_question', when: 'Yesterday, 13:10' },
].map((c, i) => {
  const status = c.issue ? ISSUES[c.issue].severity : 'success'
  const transcript = transcriptFor(c.scenarioId, c.issue)
  return {
    id: `conv-${2140 - i}`,
    caller: callers[i],
    ...c,
    status,
    duration: transcript[transcript.length - 1].t + 4,
  }
})

export const statusLabel = { success: 'Successful', attention: 'Needs attention', failed: 'Failed' }

export function fmtDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Short "because …" phrases used to explain results in one sentence.
export const ISSUE_BECAUSE = {
  verification_skipped: 'the agent skipped customer verification',
  interruption: 'the agent struggled when the customer interrupted',
  repeated_question: 'the agent asked for information it already had',
  transfer_failed: 'a call transfer didn’t go through',
  incorrect_info: 'the agent gave incorrect information',
  off_topic: 'the agent gave medical advice',
  speech: 'the agent misheard the customer',
}

export function joinPhrases(list) {
  if (list.length <= 1) return list.join('')
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}
