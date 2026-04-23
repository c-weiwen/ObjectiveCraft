import { useState, useEffect } from "react";

// ─── API ──────────────────────────────────────────────────────────────────────
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
let _lastCallTime = 0;
const MIN_INTERVAL_MS = 3000;
async function callClaude(prompt) {
  const apiKey = import.meta.env.VITE_FREELLM_API_KEY;
  if (!apiKey) {
    throw new Error("FreeLLM API key not set. Add VITE_FREELLM_API_KEY to your .env file.");
  }
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - _lastCallTime);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _lastCallTime = Date.now();
  const base = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/freellm' : '');
  const response = await fetch(`${base}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      message: prompt
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "API error " + response.status);
  return data.response || data.message || data.reply || data.content || "";
}

// ─── Bloom's Taxonomy Reference ───────────────────────────────────────────────

const BLOOMS_REFERENCE = `
BLOOM'S TAXONOMY — THREE DOMAINS (source: University of Waterloo CTE)

COGNITIVE DOMAIN (intellectual skills, critical thinking, problem solving):
  Remember    – recall facts; activities: flashcards, quizzes, labeling diagrams; assessments: multiple choice, true/false, fill-in-the-blank
  Understand  – interpret meaning; activities: concept maps, discussions, case studies, summarizing; assessments: short answer, paraphrasing, explanation tasks
  Apply       – use knowledge in new situations; activities: lab experiments, role play, problem-solving tasks, simulations; assessments: problem sets, practical tasks, simulations
  Analyze     – examine relationships, break down information; activities: debates, comparisons, mind maps, SWOT analysis; assessments: case analysis, annotated diagrams, comparative essays
  Evaluate    – make judgments based on evidence; activities: critiques, argumentative essays, peer review, presentations; assessments: essays, rubric-based presentations, peer evaluation
  Create      – combine information to produce new solutions; activities: brainstorming, research projects, design tasks, building prototypes; assessments: portfolios, capstone projects, original works

AFFECTIVE DOMAIN (attitudes, values, emotional response, motivation):
  Receiving       – willingly listen and accept knowledge; activities: watching videos, reading materials, attending lectures; assessments: attendance, observation checklists
  Responding      – actively participate; activities: group discussions, role-play, written assignments; assessments: participation rubrics, short written responses
  Valuing         – find worth in learning, maintain motivation; activities: reflection activities, debates on values; assessments: reflection papers, questionnaires, opinion essays
  Organization    – integrate and prioritize values; activities: time management tasks, problem-solving demonstrations; assessments: process journals, demonstration of consistent behavior
  Characterization– values control behavior; activities: group projects, sustained community work; assessments: critical self-reflection, long-term project portfolios, self-evaluation

PSYCHOMOTOR DOMAIN (physical movement, coordination, technique, accuracy):
  Set                  – readiness to act physically and mentally; activities: demonstrations, observation of procedures; assessments: pre-task readiness checks
  Guided Response      – learning through practice and trial-and-error; activities: supervised drills, step-by-step practice; assessments: instructor checklists, observed practice
  Mechanism            – developing proficiency, actions become habitual; activities: repeated practice tasks, timed drills; assessments: performance tests, accuracy checks
  Complex Overt Response – expert-level performance with high accuracy; activities: complex multi-step procedures; assessments: performance evaluations, expert observation
  Adaptation           – modify skills for different situations; activities: varied scenario practice, adaptive tasks; assessments: scenario-based performance, adaptive skill tests
  Origination          – create new procedures and solutions; activities: innovation challenges, design of new techniques; assessments: creative performance projects, novel solution evaluation
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOOM = {
  Remember: {
    color: "#374151",
    bg: "#F3F4F6",
    verbs: ["define", "list", "recall", "identify", "name", "state", "recognize", "label", "match", "repeat", "select"]
  },
  Understand: {
    color: "#0369A1",
    bg: "#EFF6FF",
    verbs: ["explain", "describe", "summarize", "classify", "interpret", "compare", "paraphrase", "discuss", "distinguish", "illustrate"]
  },
  Apply: {
    color: "#059669",
    bg: "#ECFDF5",
    verbs: ["use", "demonstrate", "solve", "perform", "execute", "implement", "operate", "calculate", "produce", "show", "apply"]
  },
  Analyze: {
    color: "#7C3AED",
    bg: "#F5F3FF",
    verbs: ["analyze", "differentiate", "examine", "break down", "distinguish", "organize", "outline", "diagram", "relate", "contrast"]
  },
  Evaluate: {
    color: "#DC2626",
    bg: "#FEF2F2",
    verbs: ["evaluate", "judge", "critique", "justify", "defend", "assess", "appraise", "recommend", "argue", "validate"]
  },
  Create: {
    color: "#D97706",
    bg: "#FFFBEB",
    verbs: ["design", "develop", "construct", "produce", "compose", "formulate", "plan", "devise", "generate", "build", "synthesize"]
  }
};
const STEPS = [{
  key: "audience",
  letter: "A",
  label: "Audience",
  question: "Who are the learners?",
  hint: "Describe your learners — their role, level, and prior knowledge.",
  placeholder: "e.g. Second-year nursing students with foundational anatomy knowledge",
  tip: "Be specific about prior knowledge — it shapes every design decision.",
  showBlooms: false
}, {
  key: "behavior",
  letter: "B",
  label: "Behavior",
  question: "What will learners be able to DO?",
  hint: "Use one observable, measurable action verb. It signals the cognitive level expected.",
  placeholder: "e.g. Analyze patient vital signs and identify early warning indicators",
  tip: "The verb determines depth of learning — choose it intentionally.",
  showBlooms: true
}, {
  key: "condition",
  letter: "C",
  label: "Condition",
  question: "Under what conditions will they perform?",
  hint: "Describe the context — tools, resources, or constraints available.",
  placeholder: "e.g. Given a simulated patient scenario and an observation checklist",
  tip: "Conditions make objectives realistic and directly assessable.",
  showBlooms: false
}, {
  key: "degree",
  letter: "D",
  label: "Degree",
  question: "To what standard must they perform?",
  hint: "Define the criteria — accuracy rate, number of items, time limit, or quality threshold.",
  placeholder: "e.g. with 85% accuracy, correctly identifying 3 of 4 critical warning indicators",
  tip: "The degree tells you exactly when the objective has been met.",
  showBlooms: false
}];

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Nunito:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F5F3EE; font-family: 'Nunito', sans-serif; color: #1C1814; min-height: 100vh; }
  .app { max-width: 820px; margin: 0 auto; padding: 24px 16px 80px; }
  .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .logo { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #0C5449; cursor: pointer; }
  .logo em { color: #B85C20; font-style: normal; }
  .card { background: #fff; border: 1px solid #E5E1DB; border-radius: 18px; padding: 28px 32px; margin-bottom: 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
  .btn { display: inline-flex; align-items: center; gap: 7px; border: none; border-radius: 10px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.18s; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-lg  { padding: 13px 30px; font-size: 15px; }
  .btn-md  { padding: 10px 20px; font-size: 14px; }
  .btn-sm  { padding: 7px 14px;  font-size: 13px; }
  .btn-primary   { background: #0C5449; color: #fff; }
  .btn-primary:hover:not(:disabled)   { background: #0A4740; }
  .btn-accent    { background: #B85C20; color: #fff; }
  .btn-accent:hover:not(:disabled)    { background: #9E4F1C; }
  .btn-secondary { background: transparent; color: #0C5449; border: 1.5px solid #0C5449; }
  .btn-secondary:hover:not(:disabled) { background: #E3F2EF; }
  .btn-ghost { background: transparent; color: #6E6862; border: 1.5px solid #E5E1DB; }
  .btn-ghost:hover:not(:disabled) { background: #F5F3EE; }
  .field-label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #6E6862; margin-bottom: 7px; }
  .text-input { width: 100%; border: 1.5px solid #E5E1DB; border-radius: 10px; padding: 11px 15px; font-family: 'Nunito', sans-serif; font-size: 15px; color: #1C1814; background: #fff; outline: none; transition: border-color 0.2s; }
  .text-input:focus { border-color: #0C5449; }
  .text-area { width: 100%; border: 1.5px solid #E5E1DB; border-radius: 10px; padding: 11px 15px; font-family: 'Nunito', sans-serif; font-size: 14px; color: #1C1814; background: #fff; outline: none; resize: vertical; min-height: 76px; line-height: 1.6; transition: border-color 0.2s; }
  .text-area:focus { border-color: #0C5449; }
  .hint-box { display: flex; gap: 10px; background: #F0FAF8; border: 1px solid #A8D5CE; border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #0C5449; margin-bottom: 14px; line-height: 1.55; }
  .tip-chip { display: inline-flex; align-items: center; gap: 6px; background: #FEF5EE; border: 1px solid #F0D5BE; border-radius: 20px; padding: 4px 13px; font-size: 12px; color: #B85C20; font-style: italic; margin-top: 8px; }
  .abcd-progress { display: flex; gap: 7px; margin-bottom: 22px; }
  .abcd-pill { flex: 1; text-align: center; padding: 7px 4px; border-radius: 8px; font-size: 13px; font-weight: 700; }
  .pill-done    { background: #0C5449; color: #fff; cursor: pointer; }
  .pill-active  { background: #E3F2EF; color: #0C5449; border: 1.5px solid #0C5449; }
  .pill-pending { background: #EDE9E3; color: #B0AA9E; }
  .step-letter-box { width: 54px; height: 54px; border-radius: 13px; background: #E3F2EF; border: 2px solid #0C5449; color: #0C5449; font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
  .step-h2 { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; margin-bottom: 3px; }
  .step-sub { font-size: 13px; color: #6E6862; }
  .blooms-wrap { background: #F9F7F4; border: 1px solid #E5E1DB; border-radius: 12px; padding: 14px; margin-top: 14px; }
  .blooms-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px; color: #6E6862; margin-bottom: 10px; }
  .bloom-row { margin-bottom: 8px; }
  .bloom-name { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
  .verb-chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .verb-chip { border: none; border-radius: 5px; padding: 3px 9px; font-family: 'Nunito', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; }
  .verb-chip:hover { filter: brightness(0.9); }
  .ai-box { background: linear-gradient(135deg, #EBF8F5, #EEF5FF); border: 1px solid #A8D5CE; border-radius: 12px; padding: 15px; margin-top: 14px; }
  .ai-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px; color: #0C5449; margin-bottom: 8px; }
  .ai-text { font-size: 14px; line-height: 1.75; color: #1C1814; white-space: pre-wrap; }
  .ai-error { font-size: 13px; color: #DC2626; background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 10px 14px; margin-top: 14px; }
  .nav-row { display: flex; justify-content: space-between; align-items: center; margin-top: 22px; }
  .mini-preview { background: #F9F7F4; border: 1px solid #E5E1DB; border-radius: 12px; padding: 16px 20px; margin-top: 14px; }
  .mini-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px; color: #B0AA9E; margin-bottom: 10px; }
  .mini-row { display: flex; gap: 9px; margin-bottom: 7px; align-items: flex-start; }
  .mini-badge { width: 22px; height: 22px; border-radius: 5px; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .mb-filled { background: #0C5449; color: #fff; }
  .mb-empty  { background: #EDE9E3; color: #B0AA9E; }
  .mini-val { font-size: 13px; color: #1C1814; line-height: 1.5; }
  .obj-chip { background: linear-gradient(135deg, #E3F2EF, #EBF0FF); border: 1px solid #A8D5CE; border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; }
  .obj-chip-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px; color: #0C5449; margin-bottom: 7px; }
  .obj-chip-text { font-family: 'Cormorant Garamond', serif; font-size: 16px; color: #0C5449; line-height: 1.55; font-style: italic; }
  .validate-box { background: #F0FAF8; border: 2px solid #0C5449; border-radius: 14px; padding: 20px 22px; margin-bottom: 18px; }
  .rating-badge { display: inline-block; border-radius: 6px; padding: 2px 11px; font-size: 12px; font-weight: 800; margin-bottom: 8px; }
  .id-layout { display: grid; grid-template-columns: 200px 1fr; gap: 16px; align-items: start; }
  .id-sidebar { background: #fff; border: 1px solid #E5E1DB; border-radius: 16px; padding: 16px; position: sticky; top: 24px; }
  .sidebar-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #B0AA9E; margin-bottom: 12px; }
  .sidebar-item { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: 9px; font-size: 13px; font-weight: 600; color: #6E6862; margin-bottom: 2px; cursor: pointer; }
  .sidebar-item:hover { background: #F5F3EE; }
  .si-active { background: #E3F2EF !important; color: #0C5449; }
  .si-done   { color: #0C5449; }
  .si-check  { margin-left: auto; font-size: 12px; color: #0C5449; }
  .final-card { background: linear-gradient(145deg, #0C5449, #093E36); border-radius: 20px; padding: 32px; color: #fff; margin-bottom: 18px; position: relative; overflow: hidden; }
  .final-card::before { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.05); }
  .final-obj { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; line-height: 1.5; margin-bottom: 24px; position: relative; }
  .abcd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; position: relative; }
  .abcd-cell { background: rgba(255,255,255,0.1); border-radius: 9px; padding: 11px 13px; }
  .abcd-cell-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; opacity: 0.55; margin-bottom: 4px; }
  .abcd-cell-val   { font-size: 12px; opacity: 0.88; line-height: 1.4; }
  .action-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .hero-title { font-family: 'Cormorant Garamond', serif; font-size: 44px; font-weight: 600; color: #0C5449; line-height: 1.1; margin-bottom: 12px; text-align: center; }
  .hero-sub { font-size: 15px; color: #6E6862; text-align: center; max-width: 420px; margin: 0 auto 28px; line-height: 1.65; }
  .features { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; padding: 4px 0; }
  .feat { text-align: center; max-width: 150px; }
  .feat-icon { font-size: 24px; margin-bottom: 7px; }
  .feat-name { font-weight: 800; font-size: 13px; margin-bottom: 2px; }
  .feat-desc { font-size: 12px; color: #6E6862; line-height: 1.4; }
  .saved-item { background: #F9F7F4; border: 1px solid #E5E1DB; border-radius: 11px; padding: 14px 16px; margin-bottom: 10px; }
  .saved-item:hover { border-color: #0C5449; }
  .saved-date { font-size: 11px; color: #B0AA9E; font-weight: 600; margin-bottom: 3px; }
  .saved-subj { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0C5449; margin-bottom: 5px; }
  .saved-obj  { font-size: 13px; color: #1C1814; line-height: 1.5; }
  .saved-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px; }
  .saved-tag  { background: #E3F2EF; color: #0C5449; border-radius: 4px; padding: 2px 7px; font-size: 11px; font-weight: 700; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: currentColor; animation: spin 0.7s linear infinite; flex-shrink: 0; }
  .spin-dark { border-color: rgba(12,84,73,0.2); border-top-color: #0C5449; }
  @media(max-width:600px) { .id-layout { grid-template-columns: 1fr; } .abcd-grid { grid-template-columns: 1fr; } .hero-title { font-size: 32px; } }
`;

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState("welcome");
  const [subject, setSubject] = useState("");
  const [step, setStep] = useState(0);
  const [abcd, setAbcd] = useState({
    audience: "",
    behavior: "",
    condition: "",
    degree: ""
  });
  const [aiFb, setAiFb] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [aiErr, setAiErr] = useState({});
  const [assembled, setAssembled] = useState("");
  const [asmFb, setAsmFb] = useState({
    rating: "",
    notes: ""
  });
  const [asmLoading, setAsmLoading] = useState(false);
  const [idStep, setIdStep] = useState("learners");
  const [idIn, setIdIn] = useState({
    learners: "",
    method: "",
    assess: ""
  });
  const [idFb, setIdFb] = useState({});
  const [idLoading, setIdLoading] = useState({});
  const [idErr, setIdErr] = useState({});
  const [refine, setRefine] = useState("");
  const [refLoading, setRefLoading] = useState(false);
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("oc2_saved") || "[]"));
    } catch {}
  }, []);

  // ── AI calls ────────────────────────────────────────────────────────────────

  const getStepFeedback = async key => {
    const s = STEPS.find(s => s.key === key);
    const val = abcd[key];
    if (!val.trim()) return;
    setAiLoading(prev => ({
      ...prev,
      [key]: true
    }));
    setAiErr(prev => ({
      ...prev,
      [key]: ""
    }));
    setAiFb(prev => ({
      ...prev,
      [key]: ""
    }));
    try {
      const text = await callClaude("You are an expert instructional designer. A teacher is writing the \"" + s.label + "\" (" + s.letter + ") component of an ABCD learning objective.\n" + "Subject: \"" + (subject || "not specified") + "\"\n" + "Their input: \"" + val + "\"\n\n" + "Give brief coaching feedback in 2-3 sentences:\n" + "1. Is this well-suited for the " + s.label + " component?\n" + "2. One specific improvement suggestion or confirmation it is strong.\n" + "Be direct and constructive.");
      setAiFb(prev => ({
        ...prev,
        [key]: text
      }));
    } catch (e) {
      setAiErr(prev => ({
        ...prev,
        [key]: e.message
      }));
    } finally {
      setAiLoading(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };
  const assemble = async () => {
    const direct = abcd.condition.trim() + ", " + abcd.audience.trim() + " will " + abcd.behavior.trim() + " " + abcd.degree.trim();
    setAssembled(direct);
    setAsmFb({
      rating: "",
      notes: ""
    });
    setPhase("validate");
    setAsmLoading(true);
    try {
      const text = await callClaude("You are an expert instructional designer. The following is a learning objective:\n" + "\"" + direct + "\"\n\n" + "Rate its quality as exactly one of: Strong, Good, or Needs Revision\n" + "Explain the rating in 2 sentences.\n\n" + "Reply in EXACTLY this format with no extra text:\n" + "RATING: [rating]\nNOTES: [explanation]");
      const ratM = text.match(/RATING:\s*(.+?)(?=\nNOTES:)/s);
      const notM = text.match(/NOTES:\s*([\s\S]+)/);
      setAsmFb({
        rating: ratM ? ratM[1].trim() : "",
        notes: notM ? notM[1].trim() : ""
      });
    } catch (e) {
      setAsmFb({
        rating: "",
        notes: "Error: " + e.message
      });
    } finally {
      setAsmLoading(false);
    }
  };
  const getIdFb = async sid => {
    setIdLoading(prev => ({
      ...prev,
      [sid]: true
    }));
    setIdErr(prev => ({
      ...prev,
      [sid]: ""
    }));
    setIdFb(prev => ({
      ...prev,
      [sid]: ""
    }));
    const prompts = {
      learners: "You are an expert instructional designer with deep knowledge of Bloom's Taxonomy across all three domains.\n\n" + "BLOOM'S TAXONOMY REFERENCE:\n" + BLOOMS_REFERENCE + "\n\n" + "Learning Objective: \"" + assembled + "\"\n" + "Teacher's learner description: \"" + (idIn.learners || "(not provided)") + "\"\n\n" + "Based on the learning objective and learner description:\n" + "1. Identify which Bloom's domain (Cognitive, Affective, or Psychomotor) and level this objective primarily targets, and briefly justify.\n" + "2. Describe 3-4 key learner factors relevant to this objective (prior knowledge, motivation, context, etc.).\n" + "3. Explain how these learner factors should shape the instructional approach given the identified taxonomy level.\n" + "4. Note any overlooked learner considerations.\n" + "Be specific and practical.",
      method: "You are an expert instructional designer with deep knowledge of Bloom's Taxonomy across all three domains.\n\n" + "BLOOM'S TAXONOMY REFERENCE:\n" + BLOOMS_REFERENCE + "\n\n" + "Learning Objective: \"" + assembled + "\"\n" + "Learner profile: \"" + (idIn.learners || "not described") + "\"\n" + "Teacher's proposed method: \"" + (idIn.method || "(open to suggestions)") + "\"\n\n" + "Based on the Bloom's domain and level implied by the objective:\n" + "1. Identify the primary Bloom's domain and level for this objective.\n" + "2. Recommend 3 learning activities specifically suited to that taxonomy level, drawn from the reference above. For each activity: name it, explain why it fits this objective and learner profile (1-2 sentences), and give one concrete implementation tip.\n" + "3. If the teacher proposed a method, evaluate whether it aligns with the identified taxonomy level.\n" + "Use a numbered list.",
      assess: "You are an expert instructional designer with deep knowledge of Bloom's Taxonomy across all three domains.\n\n" + "BLOOM'S TAXONOMY REFERENCE:\n" + BLOOMS_REFERENCE + "\n\n" + "Learning Objective: \"" + assembled + "\"\n" + "Instructional method: \"" + (idIn.method || "not specified") + "\"\n" + "Learner profile: \"" + (idIn.learners || "not described") + "\"\n\n" + "Based on the Bloom's domain and level implied by the objective:\n" + "1. Identify the primary Bloom's domain and level for this objective.\n" + "2. Propose 3 assessment approaches drawn from the taxonomy reference that directly measure this objective. For each: type, description, how it aligns to the Degree standard, whether it is formative or summative, and why it suits this taxonomy level.\n" + "Use a numbered list."
    };
    try {
      const text = await callClaude(prompts[sid]);
      setIdFb(prev => ({
        ...prev,
        [sid]: text
      }));
    } catch (e) {
      setIdErr(prev => ({
        ...prev,
        [sid]: e.message
      }));
    } finally {
      setIdLoading(prev => ({
        ...prev,
        [sid]: false
      }));
    }
  };
  const doRefine = async () => {
    setRefLoading(true);
    setRefine("");
    try {
      const text = await callClaude("You are an expert instructional designer with deep knowledge of Bloom's Taxonomy across all three domains.\n\n" + "BLOOM'S TAXONOMY REFERENCE:\n" + BLOOMS_REFERENCE + "\n\n" + "Learning Objective: \"" + assembled + "\"\n" + "Learner profile: \"" + (idIn.learners || idFb.learners || "not specified") + "\"\n" + "Instructional method: \"" + (idIn.method || idFb.method || "not specified") + "\"\n" + "Assessment: \"" + (idIn.assess || idFb.assess || "not specified") + "\"\n\n" + "Using the Bloom's Taxonomy reference above, provide a final design synthesis:\n" + "1. Identify the Bloom's domain (Cognitive/Affective/Psychomotor) and specific level this objective targets.\n" + "2. Evaluate alignment: do the chosen instructional methods and assessments match the identified taxonomy level and domain? Cite specific activities/assessments from the taxonomy reference that are a good fit.\n" + "3. Identify any gaps or misalignments between the objective, methods, and assessments.\n" + "4. Give 2 specific, actionable refinement recommendations to strengthen the overall design.\n" + "5. One forward-looking improvement — e.g. how to scaffold toward a higher taxonomy level in future lessons.\n" + "Use a numbered list. Be specific and reference taxonomy levels by name.");
      setRefine(text);
    } catch (e) {
      setRefine("Error: " + e.message);
    } finally {
      setRefLoading(false);
    }
  };

  // ── Misc ────────────────────────────────────────────────────────────────────

  const reset = () => {
    setPhase("welcome");
    setStep(0);
    setSubject("");
    setAbcd({
      audience: "",
      behavior: "",
      condition: "",
      degree: ""
    });
    setAiFb({});
    setAiLoading({});
    setAiErr({});
    setAssembled("");
    setAsmFb({
      rating: "",
      notes: ""
    });
    setAsmLoading(false);
    setIdStep("learners");
    setIdIn({
      learners: "",
      method: "",
      assess: ""
    });
    setIdFb({});
    setIdLoading({});
    setIdErr({});
    setRefine("");
    setRefLoading(false);
  };
  const save = () => {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
      subject,
      objective: assembled,
      abcd: {
        ...abcd
      }
    };
    const next = [entry, ...saved.slice(0, 19)];
    setSaved(next);
    localStorage.setItem("oc2_saved", JSON.stringify(next));
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2000);
  };
  const copy = () => {
    const lines = ["LEARNING OBJECTIVE", assembled, "", "ABCD COMPONENTS", "A — Audience:  " + abcd.audience, "B — Behavior:  " + abcd.behavior, "C — Condition: " + abcd.condition, "D — Degree:    " + abcd.degree];
    if (idFb.method) lines.push("", "INSTRUCTIONAL STRATEGY", idFb.method);
    if (idFb.assess) lines.push("", "ASSESSMENT", idFb.assess);
    if (refine) lines.push("", "REFINEMENT NOTES", refine);
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Shared UI ────────────────────────────────────────────────────────────────

  const Spin = _ref => {
    let {
      dark
    } = _ref;
    return /*#__PURE__*/_jsx("span", {
      className: "spin" + (dark ? " spin-dark" : "")
    });
  };
  const AiBox = _ref2 => {
    let {
      fb,
      loading,
      err
    } = _ref2;
    if (loading) return /*#__PURE__*/_jsxs("div", {
      className: "ai-box",
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        color: "#6E6862",
        fontSize: 14
      },
      children: [Spin({
        dark: true
      }), " Thinking..."]
    });
    if (err) return /*#__PURE__*/_jsxs("div", {
      className: "ai-error",
      children: ["Error: ", err]
    });
    if (!fb) return null;
    return /*#__PURE__*/_jsxs("div", {
      className: "ai-box",
      children: [/*#__PURE__*/_jsx("div", {
        className: "ai-label",
        children: "AI Feedback"
      }), /*#__PURE__*/_jsx("div", {
        className: "ai-text",
        style: {
          textAlign: "left"
        },
        children: fb.replace(/\*\*/g, "")
      })]
    });
  };

  // ── Views ────────────────────────────────────────────────────────────────────

  const Welcome = () => /*#__PURE__*/_jsxs("div", {
    className: "card",
    style: {
      textAlign: "center",
      padding: "44px 32px 36px"
    },
    children: [/*#__PURE__*/_jsx("div", {
      className: "hero-title",
      children: "ObjectiveCraft"
    }), /*#__PURE__*/_jsx("p", {
      className: "hero-sub",
      children: "A step-by-step tool for teachers and trainers. Write precise ABCD objectives, then get AI-powered instructional strategy recommendations."
    }), /*#__PURE__*/_jsx("div", {
      className: "features",
      style: {
        marginBottom: 32
      },
      children: [["🎯", "ABCD Framework", "Audience · Behavior · Condition · Degree"], ["🤖", "AI Coaching", "Guidance at every step"], ["🧭", "ID Alignment", "Objective → Method → Assessment"], ["💾", "Save & Export", "Copy or save for later"]].map(_ref3 => {
        let [icon, name, desc] = _ref3;
        return /*#__PURE__*/_jsxs("div", {
          className: "feat",
          children: [/*#__PURE__*/_jsx("div", {
            className: "feat-icon",
            children: icon
          }), /*#__PURE__*/_jsx("div", {
            className: "feat-name",
            children: name
          }), /*#__PURE__*/_jsx("div", {
            className: "feat-desc",
            children: desc
          })]
        }, name);
      })
    }), /*#__PURE__*/_jsxs("div", {
      style: {
        maxWidth: 420,
        margin: "0 auto"
      },
      children: [/*#__PURE__*/_jsx("label", {
        className: "field-label",
        children: "Subject / Topic (optional)"
      }), /*#__PURE__*/_jsx("input", {
        className: "text-input",
        value: subject,
        onChange: e => setSubject(e.target.value),
        placeholder: "e.g. Emergency Nursing, UN Peacekeeping, Financial Literacy",
        onKeyDown: e => e.key === "Enter" && setPhase("abcd"),
        style: {
          marginBottom: 20
        }
      }), /*#__PURE__*/_jsx("button", {
        type: "button",
        className: "btn btn-primary btn-lg",
        style: {
          width: "100%",
          justifyContent: "center"
        },
        onClick: () => setPhase("abcd"),
        children: "Start Designing \u2192"
      })]
    })]
  });
  const Abcd = () => {
    const cfg = STEPS[step];
    const val = abcd[cfg.key];
    const fb = aiFb[cfg.key];
    const ld = aiLoading[cfg.key];
    const err = aiErr[cfg.key];
    return /*#__PURE__*/_jsxs("div", {
      children: [/*#__PURE__*/_jsx("div", {
        className: "abcd-progress",
        children: STEPS.map((s, i) => /*#__PURE__*/_jsx("div", {
          className: "abcd-pill " + (i < step ? "pill-done" : i === step ? "pill-active" : "pill-pending"),
          onClick: () => {
            if (i < step) setStep(i);
          },
          children: i < step ? "Check " + s.letter : s.letter
        }, s.key))
      }), /*#__PURE__*/_jsxs("div", {
        className: "card",
        children: [/*#__PURE__*/_jsxs("div", {
          className: "step-header",
          children: [/*#__PURE__*/_jsx("div", {
            className: "step-letter-box",
            children: cfg.letter
          }), /*#__PURE__*/_jsxs("div", {
            children: [/*#__PURE__*/_jsx("div", {
              className: "step-h2",
              children: cfg.label
            }), /*#__PURE__*/_jsx("div", {
              className: "step-sub",
              children: cfg.question
            })]
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: "hint-box",
          children: [/*#__PURE__*/_jsx("span", {
            children: "\uD83D\uDCA1"
          }), /*#__PURE__*/_jsx("span", {
            children: cfg.hint
          })]
        }), /*#__PURE__*/_jsx("textarea", {
          className: "text-area",
          rows: 3,
          value: val,
          placeholder: cfg.placeholder,
          onChange: e => setAbcd(prev => ({
            ...prev,
            [cfg.key]: e.target.value
          }))
        }), /*#__PURE__*/_jsxs("div", {
          className: "tip-chip",
          children: ["\u2726 ", cfg.tip]
        }), cfg.showBlooms && /*#__PURE__*/_jsxs("div", {
          className: "blooms-wrap",
          children: [/*#__PURE__*/_jsx("div", {
            className: "blooms-title",
            children: "Bloom's Taxonomy \u2014 click a verb to insert it"
          }), Object.entries(BLOOM).map(_ref4 => {
            let [level, {
              color,
              bg,
              verbs
            }] = _ref4;
            return /*#__PURE__*/_jsxs("div", {
              className: "bloom-row",
              children: [/*#__PURE__*/_jsx("div", {
                className: "bloom-name",
                style: {
                  color
                },
                children: level
              }), /*#__PURE__*/_jsx("div", {
                className: "verb-chips",
                children: verbs.map(v => /*#__PURE__*/_jsx("button", {
                  type: "button",
                  className: "verb-chip",
                  style: {
                    background: bg,
                    color
                  },
                  onClick: () => {
                    const rest = abcd.behavior.trim().split(" ").slice(1).join(" ");
                    setAbcd(prev => ({
                      ...prev,
                      behavior: v + (rest ? " " + rest : " ")
                    }));
                  },
                  children: v
                }, v))
              })]
            }, level);
          })]
        }), /*#__PURE__*/_jsx("div", {
          style: {
            marginTop: 18
          },
          children: /*#__PURE__*/_jsx("button", {
            type: "button",
            className: "btn btn-accent btn-md",
            disabled: !val.trim() || !!ld,
            onClick: () => getStepFeedback(cfg.key),
            children: ld ? /*#__PURE__*/_jsxs(_Fragment, {
              children: [Spin({}), " Checking..."]
            }) : "Get AI Feedback"
          })
        }), /*#__PURE__*/_jsx(AiBox, {
          fb: fb,
          loading: !!ld,
          err: err
        }), /*#__PURE__*/_jsxs("div", {
          className: "nav-row",
          children: [/*#__PURE__*/_jsx("button", {
            type: "button",
            className: "btn btn-secondary btn-sm",
            onClick: () => step > 0 ? setStep(step - 1) : setPhase("welcome"),
            children: "Back"
          }), /*#__PURE__*/_jsx("button", {
            type: "button",
            className: "btn btn-primary btn-md",
            disabled: !val.trim(),
            onClick: () => step < 3 ? setStep(step + 1) : assemble(),
            children: step < 3 ? "Next: " + STEPS[step + 1].label : "Assemble Objective"
          })]
        })]
      }), Object.values(abcd).some(v => v) && /*#__PURE__*/_jsxs("div", {
        className: "mini-preview",
        children: [/*#__PURE__*/_jsx("div", {
          className: "mini-title",
          children: "Your progress"
        }), STEPS.map(s => /*#__PURE__*/_jsxs("div", {
          className: "mini-row",
          children: [/*#__PURE__*/_jsx("div", {
            className: "mini-badge " + (abcd[s.key] ? "mb-filled" : "mb-empty"),
            children: s.letter
          }), /*#__PURE__*/_jsx("div", {
            className: "mini-val",
            children: abcd[s.key] || "Not filled yet"
          })]
        }, s.key))]
      })]
    });
  };
  const Validate = () => {
    const rColor = asmFb.rating.includes("Strong") ? "#059669" : asmFb.rating.includes("Needs") ? "#DC2626" : "#D97706";
    return /*#__PURE__*/_jsxs("div", {
      className: "card",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "step-header",
        style: {
          marginBottom: 20
        },
        children: [/*#__PURE__*/_jsx("div", {
          className: "step-letter-box",
          style: {
            fontSize: 24
          },
          children: "\u2705"
        }), /*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsx("div", {
            className: "step-h2",
            children: "Review Your Objective"
          }), /*#__PURE__*/_jsx("div", {
            className: "step-sub",
            children: "Your ABCD components have been assembled below. Edit directly if needed."
          })]
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "validate-box",
        children: [/*#__PURE__*/_jsx("div", {
          style: {
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.7px",
            color: "#0C5449",
            marginBottom: 10
          },
          children: "Assembled Objective"
        }), /*#__PURE__*/_jsx("textarea", {
          className: "text-area",
          rows: 3,
          value: assembled,
          onChange: e => setAssembled(e.target.value),
          style: {
            background: "transparent",
            border: "none",
            padding: 0,
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 18,
            fontWeight: 500,
            color: "#0A3D35",
            lineHeight: 1.6
          }
        }), /*#__PURE__*/_jsx("div", {
          style: {
            fontSize: 11,
            color: "#6B9E99",
            marginTop: 4
          },
          children: "You can edit this directly before confirming."
        })]
      }), asmLoading ? /*#__PURE__*/_jsxs("div", {
        className: "ai-box",
        style: {
          display: "flex",
          gap: 10,
          alignItems: "center",
          color: "#6E6862",
          fontSize: 14
        },
        children: [Spin({
          dark: true
        }), " Assessing quality..."]
      }) : (asmFb.rating || asmFb.notes) && /*#__PURE__*/_jsxs("div", {
        className: "ai-box",
        children: [/*#__PURE__*/_jsx("div", {
          className: "ai-label",
          children: "Quality Assessment"
        }), asmFb.rating && /*#__PURE__*/_jsx("div", {
          className: "rating-badge",
          style: {
            background: rColor,
            color: "#fff"
          },
          children: asmFb.rating
        }), asmFb.notes && /*#__PURE__*/_jsx("div", {
          className: "ai-text",
          style: {
            marginTop: 6
          },
          children: asmFb.notes
        })]
      }), /*#__PURE__*/_jsx("div", {
        style: {
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8
        },
        children: STEPS.map(s => /*#__PURE__*/_jsxs("div", {
          style: {
            background: "#F5F3EE",
            borderRadius: 9,
            padding: 11
          },
          children: [/*#__PURE__*/_jsxs("div", {
            style: {
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#6E6862",
              marginBottom: 3
            },
            children: [s.letter, " \u2014 ", s.label]
          }), /*#__PURE__*/_jsx("div", {
            style: {
              fontSize: 13
            },
            children: abcd[s.key]
          })]
        }, s.key))
      }), /*#__PURE__*/_jsxs("div", {
        className: "nav-row",
        children: [/*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-secondary btn-sm",
          onClick: () => {
            setStep(3);
            setPhase("abcd");
          },
          children: "Edit Components"
        }), /*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-primary btn-md",
          disabled: !assembled.trim(),
          onClick: () => setPhase("id"),
          children: "Looks Good \u2014 Continue"
        })]
      })]
    });
  };
  const idDone = sid => {
    if (sid === "learners") return !!(idFb.learners || idIn.learners);
    if (sid === "method") return !!(idFb.method || idIn.method);
    if (sid === "assess") return !!(idFb.assess || idIn.assess);
    if (sid === "refine") return !!refine;
    return false;
  };
  const IdContent = () => {
    if (idStep === "learners") return /*#__PURE__*/_jsxs("div", {
      className: "card",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "step-header",
        children: [/*#__PURE__*/_jsx("div", {
          className: "step-letter-box",
          style: {
            fontSize: 24
          },
          children: "\uD83D\uDC65"
        }), /*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsx("div", {
            className: "step-h2",
            children: "Learner Characteristics"
          }), /*#__PURE__*/_jsx("div", {
            className: "step-sub",
            children: "Describe your learners to sharpen your design."
          })]
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "hint-box",
        children: [/*#__PURE__*/_jsx("span", {
          children: "\uD83D\uDCA1"
        }), /*#__PURE__*/_jsx("span", {
          children: "Consider age, prior knowledge, motivation, language background, access to technology, and special needs."
        })]
      }), /*#__PURE__*/_jsx("textarea", {
        className: "text-area",
        rows: 4,
        value: idIn.learners,
        placeholder: "e.g. Adult learners aged 25-45, mixed civilian and military backgrounds, high intrinsic motivation...",
        onChange: e => setIdIn(prev => ({
          ...prev,
          learners: e.target.value
        }))
      }), /*#__PURE__*/_jsx("div", {
        style: {
          marginTop: 14
        },
        children: /*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-accent btn-md",
          disabled: !!idLoading.learners,
          onClick: () => getIdFb("learners"),
          children: idLoading.learners ? /*#__PURE__*/_jsxs(_Fragment, {
            children: [Spin({}), " Analyzing..."]
          }) : "Analyze Learner Profile"
        })
      }), /*#__PURE__*/_jsx(AiBox, {
        fb: idFb.learners,
        loading: !!idLoading.learners,
        err: idErr.learners
      }), /*#__PURE__*/_jsxs("div", {
        className: "nav-row",
        children: [/*#__PURE__*/_jsx("div", {}), /*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-primary btn-md",
          onClick: () => setIdStep("method"),
          children: "Next: Choose Method"
        })]
      })]
    });
    if (idStep === "method") return /*#__PURE__*/_jsxs("div", {
      className: "card",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "step-header",
        children: [/*#__PURE__*/_jsx("div", {
          className: "step-letter-box",
          style: {
            fontSize: 24
          },
          children: "\uD83D\uDCD6"
        }), /*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsx("div", {
            className: "step-h2",
            children: "Choose Method"
          }), /*#__PURE__*/_jsx("div", {
            className: "step-sub",
            children: "What instructional approach will you use?"
          })]
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "hint-box",
        children: [/*#__PURE__*/_jsx("span", {
          children: "\uD83D\uDCA1"
        }), /*#__PURE__*/_jsx("span", {
          children: "Describe your planned approach, or leave blank to get AI suggestions."
        })]
      }), /*#__PURE__*/_jsx("textarea", {
        className: "text-area",
        rows: 3,
        value: idIn.method,
        placeholder: "Optional \u2014 describe your approach or leave blank for suggestions...",
        onChange: e => setIdIn(prev => ({
          ...prev,
          method: e.target.value
        }))
      }), /*#__PURE__*/_jsx("div", {
        style: {
          marginTop: 14
        },
        children: /*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-accent btn-md",
          disabled: !!idLoading.method,
          onClick: () => getIdFb("method"),
          children: idLoading.method ? /*#__PURE__*/_jsxs(_Fragment, {
            children: [Spin({}), " Generating..."]
          }) : "Get Strategy Recommendations"
        })
      }), /*#__PURE__*/_jsx(AiBox, {
        fb: idFb.method,
        loading: !!idLoading.method,
        err: idErr.method
      }), /*#__PURE__*/_jsxs("div", {
        className: "nav-row",
        children: [/*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-secondary btn-sm",
          onClick: () => setIdStep("learners"),
          children: "Back"
        }), /*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-primary btn-md",
          onClick: () => setIdStep("assess"),
          children: "Next: Measure and Evaluate"
        })]
      })]
    });
    if (idStep === "assess") return /*#__PURE__*/_jsxs("div", {
      className: "card",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "step-header",
        children: [/*#__PURE__*/_jsx("div", {
          className: "step-letter-box",
          style: {
            fontSize: 24
          },
          children: "\uD83D\uDCCA"
        }), /*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsx("div", {
            className: "step-h2",
            children: "Measure and Evaluate"
          }), /*#__PURE__*/_jsx("div", {
            className: "step-sub",
            children: "How will you know learners met the objective?"
          })]
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "hint-box",
        children: [/*#__PURE__*/_jsx("span", {
          children: "\uD83D\uDCA1"
        }), /*#__PURE__*/_jsx("span", {
          children: "Good assessment directly measures the behavior and degree in your objective."
        })]
      }), /*#__PURE__*/_jsx("textarea", {
        className: "text-area",
        rows: 3,
        value: idIn.assess,
        placeholder: "Optional \u2014 describe your assessment or leave blank for suggestions...",
        onChange: e => setIdIn(prev => ({
          ...prev,
          assess: e.target.value
        }))
      }), /*#__PURE__*/_jsx("div", {
        style: {
          marginTop: 14
        },
        children: /*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-accent btn-md",
          disabled: !!idLoading.assess,
          onClick: () => getIdFb("assess"),
          children: idLoading.assess ? /*#__PURE__*/_jsxs(_Fragment, {
            children: [Spin({}), " Generating..."]
          }) : "Get Assessment Ideas"
        })
      }), /*#__PURE__*/_jsx(AiBox, {
        fb: idFb.assess,
        loading: !!idLoading.assess,
        err: idErr.assess
      }), /*#__PURE__*/_jsxs("div", {
        className: "nav-row",
        children: [/*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-secondary btn-sm",
          onClick: () => setIdStep("method"),
          children: "Back"
        }), /*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-primary btn-md",
          onClick: () => setIdStep("refine"),
          children: "Next: Refine"
        })]
      })]
    });
    return /*#__PURE__*/_jsxs("div", {
      className: "card",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "step-header",
        children: [/*#__PURE__*/_jsx("div", {
          className: "step-letter-box",
          style: {
            fontSize: 24
          },
          children: "\u2728"
        }), /*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsx("div", {
            className: "step-h2",
            children: "Refine"
          }), /*#__PURE__*/_jsx("div", {
            className: "step-sub",
            children: "Get a final synthesis and recommendations."
          })]
        })]
      }), /*#__PURE__*/_jsxs("div", {
        style: {
          background: "#F5F3EE",
          borderRadius: 10,
          padding: 14,
          marginBottom: 18,
          fontSize: 13,
          color: "#6E6862",
          lineHeight: 1.7
        },
        children: [/*#__PURE__*/_jsx("strong", {
          style: {
            color: "#1C1814"
          },
          children: "Design summary"
        }), /*#__PURE__*/_jsx("br", {}), "Learners: ", idDone("learners") ? "Analyzed" : "Not specified", /*#__PURE__*/_jsx("br", {}), "Method: ", idDone("method") ? "Defined" : "Not specified", /*#__PURE__*/_jsx("br", {}), "Assessment: ", idDone("assess") ? "Defined" : "Not specified"]
      }), /*#__PURE__*/_jsx("button", {
        type: "button",
        className: "btn btn-accent btn-md",
        disabled: !!refLoading,
        onClick: doRefine,
        children: refLoading ? /*#__PURE__*/_jsxs(_Fragment, {
          children: [Spin({}), " Synthesizing..."]
        }) : "Generate Refinement Recommendations"
      }), /*#__PURE__*/_jsx(AiBox, {
        fb: refine,
        loading: !!refLoading,
        err: ""
      }), /*#__PURE__*/_jsxs("div", {
        className: "nav-row",
        children: [/*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-secondary btn-sm",
          onClick: () => setIdStep("assess"),
          children: "Back"
        }), /*#__PURE__*/_jsx("button", {
          type: "button",
          className: "btn btn-primary btn-md",
          onClick: () => setPhase("final"),
          children: "View Final Output"
        })]
      })]
    });
  };
  const IdFlow = () => /*#__PURE__*/_jsx("div", {
    children: /*#__PURE__*/_jsxs("div", {
      className: "id-layout",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "id-sidebar",
        children: [/*#__PURE__*/_jsx("div", {
          className: "sidebar-label",
          children: "ID Steps"
        }), [{
          id: "learners",
          icon: "👥",
          label: "Learner Analysis"
        }, {
          id: "method",
          icon: "📖",
          label: "Choose Method"
        }, {
          id: "assess",
          icon: "📊",
          label: "Measure and Evaluate"
        }, {
          id: "refine",
          icon: "✨",
          label: "Refine"
        }].map(s => /*#__PURE__*/_jsxs("div", {
          className: "sidebar-item" + (idStep === s.id ? " si-active" : "") + (idDone(s.id) ? " si-done" : ""),
          onClick: () => setIdStep(s.id),
          children: [/*#__PURE__*/_jsx("span", {
            children: s.icon
          }), /*#__PURE__*/_jsx("span", {
            style: {
              flex: 1
            },
            children: s.label
          }), idDone(s.id) && /*#__PURE__*/_jsx("span", {
            className: "si-check",
            children: "\u2713"
          })]
        }, s.id)), /*#__PURE__*/_jsx("div", {
          style: {
            borderTop: "1px solid #E5E1DB",
            marginTop: 12,
            paddingTop: 12
          },
          children: /*#__PURE__*/_jsx("button", {
            type: "button",
            className: "btn btn-primary btn-sm",
            style: {
              width: "100%",
              justifyContent: "center"
            },
            onClick: () => setPhase("final"),
            children: "Finalize"
          })
        })]
      }), /*#__PURE__*/_jsxs("div", {
        children: [/*#__PURE__*/_jsxs("div", {
          className: "obj-chip",
          children: [/*#__PURE__*/_jsx("div", {
            className: "obj-chip-label",
            children: "Your Learning Objective"
          }), /*#__PURE__*/_jsx("div", {
            className: "obj-chip-text",
            children: assembled
          })]
        }), IdContent()]
      })]
    })
  });
  const Final = () => /*#__PURE__*/_jsxs("div", {
    children: [/*#__PURE__*/_jsxs("div", {
      className: "final-card",
      children: [subject && /*#__PURE__*/_jsx("div", {
        style: {
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "1px",
          opacity: 0.55,
          marginBottom: 14
        },
        children: subject
      }), /*#__PURE__*/_jsx("div", {
        className: "final-obj",
        children: assembled
      }), /*#__PURE__*/_jsx("div", {
        className: "abcd-grid",
        children: STEPS.map(s => /*#__PURE__*/_jsxs("div", {
          className: "abcd-cell",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "abcd-cell-label",
            children: [s.letter, " \u2014 ", s.label]
          }), /*#__PURE__*/_jsx("div", {
            className: "abcd-cell-val",
            children: abcd[s.key]
          })]
        }, s.key))
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "action-row",
      children: [/*#__PURE__*/_jsx("button", {
        type: "button",
        className: "btn btn-primary btn-md",
        onClick: copy,
        children: copied ? "Copied!" : "Copy to Clipboard"
      }), /*#__PURE__*/_jsx("button", {
        type: "button",
        className: "btn btn-accent btn-md",
        onClick: save,
        children: savedOk ? "Saved!" : "Save Objective"
      }), /*#__PURE__*/_jsx("button", {
        type: "button",
        className: "btn btn-ghost btn-md",
        onClick: () => setPhase("id"),
        children: "Back to Design"
      }), /*#__PURE__*/_jsx("button", {
        type: "button",
        className: "btn btn-secondary btn-md",
        onClick: reset,
        children: "New Objective"
      })]
    }), (idFb.method || idFb.assess || refine) && /*#__PURE__*/_jsxs("div", {
      className: "card",
      children: [idFb.method && /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx("div", {
          className: "ai-label",
          style: {
            marginBottom: 8
          },
          children: "Instructional Strategy"
        }), /*#__PURE__*/_jsx("div", {
          className: "ai-text",
          style: {
            marginBottom: 16
          },
          children: idFb.method
        })]
      }), idFb.assess && /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx("div", {
          className: "ai-label",
          style: {
            marginBottom: 8
          },
          children: "Assessment Approach"
        }), /*#__PURE__*/_jsx("div", {
          className: "ai-text",
          style: {
            marginBottom: 16
          },
          children: idFb.assess
        })]
      }), refine && /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx("div", {
          className: "ai-label",
          style: {
            marginBottom: 8
          },
          children: "Refinement Notes"
        }), /*#__PURE__*/_jsx("div", {
          className: "ai-text",
          children: refine
        })]
      })]
    })]
  });
  const Saved = () => /*#__PURE__*/_jsxs("div", {
    children: [/*#__PURE__*/_jsxs("div", {
      style: {
        marginBottom: 16
      },
      children: [/*#__PURE__*/_jsx("div", {
        style: {
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 4
        },
        children: "Saved Objectives"
      }), /*#__PURE__*/_jsxs("div", {
        style: {
          fontSize: 14,
          color: "#6E6862"
        },
        children: [saved.length, " objective", saved.length !== 1 ? "s" : "", " saved locally"]
      })]
    }), saved.length === 0 ? /*#__PURE__*/_jsxs("div", {
      className: "card",
      style: {
        textAlign: "center",
        padding: "52px 32px",
        color: "#6E6862"
      },
      children: [/*#__PURE__*/_jsx("div", {
        style: {
          fontSize: 36,
          marginBottom: 12
        },
        children: "\uD83D\uDCC2"
      }), /*#__PURE__*/_jsx("div", {
        style: {
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 22,
          fontWeight: 600,
          color: "#1C1814",
          marginBottom: 8
        },
        children: "No saved objectives yet"
      }), /*#__PURE__*/_jsx("div", {
        style: {
          fontSize: 14
        },
        children: "Complete a lesson design and click Save."
      })]
    }) : saved.map(item => /*#__PURE__*/_jsxs("div", {
      className: "saved-item",
      children: [/*#__PURE__*/_jsx("div", {
        className: "saved-date",
        children: item.date
      }), item.subject && /*#__PURE__*/_jsx("div", {
        className: "saved-subj",
        children: item.subject
      }), /*#__PURE__*/_jsx("div", {
        className: "saved-obj",
        children: item.objective
      }), /*#__PURE__*/_jsx("div", {
        className: "saved-tags",
        children: ["audience", "behavior", "condition", "degree"].map(k => item.abcd?.[k] ? /*#__PURE__*/_jsxs("span", {
          className: "saved-tag",
          children: [k[0].toUpperCase(), ": ", item.abcd[k].slice(0, 30), item.abcd[k].length > 30 ? "..." : ""]
        }, k) : null)
      }), /*#__PURE__*/_jsx("button", {
        type: "button",
        style: {
          marginTop: 8,
          fontSize: 11,
          color: "#DC2626",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: 700
        },
        onClick: () => {
          const u = saved.filter(s => s.id !== item.id);
          setSaved(u);
          localStorage.setItem("oc2_saved", JSON.stringify(u));
        },
        children: "Remove"
      })]
    }, item.id))]
  });

  // ── Root ─────────────────────────────────────────────────────────────────────

  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx("style", {
      children: CSS
    }), /*#__PURE__*/_jsxs("div", {
      className: "app",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "topbar",
        children: [/*#__PURE__*/_jsxs("div", {
          className: "logo",
          onClick: reset,
          children: ["Objective", /*#__PURE__*/_jsx("em", {
            children: "Craft"
          })]
        }), /*#__PURE__*/_jsx("div", {
          style: {
            display: "flex",
            gap: 9,
            alignItems: "center"
          },
          children: saved.length > 0 && /*#__PURE__*/_jsx("button", {
            type: "button",
            className: "btn btn-secondary btn-sm",
            onClick: () => setShowSaved(s => !s),
            children: showSaved ? "Back" : "Saved (" + saved.length + ")"
          })
        })]
      }), showSaved ? Saved() : phase === "welcome" ? Welcome() : phase === "abcd" ? Abcd() : phase === "validate" ? Validate() : phase === "id" ? IdFlow() : phase === "final" ? Final() : null]
    })]
  });
}
