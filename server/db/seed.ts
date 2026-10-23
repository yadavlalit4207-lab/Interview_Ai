export interface SeedQuestion {
  id: string
  role: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  topic: string
  question_text: string
  question_type: 'technical_explanation' | 'coding' | 'behavioral' | 'system_design' | 'short_answer'
  hints: string[]
  expected_concepts: string[]
  example_solution: string
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    id: 'bank-fe-1',
    role: 'Frontend Developer',
    category: 'Technical',
    difficulty: 'Medium',
    topic: 'React Architecture & Diffing',
    question_text: 'Explain how React\'s reconciliation algorithm and Virtual DOM work. How does React determine when to re-render, and what role do keys play in list reconciliation?',
    question_type: 'technical_explanation',
    hints: [
      'Mention the Diffing algorithm and heuristic O(n) assumptions',
      'Discuss element type changes vs attribute updates',
      'Explain why index keys can cause rendering bugs with stateful elements',
    ],
    expected_concepts: [
      'Virtual DOM tree comparison',
      'Heuristic O(n) diffing',
      'Key stability',
      'Fiber architecture work loop',
      'Batched state updates',
    ],
    example_solution: 'React maintains an in-memory Virtual DOM tree representing the UI. When state or props change, React constructs a new VDOM tree and compares it with the previous snapshot using an O(n) heuristic diffing algorithm. Keys serve as persistent identifiers across renders so React can reorder, insert, or reuse nodes without tearing down DOM subtrees.',
  },
  {
    id: 'bank-fe-2',
    role: 'Frontend Developer',
    category: 'Technical',
    difficulty: 'Hard',
    topic: 'Performance & Web Vitals',
    question_text: 'What are Core Web Vitals (LCP, INP, CLS)? Walk me through how you would diagnose and optimize a web application suffering from poor Largest Contentful Paint (LCP) and High Cumulative Layout Shift (CLS).',
    question_type: 'technical_explanation',
    hints: [
      'Define LCP (<2.5s), INP (<200ms), and CLS (<0.1)',
      'Talk about image optimization, fetchpriority="high", preloading',
      'Explain explicit width/height attributes or CSS aspect-ratio to prevent layout shifts',
    ],
    expected_concepts: [
      'LCP sub-parts (TTFB, Resource Load Delay, Render Delay)',
      'Image preload and CDN delivery',
      'CLS causes (unsized images, injected ads, web fonts FOIT/FOUT)',
      'CSS aspect-ratio and font-display: swap',
    ],
    example_solution: 'To optimize LCP, optimize TTFB with edge caching, add fetchpriority="high" and rel="preload" on hero elements, and remove render-blocking stylesheets. For CLS, specify explicit width/height or aspect-ratio on images/videos, reserve layout containers for ads, and use font-display: optional or size-adjust to prevent text reflows.',
  },
  {
    id: 'bank-fe-3',
    role: 'Frontend Developer',
    category: 'Technical',
    difficulty: 'Easy',
    topic: 'CSS Cascade & Specificity',
    question_text: 'Describe how CSS Cascading and Specificity work. How do modern Cascade Layers (@layer) solve specificity wars in component-based architectures?',
    question_type: 'technical_explanation',
    hints: [
      'Explain specificity calculation (IDs, classes, elements)',
      'Discuss order of appearance in standard CSS',
      'Explain how @layer establishes explicit precedence levels regardless of selector weights',
    ],
    expected_concepts: [
      'Specificity hierarchy: inline > ID > class/attribute/pseudo-class > element',
      'Source order tie-breakers',
      'CSS Cascade Layers (@layer)',
      'Reverting styles with revert-layer',
    ],
    example_solution: 'CSS specificity determines which declaration applies when multiple rules match an element. It is calculated by counting IDs, classes, and tag selectors. Cascade Layers (@layer) group CSS rules into explicit priority bands, allowing reset or framework styles in lower layers to be overridden by higher layers even if the lower layer has higher selector specificity.',
  },
  {
    id: 'bank-be-1',
    role: 'Backend Developer',
    category: 'Technical',
    difficulty: 'Medium',
    topic: 'Database Indexing & Performance',
    question_text: 'Explain how B-Tree indexes work in PostgreSQL or MySQL. When can an index degrade performance, and how do composite indexes obey the leftmost prefix rule?',
    question_type: 'technical_explanation',
    hints: [
      'Explain balanced tree traversal O(log N)',
      'Consider write overhead (INSERT/UPDATE/DELETE cost)',
      'Explain how a composite index on (A, B) cannot optimize WHERE B = 5 without A',
    ],
    expected_concepts: [
      'B-Tree node balancing and page splits',
      'Write amplification and storage overhead',
      'Leftmost prefix matching',
      'Index selectivity and cardinality',
    ],
    example_solution: 'A B-Tree index maintains a self-balancing tree of sorted keys and page pointers, enabling O(log N) searches and range scans. However, every INSERT, UPDATE, or DELETE requires updating corresponding index pages, introducing write overhead. For composite indexes on columns (A, B, C), queries can only leverage the index if they filter on the leftmost column A first.',
  },
  {
    id: 'bank-be-2',
    role: 'Backend Developer',
    category: 'Technical',
    difficulty: 'Hard',
    topic: 'API Design & Idempotency',
    question_text: 'How do you design an idempotent API endpoint for payment processing or sensitive transactions? What mechanisms prevent duplicate processing during client timeouts or retries?',
    question_type: 'technical_explanation',
    hints: [
      'Explain the role of Idempotency-Key HTTP headers',
      'Discuss atomic locks (Redis Redlock or DB row locks)',
      'Explain caching initial responses to return identical payloads on retries',
    ],
    expected_concepts: [
      'Idempotency keys (UUIDv4) stored with TTL',
      'Atomic conditional insertion or transaction state machines',
      'Distributed locking to prevent race conditions',
      'Cached response replay for duplicate attempts',
    ],
    example_solution: 'Clients pass a unique Idempotency-Key header on mutating requests. The server checks an atomic store (e.g., Redis or SQL table) for the key. If in-flight, subsequent calls wait or return 409 Conflict. If completed, the cached response payload is replayed immediately. If new, the transaction executes within an atomic database boundary and persists the result before returning 201/200.',
  },
  {
    id: 'bank-be-3',
    role: 'Backend Developer',
    category: 'Technical',
    difficulty: 'Medium',
    topic: 'Connection Pooling & Starvation',
    question_text: 'Walk me through how connection pooling works in a backend service connected to a database. What causes connection pool starvation, and how do you size the pool correctly?',
    question_type: 'technical_explanation',
    hints: [
      'Explain active vs idle connection pools',
      'Discuss slow transactions holding connections',
      'Mention HikariCP sizing formula: (cores * 2) + disk count',
    ],
    expected_concepts: [
      'Connection overhead (TCP handshakes, process allocation)',
      'Pool starvation caused by unclosed connections or slow queries',
      'HikariCP sizing formula',
      'Connection timeouts and health checks',
    ],
    example_solution: 'Connection pools maintain warm TCP connections to the database to eliminate handshake latency. Pool starvation occurs when all connections are checked out and requests queue waiting for an idle connection, usually caused by long-running transactions, slow queries, or leaking connections without proper try/finally disposal.',
  },
  {
    id: 'bank-sys-1',
    role: 'Full-Stack Developer',
    category: 'Technical',
    difficulty: 'Hard',
    topic: 'Distributed Systems & WebSockets',
    question_text: 'How would you architect a real-time collaborative document editing platform (like Google Docs or Notion)? Compare Operational Transformation (OT) with Conflict-free Replicated Data Types (CRDTs).',
    question_type: 'system_design',
    hints: [
      'Address network latency and offline mutation',
      'Contrast centralized server transformation with decentralized commutative operations',
      'Discuss WebSocket connection management and snapshot recovery',
    ],
    expected_concepts: [
      'Operational Transformation (OT) central server authority',
      'CRDTs (Yjs, Automerge) mathematical commutativity',
      'WebSocket stateful gateways with Redis Pub/Sub',
      'Delta compression and periodic snapshotting',
    ],
    example_solution: 'Real-time collaborative editing requires handling asynchronous conflicting edits. Operational Transformation relies on a central server to transform operations based on server revision logs. CRDTs use mathematically proven merge structures where edits commute in any order, allowing peer-to-peer or server-assisted offline synchronization with zero merge conflicts.',
  },
  {
    id: 'bank-beh-1',
    role: 'Full-Stack Developer',
    category: 'Behavioral',
    difficulty: 'Medium',
    topic: 'Conflict Resolution & Technical Disagreement',
    question_text: 'Tell me about a time you strongly disagreed with a senior engineer or product manager regarding an architectural or technical decision. How did you handle the discussion, and what was the outcome?',
    question_type: 'behavioral',
    hints: [
      'Use the STAR method: Situation, Task, Action, Result',
      'Focus on objective data, benchmarks, or prototypes rather than emotion',
      'Show willingness to disagree and commit once a decision is made',
    ],
    expected_concepts: [
      'Situation & Task context',
      'Objective evaluation via benchmarks/proof-of-concept',
      'Collaborative dialogue and empathy for product goals',
      'Quantifiable Result and team reflection',
    ],
    example_solution: 'In my previous project, we faced a choice between migrating to GraphQL or optimizing our REST API with HTTP/2 and caching. I built a quick prototype benchmark showing our mobile payload sizes under both options. We reviewed the trade-offs collaboratively, aligned on optimizing REST for our immediate release timeline, and agreed to revisit GraphQL for our next major milestone.',
  },
  {
    id: 'bank-beh-2',
    role: 'Backend Developer',
    category: 'Behavioral',
    difficulty: 'Hard',
    topic: 'Production Outage & Post-Mortem',
    question_text: 'Describe a severe production outage or data issue you were involved in diagnosing and resolving. What was your triage methodology under pressure, and what safeguards did you put in place to prevent recurrence?',
    question_type: 'behavioral',
    hints: [
      'Structure response: Situation, Immediate containment, Root cause analysis, Prevention',
      'Demonstrate calm ownership and blameless post-mortem mindset',
      'Mention metrics, alerts, or automated tests implemented after the fix',
    ],
    expected_concepts: [
      'Incident command and stakeholder communication',
      'Rapid mitigation (rollback/traffic drain) before root-cause debugging',
      'Blameless post-mortem analysis (5 Whys)',
      'Defensive automation (circuit breakers, canary deployments)',
    ],
    example_solution: 'During a Black Friday spike, our payment queue choked on database deadlocks. I immediately initiated a rollback to our last stable release to protect customer checkout while isolating deadlocked worker processes. Once stabilized, we held a blameless post-mortem, identified an unindexed foreign key join, added pessimistic locking with strict timeouts, and set up canary deployment alerting.',
  },
]
