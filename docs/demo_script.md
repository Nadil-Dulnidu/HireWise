# HireWise — End-to-End Live Demonstration Script

> **Version:** 1.0.0  
> **Target Audience:** Product Managers, Technical Evaluators, Stakeholders, Demo Presenters  
> **Estimated Run Time:** 15–20 minutes

---

## 1. Demo Objectives & Environment Setup

This demo walks through the complete HireWise recruitment lifecycle across all four applications in the platform:
1. **Recruiter Web Portal** (`apps/web` on `http://localhost:5173`)
2. **Candidate Mobile App** (`apps/mobile` on Android Emulator / Physical Device)
3. **Backend API & SignalR** (`apps/api` on `http://localhost:5101`)
4. **AI Service & LangGraph** (`apps/ai-service` on `http://localhost:8000`)

### Demo Personas
| Persona | Name | Role | Primary Interface |
|---|---|---|---|
| **Recruiter** | Sarah Connor | `RECRUITER` | Web Portal (`apps/web`) |
| **Candidate** | Alex Chen | `CANDIDATE` | Mobile App (`apps/mobile`) |
| **Interviewer** | David Miller | `INTERVIEWER` | Web Portal (`apps/web`) |
| **Administrator** | Ellen Ripley | `ADMIN` | Web Portal (`apps/web`) |

---

## 2. Demonstration Flow

### Scene 1: Recruiter Onboarding & Job Creation (Web Portal)
- **Actor:** Sarah Connor (Recruiter)
- **Interface:** Web Portal (`apps/web`)
1. Sarah logs into HireWise using Clerk authentication.
2. Selects or creates the company organization **"Apex Cloud Technologies"**.
3. Navigates to **Jobs** → clicks **"Create New Job"**.
4. Enters:
   - **Title:** `Senior Distributed Systems Engineer`
   - **Department:** `Engineering`
   - **Employment Type:** `Full Time`
   - **Experience Level:** `Senior`
   - **Salary Range:** `$160,000 – $210,000 USD`
   - **Requirements:** `"5+ years Go or .NET, Kubernetes, high-concurrency systems, Kafka, Redis."`
5. Clicks **"Publish Job"**. The job status changes from `DRAFT` to `OPEN`.

---

### Scene 2: Candidate Mobile Discovery & Application (Flutter App)
- **Actor:** Alex Chen (Candidate)
- **Interface:** Candidate Mobile App (`apps/mobile`)
1. Alex launches the HireWise Flutter mobile app.
2. Completes Clerk sign-in.
3. Views the **Candidate Dashboard** showing 0 active applications and quick action cards.
4. Taps the **Jobs** tab.
5. Uses the search bar and filter sheet (selects `Senior`, `Full Time`, `Remote Only`).
6. Finds the newly posted **"Senior Distributed Systems Engineer"** at Apex Cloud Technologies.
7. Opens the job detail view, reviewing salary range, benefits, and requirements.
8. Taps **"Apply Now"**:
   - Uploads resume PDF (`Alex_Chen_Staff_Engineer_Resume.pdf`).
   - Adds a short cover letter: *"Passionate about distributed consensus and scalable microservices."*
   - Taps **"Submit Application"**.
9. The mobile screen transitions to the **Application Status Timeline**, showing the stage: `APPLIED`.

---

### Scene 3: Automated AI Evaluation & Bias Validation (FastAPI + LangGraph)
- **Actor:** Autonomous Multi-Agent Pipeline
- **Interface:** Backend logs & API Monitor
1. The ASP.NET Core API intercepts the application submission and dispatches a trigger to the FastAPI AI service (`POST /api/v1/workflows/start`).
2. **LangGraph StateGraph Execution**:
   - **Agent 1 (Job Analysis):** Deconstructs the job spec into weighted technical requirements.
   - **Agent 2 (Resume Analysis):** Ingests Alex's PDF, extracting 7 years of distributed systems experience, Kubernetes skills, and Go/.NET background.
   - **Agent 3 (Candidate Evaluation):** Computes a semantic match score of **92% (STRONG_HIRE)**, highlighting strong concurrency experience.
   - **Agent 4 (Validation):** Audits score for bias, confirms absence of demographic constraints, and flags the application as high quality.
3. The LangGraph pipeline safely pauses at **Gate 1: Evaluation Review Gate**.
4. FastAPI sends a callback to `apps/api`, which dispatches a real-time SignalR event to Sarah's web dashboard.

---

### Scene 4: Recruiter Review & Human Approval (Web Portal)
- **Actor:** Sarah Connor (Recruiter)
- **Interface:** Web Portal (`apps/web`)
1. Sarah receives a real-time notification badge on the web header.
2. Navigates to **Candidate Evaluations** for the `Senior Distributed Systems Engineer` role.
3. Clicks on Alex Chen's evaluation card:
   - Views the 92% match score breakdown.
   - Inspects AI reasoning, identified strengths, and experience timeline.
4. Clicks **"Approve for Interview"**:
   - This unlocks LangGraph **Gate 1**, triggering the remaining workflow steps.

---

### Scene 5: Automated Question Generation & Interview Scheduling
- **Actor:** AI Workflow Agents 5 & 6
1. **Agent 5 (Question Generator):** Analyzes Alex's specific resume gaps and crafts 3 targeted questions:
   - *Technical:* "How would you handle distributed split-brain scenarios in Raft consensus clusters?"
   - *Behavioral:* "Describe a production incident where message queues experienced backpressure and how you mitigated it."
   - *Architecture:* "Design a multi-region caching strategy with Redis and local in-memory L1 caches."
2. **Agent 6 (Scheduling Agent):** Cross-references interviewer David Miller's availability and Google Calendar slots, identifying an optimal slot: `Tomorrow at 3:00 PM UTC`.
3. The API creates the `Interview` record, schedules the Google Meet link, and pushes real-time notifications.

---

### Scene 6: Candidate Mobile Interview Notification & Join (Flutter App)
- **Actor:** Alex Chen (Candidate)
- **Interface:** Candidate Mobile App (`apps/mobile`)
1. Alex's mobile device receives a live SignalR notification: *"Your interview with Apex Cloud Technologies is confirmed!"*
2. Taps notification to navigate directly to the **Interviews** tab.
3. Views the upcoming interview card displaying:
   - Date, time, and duration (45 mins).
   - Format: `Technical & System Design`.
   - Preparation notes: *"Please be in a quiet space with a stable internet connection."*
   - *(Zero exposure of AI evaluation scores or generated question banks, adhering to the Candidate Confidentiality Perimeter).*
4. Tests the **"Join Meeting"** button, which seamlessly launches Google Meet in the browser.

---

### Scene 7: Interviewer Rubric Submission (Web Portal)
- **Actor:** David Miller (Interviewer)
- **Interface:** Web Portal (`apps/web`)
1. David logs into the Web Portal and navigates to **My Assigned Interviews**.
2. Opens Alex Chen's interview workspace:
   - Reads the candidate's resume snapshot.
   - Reviews the AI-suggested interview questions and expected answer rubrics.
3. Conducts the interview session.
4. Submits the structured feedback form:
   - Technical Skills: `5/5`
   - Problem Solving: `5/5`
   - Communication: `4/5`
   - Cultural Fit: `5/5`
   - Recommendation: `STRONG_HIRE`
   - Notes: *"Superb understanding of consensus protocols and fault-tolerant cloud patterns."*
5. Clicks **"Submit Evaluation Feedback"**.

---

### Scene 8: Final Hiring Decision & Offer (Web Portal)
- **Actor:** Sarah Connor (Recruiter)
- **Interface:** Web Portal (`apps/web`)
1. Sarah reviews the completed interview feedback and overall 4.75/5 rubric rating.
2. Changes application status from `INTERVIEW_COMPLETED` to `SELECTED`.
3. Candidate's mobile app immediately updates the timeline status badge to **Selected / Offer Extended**.

---

### Scene 9: Platform Admin Oversight & Agent Tuning (Web Portal)
- **Actor:** Ellen Ripley (Admin)
- **Interface:** Web Portal (`apps/web`)
1. Navigates to **Admin** → **Audit Logs**:
   - Inspects immutable JSONB diffs of every job update, application state change, and feedback submission with actor IDs and IP addresses.
2. Navigates to **Admin** → **Agent Configuration**:
   - Demonstrates dynamic tuning of LLM temperature and system prompts without restarting any backend containers.
3. Shows the **Funnel Analytics Dashboard** detailing candidate conversion rates and average time-to-hire.

---

## 3. Demo Wrap-Up & Key Takeaways

1. **Seamless Multi-Channel Experience**: Recruiters and Interviewers collaborate on an enterprise React portal, while Candidates enjoy a frictionless native Flutter mobile experience.
2. **Auditable, Guarded AI**: LangGraph guarantees that AI never acts as an unchecked black box—every recommendation is scored, validated against bias, and gated by human approval.
3. **Enterprise Resilience**: Built with production-ready .NET 8, PostgreSQL, Redis, Clerk authentication, and Google Cloud infrastructure automated via Terraform.
