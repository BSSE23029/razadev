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
        eyebrow: 'Featured build · 2025',
        title: 'Serverless URL Shortener',
        description: 'A cross-platform client with authentication, MFA, dashboards, URL analytics and optimistic UI on a serverless AWS architecture.',
        stack: ['Flutter', 'Dart', 'AWS'],
        url: 'https://github.com/BSSE23029/aws_url_shortner',
      },
      {
        eyebrow: 'Cross-platform',
        title: 'Multilingual Reading & Search',
        description: 'A reading app with audio, bookmarks and localization across 128 languages, with vectorised search powered by Rust.',
        stack: ['Flutter', 'Rust', 'Cloudflare'],
        url: 'https://github.com/BSSE23029/Quran',
      },
    ],
    signal: [
      {
        eyebrow: 'Network tooling · Go',
        meta: 'TCP/IP',
        title: 'Passive Traffic Dissector',
        description: 'Layer-by-layer protocol decoding, HTTP inspection, PCAP replay, structured JSONL output, and golden tests.',
        stack: ['Go', 'PCAP', 'TCP/IP'],
        featured: true,
        url: 'https://github.com/BSSE23029/netscope',
      },
      {
        eyebrow: 'Medical AI · Research',
        meta: 'IEEE ICIC · 2025',
        title: 'Tuberculosis Classification Pipeline',
        description: 'A reproducible VGG16 transfer-learning pipeline for three-class chest X-ray classification, reporting 98.53% accuracy and 97.54% MCC.',
        stack: ['Python', 'TensorFlow', 'Keras'],
        url: 'https://github.com/BSSE23029/VGG16-Transfer-Learning',
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
    { label: 'Scale shipped', value: '50K+ lines', detail: 'Production mobile codebase' },
    { label: 'Education', value: 'BS Software Engineering', detail: '2023 — Present' },
    { label: 'GitHub', value: '93 public repos', detail: 'BSSE23029 profile', url: 'https://github.com/BSSE23029' },
    {
      label: 'Research',
      value: 'IEEE ICIC · 2025',
      detail: 'Published paper ↗',
      url: 'https://doi.org/10.1109/ICIC68258.2025.11413008',
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
        items: ['Serverless URL Shortener', 'Multilingual Reading & Search', 'Tuberculosis Classification Pipeline', 'Passive Traffic Dissector', 'Traceable PDF Agents', 'Portunus P2P Engine'],
      },
      {
        title: 'Research & study',
        items: ['An Experimental Study for Tuberculosis Classification Using Efficient VGG16 Transfer Learning Pipeline', '2025 6th International Conference on Innovative Computing (ICIC)', 'Relevant study: OOP, DSA, operating systems, databases, AI/ML, cloud computing and HCI'],
      },
    ],
  },
};
