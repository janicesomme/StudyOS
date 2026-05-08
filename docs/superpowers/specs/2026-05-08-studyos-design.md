# StudyOS Design Spec
**Date:** 2026-05-08
**Version:** 2.0 — updated with architecture review
**Status:** Draft — awaiting implementation planning

---

## 1. What We Are Building

**StudyOS** is a personal academic operating system for students. It combines an AI study assistant and a 24/7 personal tutor to organize course materials, create study assets, schedule review sessions, explain difficult concepts, track progress, and prepare the student before exam day.

It is not a tutoring chatbot. It is not a flashcard app. It is an operating system for learning — one that runs continuously, knows the student deeply, reduces the executive-function burden of studying, and makes them a better learner across every subject.

**Working tagline:** "Your AI study assistant and personal tutor, working all semester so you're ready before exam day."

The product insight behind it: becoming a top student is about mastering a specific set of meta-skills — memory, organization, critical thinking, exam preparation. Most students fail not because they lack intelligence but because they were never taught how to learn. StudyOS encodes those meta-skills as specialized agents and delivers them as a permanent study companion.

---

## 2. The Problem Being Solved

Students under academic pressure carry a constant executive-function burden. They are always wondering:

- What should I study today?
- What am I behind on?
- What do I understand and what am I forgetting?
- What should I review before the exam?
- Where are my notes?
- Am I actually ready?

StudyOS eliminates that burden. The system answers those questions automatically, keeps the student organized, tracks their progress, creates study materials, schedules sessions, tutors them when stuck, and helps them feel in control.

The target student: average academic performers with high external pressure — private school students, fraternity and sorority members, students with professional parents who highly value education. They have the resources and motivation to perform but were never taught the meta-skills of learning. They will pay for a genuine competitive advantage. The emotional value is not only better grades — it is less panic, less disorganization, and more confidence.

No existing tool solves this. Consumer tools (Mindgrasp, StudyFetch, NotebookLM) transform content but do not know the student. Research systems (AgentTutor, DeepTutor) have deep architecture but are not consumer products. Nobody has built a proper AIOS for study that combines deep student personalization, autonomous preparation, and a polished consumer interface.

---

## 3. Target User

- High school through college students
- Average academic performers with high external pressure to succeed
- Resourced — able and willing to pay for competitive advantage
- Not in crisis — proactively seeking to perform better
- Buyer may be the student or the parent
- No school licensing in V1 — direct to student/parent only

**Emotional job to be done:** Feel in control, feel prepared, feel less overwhelmed.

---

## 4. Core Product Claim

**"Your personal AI study partner that knows you, builds your knowledge, and has you ready before exam day."**

The system works in two modes simultaneously:
- **Ongoing:** daily study partner that helps the student learn more effectively right now
- **Accumulating:** quietly building towards exam readiness throughout the semester so exam week is not a panic

---

## 5. The V1 Core Loop

The highest-value V1 loop — the thing that must work before anything else:

> Upload material → StudyOS organizes it → extracts knowledge units → creates study assets → schedules practice → runs recall → tracks results → identifies gaps → tells the student exactly what to do next.

This loop is the north star for the build sequence. Everything else — the Professor, the Note Architect, the Exam Strategist, parent reports — is built on top of a working core loop.

---

## 6. Architecture: The Four Cs

StudyOS is organized around the Four Cs framework, applied to the study domain:

| Layer | What it means in StudyOS |
|---|---|
| **Context** | Student profile, knowledge base, course structure, performance history, misconceptions |
| **Connections** | Everything the student learns from: PDFs, slides, notes, voice, video, typed thoughts |
| **Capabilities** | Six specialist agents, each expert in one learning function |
| **Cadence** | Autonomous behavior between sessions: scheduling recall, tracking gaps, preparing exam assets, daily planning |

---

## 7. The Six Agents

Two-tier architecture: one thin orchestrator above six specialist agents. The orchestrator routes requests and coordinates agents. It does no subject-matter work.

### Orchestrator
Receives every student input. Reads the student's current context (active course, loaded materials, upcoming exams, session state). Routes to the right agent or combination of agents. Kept deliberately thin — routing and coordination only.

---

### Agent 1 — The Archivist
**OUTCOME:** Every piece of content the student uploads becomes structured, traceable, confidence-scored knowledge units in Supabase that every other agent can read from.

**CONSTRAINTS:** Never lose or misclassify content. Every knowledge unit must be traceable to its source. Flag low-confidence extractions for review rather than silently processing them as solid.

**TOOLS:** File parser (PDF, text, audio transcript, video transcript), knowledge unit extractor, confidence scorer, needs-review flagger, Supabase write.

**Upload quality handling:** The Archivist must not treat all uploads as equal. For each processed file it assigns an extraction confidence score, sets a needs_review flag for weak material, identifies missing context, and can ask the student clarifying questions before committing knowledge units. Failed or partial processing states must be surfaced to the student, not hidden.

The Archivist is the foundation. All other agents depend on its output.

---

### Agent 2 — The Memory Coach
**OUTCOME:** The student can recall key knowledge from their course materials with increasing confidence over time, and gaps are surfaced and closed before the exam.

**CONSTRAINTS:** Always follow spaced repetition principles — never re-test what is solid, always prioritize what is slipping. Adapt session length to the student's attention span. Never make the student feel inadequate.

**TOOLS:** Knowledge unit reader, recall session generator, performance tracker, gap identifier, spaced repetition scheduler, misconception detector, Supabase read/write.

The core agent. Memory is the foundation that makes everything else — analysis, exam performance, essay quality — possible. The Memory Coach also feeds the misconceptions table when recall responses reveal misunderstanding rather than simple forgetting.

---

### Agent 3 — The Study Manager
**OUTCOME:** The student always knows exactly what to do next and never has to manage their own study schedule.

**CONSTRAINTS:** Recommendations must be grounded in real data — gaps, exam dates, performance records, available time. Never fabricate urgency. Adapt to the student's actual pace and attention span.

**TOOLS:** Full knowledge base reader, performance record reader, gap reader, exam schedule reader, recall scheduler, study plan generator, progress summarizer, Supabase read/write.

The Study Manager owns the Cadence layer explicitly. It generates daily study recommendations, weekly study plans, exam countdowns, progress summaries, and answers "what should I do next?" It is the agent that makes the student feel organized and in control. This is what turns StudyOS from a collection of tools into an operating system.

---

### Agent 4 — The Note Architect
**OUTCOME:** The student's raw uploaded materials are transformed into organized, hierarchical summaries matched to their course structure that they can actually study from.

**CONSTRAINTS:** Never add information not present in the source material. Structure must match the student's course organization. Adapt summary depth to the student's learning style.

**TOOLS:** Knowledge unit reader, source material reader, summary generator, structure organizer, Supabase read/write.

---

### Agent 5 — The Exam Strategist
**OUTCOME:** By exam week, the student has a curated set of high-yield topics, practice questions with hints, and a final review pack — all derived from their actual course materials and weighted toward their known gaps.

**CONSTRAINTS:** Questions must be derived from the student's course materials. Never fabricate content or claim to predict the exam. Weight questions towards known gaps and high-yield topics.

**TOOLS:** Knowledge unit reader, performance record reader, gap reader, question generator, hint writer, topic ranker, final review pack builder, Supabase read/write.

The Exam Strategist works throughout the semester, not just exam week. It identifies high-yield topics, generates practice questions, ranks weak areas, and builds the final review pack incrementally. By the time the exam arrives, the assets already exist.

---

### Agent 6 — The Professor
**OUTCOME:** The student has a 24/7 personal tutor that knows them deeply — their gaps, their misconceptions, their learning style, their attention span, their academic history — and uses that knowledge to explain concepts, answer questions, and build understanding in the way that works specifically for this student.

**CONSTRAINTS:** Always adapt teaching method to the student's profile. Use Socratic method by default — lead the student to understanding rather than giving answers. Never make the student feel judged. Reference the student's history naturally, not mechanically.

**TOOLS:** Full knowledge base reader, student profile reader, interaction history reader, misconceptions reader, course materials reader, Socratic questioning framework, teaching approach tracker, Supabase read/write.

The Professor is the most personalized agent. It knows the student through two mechanisms: the detailed onboarding assessment it conducts on day one, and continuous enrichment from every subsequent session. It absorbs the critical thinking function — building analytical skills is part of how a good tutor teaches, not a separate capability.

The Professor is also the student's onboarding experience. The first interaction a new student has with StudyOS is a structured conversation the Professor leads — warm, intelligent, and purposeful — that builds the student profile while demonstrating what the system can do.

---

## 8. Self-Annealing: How the System Improves Over Time

StudyOS improves itself for each student through three feedback channels:

- **Performance feedback:** what the student gets right and wrong in recall sessions
- **Behavior feedback:** what they avoid, rush, repeat, or spend extended time on
- **Direct feedback:** explicit signals ("this explanation helped", "I still don't get it")

What each feedback channel updates:

| Signal | Updates |
|---|---|
| Recall results | Student profile gaps, Memory Coach scheduling, Exam Strategist question weighting |
| Session behavior | Attention span in student profile, Study Manager session length recommendations |
| Professor interaction | Teaching approach effectiveness in student profile, Professor teaching method selection |
| Direct feedback | Student profile preferred explanation styles, Professor approach adjustments |

This is not a separate agent or system — it is how the student profile stays accurate and how each agent gets better at serving this specific student over time.

---

## 9. The Student Profile

The most important data layer in the system. Every agent reads from it. The Professor is shaped by it most deeply.

**Built two ways:**

1. **Onboarding assessment** — a structured conversation the Professor leads on day one. Covers academic strengths and weaknesses, learning style, attention span, current courses, upcoming exams, past struggles, goals, and the pressure context the student is operating in. Conversational, not a form.

2. **Continuous enrichment** — every session adds to it via the self-annealing feedback loops described above.

**What it stores:**
- Learning style (visual, auditory, reading/writing, kinesthetic)
- Attention span characteristics
- Academic strengths and weaknesses by topic
- Academic pressure context and goals
- Current courses and exam schedule
- Teaching approaches that have worked
- Preferred explanation styles

**Why it matters:**
The feeling that the Professor knows them is what drives student retention and trust. That specificity — "I know you find this type of question harder, so let me approach it from the other direction" — is what makes StudyOS feel like a relationship rather than a tool.

---

## 10. The Dashboard — Command Center

The student's single interface for everything. A command center, not a chat window.

**Six areas:**

1. **Today's Focus** — Study Manager's daily output. Tells the student exactly what to do: scheduled recall sessions, upcoming exams, gaps needing attention. The student does not have to decide.

2. **The Professor** — persistent conversational panel. Import a chapter, say what is unclear, begin the session.

3. **My Courses** — active courses with materials, processing status, and progress indicators. Upload new material here.

4. **Memory Sessions** — the Memory Coach's recall interface. Shows what is solid, what is slipping, and the gap map by topic.

5. **Exam Assets** — what the Exam Strategist has built: high-yield topics, practice questions, hints, final review pack. Grows throughout the semester.

6. **Progress / Gap Map** — visual representation of knowledge coverage and gaps across all topics. Updated continuously.

**Navigation:** Upload, My Profile, Settings.

**V1 dashboard priority:** Today's Focus + Memory Sessions + My Courses are the three areas that prove core value immediately. Professor and Exam Assets follow once the core loop is working.

---

## 11. The Data Schema

Design principle: every table is a real-world entity — independently queryable, not a workflow step. Schema fields are derived from what each agent needs to decide, not from what data happens to be available.

### Core tables (required for V1)

**`students`**
id, email, name, onboarding_complete, created_at

**`student_profile`**
id, student_id, learning_style, attention_span_minutes, academic_level, pressure_context, goals, preferred_explanation_styles, updated_at

**`assessment_responses`**
id, student_id, question, response, created_at

**`courses`**
id, student_id, name, subject, institution, semester, exam_date, created_at

**`source_materials`**
id, student_id, course_id, title, file_type, file_url, extraction_confidence, needs_review, processing_status (pending/processing/complete/failed/partial), created_at

**`knowledge_units`** — the atomic heart of the system
id, student_id, course_id, source_material_id, concept_name, plain_english_explanation, topic, subtopic, difficulty_level, prerequisite_concept_ids, common_misconceptions, testability_score, extraction_confidence, source_location, created_by_agent, reviewed, created_at

**`recall_sessions`**
id, student_id, course_id, started_at, completed_at, session_length_minutes

**`recall_results`**
id, recall_session_id, knowledge_unit_id, student_id, result (correct/incorrect/partial), confidence_level, next_review_date

**`knowledge_gaps`**
id, student_id, knowledge_unit_id, gap_severity (1-5), identified_at, resolved_at

**`misconceptions`**
id, student_id, course_id, knowledge_unit_id, misconception_description, evidence_source (recall/chat/session), correction_strategy, resolved, identified_at, resolved_at

**`study_assets`**
id, student_id, course_id, asset_type (summary/flashcard/practice_question/hint/review_pack), content, knowledge_unit_id, created_by_agent, created_at

**`interaction_history`**
id, student_id, course_id, agent, message_role (user/assistant), content, created_at

**`sessions`**
id, student_id, started_at, ended_at, agents_used

### Added by self-annealing

**`teaching_approaches`**
id, student_id, approach_description, effectiveness_score, last_used_at — Professor reads this to know what has worked

**`behavior_signals`**
id, student_id, knowledge_unit_id, signal_type (avoided/rushed/repeated/extended), recorded_at — Study Manager and Memory Coach read this

### For later (not V1)

**`progress_reports`** — parent-safe summaries, generated on request, never automatic

---

## 12. Tech Stack

- **Frontend:** React dashboard (command center)
- **Backend / Database:** Supabase
- **AI:** Claude API (all agents)
- **File processing:** Supabase Storage for uploads; transcription service for audio/video
- **Build approach:** Multi-agent parallel build using GSD — schema as hard gate, agents built and validated independently

---

## 13. Build Sequence

Schema design is a hard gate. No agent is built until the full schema is designed and approved.

1. **Schema** — all tables, all agent decision surfaces mapped and approved
2. **Auth + student + course setup** — student can log in, create a course, set up their profile
3. **Upload + source_materials** — student can upload any file type
4. **Archivist + knowledge_units** — files become structured knowledge units with confidence scoring
5. **Basic topic map** — knowledge units organized into a visual course structure
6. **Memory Coach recall loop** — recall sessions generated from knowledge units
7. **recall_results + gap tracking** — performance tracked, gaps identified
8. **Study Manager + Today's Focus** — student always knows what to do next
9. **Professor grounded in real data** — tutor has access to actual knowledge base and student profile
10. **Exam Strategist** — practice questions and review pack built from real gaps
11. **Note Architect** — summaries generated from processed materials
12. **Progress / Gap Map** — visual dashboard panel
13. **Parent-safe progress reports** — post-V1

---

## 14. First Test Case: Organic Chemistry 1

The system is built subject-agnostic but tested first on OChem 1. This subject has domain-specific learning structures that the schema must accommodate:

- Mechanisms (sequential electron movement steps)
- Functional groups (structural pattern recognition)
- Prerequisite chains (resonance before carbocations; acid/base before elimination)
- Reaction patterns (SN1/SN2/E1/E2 classification)
- Formal charge and electron counting
- Stereochemistry (R/S, cis/trans, enantiomers)
- Acid/base reasoning (ARIO framework)

The `knowledge_units` table accommodates these through: topic/subtopic fields, prerequisite_concept_ids (chains), difficulty_level, and common_misconceptions. No OChem-specific tables are needed — the schema is flexible enough.

The existing OChem playbook (46 acids/bases cards + 17 bonding cards) in the AI OCHEM STUDY SYSTEM repo is available as seed content for the first test run.

---

## 15. What Makes This Different

| What exists | What is missing |
|---|---|
| Content transformation tools (Mindgrasp, StudyFetch) | Deep student profile that shapes every interaction |
| Chatbots that answer questions (NotebookLM) | Autonomous Cadence that builds exam assets without being asked |
| Research multi-agent prototypes (AgentTutor, DeepTutor) | A polished consumer product |
| Single-skill tools (Anki for memory, Notion for notes) | An operating system that integrates all skills |
| AI tutors that respond to queries | A Study Manager that eliminates the executive-function burden entirely |

StudyOS is the first consumer product to combine: AIOS architecture, deep student personalization, autonomous study preparation, a misconceptions layer, self-annealing feedback loops, and a multi-agent specialist layer — in a single platform designed for the student who is willing to invest in learning how to learn.

---

## 16. Do Not Build Yet

- Parent progress reports (post-V1)
- School/institution licensing
- Mobile app
- Calendar integrations
- LMS integrations (Canvas, Blackboard)
- Social/group study features
- Video generation
- Gamification layer
- Subject-specific OChem tables (not needed — schema is flexible enough)
