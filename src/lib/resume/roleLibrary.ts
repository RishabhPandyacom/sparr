/**
 * Role knowledge base.
 *
 * One-shot generation has to produce something genuinely usable the moment
 * someone types a job title — including when no LLM key is configured. This
 * library is what makes that possible: per-role summaries, skill vocabularies,
 * skill groupings and accomplishment patterns written the way strong résumés
 * are actually written (verb → what → measured outcome).
 *
 * Placeholders are filled deterministically from a seed derived from the
 * user's own inputs, so the same request always produces the same draft and
 * two different people never get the same numbers.
 *
 *   {n}      small count        {pct}   percentage
 *   {k}      thousands scale    {money} currency amount
 *   {team}   team size          {ms}    latency / duration
 */

import type { SectionKey } from "./schema";

export type Seniority = "student" | "entry" | "mid" | "senior" | "lead" | "executive";

export const SENIORITY_OPTIONS: { value: Seniority; label: string; hint: string }[] = [
  { value: "student", label: "Student / new grad", hint: "Coursework, projects, internships" },
  { value: "entry", label: "Entry level", hint: "0–2 years" },
  { value: "mid", label: "Mid level", hint: "3–5 years" },
  { value: "senior", label: "Senior", hint: "6–9 years" },
  { value: "lead", label: "Lead / Manager", hint: "Owns a team or a domain" },
  { value: "executive", label: "Director / Executive", hint: "Owns an org or a P&L" },
];

export type RoleFamily = {
  id: string;
  label: string;
  aliases: string[];
  summary: string[];
  coreSkills: string[];
  tools: string[];
  groups: { label: string; tags: string[] }[];
  bullets: string[];
  leadership: string[];
  projects: { title: string; subtitle: string; bullets: string[]; tags: string[] }[];
  certifications?: string[];
  extraSections?: SectionKey[];
};

// ── families ────────────────────────────────────────────────────────────────

export const ROLE_FAMILIES: RoleFamily[] = [
  {
    id: "software",
    label: "Software Engineering",
    aliases: ["software", "engineer", "developer", "swe", "programmer", "full stack", "fullstack", "backend", "back end", "web developer", "application"],
    summary: [
      "{seniority} software engineer who ships. {years}Comfortable owning a feature from design doc to production, and happiest when something I built is in front of real users.",
      "Engineer focused on {focus}. I care about the boring things that make software last — tests, observability, and code the next person can read.",
    ],
    coreSkills: ["TypeScript", "JavaScript", "Python", "React", "Node.js", "SQL", "REST APIs", "Git", "Testing", "System design"],
    tools: ["PostgreSQL", "Docker", "AWS", "GitHub Actions", "Redis", "GraphQL"],
    groups: [
      { label: "Languages", tags: ["TypeScript", "JavaScript", "Python", "SQL", "Go"] },
      { label: "Frameworks", tags: ["React", "Next.js", "Node.js", "Express", "FastAPI"] },
      { label: "Infrastructure", tags: ["AWS", "Docker", "PostgreSQL", "Redis", "CI/CD"] },
      { label: "Practices", tags: ["TDD", "Code review", "Observability", "Agile"] },
    ],
    bullets: [
      "Shipped {feature} used by {k} monthly users, cutting support tickets {pct}%.",
      "Cut p95 API latency from {ms}ms to {ms2}ms by adding query indexes and a Redis read-through cache.",
      "Migrated {n} services from a monolith to independently deployable modules, dropping deploy time from 40 minutes to {ms3} minutes.",
      "Raised automated test coverage from {pctLow}% to {pctHigh}%, eliminating the release-day regression cycle.",
      "Built an internal CLI that removed {n} manual steps from onboarding, saving each new engineer a full day.",
      "Fixed a race condition responsible for {pct}% of checkout failures, recovering roughly {money} in monthly revenue.",
      "Instrumented the critical path with structured logging and traces, reducing mean time to diagnosis from hours to {ms3} minutes.",
      "Partnered with design to rebuild the {feature} flow, lifting completion rate {pct}%.",
    ],
    leadership: [
      "Led a team of {team} engineers through the {feature} rewrite, delivered on schedule with zero customer-visible incidents.",
      "Set the service-ownership and on-call model now used across {n} teams.",
      "Mentored {n} engineers to promotion; two now lead their own workstreams.",
    ],
    projects: [
      {
        title: "Open-source contribution",
        subtitle: "TypeScript · Community project",
        bullets: ["Contributed {n} merged pull requests, including a fix adopted in the {ms3}.x release."],
        tags: ["TypeScript", "Open source", "Git"],
      },
      {
        title: "Side project",
        subtitle: "Full-stack build",
        bullets: [
          "Designed, built and deployed an end-to-end app now serving {k} requests a month on a free-tier budget.",
        ],
        tags: ["Next.js", "PostgreSQL", "Vercel"],
      },
    ],
  },
  {
    id: "frontend",
    label: "Frontend Engineering",
    aliases: ["frontend", "front end", "front-end", "ui engineer", "react developer", "web ui"],
    summary: [
      "{seniority} frontend engineer with an unusual amount of care for the last 10%. {years}I build interfaces that stay fast on a mid-range Android and readable with a screen reader.",
      "Frontend engineer working at the seam between design and systems — design tokens, component APIs, and the performance budget nobody else wants to own.",
    ],
    coreSkills: ["React", "TypeScript", "CSS", "Accessibility (WCAG)", "Performance", "Design systems", "Testing", "Next.js"],
    tools: ["Tailwind CSS", "Storybook", "Playwright", "Figma", "Vite", "Lighthouse"],
    groups: [
      { label: "Core", tags: ["React", "TypeScript", "Next.js", "HTML", "CSS"] },
      { label: "Craft", tags: ["Accessibility", "Design systems", "Animation", "Responsive design"] },
      { label: "Tooling", tags: ["Vite", "Storybook", "Playwright", "Figma"] },
    ],
    bullets: [
      "Rebuilt the {feature} view, cutting Largest Contentful Paint from {sec}s to {sec2}s on 4G.",
      "Shipped a {n}-component design system adopted by {n2} product teams, ending one-off button variants for good.",
      "Took the app from {pctLow}% to {pctHigh}% WCAG 2.2 AA compliance and fixed keyboard traps across every modal.",
      "Reduced JavaScript bundle size {pct}% by code-splitting routes and dropping three redundant dependencies.",
      "Added visual regression tests that caught {n} layout breaks before they reached production.",
      "Converted {n} class components to hooks with typed props, removing an entire category of runtime errors.",
      "Collaborated with design on motion specs that made state changes legible without slowing interaction.",
    ],
    leadership: [
      "Owned frontend architecture for a {team}-person team and set the review bar for accessibility and performance.",
      "Ran a weekly craft review that raised the whole team's CSS and a11y fluency.",
      "Defined the performance budget and the CI gate that enforces it.",
    ],
    projects: [
      {
        title: "Component library",
        subtitle: "React · TypeScript · Storybook",
        bullets: ["Published a headless, fully accessible component set with {n} components and documented APIs."],
        tags: ["React", "Storybook", "Accessibility"],
      },
    ],
  },
  {
    id: "mobile",
    label: "Mobile Engineering",
    aliases: ["mobile", "ios", "android", "swift", "kotlin", "react native", "flutter"],
    summary: [
      "{seniority} mobile engineer shipping to the App Store and Play Store. {years}I optimise for cold-start time, offline behaviour, and the crash-free rate.",
    ],
    coreSkills: ["Swift", "Kotlin", "React Native", "REST APIs", "Offline-first", "App Store release", "Unit testing"],
    tools: ["Xcode", "Android Studio", "Firebase", "Fastlane", "Sentry"],
    groups: [
      { label: "Platforms", tags: ["iOS", "Android", "React Native"] },
      { label: "Languages", tags: ["Swift", "Kotlin", "TypeScript"] },
      { label: "Release", tags: ["Fastlane", "App Store Connect", "Play Console", "Firebase"] },
    ],
    bullets: [
      "Shipped {n} releases with a crash-free session rate above {pctHigh}%.",
      "Cut cold-start time from {sec}s to {sec2}s by deferring non-critical initialisation.",
      "Built an offline-first sync layer that kept the app usable through network drops for {k} field users.",
      "Reduced app size {pct}% by pruning assets and switching to on-demand resources.",
      "Automated the release pipeline with Fastlane, taking submission from a half-day ritual to {ms3} minutes.",
      "Instrumented funnels that surfaced a {pct}% drop-off in onboarding and drove the redesign that fixed it.",
    ],
    leadership: [
      "Led a {team}-engineer mobile team across two platforms and one shared API contract.",
      "Introduced the release train and rollback policy still in use today.",
      "Mentored {n} engineers through their first App Store submission.",
    ],
    projects: [
      {
        title: "Published app",
        subtitle: "iOS / Android",
        bullets: ["Designed, built and shipped a solo app with {k} downloads and a {rating}-star average rating."],
        tags: ["Swift", "Kotlin", "Firebase"],
      },
    ],
  },
  {
    id: "devops",
    label: "DevOps / SRE / Platform",
    aliases: ["devops", "sre", "site reliability", "platform", "infrastructure", "cloud engineer", "systems engineer"],
    summary: [
      "{seniority} platform engineer who measures success in incidents that never happened. {years}Infrastructure as code, sane defaults, and paved roads other teams actually want to use.",
    ],
    coreSkills: ["Kubernetes", "Terraform", "AWS", "CI/CD", "Linux", "Observability", "Incident response", "Python"],
    tools: ["Docker", "Prometheus", "Grafana", "Datadog", "ArgoCD", "GitHub Actions", "Ansible"],
    groups: [
      { label: "Cloud", tags: ["AWS", "GCP", "Azure"] },
      { label: "Orchestration", tags: ["Kubernetes", "Docker", "Helm", "ArgoCD"] },
      { label: "IaC & CI", tags: ["Terraform", "Ansible", "GitHub Actions", "Jenkins"] },
      { label: "Observability", tags: ["Prometheus", "Grafana", "Datadog", "OpenTelemetry"] },
    ],
    bullets: [
      "Codified {n} environments in Terraform, replacing click-ops and cutting environment setup from days to {ms3} minutes.",
      "Reduced cloud spend {pct}% ({money}/year) through right-sizing, spot instances and killing idle resources.",
      "Improved service availability from {avail}% to {avail2}% by adding health-based routing and automated failover.",
      "Cut deployment lead time from {ms3} hours to under {ms4} minutes with a trunk-based CI/CD pipeline.",
      "Built the alerting model that dropped pager noise {pct}% while catching every real Sev-1.",
      "Ran incident command for {n} major incidents and wrote the blameless postmortems that closed the gaps.",
      "Hardened the cluster with network policies, pod security standards and secret rotation.",
    ],
    leadership: [
      "Built the platform team from {team} engineers and defined its charter as a product, not a ticket queue.",
      "Set the SLO framework now used by every service owner in the org.",
      "Led the migration of {n} services to Kubernetes with zero customer-visible downtime.",
    ],
    projects: [
      {
        title: "Homelab / infrastructure project",
        subtitle: "Kubernetes · Terraform",
        bullets: ["Ran a GitOps-managed cluster with full observability for under {money2} a month."],
        tags: ["Kubernetes", "Terraform", "Prometheus"],
      },
    ],
  },
  {
    id: "data-science",
    label: "Data Science / ML",
    aliases: ["data scientist", "machine learning", "ml engineer", "ai engineer", "research scientist", "applied scientist", "deep learning"],
    summary: [
      "{seniority} data scientist who cares whether the model actually changed a decision. {years}Comfortable from problem framing through to a deployed, monitored model.",
      "Applied ML practitioner working on {focus}. I'd rather ship a well-understood baseline than an unexplainable win.",
    ],
    coreSkills: ["Python", "SQL", "Machine learning", "Statistics", "Experimentation", "Pandas", "scikit-learn", "PyTorch"],
    tools: ["Jupyter", "Airflow", "MLflow", "Spark", "dbt", "Snowflake", "Tableau"],
    groups: [
      { label: "Languages", tags: ["Python", "SQL", "R"] },
      { label: "ML", tags: ["scikit-learn", "PyTorch", "XGBoost", "Transformers", "MLflow"] },
      { label: "Data", tags: ["Spark", "Airflow", "dbt", "Snowflake", "BigQuery"] },
      { label: "Methods", tags: ["A/B testing", "Causal inference", "Time series", "NLP"] },
    ],
    bullets: [
      "Built a churn model with {auc} AUC that redirected retention spend and saved an estimated {money} annually.",
      "Designed and ran {n} A/B tests; the winning variant lifted conversion {pct}%.",
      "Cut model training time {pct}% by moving feature generation to Spark and caching intermediate frames.",
      "Deployed a recommendation model that increased average order value {pct}% within one quarter.",
      "Replaced a hand-tuned heuristic with a calibrated classifier, reducing false positives {pct}%.",
      "Built the feature store and monitoring that caught {n} instances of training/serving skew before they hit users.",
      "Translated an ambiguous business question into a measurable target, then said no to the model when a rules engine was enough.",
    ],
    leadership: [
      "Led a {team}-person data science team and set the standard for reproducible, reviewed analysis.",
      "Established the experimentation platform and the review bar for what counts as a result.",
      "Presented findings to the executive team quarterly and turned them into roadmap decisions.",
    ],
    projects: [
      {
        title: "Applied ML project",
        subtitle: "Python · PyTorch",
        bullets: ["Trained and evaluated a model on {k} records, documenting error analysis and failure modes."],
        tags: ["Python", "PyTorch", "Pandas"],
      },
    ],
    extraSections: ["publications"],
  },
  {
    id: "data-analyst",
    label: "Data & Business Analytics",
    aliases: ["data analyst", "business analyst", "bi", "business intelligence", "analytics", "reporting analyst", "insights"],
    summary: [
      "{seniority} analyst who turns messy data into decisions people actually make. {years}SQL-first, dashboard-second, narrative always.",
    ],
    coreSkills: ["SQL", "Excel", "Data visualisation", "Dashboarding", "A/B testing", "Stakeholder communication", "Python"],
    tools: ["Tableau", "Looker", "Power BI", "dbt", "BigQuery", "Google Analytics"],
    groups: [
      { label: "Analysis", tags: ["SQL", "Python", "Excel", "Statistics"] },
      { label: "Visualisation", tags: ["Tableau", "Looker", "Power BI"] },
      { label: "Data stack", tags: ["dbt", "BigQuery", "Snowflake", "Airflow"] },
    ],
    bullets: [
      "Built the executive dashboard now used weekly by {n} leaders to steer spend.",
      "Found and fixed a tracking error that had understated revenue attribution by {pct}% for {ms3} months.",
      "Automated a {ms3}-hour manual report down to a scheduled query, freeing {n} hours a week across the team.",
      "Segmented {k} customers into behavioural cohorts that reshaped the lifecycle marketing plan.",
      "Modelled the impact of a pricing change and recommended the tier structure that added {money} in ARR.",
      "Wrote the metric definitions that ended a long-running argument about what 'active user' means.",
    ],
    leadership: [
      "Led analytics for a {team}-person function and set the self-serve standard so leaders stopped queuing for numbers.",
      "Built the data literacy programme that made {n} non-analysts fluent in the core dashboards.",
      "Owned the KPI framework used in board reporting.",
    ],
    projects: [
      {
        title: "Analytics case study",
        subtitle: "SQL · Tableau",
        bullets: ["Analysed a public dataset of {k} records and published the findings with reproducible queries."],
        tags: ["SQL", "Tableau", "Python"],
      },
    ],
  },
  {
    id: "data-engineer",
    label: "Data Engineering",
    aliases: ["data engineer", "etl", "data platform", "analytics engineer", "pipeline"],
    summary: [
      "{seniority} data engineer building pipelines that don't page anyone at 3am. {years}Correctness, lineage and cost, in that order.",
    ],
    coreSkills: ["Python", "SQL", "Airflow", "dbt", "Spark", "Data modelling", "Kafka", "Warehouse design"],
    tools: ["Snowflake", "BigQuery", "Databricks", "Terraform", "Great Expectations"],
    groups: [
      { label: "Pipelines", tags: ["Airflow", "dbt", "Kafka", "Spark"] },
      { label: "Warehouses", tags: ["Snowflake", "BigQuery", "Redshift"] },
      { label: "Quality", tags: ["Great Expectations", "Data contracts", "Lineage"] },
    ],
    bullets: [
      "Rebuilt {n} pipelines on Airflow with retries and alerting, taking pipeline failures from weekly to rare.",
      "Cut warehouse cost {pct}% ({money}/year) by partitioning hot tables and killing unused materialisations.",
      "Modelled the core fact and dimension layer that {n} downstream dashboards now depend on.",
      "Introduced data contracts and freshness tests, catching {n} upstream schema breaks before consumers noticed.",
      "Reduced end-to-end pipeline latency from {ms3} hours to {ms4} minutes with incremental loads.",
      "Documented lineage end-to-end so analysts could answer 'where does this number come from' without asking.",
    ],
    leadership: [
      "Led a {team}-person data platform team and set the ingestion standards for the whole company.",
      "Owned the migration from legacy ETL to a modern ELT stack across {n} source systems.",
      "Defined the on-call rotation and runbooks for data reliability.",
    ],
    projects: [
      {
        title: "Data pipeline project",
        subtitle: "Airflow · dbt · BigQuery",
        bullets: ["Built an end-to-end pipeline ingesting {k} rows daily with tests and monitoring."],
        tags: ["Airflow", "dbt", "SQL"],
      },
    ],
  },
  {
    id: "security",
    label: "Security Engineering",
    aliases: ["security", "infosec", "cyber", "appsec", "penetration", "soc analyst", "grc"],
    summary: [
      "{seniority} security engineer focused on reducing real risk, not producing findings. {years}I work with engineering teams rather than at them.",
    ],
    coreSkills: ["Threat modelling", "Application security", "Incident response", "Cloud security", "Python", "SIEM", "Risk assessment"],
    tools: ["Burp Suite", "Splunk", "Wireshark", "Nessus", "AWS Security Hub", "Snyk"],
    groups: [
      { label: "Offensive", tags: ["Penetration testing", "Threat modelling", "Burp Suite", "OWASP Top 10"] },
      { label: "Defensive", tags: ["SIEM", "Incident response", "Detection engineering", "Splunk"] },
      { label: "Compliance", tags: ["SOC 2", "ISO 27001", "GDPR", "Risk management"] },
    ],
    bullets: [
      "Found and drove remediation of {n} high-severity vulnerabilities across {n2} services.",
      "Cut mean time to detect from {ms3} hours to {ms4} minutes by tuning detections and removing alert noise.",
      "Led the SOC 2 Type II readiness programme to a clean report with zero exceptions.",
      "Built a secure-by-default service template that removed {n} classes of misconfiguration at the source.",
      "Ran tabletop exercises with engineering and legal that halved decision time during a real incident.",
      "Automated dependency scanning in CI, closing the median patch window from {ms3} weeks to {ms4} days.",
    ],
    leadership: [
      "Built and led a {team}-person security function from scratch.",
      "Owned the security roadmap and the board-level risk register.",
      "Established the vulnerability disclosure programme and its triage SLAs.",
    ],
    projects: [
      {
        title: "Security research",
        subtitle: "CTF / disclosure",
        bullets: ["Placed top {pctLow}% in {n} CTF competitions and responsibly disclosed {n2} vulnerabilities."],
        tags: ["Penetration testing", "Python", "Reverse engineering"],
      },
    ],
    certifications: ["CompTIA Security+", "OSCP", "CISSP (Associate)"],
  },
  {
    id: "qa",
    label: "QA / Test Engineering",
    aliases: ["qa", "quality assurance", "test engineer", "sdet", "automation engineer", "tester"],
    summary: [
      "{seniority} test engineer who treats quality as a design problem, not a gate at the end. {years}Automation where it pays, exploratory testing where it doesn't.",
    ],
    coreSkills: ["Test automation", "Playwright", "Selenium", "API testing", "CI/CD", "Test strategy", "Python"],
    tools: ["Playwright", "Cypress", "Postman", "JMeter", "Jira", "GitHub Actions"],
    groups: [
      { label: "Automation", tags: ["Playwright", "Cypress", "Selenium", "Pytest"] },
      { label: "API & load", tags: ["Postman", "REST Assured", "JMeter", "k6"] },
      { label: "Process", tags: ["Test strategy", "Risk-based testing", "CI/CD"] },
    ],
    bullets: [
      "Built an end-to-end suite of {n} tests that cut regression testing from {ms3} days to {ms4} minutes.",
      "Reduced escaped defects {pct}% by adding contract tests at the service boundary.",
      "Introduced risk-based test planning, focusing effort on the {pctLow}% of flows carrying most revenue.",
      "Stabilised a flaky suite from {pctLow}% to {pctHigh}% pass reliability by fixing timing assumptions.",
      "Ran load tests that exposed a bottleneck at {k} concurrent users before the launch that would have found it.",
      "Wrote the bug-reporting standard that halved back-and-forth between QA and engineering.",
    ],
    leadership: [
      "Led a {team}-person QA function and moved it from gatekeeping to embedded quality coaching.",
      "Owned the release readiness criteria used across {n} product teams.",
      "Trained {n} engineers to write and own their own tests.",
    ],
    projects: [
      {
        title: "Test automation framework",
        subtitle: "Playwright · TypeScript",
        bullets: ["Built a reusable framework with parallel execution and rich failure artefacts."],
        tags: ["Playwright", "TypeScript", "CI/CD"],
      },
    ],
  },
  {
    id: "product",
    label: "Product Management",
    aliases: ["product manager", "product owner", "pm", "product lead", "technical product", "group product"],
    summary: [
      "{seniority} product manager who starts with the problem and stays with it. {years}I'm most useful where customer evidence, engineering reality and business constraints have to be reconciled.",
      "Product manager for {focus}. I ship in small increments, measure honestly, and kill my own ideas when the data says so.",
    ],
    coreSkills: ["Product strategy", "Roadmapping", "User research", "Prioritisation", "A/B testing", "SQL", "Stakeholder management"],
    tools: ["Jira", "Figma", "Amplitude", "Looker", "Notion", "Linear"],
    groups: [
      { label: "Discovery", tags: ["User research", "Jobs to be done", "Journey mapping", "Usability testing"] },
      { label: "Delivery", tags: ["Agile", "Roadmapping", "Jira", "Linear"] },
      { label: "Analysis", tags: ["SQL", "Amplitude", "A/B testing", "Funnel analysis"] },
    ],
    bullets: [
      "Owned {feature} end to end, growing weekly active use {pct}% in two quarters.",
      "Ran {n} customer interviews that reframed the roadmap and killed a feature we'd already scoped.",
      "Defined the activation metric and drove it from {pctLow}% to {pctHigh}% through {n} sequenced experiments.",
      "Cut time-to-first-value from {ms3} days to {ms4} minutes by rebuilding onboarding around a single action.",
      "Prioritised a backlog of {n} requests into a roadmap engineering could commit to without heroics.",
      "Launched into {n} new markets, coordinating legal, support and marketing on one timeline.",
      "Wrote the specs, the metrics and the rollback plan — and used the rollback plan once, on purpose.",
    ],
    leadership: [
      "Led a product group of {team} PMs covering {n} squads and a shared platform roadmap.",
      "Introduced the quarterly planning process now used company-wide.",
      "Presented strategy and trade-offs to the board each quarter.",
    ],
    projects: [
      {
        title: "Product teardown",
        subtitle: "Case study",
        bullets: ["Published a teardown of a live product with a prioritised improvement roadmap and success metrics."],
        tags: ["Product strategy", "User research"],
      },
    ],
  },
  {
    id: "design",
    label: "Product Design / UX",
    aliases: ["designer", "ux", "ui designer", "product designer", "interaction", "user experience", "visual designer"],
    summary: [
      "{seniority} product designer working end to end — research, interaction, interface, and the follow-through that makes it ship. {years}",
      "Designer for {focus}. I show my work early, test it with real people, and design the empty and error states before the happy path.",
    ],
    coreSkills: ["User research", "Interaction design", "Prototyping", "Design systems", "Accessibility", "Usability testing", "Visual design"],
    tools: ["Figma", "Framer", "Maze", "Miro", "Principle"],
    groups: [
      { label: "Research", tags: ["User interviews", "Usability testing", "Surveys", "Journey mapping"] },
      { label: "Craft", tags: ["Interaction design", "Visual design", "Prototyping", "Design systems"] },
      { label: "Tools", tags: ["Figma", "Framer", "Miro", "Maze"] },
    ],
    bullets: [
      "Redesigned {feature}, lifting task completion from {pctLow}% to {pctHigh}% in moderated testing.",
      "Ran {n} usability sessions and turned the findings into a prioritised fix list engineering shipped in one sprint.",
      "Built and documented a design system of {n} components, cutting design-to-dev handoff time {pct}%.",
      "Raised accessibility to WCAG 2.2 AA across {n} core flows, including full keyboard and screen-reader paths.",
      "Reduced onboarding drop-off {pct}% by cutting the flow from {n} screens to {n2}.",
      "Designed the empty, loading and error states first — the states that decide whether people trust a product.",
    ],
    leadership: [
      "Led design for a {team}-person product org and set the critique and research cadence.",
      "Owned the design system as a product with its own roadmap and adoption metrics.",
      "Mentored {n} designers and built the portfolio review process for hiring.",
    ],
    projects: [
      {
        title: "Portfolio case study",
        subtitle: "End-to-end product design",
        bullets: ["Documented problem framing, research, iterations and measured outcome for a shipped feature."],
        tags: ["Figma", "User research", "Prototyping"],
      },
    ],
    extraSections: ["portfolio"],
  },
  {
    id: "marketing",
    label: "Marketing",
    aliases: ["marketing", "growth", "demand generation", "brand", "content marketing", "seo", "performance marketing", "digital marketing"],
    summary: [
      "{seniority} marketer who runs campaigns like experiments. {years}Channel-agnostic, attribution-honest, and allergic to vanity metrics.",
    ],
    coreSkills: ["Campaign strategy", "SEO", "Paid acquisition", "Content strategy", "Marketing analytics", "Email marketing", "Positioning"],
    tools: ["Google Analytics", "HubSpot", "Google Ads", "Meta Ads", "Ahrefs", "Klaviyo"],
    groups: [
      { label: "Acquisition", tags: ["SEO", "SEM", "Paid social", "Partnerships"] },
      { label: "Lifecycle", tags: ["Email marketing", "Lifecycle campaigns", "CRM", "Retention"] },
      { label: "Analytics", tags: ["Google Analytics", "Attribution", "A/B testing", "SQL"] },
    ],
    bullets: [
      "Grew organic traffic {pct}% in {ms3} months through a topic-cluster content strategy and technical SEO fixes.",
      "Cut cost per acquisition {pct}% while holding volume, by reallocating spend from broad to intent-based targeting.",
      "Launched a lifecycle email programme that added {money} in incremental revenue in its first quarter.",
      "Ran {n} landing-page experiments; the winning variant lifted conversion {pct}%.",
      "Repositioned the product around a single sharper claim, lifting demo-request rate {pct}%.",
      "Built the attribution model that ended the argument about which channel deserved credit.",
    ],
    leadership: [
      "Led a {team}-person marketing team across content, paid and lifecycle.",
      "Owned a {money2} annual budget and reported performance monthly to the exec team.",
      "Built the brand and messaging framework used across every channel.",
    ],
    projects: [
      {
        title: "Growth experiment portfolio",
        subtitle: "Self-directed",
        bullets: ["Documented {n} experiments with hypotheses, results and what I'd do differently."],
        tags: ["SEO", "Analytics", "Copywriting"],
      },
    ],
  },
  {
    id: "sales",
    label: "Sales & Business Development",
    aliases: ["sales", "account executive", "business development", "bdr", "sdr", "account manager", "partnerships"],
    summary: [
      "{seniority} salesperson who wins by understanding the buyer's problem better than they've articulated it. {years}Consistent quota attainment and clean pipeline hygiene.",
    ],
    coreSkills: ["Consultative selling", "Pipeline management", "Negotiation", "Discovery", "Forecasting", "CRM hygiene", "Territory planning"],
    tools: ["Salesforce", "HubSpot", "Outreach", "Gong", "LinkedIn Sales Navigator"],
    groups: [
      { label: "Selling", tags: ["Consultative selling", "MEDDIC", "Negotiation", "Objection handling"] },
      { label: "Pipeline", tags: ["Forecasting", "Territory planning", "Pipeline management"] },
      { label: "Tools", tags: ["Salesforce", "Outreach", "Gong", "HubSpot"] },
    ],
    bullets: [
      "Closed {money} in new business, hitting {pctHigh}% of quota across {n} consecutive quarters.",
      "Grew territory revenue {pct}% year over year by shifting focus from volume to fit.",
      "Built a pipeline of {n} qualified opportunities through targeted outbound with a {pctLow}% reply rate.",
      "Shortened average sales cycle from {ms3} days to {ms4} days by moving security review earlier.",
      "Landed {n} enterprise logos, including the largest deal in the segment that year at {money2}.",
      "Expanded {n} existing accounts by {pct}% through structured quarterly business reviews.",
    ],
    leadership: [
      "Led a {team}-person sales team to {pctHigh}% of team quota.",
      "Built the onboarding programme that cut new-rep ramp time from {ms3} to {ms4} months.",
      "Owned forecasting accuracy within {pctLow}% for {n} consecutive quarters.",
    ],
    projects: [
      {
        title: "Outbound playbook",
        subtitle: "Self-authored",
        bullets: ["Wrote and tested a sequence framework adopted by the wider team."],
        tags: ["Outreach", "Copywriting", "Salesforce"],
      },
    ],
  },
  {
    id: "customer",
    label: "Customer Success & Support",
    aliases: ["customer success", "customer support", "account management", "client services", "csm", "technical support", "helpdesk"],
    summary: [
      "{seniority} customer success professional who treats churn as a product signal, not a personal failure. {years}I'm the bridge between what customers need and what the roadmap says.",
    ],
    coreSkills: ["Account management", "Onboarding", "Churn prevention", "Escalation management", "QBRs", "Product knowledge", "Documentation"],
    tools: ["Zendesk", "Intercom", "Salesforce", "Gainsight", "Notion"],
    groups: [
      { label: "Success", tags: ["Onboarding", "QBRs", "Adoption", "Renewals"] },
      { label: "Support", tags: ["Escalation management", "Troubleshooting", "SLA management"] },
      { label: "Tools", tags: ["Zendesk", "Intercom", "Salesforce", "Gainsight"] },
    ],
    bullets: [
      "Managed a book of {n} accounts worth {money} ARR at {pctHigh}% gross retention.",
      "Reduced churn {pct}% by building a health-score model and intervening before renewal conversations.",
      "Cut first-response time from {ms3} hours to {ms4} minutes by restructuring the triage queue.",
      "Wrote {n} help-centre articles that deflected {pct}% of repeat tickets.",
      "Ran onboarding for {n} enterprise customers, getting each to first value within {ms4} days.",
      "Fed {n} recurring customer problems back to product with evidence; three became roadmap items.",
    ],
    leadership: [
      "Led a {team}-person CS team and defined the segmentation and coverage model.",
      "Owned net revenue retention as a target and grew it to {pctHigh}%.",
      "Built the escalation path that finally made engineering and support one process.",
    ],
    projects: [
      {
        title: "Knowledge base rebuild",
        subtitle: "Documentation project",
        bullets: ["Restructured {n} articles around customer intent rather than internal org structure."],
        tags: ["Documentation", "Zendesk"],
      },
    ],
  },
  {
    id: "finance",
    label: "Finance & Accounting",
    aliases: ["finance", "accountant", "accounting", "financial analyst", "fp&a", "controller", "audit", "treasury", "bookkeeper"],
    summary: [
      "{seniority} finance professional who makes the numbers usable, not just correct. {years}Close, forecast, and the analysis that changes a decision.",
    ],
    coreSkills: ["Financial modelling", "Forecasting", "Budgeting", "Variance analysis", "GAAP", "Month-end close", "Excel"],
    tools: ["NetSuite", "SAP", "QuickBooks", "Power BI", "Anaplan", "SQL"],
    groups: [
      { label: "Reporting", tags: ["GAAP", "IFRS", "Month-end close", "Consolidation"] },
      { label: "Planning", tags: ["Forecasting", "Budgeting", "Scenario modelling", "Variance analysis"] },
      { label: "Systems", tags: ["NetSuite", "SAP", "Excel", "Power BI", "SQL"] },
    ],
    bullets: [
      "Cut month-end close from {ms3} days to {ms4} days by automating {n} reconciliations.",
      "Built the three-statement model used for a {money2} funding round and its scenario analysis.",
      "Identified {money} in recoverable spend through a vendor and subscription audit.",
      "Improved forecast accuracy from ±{pctLow}% to ±{pctVar}% by rebuilding driver-based assumptions.",
      "Led the audit with zero material adjustments for {n} consecutive years.",
      "Partnered with department heads on budgets, turning an annual argument into a quarterly rhythm.",
    ],
    leadership: [
      "Led a {team}-person finance team through a systems migration with no disruption to close.",
      "Owned the board reporting pack and the underlying KPI definitions.",
      "Built the FP&A function from scratch, including headcount and capacity planning.",
    ],
    projects: [
      {
        title: "Financial model",
        subtitle: "Self-directed",
        bullets: ["Built a full three-statement model with scenario toggles and documented assumptions."],
        tags: ["Excel", "Financial modelling", "Valuation"],
      },
    ],
    certifications: ["CPA", "CFA Level I", "ACCA"],
  },
  {
    id: "consulting",
    label: "Consulting & Strategy",
    aliases: ["consultant", "strategy", "management consultant", "advisory", "corporate strategy", "transformation"],
    summary: [
      "{seniority} consultant who leaves clients with a decision, not a deck. {years}Structured problem-solving, fast diagnosis, and recommendations that survive contact with implementation.",
    ],
    coreSkills: ["Problem structuring", "Market analysis", "Financial modelling", "Stakeholder management", "Workshop facilitation", "Executive communication"],
    tools: ["Excel", "PowerPoint", "Tableau", "SQL", "Miro"],
    groups: [
      { label: "Analysis", tags: ["Market sizing", "Financial modelling", "Benchmarking", "Due diligence"] },
      { label: "Delivery", tags: ["Workshop facilitation", "Change management", "Programme management"] },
      { label: "Tools", tags: ["Excel", "PowerPoint", "Tableau", "SQL"] },
    ],
    bullets: [
      "Led a {ms3}-week diagnostic for a {money2} business, identifying {money} in annual margin improvement.",
      "Built the market model that shaped the client's entry decision into {n} new territories.",
      "Facilitated workshops with {n} executives to align a fragmented strategy into one operating plan.",
      "Ran commercial due diligence on {n} acquisition targets; the recommended target closed within the quarter.",
      "Designed an operating model that reduced hand-offs between {n} functions and cut cycle time {pct}%.",
      "Stayed through implementation, which is where most recommendations quietly die.",
    ],
    leadership: [
      "Led a {team}-person engagement team across {n} workstreams.",
      "Owned the client relationship at C-level and grew the account {pct}%.",
      "Built the firm's methodology for {focus} engagements.",
    ],
    projects: [
      {
        title: "Case competition",
        subtitle: "Strategy case",
        bullets: ["Placed top {n} of {k} teams with a market-entry recommendation backed by a bottom-up model."],
        tags: ["Market sizing", "Excel", "Presentation"],
      },
    ],
  },
  {
    id: "operations",
    label: "Operations & Supply Chain",
    aliases: ["operations", "supply chain", "logistics", "procurement", "warehouse", "manufacturing", "process improvement", "coo"],
    summary: [
      "{seniority} operations professional who finds the constraint and fixes it. {years}Process, throughput, cost — measured before and after.",
    ],
    coreSkills: ["Process improvement", "Inventory management", "Vendor management", "Forecasting", "Lean/Six Sigma", "SOP development"],
    tools: ["SAP", "NetSuite", "Excel", "Power BI", "WMS"],
    groups: [
      { label: "Operations", tags: ["Process improvement", "Lean", "Six Sigma", "Capacity planning"] },
      { label: "Supply chain", tags: ["Inventory management", "Procurement", "Logistics", "Demand planning"] },
      { label: "Systems", tags: ["SAP", "NetSuite", "WMS", "Excel"] },
    ],
    bullets: [
      "Redesigned the {feature} process, cutting cycle time {pct}% and removing {n} hand-offs.",
      "Reduced inventory carrying cost {money} annually while improving fill rate to {pctHigh}%.",
      "Renegotiated {n} supplier contracts for {money} in annual savings without changing service levels.",
      "Cut order-to-delivery time from {ms3} days to {ms4} days by re-sequencing the pick-pack flow.",
      "Documented {n} SOPs that took new-hire ramp from {ms3} weeks to {ms4} days.",
      "Built the demand forecast that reduced stockouts {pct}% across {n} SKUs.",
    ],
    leadership: [
      "Led a {team}-person operations team across {n} sites.",
      "Owned a {money2} operating budget and its quarterly review.",
      "Ran the continuous-improvement programme that delivered {money} in cumulative savings.",
    ],
    projects: [
      {
        title: "Process improvement project",
        subtitle: "Lean initiative",
        bullets: ["Mapped a value stream end to end and eliminated {n} non-value-adding steps."],
        tags: ["Lean", "Process mapping", "Excel"],
      },
    ],
    certifications: ["Lean Six Sigma Green Belt", "APICS CPIM", "PMP"],
  },
  {
    id: "hr",
    label: "People & Talent",
    aliases: ["hr", "human resources", "recruiter", "talent", "people operations", "recruiting", "l&d", "compensation"],
    summary: [
      "{seniority} people professional who builds systems, not just goodwill. {years}Hiring, development and the unglamorous policy work that makes a company fair.",
    ],
    coreSkills: ["Full-cycle recruiting", "Employee relations", "Performance management", "Onboarding", "HR policy", "Compensation"],
    tools: ["Greenhouse", "Workday", "BambooHR", "LinkedIn Recruiter", "Culture Amp"],
    groups: [
      { label: "Talent", tags: ["Sourcing", "Interviewing", "Employer branding", "Greenhouse"] },
      { label: "People ops", tags: ["Onboarding", "Performance management", "Employee relations", "Policy"] },
      { label: "Systems", tags: ["Workday", "BambooHR", "Culture Amp"] },
    ],
    bullets: [
      "Hired {n} people across {n2} functions with a {pctHigh}% offer-acceptance rate.",
      "Cut time-to-hire from {ms3} days to {ms4} days by restructuring the interview loop and killing redundant stages.",
      "Built a structured interview scorecard that improved first-year retention {pct}%.",
      "Rolled out a performance framework across {k} employees with manager training to match.",
      "Reduced regretted attrition {pct}% by acting on exit-interview themes rather than filing them.",
      "Rewrote the leave and remote-work policies to be clearer, fairer and legally sound in {n} jurisdictions.",
    ],
    leadership: [
      "Led a {team}-person people team through headcount growth from {n} to {k}.",
      "Owned the compensation philosophy, banding and annual review cycle.",
      "Advised the executive team on organisational design during a restructure.",
    ],
    projects: [
      {
        title: "Hiring process redesign",
        subtitle: "People operations",
        bullets: ["Rebuilt a hiring loop around structured, bias-aware evaluation."],
        tags: ["Recruiting", "Process design"],
      },
    ],
  },
  {
    id: "project",
    label: "Project & Programme Management",
    aliases: ["project manager", "programme manager", "program manager", "delivery manager", "scrum master", "pmo"],
    summary: [
      "{seniority} project manager who makes dependencies visible early enough to do something about them. {years}Scope, risk and communication — on time more often than not, and honest when not.",
    ],
    coreSkills: ["Project planning", "Risk management", "Stakeholder management", "Agile", "Budget management", "Reporting"],
    tools: ["Jira", "Asana", "MS Project", "Confluence", "Smartsheet"],
    groups: [
      { label: "Delivery", tags: ["Agile", "Scrum", "Waterfall", "Kanban"] },
      { label: "Governance", tags: ["Risk management", "Budget management", "RAID logs", "Reporting"] },
      { label: "Tools", tags: ["Jira", "Asana", "MS Project", "Confluence"] },
    ],
    bullets: [
      "Delivered a {money2} programme across {n} workstreams on time and {pctLow}% under budget.",
      "Cut project status reporting from {ms3} hours a week to {ms4} minutes with a single source of truth.",
      "Identified and mitigated {n} critical-path risks before they became delays.",
      "Coordinated {n} teams across {n2} time zones on a single release calendar.",
      "Introduced retrospectives that turned recurring delivery complaints into {n} closed process fixes.",
      "Recovered a red project to green in {ms3} weeks by renegotiating scope rather than adding people.",
    ],
    leadership: [
      "Ran a PMO covering {n} concurrent programmes and a {money2} portfolio.",
      "Set the delivery standards and stage gates used across the organisation.",
      "Coached {n} project managers through certification.",
    ],
    projects: [
      {
        title: "Programme delivery",
        subtitle: "Cross-functional",
        bullets: ["Planned and delivered a multi-team programme with published RAID and status cadence."],
        tags: ["Jira", "Risk management", "Agile"],
      },
    ],
    certifications: ["PMP", "PRINCE2 Practitioner", "Certified ScrumMaster"],
  },
  {
    id: "education",
    label: "Teaching & Education",
    aliases: ["teacher", "educator", "lecturer", "instructor", "tutor", "professor", "curriculum", "school", "principal"],
    summary: [
      "{seniority} educator who plans for the students actually in the room. {years}Curriculum design, differentiated instruction, and assessment that informs teaching rather than just ranking learners.",
    ],
    coreSkills: ["Curriculum design", "Differentiated instruction", "Assessment design", "Classroom management", "Student mentoring", "Ed-tech"],
    tools: ["Google Classroom", "Canvas", "Moodle", "Nearpod"],
    groups: [
      { label: "Teaching", tags: ["Curriculum design", "Lesson planning", "Differentiation", "Assessment"] },
      { label: "Support", tags: ["IEP support", "Behaviour management", "Parent engagement"] },
      { label: "Technology", tags: ["Google Classroom", "Canvas", "Moodle"] },
    ],
    bullets: [
      "Taught {n} students across {n2} sections, raising average assessment scores {pct}%.",
      "Redesigned the {subject} curriculum around inquiry-based units, lifting engagement measurably.",
      "Supported {n} students with IEPs through differentiated materials and one-to-one intervention.",
      "Introduced formative assessment routines that let me adjust instruction weekly instead of at term's end.",
      "Mentored {n} early-career teachers through their first full year.",
      "Ran an after-school programme that reached {n} students and improved attendance {pct}%.",
    ],
    leadership: [
      "Led a department of {team} teachers and owned curriculum standards across the year group.",
      "Chaired the assessment review that reshaped how the school reports progress.",
      "Coordinated professional development for {n} staff.",
    ],
    projects: [
      {
        title: "Curriculum unit",
        subtitle: "Designed and taught",
        bullets: ["Built a full unit with differentiated resources, rubrics and reflection data."],
        tags: ["Curriculum design", "Assessment"],
      },
    ],
    extraSections: ["teaching", "certifications"],
  },
  {
    id: "healthcare",
    label: "Healthcare & Clinical",
    aliases: ["nurse", "nursing", "clinical", "physician", "doctor", "medical", "healthcare", "therapist", "pharmacist", "paramedic"],
    summary: [
      "{seniority} clinician focused on safe, evidence-based care and clear communication with patients and families. {years}",
    ],
    coreSkills: ["Patient assessment", "Care planning", "Clinical documentation", "Patient education", "Infection control", "Interdisciplinary collaboration"],
    tools: ["Epic", "Cerner", "Meditech"],
    groups: [
      { label: "Clinical", tags: ["Patient assessment", "Care planning", "Medication administration", "Triage"] },
      { label: "Compliance", tags: ["HIPAA", "Infection control", "Quality improvement"] },
      { label: "Systems", tags: ["Epic", "Cerner", "EMR documentation"] },
    ],
    bullets: [
      "Provided direct care for a caseload of {n} patients per shift in a {n2}-bed unit.",
      "Reduced {metricArea} incidents {pct}% by leading a unit-level quality improvement initiative.",
      "Precepted {n} new nurses through orientation and competency sign-off.",
      "Improved documentation compliance to {pctHigh}% through targeted peer coaching.",
      "Coordinated discharge planning with social work and pharmacy, cutting readmissions {pct}%.",
      "Educated patients and families on care plans, measurably improving adherence.",
    ],
    leadership: [
      "Charge nurse for a {team}-person team across {n} shifts a week.",
      "Chaired the unit practice council and led {n} evidence-based practice changes.",
      "Owned staffing, scheduling and competency tracking for the unit.",
    ],
    projects: [
      {
        title: "Quality improvement project",
        subtitle: "Unit initiative",
        bullets: ["Ran a PDSA cycle that reduced a recurring safety event and sustained the gain for {ms3} months."],
        tags: ["Quality improvement", "Evidence-based practice"],
      },
    ],
    certifications: ["BLS", "ACLS", "Registered Nurse (RN) licence"],
    extraSections: ["certifications", "memberships"],
  },
  {
    id: "research",
    label: "Research & Academia",
    aliases: ["researcher", "phd", "postdoc", "academic", "scientist", "research assistant", "fellow", "faculty", "lecturer"],
    summary: [
      "{seniority} researcher working on {focus}. {years}Interested in questions where careful method changes the answer, and in writing that makes the work usable by others.",
    ],
    coreSkills: ["Experimental design", "Statistical analysis", "Academic writing", "Literature review", "Grant writing", "Peer review", "Python"],
    tools: ["R", "Python", "LaTeX", "SPSS", "MATLAB", "Zotero"],
    groups: [
      { label: "Methods", tags: ["Experimental design", "Statistical analysis", "Qualitative methods", "Meta-analysis"] },
      { label: "Tools", tags: ["R", "Python", "LaTeX", "SPSS", "MATLAB"] },
      { label: "Scholarship", tags: ["Academic writing", "Peer review", "Grant writing", "Conference presentation"] },
    ],
    bullets: [
      "Designed and ran {n} studies with {k} participants, published in a peer-reviewed venue.",
      "Secured {money2} in competitive funding as {role} on a multi-institution grant.",
      "Published {n} first-author papers and {n2} co-authored papers, cited {n3}+ times.",
      "Supervised {n} undergraduate and master's students through independent projects.",
      "Built an analysis pipeline in R that made the lab's results reproducible from raw data.",
      "Presented at {n} international conferences and reviewed for {n2} journals.",
    ],
    leadership: [
      "Led a research group of {team} and set its methodological and data-sharing standards.",
      "Principal investigator on a {money2} grant across {n} institutions.",
      "Convened a workshop bringing together {n} researchers across disciplines.",
    ],
    projects: [
      {
        title: "Dissertation research",
        subtitle: "Independent project",
        bullets: ["Designed, executed and defended original research contributing new evidence to the field."],
        tags: ["Research design", "Statistics", "Academic writing"],
      },
    ],
    extraSections: ["publications", "research", "teaching", "grants", "conferences", "references"],
  },
  {
    id: "legal",
    label: "Legal",
    aliases: ["lawyer", "legal", "attorney", "paralegal", "counsel", "compliance officer", "solicitor"],
    summary: [
      "{seniority} legal professional focused on practical advice — the version a business can actually act on. {years}",
    ],
    coreSkills: ["Contract drafting", "Legal research", "Negotiation", "Regulatory compliance", "Risk assessment", "Litigation support"],
    tools: ["Westlaw", "LexisNexis", "DocuSign", "Ironclad"],
    groups: [
      { label: "Practice", tags: ["Contract drafting", "Negotiation", "Legal research", "Due diligence"] },
      { label: "Compliance", tags: ["GDPR", "Regulatory compliance", "Policy drafting", "Risk assessment"] },
      { label: "Tools", tags: ["Westlaw", "LexisNexis", "Ironclad"] },
    ],
    bullets: [
      "Drafted and negotiated {n} commercial agreements a year, from NDAs to {money2} master service agreements.",
      "Built a contract playbook and template set that cut average turnaround from {ms3} days to {ms4} days.",
      "Advised on regulatory compliance across {n} jurisdictions, including data protection and consumer law.",
      "Managed {n} disputes to resolution without litigation, preserving commercial relationships.",
      "Ran legal due diligence on {n} transactions totalling {money2}.",
      "Trained {n} non-legal staff on contract risk so routine deals stopped queuing for review.",
    ],
    leadership: [
      "Built and led an in-house legal function of {team}.",
      "Owned the legal risk register and reported quarterly to the board.",
      "Selected and managed external counsel, cutting outside spend {pct}%.",
    ],
    projects: [
      {
        title: "Policy project",
        subtitle: "Compliance",
        bullets: ["Authored a compliance framework adopted across the organisation."],
        tags: ["Compliance", "Policy drafting"],
      },
    ],
    extraSections: ["certifications"],
  },
  {
    id: "writing",
    label: "Writing & Communications",
    aliases: ["writer", "editor", "copywriter", "content", "journalist", "communications", "technical writer", "pr"],
    summary: [
      "{seniority} writer who edits hard and ships on deadline. {years}I write for a specific reader with a specific decision to make.",
    ],
    coreSkills: ["Editorial strategy", "Copywriting", "Editing", "SEO writing", "Interviewing", "Style guides", "Content planning"],
    tools: ["WordPress", "Contentful", "Ahrefs", "Google Docs", "Figma"],
    groups: [
      { label: "Writing", tags: ["Copywriting", "Long-form", "Technical writing", "Editing"] },
      { label: "Strategy", tags: ["Editorial strategy", "SEO", "Content planning", "Style guides"] },
      { label: "Tools", tags: ["WordPress", "Contentful", "Ahrefs"] },
    ],
    bullets: [
      "Wrote and published {n} pieces reaching {k} readers, with {n2} ranking on page one.",
      "Rebuilt the documentation set, cutting support tickets on covered topics {pct}%.",
      "Created and enforced a style guide that made {n} contributors sound like one publication.",
      "Interviewed {n} subject-matter experts and turned dense material into pieces non-specialists finished.",
      "Grew newsletter subscribers {pct}% through a sharper editorial point of view.",
      "Edited {n} pieces a month against a fixed deadline without missing one.",
    ],
    leadership: [
      "Led an editorial team of {team} across {n} content lines.",
      "Owned the content strategy and its contribution to pipeline.",
      "Built the freelance network and commissioning process.",
    ],
    projects: [
      {
        title: "Writing portfolio",
        subtitle: "Published work",
        bullets: ["Maintained a portfolio of published pieces across {n} publications."],
        tags: ["Writing", "Editing", "SEO"],
      },
    ],
    extraSections: ["portfolio"],
  },
  {
    id: "generalist",
    label: "General Professional",
    aliases: [],
    summary: [
      "{seniority} professional focused on {focus}. {years}I take ownership of ambiguous problems, work well across functions, and measure whether what I did actually worked.",
    ],
    coreSkills: ["Problem solving", "Communication", "Project management", "Data analysis", "Stakeholder management", "Process improvement"],
    tools: ["Excel", "Google Workspace", "Slack", "Notion", "Jira"],
    groups: [
      { label: "Core", tags: ["Problem solving", "Communication", "Project management"] },
      { label: "Analysis", tags: ["Excel", "Data analysis", "Reporting"] },
      { label: "Tools", tags: ["Google Workspace", "Notion", "Slack", "Jira"] },
    ],
    bullets: [
      "Owned {feature} end to end and improved its key measure {pct}%.",
      "Streamlined a recurring process, saving the team {n} hours a week.",
      "Coordinated {n} stakeholders across {n2} teams to deliver on a shared deadline.",
      "Built the reporting that gave leadership visibility into a previously opaque area.",
      "Trained {n} colleagues on a new tool and wrote the documentation to make it stick.",
      "Identified a gap nobody owned, proposed a fix, and delivered it.",
    ],
    leadership: [
      "Led a team of {team} and set its priorities and working agreements.",
      "Owned a budget of {money2} and reported on it quarterly.",
      "Mentored {n} colleagues into expanded scope.",
    ],
    projects: [
      {
        title: "Independent project",
        subtitle: "Self-directed",
        bullets: ["Scoped and delivered a project end to end with a measured outcome."],
        tags: ["Project management", "Analysis"],
      },
    ],
  },
];

// ── lookup ──────────────────────────────────────────────────────────────────

const GENERALIST = ROLE_FAMILIES[ROLE_FAMILIES.length - 1];

/**
 * Picks the family whose aliases best match a free-text role. Longer alias
 * matches win so "data engineer" beats "engineer".
 */
export function matchRoleFamily(role: string): RoleFamily {
  const q = ` ${role.toLowerCase().replace(/[^a-z0-9+#/ ]/g, " ").replace(/\s+/g, " ")} `;
  let best: { family: RoleFamily; score: number } | null = null;

  for (const family of ROLE_FAMILIES) {
    for (const alias of family.aliases) {
      if (!q.includes(` ${alias} `) && !q.includes(alias)) continue;
      const score = alias.length + (q.includes(` ${alias} `) ? 3 : 0);
      if (!best || score > best.score) best = { family, score };
    }
  }
  return best?.family ?? GENERALIST;
}

export const ROLE_SUGGESTIONS = [
  "Software Engineer",
  "Frontend Engineer",
  "Data Scientist",
  "Data Analyst",
  "Product Manager",
  "Product Designer",
  "DevOps Engineer",
  "Marketing Manager",
  "Account Executive",
  "Financial Analyst",
  "Registered Nurse",
  "Research Assistant",
  "Project Manager",
  "Teacher",
  "Operations Manager",
  "Customer Success Manager",
];
