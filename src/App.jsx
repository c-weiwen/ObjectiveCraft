import { useState, useEffect } from "react";

// ─── API ──────────────────────────────────────────────────────────────────────

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

  const response = await fetch("/freellm/api/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      message: prompt,
    }),
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
  Remember:   { color: "#374151", bg: "#F3F4F6", verbs: ["define","list","recall","identify","name","state","recognize","label","match","repeat","select"] },
  Understand: { color: "#0369A1", bg: "#EFF6FF", verbs: ["explain","describe","summarize","classify","interpret","compare","paraphrase","discuss","distinguish","illustrate"] },
  Apply:      { color: "#059669", bg: "#ECFDF5", verbs: ["use","demonstrate","solve","perform","execute","implement","operate","calculate","produce","show","apply"] },
  Analyze:    { color: "#7C3AED", bg: "#F5F3FF", verbs: ["analyze","differentiate","examine","break down","distinguish","organize","outline","diagram","relate","contrast"] },
  Evaluate:   { color: "#DC2626", bg: "#FEF2F2", verbs: ["evaluate","judge","critique","justify","defend","assess","appraise","recommend","argue","validate"] },
  Create:     { color: "#D97706", bg: "#FFFBEB", verbs: ["design","develop","construct","produce","compose","formulate","plan","devise","generate","build","synthesize"] },
};

const STEPS = [
  { key: "audience", letter: "A", label: "Audience",  question: "Who are the learners?",                    hint: "Describe your learners — their role, level, and prior knowledge.",                            placeholder: "e.g. Second-year nursing students with foundational anatomy knowledge",           tip: "Be specific about prior knowledge — it shapes every design decision.", showBlooms: false },
  { key: "behavior", letter: "B", label: "Behavior",  question: "What will learners be able to DO?",        hint: "Use one observable, measurable action verb. It signals the cognitive level expected.",        placeholder: "e.g. Analyze patient vital signs and identify early warning indicators",           tip: "The verb determines depth of learning — choose it intentionally.",     showBlooms: true  },
  { key: "condition",letter: "C", label: "Condition", question: "Under what conditions will they perform?",  hint: "Describe the context — tools, resources, or constraints available.",                         placeholder: "e.g. Given a simulated patient scenario and an observation checklist",              tip: "Conditions make objectives realistic and directly assessable.",        showBlooms: false },
  { key: "degree",   letter: "D", label: "Degree",    question: "To what standard must they perform?",      hint: "Define the criteria — accuracy rate, number of items, time limit, or quality threshold.",    placeholder: "e.g. with 85% accuracy, correctly identifying 3 of 4 critical warning indicators",  tip: "The degree tells you exactly when the objective has been met.",        showBlooms: false },
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase]           = useState("welcome");
  const [subject, setSubject]       = useState("");
  const [step, setStep]             = useState(0);
  const [abcd, setAbcd]             = useState({ audience: "", behavior: "", condition: "", degree: "" });
  const [aiFb, setAiFb]             = useState({});
  const [aiLoading, setAiLoading]   = useState({});
  const [aiErr, setAiErr]           = useState({});
  const [assembled, setAssembled]   = useState("");
  const [asmFb, setAsmFb]           = useState({ rating: "", notes: "" });
  const [asmLoading, setAsmLoading] = useState(false);
  const [idStep, setIdStep]         = useState("learners");
  const [idIn, setIdIn]             = useState({ learners: "", method: "", assess: "" });
  const [idFb, setIdFb]             = useState({});
  const [idLoading, setIdLoading]   = useState({});
  const [idErr, setIdErr]           = useState({});
  const [refine, setRefine]         = useState("");
  const [refLoading, setRefLoading] = useState(false);
  const [saved, setSaved]           = useState([]);
  const [showSaved, setShowSaved]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [savedOk, setSavedOk]       = useState(false);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem("oc2_saved") || "[]")); } catch {}
  }, []);

  // ── AI calls ────────────────────────────────────────────────────────────────

  const getStepFeedback = async (key) => {
    const s   = STEPS.find(s => s.key === key);
    const val = abcd[key];
    if (!val.trim()) return;
    setAiLoading(prev => ({ ...prev, [key]: true }));
    setAiErr(prev => ({ ...prev, [key]: "" }));
    setAiFb(prev => ({ ...prev, [key]: "" }));
    try {
      const text = await callClaude(
        "You are an expert instructional designer. A teacher is writing the \"" + s.label + "\" (" + s.letter + ") component of an ABCD learning objective.\n" +
        "Subject: \"" + (subject || "not specified") + "\"\n" +
        "Their input: \"" + val + "\"\n\n" +
        "Give brief coaching feedback in 2-3 sentences:\n" +
        "1. Is this well-suited for the " + s.label + " component?\n" +
        "2. One specific improvement suggestion or confirmation it is strong.\n" +
        "Be direct and constructive."
      );
      setAiFb(prev => ({ ...prev, [key]: text }));
    } catch (e) {
      setAiErr(prev => ({ ...prev, [key]: e.message }));
    } finally {
      setAiLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const assemble = async () => {
    const direct =
      abcd.condition.trim() + ", " +
      abcd.audience.trim() + " will " +
      abcd.behavior.trim() + " " +
      abcd.degree.trim();
    setAssembled(direct);
    setAsmFb({ rating: "", notes: "" });
    setPhase("validate");
    setAsmLoading(true);
    try {
      const text = await callClaude(
        "You are an expert instructional designer. The following is a learning objective:\n" +
        "\"" + direct + "\"\n\n" +
        "Rate its quality as exactly one of: Strong, Good, or Needs Revision\n" +
        "Explain the rating in 2 sentences.\n\n" +
        "Reply in EXACTLY this format with no extra text:\n" +
        "RATING: [rating]\nNOTES: [explanation]"
      );
      const ratM = text.match(/RATING:\s*(.+?)(?=\nNOTES:)/s);
      const notM = text.match(/NOTES:\s*([\s\S]+)/);
      setAsmFb({ rating: ratM ? ratM[1].trim() : "", notes: notM ? notM[1].trim() : "" });
    } catch (e) {
      setAsmFb({ rating: "", notes: "Error: " + e.message });
    } finally {
      setAsmLoading(false);
    }
  };

  const getIdFb = async (sid) => {
    setIdLoading(prev => ({ ...prev, [sid]: true }));
    setIdErr(prev => ({ ...prev, [sid]: "" }));
    setIdFb(prev => ({ ...prev, [sid]: "" }));
    const prompts = {
      learners:
        "You are an expert instructional designer with deep knowledge of Bloom's Taxonomy across all three domains.\n\n" +
        "BLOOM'S TAXONOMY REFERENCE:\n" + BLOOMS_REFERENCE + "\n\n" +
        "Learning Objective: \"" + assembled + "\"\n" +
        "Teacher's learner description: \"" + (idIn.learners || "(not provided)") + "\"\n\n" +
        "Based on the learning objective and learner description:\n" +
        "1. Identify which Bloom's domain (Cognitive, Affective, or Psychomotor) and level this objective primarily targets, and briefly justify.\n" +
        "2. Describe 3-4 key learner factors relevant to this objective (prior knowledge, motivation, context, etc.).\n" +
        "3. Explain how these learner factors should shape the instructional approach given the identified taxonomy level.\n" +
        "4. Note any overlooked learner considerations.\n" +
        "Be specific and practical.",
      method:
        "You are an expert instructional designer with deep knowledge of Bloom's Taxonomy across all three domains.\n\n" +
        "BLOOM'S TAXONOMY REFERENCE:\n" + BLOOMS_REFERENCE + "\n\n" +
        "Learning Objective: \"" + assembled + "\"\n" +
        "Learner profile: \"" + (idIn.learners || "not described") + "\"\n" +
        "Teacher's proposed method: \"" + (idIn.method || "(open to suggestions)") + "\"\n\n" +
        "Based on the Bloom's domain and level implied by the objective:\n" +
        "1. Identify the primary Bloom's domain and level for this objective.\n" +
        "2. Recommend 3 learning activities specifically suited to that taxonomy level, drawn from the reference above. For each activity: name it, explain why it fits this objective and learner profile (1-2 sentences), and give one concrete implementation tip.\n" +
        "3. If the teacher proposed a method, evaluate whether it aligns with the identified taxonomy level.\n" +
        "Use a numbered list.",
      assess:
        "You are an expert instructional designer with deep knowledge of Bloom's Taxonomy across all three domains.\n\n" +
        "BLOOM'S TAXONOMY REFERENCE:\n" + BLOOMS_REFERENCE + "\n\n" +
        "Learning Objective: \"" + assembled + "\"\n" +
        "Instructional method: \"" + (idIn.method || "not specified") + "\"\n" +
        "Learner profile: \"" + (idIn.learners || "not described") + "\"\n\n" +
        "Based on the Bloom's domain and level implied by the objective:\n" +
        "1. Identify the primary Bloom's domain and level for this objective.\n" +
        "2. Propose 3 assessment approaches drawn from the taxonomy reference that directly measure this objective. For each: type, description, how it aligns to the Degree standard, whether it is formative or summative, and why it suits this taxonomy level.\n" +
        "Use a numbered list.",
    };
    try {
      const text = await callClaude(prompts[sid]);
      setIdFb(prev => ({ ...prev, [sid]: text }));
    } catch (e) {
      setIdErr(prev => ({ ...prev, [sid]: e.message }));
    } finally {
      setIdLoading(prev => ({ ...prev, [sid]: false }));
    }
  };

  const doRefine = async () => {
    setRefLoading(true);
    setRefine("");
    try {
      const text = await callClaude(
        "You are an expert instructional designer with deep knowledge of Bloom's Taxonomy across all three domains.\n\n" +
        "BLOOM'S TAXONOMY REFERENCE:\n" + BLOOMS_REFERENCE + "\n\n" +
        "Learning Objective: \"" + assembled + "\"\n" +
        "Learner profile: \"" + (idIn.learners || idFb.learners || "not specified") + "\"\n" +
        "Instructional method: \"" + (idIn.method || idFb.method || "not specified") + "\"\n" +
        "Assessment: \"" + (idIn.assess || idFb.assess || "not specified") + "\"\n\n" +
        "Using the Bloom's Taxonomy reference above, provide a final design synthesis:\n" +
        "1. Identify the Bloom's domain (Cognitive/Affective/Psychomotor) and specific level this objective targets.\n" +
        "2. Evaluate alignment: do the chosen instructional methods and assessments match the identified taxonomy level and domain? Cite specific activities/assessments from the taxonomy reference that are a good fit.\n" +
        "3. Identify any gaps or misalignments between the objective, methods, and assessments.\n" +
        "4. Give 2 specific, actionable refinement recommendations to strengthen the overall design.\n" +
        "5. One forward-looking improvement — e.g. how to scaffold toward a higher taxonomy level in future lessons.\n" +
        "Use a numbered list. Be specific and reference taxonomy levels by name."
      );
      setRefine(text);
    } catch (e) {
      setRefine("Error: " + e.message);
    } finally {
      setRefLoading(false);
    }
  };

  // ── Misc ────────────────────────────────────────────────────────────────────

  const reset = () => {
    setPhase("welcome"); setStep(0); setSubject("");
    setAbcd({ audience: "", behavior: "", condition: "", degree: "" });
    setAiFb({}); setAiLoading({}); setAiErr({});
    setAssembled(""); setAsmFb({ rating: "", notes: "" }); setAsmLoading(false);
    setIdStep("learners"); setIdIn({ learners: "", method: "", assess: "" });
    setIdFb({}); setIdLoading({}); setIdErr({});
    setRefine(""); setRefLoading(false);
  };

  const save = () => {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      subject, objective: assembled, abcd: { ...abcd },
    };
    const next = [entry, ...saved.slice(0, 19)];
    setSaved(next);
    localStorage.setItem("oc2_saved", JSON.stringify(next));
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2000);
  };

  const copy = () => {
    const lines = [
      "LEARNING OBJECTIVE", assembled, "",
      "ABCD COMPONENTS",
      "A — Audience:  " + abcd.audience,
      "B — Behavior:  " + abcd.behavior,
      "C — Condition: " + abcd.condition,
      "D — Degree:    " + abcd.degree,
    ];
    if (idFb.method) lines.push("", "INSTRUCTIONAL STRATEGY", idFb.method);
    if (idFb.assess) lines.push("", "ASSESSMENT", idFb.assess);
    if (refine)      lines.push("", "REFINEMENT NOTES", refine);
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Shared UI ────────────────────────────────────────────────────────────────

  const Spin = ({ dark }) => <span className={"spin" + (dark ? " spin-dark" : "")} />;

  const AiBox = ({ fb, loading, err }) => {
    if (loading) return (
      <div className="ai-box" style={{ display: "flex", gap: 10, alignItems: "center", color: "#6E6862", fontSize: 14 }}>
        {Spin({dark:true})} Thinking...
      </div>
    );
    if (err) return <div className="ai-error">Error: {err}</div>;
    if (!fb) return null;
    return (
      <div className="ai-box">
        <div className="ai-label">AI Feedback</div>
        <div className="ai-text" style={{ textAlign: "left" }}>{fb.replace(/\*\*/g, "")}</div>
      </div>
    );
  };

  // ── Views ────────────────────────────────────────────────────────────────────

  const Welcome = () => (
    <div className="card" style={{ textAlign: "center", padding: "44px 32px 36px" }}>
      <div className="hero-title">ObjectiveCraft</div>
      <p className="hero-sub">A step-by-step tool for teachers and trainers. Write precise ABCD objectives, then get AI-powered instructional strategy recommendations.</p>
      <div className="features" style={{ marginBottom: 32 }}>
        {[
          ["🎯", "ABCD Framework", "Audience · Behavior · Condition · Degree"],
          ["🤖", "AI Coaching", "Guidance at every step"],
          ["🧭", "ID Alignment", "Objective → Method → Assessment"],
          ["💾", "Save & Export", "Copy or save for later"],
        ].map(([icon, name, desc]) => (
          <div className="feat" key={name}>
            <div className="feat-icon">{icon}</div>
            <div className="feat-name">{name}</div>
            <div className="feat-desc">{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <label className="field-label">Subject / Topic (optional)</label>
        <input
          className="text-input"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="e.g. Emergency Nursing, UN Peacekeeping, Financial Literacy"
          onKeyDown={e => e.key === "Enter" && setPhase("abcd")}
          style={{ marginBottom: 20 }}
        />
        <button type="button" className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => setPhase("abcd")}>
          Start Designing →
        </button>
      </div>
    </div>
  );

  const Abcd = () => {
    const cfg = STEPS[step];
    const val = abcd[cfg.key];
    const fb  = aiFb[cfg.key];
    const ld  = aiLoading[cfg.key];
    const err = aiErr[cfg.key];
    return (
      <div>
        <div className="abcd-progress">
          {STEPS.map((s, i) => (
            <div key={s.key}
              className={"abcd-pill " + (i < step ? "pill-done" : i === step ? "pill-active" : "pill-pending")}
              onClick={() => { if (i < step) setStep(i); }}>
              {i < step ? ("Check " + s.letter) : s.letter}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="step-header">
            <div className="step-letter-box">{cfg.letter}</div>
            <div>
              <div className="step-h2">{cfg.label}</div>
              <div className="step-sub">{cfg.question}</div>
            </div>
          </div>

          <div className="hint-box">
            <span>💡</span>
            <span>{cfg.hint}</span>
          </div>

          <textarea
            className="text-area"
            rows={3}
            value={val}
            placeholder={cfg.placeholder}
            onChange={e => setAbcd(prev => ({ ...prev, [cfg.key]: e.target.value }))}
          />
          <div className="tip-chip">✦ {cfg.tip}</div>

          {cfg.showBlooms && (
            <div className="blooms-wrap">
              <div className="blooms-title">Bloom's Taxonomy — click a verb to insert it</div>
              {Object.entries(BLOOM).map(([level, { color, bg, verbs }]) => (
                <div className="bloom-row" key={level}>
                  <div className="bloom-name" style={{ color }}>{level}</div>
                  <div className="verb-chips">
                    {verbs.map(v => (
                      <button type="button" key={v} className="verb-chip" style={{ background: bg, color }}
                        onClick={() => {
                          const rest = abcd.behavior.trim().split(" ").slice(1).join(" ");
                          setAbcd(prev => ({ ...prev, behavior: v + (rest ? " " + rest : " ") }));
                        }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <button type="button" className="btn btn-accent btn-md"
              disabled={!val.trim() || !!ld}
              onClick={() => getStepFeedback(cfg.key)}>
              {ld ? <>{Spin({})} Checking...</> : "Get AI Feedback"}
            </button>
          </div>

          <AiBox fb={fb} loading={!!ld} err={err} />

          <div className="nav-row">
            <button type="button" className="btn btn-secondary btn-sm"
              onClick={() => step > 0 ? setStep(step - 1) : setPhase("welcome")}>
              Back
            </button>
            <button type="button" className="btn btn-primary btn-md"
              disabled={!val.trim()}
              onClick={() => step < 3 ? setStep(step + 1) : assemble()}>
              {step < 3 ? ("Next: " + STEPS[step + 1].label) : "Assemble Objective"}
            </button>
          </div>
        </div>

        {Object.values(abcd).some(v => v) && (
          <div className="mini-preview">
            <div className="mini-title">Your progress</div>
            {STEPS.map(s => (
              <div className="mini-row" key={s.key}>
                <div className={"mini-badge " + (abcd[s.key] ? "mb-filled" : "mb-empty")}>{s.letter}</div>
                <div className="mini-val">{abcd[s.key] || "Not filled yet"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Validate = () => {
    const rColor = asmFb.rating.includes("Strong") ? "#059669" : asmFb.rating.includes("Needs") ? "#DC2626" : "#D97706";
    return (
      <div className="card">
        <div className="step-header" style={{ marginBottom: 20 }}>
          <div className="step-letter-box" style={{ fontSize: 24 }}>✅</div>
          <div>
            <div className="step-h2">Review Your Objective</div>
            <div className="step-sub">Your ABCD components have been assembled below. Edit directly if needed.</div>
          </div>
        </div>

        <div className="validate-box">
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.7px", color: "#0C5449", marginBottom: 10 }}>
            Assembled Objective
          </div>
          <textarea
            className="text-area"
            rows={3}
            value={assembled}
            onChange={e => setAssembled(e.target.value)}
            style={{ background: "transparent", border: "none", padding: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 500, color: "#0A3D35", lineHeight: 1.6 }}
          />
          <div style={{ fontSize: 11, color: "#6B9E99", marginTop: 4 }}>You can edit this directly before confirming.</div>
        </div>

        {asmLoading ? (
          <div className="ai-box" style={{ display: "flex", gap: 10, alignItems: "center", color: "#6E6862", fontSize: 14 }}>
            {Spin({dark:true})} Assessing quality...
          </div>
        ) : (asmFb.rating || asmFb.notes) && (
          <div className="ai-box">
            <div className="ai-label">Quality Assessment</div>
            {asmFb.rating && <div className="rating-badge" style={{ background: rColor, color: "#fff" }}>{asmFb.rating}</div>}
            {asmFb.notes  && <div className="ai-text" style={{ marginTop: 6 }}>{asmFb.notes}</div>}
          </div>
        )}

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {STEPS.map(s => (
            <div key={s.key} style={{ background: "#F5F3EE", borderRadius: 9, padding: 11 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6E6862", marginBottom: 3 }}>
                {s.letter} — {s.label}
              </div>
              <div style={{ fontSize: 13 }}>{abcd[s.key]}</div>
            </div>
          ))}
        </div>

        <div className="nav-row">
          <button type="button" className="btn btn-secondary btn-sm"
            onClick={() => { setStep(3); setPhase("abcd"); }}>
            Edit Components
          </button>
          <button type="button" className="btn btn-primary btn-md"
            disabled={!assembled.trim()}
            onClick={() => setPhase("id")}>
            Looks Good — Continue
          </button>
        </div>
      </div>
    );
  };

  const idDone = sid => {
    if (sid === "learners") return !!(idFb.learners || idIn.learners);
    if (sid === "method")   return !!(idFb.method   || idIn.method);
    if (sid === "assess")   return !!(idFb.assess    || idIn.assess);
    if (sid === "refine")   return !!refine;
    return false;
  };

  const IdContent = () => {
    if (idStep === "learners") return (
      <div className="card">
        <div className="step-header">
          <div className="step-letter-box" style={{ fontSize: 24 }}>👥</div>
          <div>
            <div className="step-h2">Learner Characteristics</div>
            <div className="step-sub">Describe your learners to sharpen your design.</div>
          </div>
        </div>
        <div className="hint-box"><span>💡</span><span>Consider age, prior knowledge, motivation, language background, access to technology, and special needs.</span></div>
        <textarea className="text-area" rows={4} value={idIn.learners}
          placeholder="e.g. Adult learners aged 25-45, mixed civilian and military backgrounds, high intrinsic motivation..."
          onChange={e => setIdIn(prev => ({ ...prev, learners: e.target.value }))} />
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-accent btn-md"
            disabled={!!idLoading.learners}
            onClick={() => getIdFb("learners")}>
            {idLoading.learners ? <>{Spin({})} Analyzing...</> : "Analyze Learner Profile"}
          </button>
        </div>
        <AiBox fb={idFb.learners} loading={!!idLoading.learners} err={idErr.learners} />
        <div className="nav-row">
          <div />
          <button type="button" className="btn btn-primary btn-md" onClick={() => setIdStep("method")}>Next: Choose Method</button>
        </div>
      </div>
    );

    if (idStep === "method") return (
      <div className="card">
        <div className="step-header">
          <div className="step-letter-box" style={{ fontSize: 24 }}>📖</div>
          <div>
            <div className="step-h2">Choose Method</div>
            <div className="step-sub">What instructional approach will you use?</div>
          </div>
        </div>
        <div className="hint-box"><span>💡</span><span>Describe your planned approach, or leave blank to get AI suggestions.</span></div>
        <textarea className="text-area" rows={3} value={idIn.method}
          placeholder="Optional — describe your approach or leave blank for suggestions..."
          onChange={e => setIdIn(prev => ({ ...prev, method: e.target.value }))} />
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-accent btn-md"
            disabled={!!idLoading.method}
            onClick={() => getIdFb("method")}>
            {idLoading.method ? <>{Spin({})} Generating...</> : "Get Strategy Recommendations"}
          </button>
        </div>
        <AiBox fb={idFb.method} loading={!!idLoading.method} err={idErr.method} />
        <div className="nav-row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIdStep("learners")}>Back</button>
          <button type="button" className="btn btn-primary btn-md" onClick={() => setIdStep("assess")}>Next: Measure and Evaluate</button>
        </div>
      </div>
    );

    if (idStep === "assess") return (
      <div className="card">
        <div className="step-header">
          <div className="step-letter-box" style={{ fontSize: 24 }}>📊</div>
          <div>
            <div className="step-h2">Measure and Evaluate</div>
            <div className="step-sub">How will you know learners met the objective?</div>
          </div>
        </div>
        <div className="hint-box"><span>💡</span><span>Good assessment directly measures the behavior and degree in your objective.</span></div>
        <textarea className="text-area" rows={3} value={idIn.assess}
          placeholder="Optional — describe your assessment or leave blank for suggestions..."
          onChange={e => setIdIn(prev => ({ ...prev, assess: e.target.value }))} />
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-accent btn-md"
            disabled={!!idLoading.assess}
            onClick={() => getIdFb("assess")}>
            {idLoading.assess ? <>{Spin({})} Generating...</> : "Get Assessment Ideas"}
          </button>
        </div>
        <AiBox fb={idFb.assess} loading={!!idLoading.assess} err={idErr.assess} />
        <div className="nav-row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIdStep("method")}>Back</button>
          <button type="button" className="btn btn-primary btn-md" onClick={() => setIdStep("refine")}>Next: Refine</button>
        </div>
      </div>
    );

    return (
      <div className="card">
        <div className="step-header">
          <div className="step-letter-box" style={{ fontSize: 24 }}>✨</div>
          <div>
            <div className="step-h2">Refine</div>
            <div className="step-sub">Get a final synthesis and recommendations.</div>
          </div>
        </div>
        <div style={{ background: "#F5F3EE", borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 13, color: "#6E6862", lineHeight: 1.7 }}>
          <strong style={{ color: "#1C1814" }}>Design summary</strong><br />
          Learners: {idDone("learners") ? "Analyzed" : "Not specified"}<br />
          Method: {idDone("method") ? "Defined" : "Not specified"}<br />
          Assessment: {idDone("assess") ? "Defined" : "Not specified"}
        </div>
        <button type="button" className="btn btn-accent btn-md"
          disabled={!!refLoading}
          onClick={doRefine}>
          {refLoading ? <>{Spin({})} Synthesizing...</> : "Generate Refinement Recommendations"}
        </button>
        <AiBox fb={refine} loading={!!refLoading} err="" />
        <div className="nav-row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIdStep("assess")}>Back</button>
          <button type="button" className="btn btn-primary btn-md" onClick={() => setPhase("final")}>View Final Output</button>
        </div>
      </div>
    );
  };

  const IdFlow = () => (
    <div>
      <div className="id-layout">
        <div className="id-sidebar">
          <div className="sidebar-label">ID Steps</div>
          {[
            { id: "learners", icon: "👥", label: "Learner Analysis" },
            { id: "method",   icon: "📖", label: "Choose Method" },
            { id: "assess",   icon: "📊", label: "Measure and Evaluate" },
            { id: "refine",   icon: "✨", label: "Refine" },
          ].map(s => (
            <div key={s.id}
              className={"sidebar-item" + (idStep === s.id ? " si-active" : "") + (idDone(s.id) ? " si-done" : "")}
              onClick={() => setIdStep(s.id)}>
              <span>{s.icon}</span>
              <span style={{ flex: 1 }}>{s.label}</span>
              {idDone(s.id) && <span className="si-check">✓</span>}
            </div>
          ))}
          <div style={{ borderTop: "1px solid #E5E1DB", marginTop: 12, paddingTop: 12 }}>
            <button type="button" className="btn btn-primary btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setPhase("final")}>
              Finalize
            </button>
          </div>
        </div>
        <div>
          <div className="obj-chip">
            <div className="obj-chip-label">Your Learning Objective</div>
            <div className="obj-chip-text">{assembled}</div>
          </div>
          {IdContent()}
        </div>
      </div>
    </div>
  );

  const Final = () => (
    <div>
      <div className="final-card">
        {subject && (
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.55, marginBottom: 14 }}>
            {subject}
          </div>
        )}
        <div className="final-obj">{assembled}</div>
        <div className="abcd-grid">
          {STEPS.map(s => (
            <div className="abcd-cell" key={s.key}>
              <div className="abcd-cell-label">{s.letter} — {s.label}</div>
              <div className="abcd-cell-val">{abcd[s.key]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="action-row">
        <button type="button" className="btn btn-primary btn-md" onClick={copy}>{copied ? "Copied!" : "Copy to Clipboard"}</button>
        <button type="button" className="btn btn-accent btn-md" onClick={save}>{savedOk ? "Saved!" : "Save Objective"}</button>
        <button type="button" className="btn btn-ghost btn-md" onClick={() => setPhase("id")}>Back to Design</button>
        <button type="button" className="btn btn-secondary btn-md" onClick={reset}>New Objective</button>
      </div>

      {(idFb.method || idFb.assess || refine) && (
        <div className="card">
          {idFb.method && (
            <>
              <div className="ai-label" style={{ marginBottom: 8 }}>Instructional Strategy</div>
              <div className="ai-text" style={{ marginBottom: 16 }}>{idFb.method}</div>
            </>
          )}
          {idFb.assess && (
            <>
              <div className="ai-label" style={{ marginBottom: 8 }}>Assessment Approach</div>
              <div className="ai-text" style={{ marginBottom: 16 }}>{idFb.assess}</div>
            </>
          )}
          {refine && (
            <>
              <div className="ai-label" style={{ marginBottom: 8 }}>Refinement Notes</div>
              <div className="ai-text">{refine}</div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const Saved = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, marginBottom: 4 }}>Saved Objectives</div>
        <div style={{ fontSize: 14, color: "#6E6862" }}>{saved.length} objective{saved.length !== 1 ? "s" : ""} saved locally</div>
      </div>
      {saved.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "52px 32px", color: "#6E6862" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: "#1C1814", marginBottom: 8 }}>No saved objectives yet</div>
          <div style={{ fontSize: 14 }}>Complete a lesson design and click Save.</div>
        </div>
      ) : saved.map(item => (
        <div className="saved-item" key={item.id}>
          <div className="saved-date">{item.date}</div>
          {item.subject && <div className="saved-subj">{item.subject}</div>}
          <div className="saved-obj">{item.objective}</div>
          <div className="saved-tags">
            {["audience", "behavior", "condition", "degree"].map(k => item.abcd?.[k] ? (
              <span className="saved-tag" key={k}>
                {k[0].toUpperCase()}: {item.abcd[k].slice(0, 30)}{item.abcd[k].length > 30 ? "..." : ""}
              </span>
            ) : null)}
          </div>
          <button type="button"
            style={{ marginTop: 8, fontSize: 11, color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
            onClick={() => {
              const u = saved.filter(s => s.id !== item.id);
              setSaved(u);
              localStorage.setItem("oc2_saved", JSON.stringify(u));
            }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );

  // ── Root ─────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="app">
        <div className="topbar">
          <div className="logo" onClick={reset}>Objective<em>Craft</em></div>
          <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            {saved.length > 0 && (
              <button type="button" className="btn btn-secondary btn-sm"
                onClick={() => setShowSaved(s => !s)}>
                {showSaved ? "Back" : "Saved (" + saved.length + ")"}
              </button>
            )}
          </div>
        </div>

        {showSaved            ? Saved()    :
         phase === "welcome"  ? Welcome()  :
         phase === "abcd"     ? Abcd()     :
         phase === "validate" ? Validate() :
         phase === "id"       ? IdFlow()   :
         phase === "final"    ? Final()    : null}
      </div>
    </>
  );
}
