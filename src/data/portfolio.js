/**
 * Portfolio content source.
 *
 * Add projects to one of the arrays below and the matching chapter will render
 * them automatically. No HTML, CSS, or Three.js changes are required.
 */
export const portfolio = {
  projects: {
    surface: [
      {
        id: 'url-shortener',
        eyebrow: 'Featured build · 2025',
        domain: 'Frontend · Product',
        title: 'Serverless URL Shortener',
        description: 'A cross-platform client with authentication, MFA, dashboards, URL analytics and optimistic UI on a serverless AWS architecture.',
        stack: ['Flutter', 'Dart', 'AWS'],
        url: 'https://github.com/BSSE23029/aws_url_shortner',
        caseStudy: {
          label: 'Product systems',
          problem: 'Link management needs to feel immediate while authentication, MFA and analytics remain dependable underneath.',
          approach: 'Built the cross-platform Flutter client around authenticated workflows, dashboards, URL analytics and optimistic UI, backed by a serverless AWS architecture.',
          result: 'A product-shaped surface that keeps the fast interaction in the foreground while the cloud services handle the durable work.',
        },
      },
      {
        id: 'multilingual-reading',
        eyebrow: 'Cross-platform',
        domain: 'Frontend · Search',
        title: 'Multilingual Reading & Search',
        description: 'A reading app with audio, bookmarks and localization across 128 languages, with vectorised search powered by Rust.',
        stack: ['Flutter', 'Rust', 'Cloudflare'],
        url: 'https://github.com/BSSE23029/Quran',
        caseStudy: {
          label: 'Search + mobile',
          problem: 'A large multilingual reading experience needs useful discovery without making the interface feel like a database.',
          approach: 'Combined Flutter for the product surface with audio, bookmarks and localization, then moved vectorised search into Rust-backed infrastructure.',
          result: 'A reading application spanning 128 languages and 79 reciters, with search designed around the act of reading rather than around raw records.',
        },
      },
    ],
    signal: [
      {
        id: 'traffic-dissector',
        eyebrow: 'Network tooling · Go',
        domain: 'Network · APIs',
        meta: 'TCP/IP',
        title: 'Passive Traffic Dissector',
        description: 'Layer-by-layer protocol decoding, HTTP inspection, PCAP replay, structured JSONL output, and golden tests.',
        stack: ['Go', 'PCAP', 'TCP/IP'],
        url: 'https://github.com/BSSE23029/netscope',
        caseStudy: {
          label: 'Network tooling',
          problem: 'Raw packet captures are detailed but difficult to reason about when the useful evidence is spread across multiple protocol layers.',
          approach: 'Built a passive Go analyzer with layer-by-layer decoding, HTTP inspection, PCAP replay, JSONL output and golden tests.',
          result: 'A testable path from captured frames to structured evidence that can be inspected, replayed and compared over time.',
        },
      },
      {
        id: 'chess-go',
        eyebrow: 'Systems + terminal UI · Go',
        domain: 'Systems · Engine',
        meta: 'Rules · Engine · Network',
        title: 'Chess-Go',
        description: 'A dependency-light Go chess toolkit combining a rules-first library, classical alpha-beta search, a responsive terminal UI, versioned network matches and deterministic tournaments.',
        stack: ['Go', 'Alpha-beta', 'HTTP/WebSocket', 'TUI'],
        featured: true,
        url: 'https://github.com/bsse23029/chess-go',
        caseStudy: {
          label: 'Systems + game tooling',
          problem: 'A chess product becomes difficult to evolve when rules, search, terminal presentation and network state are tightly coupled.',
          approach: 'Kept the rules library independent from the CLI and transport layers, then added FEN/SAN/UCI/PGN support, Zobrist hashing, iterative alpha-beta search, a responsive TUI, versioned JSON/HTTP/WebSocket matches, LAN discovery and deterministic tournaments.',
          result: 'One Go checkout supports reusable rules and engine APIs, local human-or-bot play, reconnectable match prototypes and reproducible verification through tests, perft and benchmarks.',
        },
      },
      {
        id: 'tb-classification',
        eyebrow: 'Medical AI · Research',
        domain: 'AI · Research',
        meta: 'IEEE ICIC · 2025',
        title: 'Tuberculosis Classification Pipeline',
        description: 'A reproducible VGG16 transfer-learning pipeline for three-class chest X-ray classification, reporting 98.53% accuracy and 97.54% MCC.',
        stack: ['Python', 'TensorFlow', 'Keras'],
        url: 'https://github.com/BSSE23029/VGG16-Transfer-Learning',
        caseStudy: {
          label: 'Applied research',
          problem: 'Chest X-ray classification needs a reproducible evaluation path, not just a promising model output.',
          approach: 'Applied VGG16 transfer learning to a three-class classification pipeline with a repeatable training and evaluation workflow.',
          result: 'The published pipeline reported 98.53% accuracy and 97.54% MCC at IEEE ICIC 2025.',
        },
      },
    ],
    core: [
      {
        id: 'typescript-backend',
        eyebrow: 'Service architecture',
        domain: 'Backend',
        title: 'TypeScript Backend',
        description: 'Decorators, controllers, middleware and service-oriented modules.',
        stack: ['TypeScript', 'NestJS', 'Node'],
        url: 'https://github.com/BSSE23029/ts_server_decorators',
        caseStudy: {
          label: 'Backend engineering',
          problem: 'A growing server becomes difficult to reason about when routing, middleware and business services are mixed together.',
          approach: 'Explored decorators, controllers, route handlers and middleware as explicit layers, then organized the implementation around service-oriented modules and NestJS patterns.',
          result: 'A clearer backend foundation that makes request flow and service boundaries easier to inspect and extend.',
        },
      },
      {
        id: 'document-agents',
        eyebrow: 'Traceable workflows',
        domain: 'AI · Backend',
        title: 'Document Agents',
        description: 'Worker processes, Redis, vector retrieval and tracing integrations.',
        stack: ['Python', 'LangChain', 'Redis', 'Langfuse'],
        url: 'https://github.com/BSSE23029/langchain_pdf_tracibility',
        caseStudy: {
          label: 'Applied AI + backend',
          problem: 'PDF retrieval prototypes need more than an answer: their sources, worker behavior and failure modes must remain traceable.',
          approach: 'Combined Flask endpoints, worker processes, Redis-backed coordination, vector retrieval and Langfuse-oriented tracing around the document workflow.',
          result: 'A retrieval-augmented prototype that keeps the path from uploaded document to generated answer inspectable.',
        },
      },
      {
        id: 'portunus-p2p',
        eyebrow: 'Systems architecture · Rust',
        domain: 'Backend · Systems',
        title: 'Portunus P2P Engine',
        description: 'A high-performance, gRPC-controlled peer-to-peer engine for binary networking, service discovery and async storage.',
        stack: ['Rust', 'gRPC', 'P2P'],
        url: 'https://github.com/BSSE23029/portunus',
        caseStudy: {
          label: 'Systems architecture',
          problem: 'Peer-to-peer infrastructure has to coordinate discovery, binary transport and asynchronous storage without hiding the system boundaries.',
          approach: 'Designed a reusable Rust engine around gRPC control, binary networking, service discovery and async storage components.',
          result: 'A focused systems build that exposes the infrastructure path instead of burying it behind a single application surface.',
        },
      },
      {
        id: 'hotel-management',
        eyebrow: 'Full-stack web',
        domain: 'Full-stack',
        title: 'Hotel Management Systems',
        description: 'A structured management workflow spanning React, Node.js, PostgreSQL and AWS-oriented deployment work.',
        stack: ['React', 'Node.js', 'PostgreSQL'],
        url: 'https://github.com/BSSE23029/DBMS-HMS-PROJECT',
        caseStudy: {
          label: 'Full-stack web',
          problem: 'Operational management software has to keep structured records, server workflows and user-facing screens aligned.',
          approach: 'Connected React interfaces to Node.js services and PostgreSQL data workflows, with deployment work shaped around AWS-oriented infrastructure.',
          result: 'A full-stack implementation that treats data management and interaction design as one connected workflow.',
        },
      },
    ],
  },

  experience: [
    {
      role: 'Flutter Developer Intern',
      organization: 'Granjur Technologies',
      period: 'Jun — Aug 2025',
      detail: '3 months · Production mobile development',
    },
  ],

  profileFacts: [
    { label: 'Scale shipped', value: '50 KSLOC', detail: 'Production mobile codebase' },
    { label: 'Education', value: 'BS Software Engineering', detail: '2023 — Present' },
    { label: 'GitHub', value: 'Public profile', detail: 'BSSE23029 profile', url: 'https://github.com/BSSE23029' },
    {
      label: 'Research',
      value: 'IEEE ICIC · 2025',
      detail: 'Published paper ↗',
      url: 'https://doi.org/10.1109/ICIC68258.2025.11413008',
    },
  ],

  githubBuilds: [
    {
      period: 'Current build',
      title: 'Chess-Go',
      detail: 'Rules-first Go library, classical engine, terminal UI and versioned network matches.',
      url: 'https://github.com/bsse23029/chess-go',
    },
    {
      period: 'Systems',
      title: 'Portunus P2P Engine',
      detail: 'Rust peer-to-peer engine for binary networking, service discovery and async storage.',
      url: 'https://github.com/BSSE23029/portunus',
    },
    {
      period: 'Network tooling',
      title: 'Passive Traffic Dissector',
      detail: 'Go protocol decoding, HTTP inspection, PCAP replay and structured evidence.',
      url: 'https://github.com/BSSE23029/netscope',
    },
    {
      period: 'Flutter · mobile tooling',
      title: 'Roxum IDE',
      detail: 'A mobile-first Flutter code editor with terminal workflows, Git/GitHub tooling, AI assistance and a Rust-backed editor engine.',
      url: 'https://github.com/BSSE23029/roxum-ide',
    },
    {
      period: 'Low-level systems',
      title: 'RISC-V Gradebook',
      detail: 'Freestanding RV32IM assembly with raw Linux syscalls, bounded buffers and QEMU/RARS targets.',
      url: 'https://github.com/BSSE23029/riscv-gradebook',
    },
    {
      period: 'Applied AI · HCI',
      title: 'Drowsiness Detection Pipeline',
      detail: 'Edge-compatible driver monitoring with MediaPipe face mesh, MobileNetV2, geometric EAR, low-light reliability and temporal alarm escalation.',
      url: 'https://github.com/BSSE23029/dowsiness_hci',
    },
  ],

  socials: [
    { label: 'GitHub', url: 'https://github.com/bsse23029' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mukarram-raza-4599762ab/' },
    { label: 'Scholar', url: 'https://scholar.google.com/citations?user=0gtxh8EAAAAJ&hl=en' },
    { label: 'Website', url: 'https://razadev.pages.dev' },
  ],

  cv: {
    name: 'Muhammad Mukarram Raza',
    role: 'Software Engineer',
    location: 'Lahore, Pakistan',
    pdf: '/muhammad-mukarram-raza-cv.pdf',
    github: 'https://github.com/BSSE23029',
    linkedin: 'https://www.linkedin.com/in/mukarram-raza-4599762ab/',
    summary: 'Software Engineer focused on Flutter mobile development, TypeScript/NestJS backends, and applied AI. Comfortable moving between user-facing product work and the systems that support it.',
    highlights: [
      { label: 'Focus', value: 'Flutter · TypeScript/NestJS · Applied AI' },
      { label: 'Experience', value: 'Flutter Developer Intern · Granjur Technologies · 3 months · Jun — Aug 2025' },
      { label: 'Education', value: 'BS Software Engineering · 2023 — Present' },
      { label: 'Research', value: 'IEEE ICIC 2025 · 98.53% accuracy · 97.54% MCC' },
    ],
    sections: [
      {
        title: 'Core toolkit',
        items: ['Dart, Python, C/C++, JavaScript, SQL', 'Flutter, REST APIs, React, Node.js, NestJS', 'CNNs, RNNs, transfer learning, computer vision', 'AWS Lambda, API Gateway, DynamoDB, S3, Docker', 'PostgreSQL, MySQL, MongoDB, SQLite', 'Git, Bash, Ubuntu/WSL, VS Code, JetBrains'],
      },
      {
        title: 'Selected work',
        items: ['Serverless URL Shortener', 'Multilingual Reading & Search', 'Chess-Go', 'Tuberculosis Classification Pipeline', 'Passive Traffic Dissector', 'Traceable PDF Agents', 'Portunus P2P Engine'],
      },
      {
        title: 'Research & study',
        items: ['An Experimental Study for Tuberculosis Classification Using Efficient VGG16 Transfer Learning Pipeline', '2025 6th International Conference on Innovative Computing (ICIC)', 'Relevant study: OOP, DSA, operating systems, databases, AI/ML, cloud computing and HCI'],
      },
    ],
  },
};
