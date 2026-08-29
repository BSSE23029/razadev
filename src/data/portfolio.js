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
        description: 'Authentication, MFA, analytics and optimistic interactions backed by AWS.',
        stack: ['Flutter', 'Dart', 'AWS'],
        url: 'https://github.com/BSSE23029/aws_url_shortner',
      },
      {
        eyebrow: 'Cross-platform',
        title: 'Multilingual Reader',
        description: 'Audio, localization, bookmarks and vector search across languages.',
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
        stack: ['Python', 'Redis', 'Langfuse'],
        url: 'https://github.com/BSSE23029/langchain_pdf_tracibility',
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
  ],
};
