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
        meta: 'TCP/IP',
        title: 'Passive Traffic Dissector',
        description: 'Layer-by-layer protocol decoding, HTTP inspection, PCAP replay, structured JSONL output, and golden tests.',
        stack: ['Go', 'PCAP', 'TCP/IP'],
        featured: true,
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
        meta: 'Rules · Engine · Network',
        title: 'Chess-Go',
        description: 'A dependency-light Go chess toolkit combining a rules-first library, classical alpha-beta search, a responsive terminal UI, versioned network matches and deterministic tournaments.',
        stack: ['Go', 'Alpha-beta', 'HTTP/WebSocket', 'TUI'],
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
        eyebrow: 'Service architecture',
        title: 'TypeScript Backend',
        description: 'Decorators, controllers, middleware and service-oriented modules.',
        stack: ['TypeScript', 'NestJS', 'Node'],
        url: 'https://github.com/BSSE23029/ts_server_decorators',
      },
      {
        eyebrow: 'Traceable workflows',
        title: 'Document Agents',
        description: 'Worker processes, Redis, vector retrieval and tracing integrations.',
        stack: ['Python', 'LangChain', 'Redis', 'Langfuse'],
        url: 'https://github.com/BSSE23029/langchain_pdf_tracibility',
      },
      {
        eyebrow: 'Systems architecture · Rust',
        title: 'Portunus P2P Engine',
        description: 'A high-performance, gRPC-controlled peer-to-peer engine for binary networking, service discovery and async storage.',
        stack: ['Rust', 'gRPC', 'P2P'],
        url: 'https://github.com/BSSE23029/portunus',
      },
      {
        eyebrow: 'Full-stack web',
        title: 'Hotel Management Systems',
        description: 'A structured management workflow spanning React, Node.js, PostgreSQL and AWS-oriented deployment work.',
        stack: ['React', 'Node.js', 'PostgreSQL'],
        url: 'https://github.com/BSSE23029/DBMS-HMS-PROJECT',
      },
    ],
  },

  experience: [
    {
      role: 'Flutter Developer Intern',
      organization: 'Granjur Technologies',
      period: 'Jun — Aug 2025',
      detail: 'Production mobile development',
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
      period: 'Low-level systems',
      title: 'RISC-V Gradebook',
      detail: 'Freestanding RV32IM assembly with raw Linux syscalls, bounded buffers and QEMU/RARS targets.',
      url: 'https://github.com/BSSE23029/riscv-gradebook',
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
      { label: 'Experience', value: 'Flutter Developer Intern · Granjur Technologies · Jun — Aug 2025' },
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
