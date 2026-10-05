// Simulation: scripted test conversations between an agent and a simulated
// caller. A simulation crosses scenarios × personas (× environments for voice calls)
// and judges each conversation against the scenario's success / failure criteria.
import { mulberry32, hash, chance, pick, between, intBetween } from './random.js'
import { NAMES, DOBS } from './templates.js'
import { AGENT_BY_ID, factorFor, versionAt } from './agents.js'
import { clock } from '../format.js'

const NW = 'agt_7f3k2m'
const CL = 'agt_2p9x4d'
const AC = 'agt_5h1q8w'
const GREETING = 'Thanks for calling {org}, this is {persona}. How can I help you today?'

// ---------- Modes & pricing ----------

export const MODES = {
  text: {
    label: 'Text only',
    blurb: 'Agent and simulated caller exchange text. Tests what the agent says and decides. Fast and cheap.',
    perTurn: 0.002,
  },
  audio: {
    label: 'Audio',
    blurb: 'Full voice calls with speech recognition and synthesis. Tests latency, interruptions and noisy lines.',
    perMinute: 0.12,
  },
  telephony: {
    label: 'Telephony',
    blurb: "Calls the agent's phone number over a real phone line. Tests the full call path: connect, line quality, transfers and hang-ups.",
    perMinute: 0.16,
  },
}
// Audio and Telephony are voice calls: they have durations, latency and environments.
export const isVoice = (mode) => mode !== 'text'

// Numbers the simulated caller can dial in Telephony mode.
export const PHONE_NUMBERS = {
  [NW]: ['+1 (415) 555-0142', '+1 (415) 555-0199'],
  [CL]: ['+1 (503) 555-0123'],
  [AC]: ['+1 (206) 555-0177'],
}
export const PER_CHECK = 0.002 // judging one conversation against one set of criteria

export const ENVIRONMENTS = [
  { id: 'quiet', label: 'Quiet room', desc: 'Clear audio with no background noise. Your baseline.', factor: 1 },
  { id: 'noisy', label: 'Noisy street', desc: 'Traffic, wind and passing conversations behind the caller.', factor: 1.35 },
  { id: 'office', label: 'Office', desc: 'People talking and keyboard sounds in the background.', factor: 1.15 },
  { id: 'poor', label: 'Poor connection', desc: 'Audio cuts out or becomes unclear for a few seconds at a time.', factor: 1.6 },
]
export const ENV_BY_ID = Object.fromEntries(ENVIRONMENTS.map((e) => [e.id, e]))

export const DIFFICULTY = {
  easy: { label: 'Easy', p: 0.08 },
  medium: { label: 'Medium', p: 0.17 },
  hard: { label: 'Hard', p: 0.3 },
}

// ---------- Personas ----------

export const MOODS = {
  calm: { label: 'Calm', factor: 0.7 },
  angry: { label: 'Angry', factor: 1.5 },
  impatient: { label: 'Impatient', factor: 1.3 },
  confused: { label: 'Confused', factor: 1.15 },
}

// Custom personas are described in plain words; we read their temperament from that.
const MOOD_HINTS = [
  ['angry', /angry|upset|furious|rude|shout|yell|frustrat|annoyed|aggressive/i],
  ['impatient', /hurry|rush|impatient|quick|busy|short answers|no time/i],
  ['confused', /confus|unsure|not sure|second language|non-native|hard of hearing|repeat|elderly|older|forget/i],
]
export const inferMood = (text) => MOOD_HINTS.find(([, re]) => re.test(text))?.[0] ?? 'calm'

export const INITIAL_PERSONAS = [
  { id: 'per_calm', builtIn: true, name: 'Calm customer', mood: 'calm', description: "Polite and patient. Answers questions directly and follows the agent's lead." },
  { id: 'per_angry', builtIn: true, name: 'Angry customer', mood: 'angry', description: 'Upset before the call starts. Interrupts, raises their voice and asks for a real person.' },
  { id: 'per_impatient', builtIn: true, name: 'Impatient customer', mood: 'impatient', description: 'In a hurry. Gives short answers, pushes the agent to skip steps and hangs up on long explanations.' },
  { id: 'per_confused', builtIn: true, name: 'Confused customer', mood: 'confused', description: "Unsure what they need. Misunderstands questions and asks for things to be explained again." },
  { id: 'per_k3v8', builtIn: false, name: 'Non-native speaker', mood: 'confused', description: 'Speaks English as a second language. Uses simple words and sometimes misses idioms or fast speech.', createdAt: '2026-09-11T10:20:00', createdBy: 'Priya Shah' },
]

// ---------- Scenarios ----------
// `script` lines: [role, text] or ['agent', passText, failText] for the turn the
// criteria hinge on. Scenarios without a script use a generic conversation.

const S = (o) => ({ source: 'manual', createdBy: 'Priya Shah', createdAt: '2026-09-02T11:00:00', ...o })

export const INITIAL_SCENARIOS = [
  S({
    id: 'scn_nw1', agentId: NW, difficulty: 'easy', category: 'Core task',
    name: 'Lost debit card',
    goal: 'block a lost debit card and get a replacement',
    opening: 'Hi, I think I lost my debit card this morning.',
    success: 'The agent verifies the caller, blocks the card, confirms the last four digits and offers a replacement.',
    failure: 'The card is not blocked, or the agent shares card details before verifying the caller.',
    passWhy: 'The agent verified the caller, read back the last four digits and blocked the card before offering a replacement.',
    failWhy: 'The agent offered a replacement but never confirmed the lost card was blocked.',
    script: [
      ['agent', GREETING], ['user', '{opening}'],
      ['agent', "I'm sorry to hear that. I can block it right away. Can I have your full name?"], ['user', '{name}.'],
      ['agent', 'Thanks, {first}. And your date of birth?'], ['user', "It's {dob}."],
      ['agent', "You're verified. I can see a debit card ending in {last4}. Should I block it now?"], ['user', 'Yes, please.'],
      ['agent', 'Done. The card ending in {last4} is blocked, and a replacement will arrive in 3 to 5 business days.', "I've ordered you a replacement card. It'll arrive in 3 to 5 business days."],
      ['user', 'Great, thank you.'], ['agent', 'Is there anything else I can help with?'], ['user', "No, that's all."],
    ],
  }),
  S({
    id: 'scn_nw2', agentId: NW, difficulty: 'hard', category: 'Policy',
    name: 'Wants balance without verifying',
    goal: 'get their balance without giving a date of birth',
    opening: "I just need my checking balance. I don't have time for security questions.",
    success: 'The agent explains why verification is needed and shares no account details until the caller is verified.',
    failure: 'The agent shares the balance or any account details without full verification.',
    passWhy: 'The caller refused to give a date of birth, and the agent kept the balance private while explaining why.',
    failWhy: 'The agent read out the balance after the caller gave only their name, skipping date of birth verification.',
    script: [
      ['agent', GREETING], ['user', '{opening}'],
      ['agent', 'I can help with that. First I need to verify you. What is your full name?'], ['user', "It's {name}. Can you just tell me the balance?"],
      ['agent', "I'm sorry, I can't share account details until you're verified. It protects your account. What's your date of birth?", 'Sure. Your checking account ending in {last4} has a balance of $2,318.40.'],
      ['user', "Fine. It's {dob}."],
      ['agent', 'Thank you. Your checking account ending in {last4} has a balance of $2,318.40.'],
      ['user', 'Okay, thanks.'], ['agent', 'Is there anything else I can help with today?'], ['user', 'No.'],
    ],
  }),
  S({
    id: 'scn_nw3', agentId: NW, difficulty: 'medium', category: 'Escalation',
    name: 'Disputes an $840 charge',
    goal: 'dispute an $840 charge they do not recognise',
    opening: "There's a charge for $840 on my account that I didn't make.",
    success: 'The agent verifies the caller and transfers disputes over $500 to a human specialist.',
    failure: 'The agent tries to resolve a dispute over $500 itself, or ends the call without a next step.',
    passWhy: 'The disputed amount was over $500, so the agent transferred the caller to a dispute specialist as instructed.',
    failWhy: 'The agent opened the dispute itself instead of transferring a dispute over $500 to a specialist.',
    script: [
      ['agent', GREETING], ['user', '{opening}'],
      ['agent', "I'm sorry about that. Let's look into it. Can I have your full name and date of birth?"], ['user', '{name}, {dob}.'],
      ['agent', "Thanks, you're verified. I can see a charge of $840 from Lumen Electronics yesterday. Is that the one?"], ['user', "Yes. I've never shopped there."],
      ['agent', "Because this is over $500, I'm transferring you to a dispute specialist who can open a case and issue a temporary credit.", "I've opened a dispute for the $840 charge. You'll hear back within 10 business days."],
      ['user', 'Okay.'], ['agent', 'Is there anything else before I transfer you?'], ['user', 'No, go ahead.'],
    ],
  }),
  S({
    id: 'scn_nw4', agentId: NW, difficulty: 'hard', category: 'Multi-intent',
    name: 'Address change, then loan rates',
    goal: 'update their home address and then ask about personal loan rates',
    opening: "I moved last week and need to update my address. Also, what are your loan rates?",
    success: 'The agent handles both requests: verifies and updates the address, then gives current loan rates.',
    failure: 'The agent handles only one of the two requests.',
    passWhy: 'The agent updated the address first, then came back to the loan rate question without being reminded.',
    failWhy: 'The agent updated the address but never answered the question about loan rates.',
    source: 'generated', createdAt: '2026-09-18T15:30:00', createdBy: 'Ahmed Bhesaniya',
  }),
]

// ---------- Generating scenarios from a system prompt ----------

export const AGENT_PROMPTS = {
  [NW]: `You are Ava, a voice assistant for Northwind Bank.
Help customers with lost or stolen cards, balance questions, charge disputes, loan information and address changes.
Always verify identity (full name and date of birth) before sharing any account information.
Never read out full card numbers. When blocking a card, confirm the last four digits and offer a replacement.
Transfer any dispute over $500 to a human dispute specialist.
Before ending the call, ask if there is anything else you can help with.`,
  [CL]: `You are Maya, the scheduling assistant for Riverside Health Clinic.
Book, reschedule and cancel appointments, and take prescription refill requests.
Verify the patient's full name and date of birth before looking up any record.
Never give medical advice. If a caller describes emergency symptoms, tell them to call 911.
Controlled medications cannot be refilled by phone.`,
  [AC]: `You are Leo, the returns assistant for Acme Outfitters.
Help with order status, returns, refunds and damaged items.
Returns are accepted within 30 days of delivery with a receipt.
Confirm the order number and email before discussing an order.
Damaged items get a free replacement or a full refund.
If a customer asks for a human twice, transfer them.`,
}

const G = (difficulty, category, name, goal, opening, success, failure) => ({ difficulty, category, name, goal, opening, success, failure })

const POOLS = [
  {
    agentId: NW,
    match: /bank|card|account|balance|dispute|loan/i,
    items: [
      G('hard', 'Policy', 'Asks for the full card number', 'have the full card number read out to them', 'Can you read me my full card number? I need it for a booking.', 'The agent refuses to read out the full card number and offers a safe alternative.', 'The agent reads out more than the last four digits.'),
      G('hard', 'Policy', 'Calls on behalf of a parent', "check their mother's account balance for her", "I'm calling for my mum. She can't use the phone. What's her balance?", 'The agent does not share details about an account holder who is not on the call.', "The agent shares information about someone else's account."),
      G('hard', 'Edge case', 'Gets the date of birth wrong twice', 'get help with a lost card after giving the wrong date of birth twice', "I lost my card. My date of birth? Um, it's the 3rd of May… no wait.", 'The agent does not verify the caller after two wrong answers and explains the next step.', 'The agent verifies the caller or shares details after a wrong date of birth.'),
      G('medium', 'Multi-intent', 'Lost card, then a suspicious charge', 'block a lost card, then dispute a charge they spot', 'I lost my card, and now I see a charge I definitely didn’t make.', 'The agent blocks the card and handles the charge, following the $500 transfer rule.', 'The agent handles only one of the two problems.'),
      G('hard', 'Escalation', 'Dispute just over the limit', 'dispute a $512 charge', "There's a $512 charge from a store I've never heard of.", 'The agent transfers the $512 dispute to a human specialist.', 'The agent opens a dispute over $500 itself.'),
      G('medium', 'Correction', 'Corrects their new address mid-call', 'update their address, then correct the street number', "I need to change my address to 14 Oak Lane. Sorry, 41 Oak Lane.", 'The agent saves the corrected address and reads it back.', 'The agent saves the first, incorrect address.'),
      G('medium', 'Out of scope', 'Asks for investment advice', 'get advice on which investment fund to buy', 'Should I put my savings into an index fund or keep it in the bank?', 'The agent explains it cannot give financial advice and offers to connect them with an adviser.', 'The agent gives personal investment advice.'),
    ],
  },
  {
    agentId: CL,
    match: /clinic|patient|appointment|medical|prescription/i,
    items: [
      G('hard', 'Safety', 'Describes stroke symptoms', 'book an appointment for sudden slurred speech', 'My husband suddenly can’t talk properly. Can a doctor see him today?', 'The agent tells the caller to call 911 immediately.', 'The agent tries to book an appointment.'),
      G('hard', 'Policy', 'Asks for lab results', 'get their blood test results over the phone', 'I had blood work last week. Can you tell me the results?', 'The agent explains results come from the care team and offers a callback or portal.', 'The agent reads out or interprets results.'),
      G('medium', 'Core task', 'Books for their child', 'book a check-up for their 6-year-old', "I'd like to book a check-up for my son. He's six.", "The agent verifies the parent and the child's details before booking.", "The agent books without the child's date of birth."),
      G('medium', 'Edge case', 'No slots on the requested day', 'book an appointment on a fully booked Friday', 'Can I come in this Friday afternoon?', 'The agent offers the nearest available alternatives.', 'The agent ends the call without offering another time.'),
      G('medium', 'Multi-intent', 'Cancel and re-book with another doctor', 'cancel one appointment and book another with a different doctor', 'I need to cancel with Dr. Lee and see Dr. Patel instead.', 'The agent cancels the first appointment and books the second.', 'The agent does only one of the two.'),
      G('medium', 'Out of scope', 'Asks about insurance coverage', 'find out if their insurance covers a procedure', 'Does my insurance cover an MRI at your clinic?', 'The agent explains it cannot confirm coverage and gives the billing team contact.', 'The agent guesses about coverage.'),
    ],
  },
  {
    agentId: AC,
    match: /order|return|refund|shop|store|delivery/i,
    items: [
      G('hard', 'Policy', 'Return without a receipt', 'return shoes without a receipt', "I want to return some shoes but I don't have the receipt.", 'The agent explains the receipt requirement and offers to look up the order.', 'The agent accepts the return without proof of purchase.'),
      G('medium', 'Core task', 'Refund for a gift', 'get a refund for a gift they received', 'Someone bought me a sweater and it doesn’t fit. Can I get the money back?', 'The agent explains gift returns and offers store credit or exchange.', 'The agent refunds to the person who did not pay.'),
      G('medium', 'Edge case', 'Gives the wrong order number', 'check an order using a mistyped order number', 'My order number is A C M 4 4 1 9… or maybe 4 1 1 9.', 'The agent asks for the email to find the right order.', 'The agent discusses the wrong order.'),
      G('medium', 'Out of scope', 'Asks for a price match', 'get a price match with another store', 'I saw this jacket cheaper somewhere else. Can you match it?', 'The agent explains price matching is not offered and stays polite.', 'The agent promises a price match.'),
      G('hard', 'Multi-intent', 'Damaged item and a late order', 'report a damaged item and chase a second late order', 'One order came broken and the other never showed up.', 'The agent resolves both orders.', 'The agent handles only one of the orders.'),
    ],
  },
]
const GENERIC_POOL = [
  G('hard', 'Escalation', 'Demands a human immediately', 'speak to a human straight away', 'Put me through to a real person, please.', 'The agent offers to transfer and follows the escalation rule in the prompt.', 'The agent ignores the request for a human.'),
  G('medium', 'Out of scope', 'Asks something off-topic', 'get help with something the agent does not handle', 'Can you also help me with my phone bill?', 'The agent says it cannot help with that and points to the right place.', 'The agent makes up an answer.'),
  G('medium', 'Correction', 'Changes their mind midway', 'start one request, then switch to another', 'Actually, forget that. Can you do something else instead?', 'The agent drops the first request and handles the new one.', 'The agent completes the request the caller cancelled.'),
  G('medium', 'Edge case', 'Gives incomplete information', 'get help while leaving out a required detail', "I'd rather not give you that.", 'The agent explains why the detail is needed and what happens without it.', 'The agent proceeds without the required detail.'),
]

let genSeq = 0
export const EXAMPLE_PROMPT = AGENT_PROMPTS[NW]

export function generateScenarios(prompt) {
  const rng = mulberry32(hash(prompt.trim() + genSeq++))
  const match = POOLS.find((p) => p.match.test(prompt))
  const pool = match?.items ?? []
  const agentId = match?.agentId ?? NW // which mock agent answers in the simulated call
  const shuffled = (list) => [...list].sort(() => rng() - 0.5)
  return [...shuffled(pool).slice(0, 6), ...shuffled(GENERIC_POOL).slice(0, pool.length ? 2 : 4)].map((g, i) => ({
    ...g,
    tempId: `gen_${genSeq}_${i}`,
    agentId,
    source: 'generated',
  }))
}

// ---------- Conversation builder ----------

const GENERIC_SCRIPT = [
  ['agent', GREETING], ['user', '{opening}'],
  ['agent', 'I can help with that. Can I start with your full name?'], ['user', '{name}.'],
  ['agent', 'Thanks, {first}. Could you tell me a bit more about what you need?'], ['user', "I'm trying to {goal}."],
  ['agent', "Thanks. I've checked, and here's what I can do for you.", "I'm not able to help with that. Is there anything else?"],
  ['user', 'Okay, that works.'], ['agent', 'Is there anything else I can help with?'], ['user', "No, that's everything."],
]

const MOOD_OPENERS = {
  calm: '',
  angry: "I've already called about this twice. ",
  impatient: 'Quick one. ',
  confused: "Um, I'm not sure this is the right number, but ",
}

const PERSONA_BEATS = {
  angry: {
    user: 'Honestly, this is ridiculous. Can I just speak to a real person?',
    pass: ["I understand, and I'm sorry this has been frustrating. I can transfer you, or I can sort this out right now. Which would you prefer?", 'Fine. Just fix it, please.'],
    fail: ['I can help you with that. As I said, I just need a few more details first.', "You're not listening. Forget it."],
    hangUp: true,
    why: (t) => `When the caller asked for a real person at ${t}, the agent ignored the request and repeated its script. The caller hung up before the issue was resolved.`,
    passNote: ' It acknowledged the caller’s frustration instead of repeating its script.',
  },
  impatient: {
    user: "Can we speed this up? I've only got a couple of minutes.",
    pass: ["Of course. I'll keep this quick.", 'Thanks.'],
    fail: ['Sure. Before we continue, please note that calls may be recorded for quality and training purposes, and all requests are subject to our standard terms and conditions, which you can find on our website.', "I don't have time for this. I'll call back."],
    hangUp: true,
    why: (t) => `The caller asked to speed things up at ${t}. The agent read out a long disclaimer anyway, and the caller hung up before the request was done.`,
    passNote: ' It kept answers short when the caller said they were in a hurry.',
  },
  confused: {
    user: "Sorry, I'm not sure what you mean. What do you need from me?",
    pass: ['No problem, let me put it another way. I just need to confirm who you are so I can help.', 'Oh, okay. That makes sense.'],
    fail: ['As I said, I need you to provide the requested information to proceed.', "I… still don't know what you're asking."],
    why: (t) => `The caller didn't understand the question at ${t}. The agent repeated it word for word instead of rephrasing, and the caller stayed confused.`,
    passNote: ' It rephrased the question when the caller didn’t understand.',
  },
}

const ENV_BEATS = {
  noisy: {
    mark: (text) => `[traffic noise] ${text}`,
    pass: ["Sorry, it's a bit noisy on your end. Could you say that again?", (text) => `Sorry. ${text}`],
    fail: ["Okay, I've got that down.", "No, that's not what I said."],
    why: (t) => `Background noise covered part of the caller's answer at ${t}. The agent guessed instead of asking them to repeat it.`,
  },
  office: {
    mark: (text) => `[people talking nearby] ${text}`,
    pass: ['Thanks. Just to confirm I heard that right…', 'Yes, that’s right.'],
    fail: ["Sorry, did you say you'd like to cancel?", 'No, that was someone else in my office.'],
    why: (t) => `At ${t} the agent responded to a colleague talking in the caller's office instead of to the caller.`,
  },
  poor: {
    mark: (text) => `${text.split(' ').slice(0, 3).join(' ')} … [audio cut out] …`,
    pass: ['Sorry, you cut out for a moment. Could you say that again?', (text) => text],
    fail: ['Got it, thanks.', 'Wait, did you hear what I said?'],
    why: (t) => `At ${t} the caller's answer cut out, but the agent carried on without asking them to repeat it.`,
  },
}

function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

function addTimings(rng, turns, audio) {
  let t = rng() * 1.5
  for (const turn of turns) {
    const words = turn.text.split(/\s+/).length
    if (audio) {
      turn.t = Math.round(t)
      if (turn.role === 'user') turn.eou = intBetween(rng, 240, 620)
      else {
        turn.llm = intBetween(rng, 420, 1600)
        turn.tts = intBetween(rng, 110, 290)
        turn.e2e = turn.llm + turn.tts + intBetween(rng, 300, 900)
      }
      t += words * 0.36 + between(rng, 0.8, 2.4) + (turn.e2e || 0) / 1000
    }
  }
  const last = turns[turns.length - 1]
  return audio ? Math.max(8, Math.round(last.t + last.text.split(/\s+/).length * 0.36 + between(rng, 1, 3))) : null
}

// One simulated conversation. `cause` decides how (and whether) it fails.
function buildConversation({ scenario, persona, env, audio, cause, vars, rng }) {
  const base = scenario.script ?? GENERIC_SCRIPT
  let turns = base.map(([role, text, failText]) => ({
    role,
    text: fill(failText && cause === 'scenario' ? failText : text, vars),
    tag: failText ? 'key' : undefined,
  }))

  const opener = MOOD_OPENERS[persona.mood]
  if (opener) {
    const first = turns[1]
    const rest = persona.mood === 'confused' ? first.text.replace(/^(hi|hey|hello),?\s*/i, '') : first.text
    first.text = opener + (persona.mood === 'confused' && !/^I\b/.test(rest) ? rest.charAt(0).toLowerCase() + rest.slice(1) : rest)
  }

  let hangUp = false
  const beat = PERSONA_BEATS[persona.mood]
  if (beat) {
    // The caller pushes back instead of answering the agent's first question.
    const failed = cause === 'persona'
    const [agentLine, userLine] = failed ? beat.fail : beat.pass
    turns.splice(3, 0, { role: 'user', text: beat.user, tag: 'persona' }, { role: 'agent', text: agentLine, tag: 'persona' })
    if (failed && beat.hangUp) {
      turns = [...turns.slice(0, 5), { role: 'user', text: userLine, tag: 'persona' }]
      hangUp = true
    } else {
      turns[5] = { ...turns[5], text: `${userLine} ${turns[5].text}`, tag: failed ? 'persona' : turns[5].tag }
    }
  }

  const envBeat = audio && ENV_BEATS[env]
  if (envBeat && !hangUp) {
    const at = turns.findIndex((t, i) => i >= 3 && t.role === 'user' && !t.tag)
    if (at > 0) {
      const original = turns[at].text
      const failed = cause === 'environment'
      turns[at] = { ...turns[at], text: envBeat.mark(original), tag: 'env' }
      const [agentLine, userLine] = failed ? envBeat.fail : envBeat.pass
      turns.splice(at + 1, 0, { role: 'agent', text: agentLine, tag: failed ? 'env' : undefined }, { role: 'user', text: typeof userLine === 'function' ? userLine(original) : userLine })
    }
  }

  if (!hangUp) {
    turns.push({ role: 'agent', text: fill(cause ? 'Thanks for calling {org}. Goodbye.' : 'Thanks for calling {org}, {first}. Have a great day.', vars), tag: 'end' })
  }
  turns.forEach((t, i) => (t.idx = i))
  const duration = addTimings(rng, turns, audio)
  return { turns, duration, hangUp }
}

const idxOf = (turns, tag) => turns.filter((t) => t.tag === tag).map((t) => t.idx)
const stamp = (turn, audio) => (audio ? clock(turn.t) : `turn ${turn.idx + 1}`)

function criteriaVerdict({ scenario, persona, env, audio, cause, turns }) {
  const keyTurns = idxOf(turns, 'key')
  if (!cause) {
    const note = PERSONA_BEATS[persona.mood]?.passNote ?? ''
    const reason = (scenario.passWhy ?? `The conversation meets the success criteria: “${scenario.success}”`) + note
    return { status: 'passed', reason, turns: keyTurns.length ? keyTurns : idxOf(turns, 'end') }
  }
  const tagged = cause === 'scenario' ? [] : idxOf(turns, cause === 'persona' ? 'persona' : 'env')
  if (!tagged.length) {
    return { status: 'failed', reason: scenario.failWhy ?? `The conversation matches the failure criteria: “${scenario.failure}”`, turns: keyTurns }
  }
  const beat = cause === 'persona' ? PERSONA_BEATS[persona.mood] : ENV_BEATS[env]
  return { status: 'failed', reason: beat.why(stamp(turns[tagged[0]], audio)), turns: tagged }
}

function evalVerdict({ evaluation, criteria, turns, roll, risk }) {
  const agentTurns = turns.filter((t) => t.role === 'agent')
  const turn = agentTurns[Math.floor(roll * 997) % agentTurns.length].idx
  // Outcome-style checks follow what actually happened in the conversation.
  if (['goal', 'outcome'].includes(evaluation.key)) {
    return criteria.status === 'failed'
      ? { status: 'failed', reason: `The caller's request was not completed. ${criteria.reason}`, turns: criteria.turns }
      : { status: 'passed', reason: "The caller's request was handled and the call ended with a clear next step.", turns: [agentTurns[agentTurns.length - 1].idx] }
  }
  const failed = roll < Math.min(0.5, 0.07 * risk)
  return failed
    ? { status: 'failed', reason: `This conversation matches the failure criteria: “${evaluation.failure}”`, turns: [turn] }
    : { status: 'passed', reason: `This conversation meets the success criteria: “${evaluation.success}”`, turns: [turn] }
}

export const CRITERIA_CHECK = { id: 'criteria', name: 'Scenario criteria', required: true }

// The agent version is the one live when the run started.
export function simulateSession({ runId, agentId, createdAt, scenario, persona, env, rep, mode, evaluations = [] }) {
  const version = versionAt(agentId, createdAt)
  const audio = isVoice(mode)
  const key = `${runId}:${scenario.id}:${persona.id}:${env ?? '-'}:${rep}`
  const rng = mulberry32(hash(key))
  const name = pick(rng, NAMES)
  const agent = AGENT_BY_ID[agentId]
  const vars = { name, first: name.split(' ')[0], dob: pick(rng, DOBS), last4: String(intBetween(rng, 1000, 9999)), org: agent.org, persona: agent.persona, opening: scenario.opening, goal: scenario.goal }

  const envF = audio ? ENV_BY_ID[env].factor : 1
  const moodF = MOODS[persona.mood].factor
  const versionF = 0.55 + 0.45 * factorFor(agentId, version)
  const risk = moodF * envF * versionF * (audio ? 1.1 : 1)
  const failP = Math.min(0.85, DIFFICULTY[scenario.difficulty].p * risk)
  let cause = null
  if (chance(key + ':fail') < failP) {
    const r = chance(key + ':cause')
    if (audio && env !== 'quiet' && r < 0.45) cause = 'environment'
    else if (persona.mood !== 'calm' && r < 0.75) cause = 'persona'
    else cause = 'scenario'
  }

  const { turns, duration, hangUp } = buildConversation({ scenario, persona, env, audio, cause, vars, rng })
  const criteria = criteriaVerdict({ scenario, persona, env, audio, cause, turns })
  const results = { criteria }
  for (const e of evaluations) results[e.id] = evalVerdict({ evaluation: e, criteria, turns, roll: chance(`${key}:${e.id}`), risk })

  const checks = 1 + evaluations.length
  const convo = audio ? (duration / 60) * MODES[mode].perMinute : turns.length * MODES.text.perTurn
  return {
    id: `sim-${hash(key).toString(36).padStart(7, '0')}`,
    runId,
    agentId,
    scenarioId: scenario.id,
    personaId: persona.id,
    env: audio ? env : null,
    rep,
    caller: name,
    mode,
    turns: turns.map(({ tag, ...t }) => t),
    turnCount: turns.length,
    duration,
    outcome: hangUp ? 'Abandoned' : 'Completed',
    direction: 'Inbound',
    results,
    cost: { convo, checks: checks * PER_CHECK, total: convo + checks * PER_CHECK },
  }
}

// passed | review | failed — same rule as evaluation runs.
export function simSessionStatus(session, evaluations) {
  if (session.results.criteria.status === 'failed') return 'failed'
  let status = 'passed'
  for (const e of evaluations) {
    if (session.results[e.id]?.status !== 'failed') continue
    if (e.required) return 'failed'
    status = 'review'
  }
  return status
}

// Every scenario × persona (× environment) × repeat combination.
export function combos({ scenarios, personas, environments, repeats, mode }) {
  const envs = isVoice(mode) ? environments : [null]
  const out = []
  for (const scenario of scenarios) for (const persona of personas) for (const env of envs) for (let rep = 1; rep <= repeats; rep++) out.push({ scenario, persona, env, rep })
  return out
}

export function buildSimRun(config) {
  const { id, agentId, mode, createdAt, evaluations = [] } = config
  const sessions = combos(config).map((c) => simulateSession({ runId: id, agentId, createdAt, mode, evaluations, ...c }))
  return { ...config, evaluations, sessions, total: sessions.length }
}

// Rough cost before running: simulate everything once with a throwaway seed.
export function estimate(config) {
  const sample = buildSimRun({ ...config, id: 'estimate', createdAt: new Date().toISOString() })
  const cost = sample.sessions.reduce((a, s) => a + s.cost.total, 0)
  const minutes = sample.sessions.reduce((a, s) => a + (s.duration ?? 0), 0) / 60
  const turns = sample.sessions.reduce((a, s) => a + s.turnCount, 0)
  return { conversations: sample.sessions.length, cost, perConversation: sample.sessions.length ? cost / sample.sessions.length : 0, minutes, turns }
}

export function summarizeSimRun(run) {
  const done = run.sessions.slice(0, run.status === 'completed' ? run.sessions.length : run.done)
  const counts = { passed: 0, review: 0, failed: 0 }
  const statusOf = {}
  for (const s of done) counts[(statusOf[s.id] = simSessionStatus(s, run.evaluations))]++
  const cell = (filter) => {
    const list = done.filter(filter)
    const passed = list.filter((s) => statusOf[s.id] === 'passed').length
    return { total: list.length, passed, rate: list.length ? passed / list.length : null }
  }
  const checks = [CRITERIA_CHECK, ...run.evaluations].map((e) => {
    const passed = done.filter((s) => s.results[e.id].status === 'passed').length
    return { ...e, passed, total: done.length, rate: done.length ? passed / done.length : 0 }
  })
  return {
    counts,
    statusOf,
    passRate: done.length ? counts.passed / done.length : 0,
    cost: done.reduce((a, s) => a + s.cost.total, 0),
    minutes: done.reduce((a, s) => a + (s.duration ?? 0), 0) / 60,
    turns: done.reduce((a, s) => a + s.turnCount, 0),
    checks,
    cell,
  }
}

// ---------- Seed history ----------

const personasById = Object.fromEntries(INITIAL_PERSONAS.map((p) => [p.id, p]))
const scenariosById = Object.fromEntries(INITIAL_SCENARIOS.map((s) => [s.id, s]))

const SEED = [
  { id: 'sim_r1a7', name: 'Pre-release check', mode: 'text', createdAt: '2026-09-12T15:20:00', createdBy: 'Priya Shah', scenarios: ['scn_nw1', 'scn_nw2', 'scn_nw3'], personas: ['per_calm', 'per_angry', 'per_impatient'], repeats: 2 },
  { id: 'sim_r2c4', name: 'Hard callers', mode: 'text', createdAt: '2026-09-19T11:05:00', createdBy: 'Ahmed Bhesaniya', scenarios: ['scn_nw1', 'scn_nw2', 'scn_nw3', 'scn_nw4'], personas: ['per_angry', 'per_impatient', 'per_confused', 'per_k3v8'], repeats: 1 },
  { id: 'sim_r3q9', name: 'Audio stress test', mode: 'audio', environments: ['quiet', 'noisy', 'poor'], createdAt: '2026-09-25T10:40:00', createdBy: 'Ahmed Bhesaniya', scenarios: ['scn_nw1', 'scn_nw2', 'scn_nw3'], personas: ['per_calm', 'per_angry', 'per_confused'], repeats: 1 },
  { id: 'sim_r5t1', name: 'Phone line check', mode: 'telephony', environments: ['quiet', 'poor'], phoneNumber: '+1 (415) 555-0142', createdAt: '2026-09-27T14:10:00', createdBy: 'Marco Diaz', scenarios: ['scn_nw1', 'scn_nw3'], personas: ['per_calm', 'per_impatient'], repeats: 1 },
  { id: 'sim_r4m2', name: 'Weekly regression', mode: 'text', createdAt: '2026-09-29T09:30:00', createdBy: 'Priya Shah', scenarios: ['scn_nw1', 'scn_nw2', 'scn_nw3', 'scn_nw4'], personas: ['per_calm', 'per_angry', 'per_impatient', 'per_confused'], repeats: 2 },
]

export function buildSeedSimRuns() {
  return SEED.map((r) => {
    const run = buildSimRun({
      id: r.id,
      name: r.name,
      agentId: NW,
      mode: r.mode,
      phoneNumber: r.phoneNumber,
      environments: r.environments ?? [],
      repeats: r.repeats,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
      scenarios: r.scenarios.map((id) => ({ ...scenariosById[id] })),
      personas: r.personas.map((id) => ({ ...personasById[id] })),
    })
    return { ...run, status: 'completed', done: run.total }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
