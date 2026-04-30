import type { TopicCategory } from '@/types/event';

// Keyword lists are scored: exact word match scores higher than substring match.
// The category with the highest cumulative score wins.

const TOPIC_KEYWORDS: Record<TopicCategory, string[]> = {
  'AI & Machine Learning': [
    'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
    'neural networks', 'computer vision', 'natural language processing', 'nlp',
    'reinforcement learning', 'large language model', 'llm', 'foundation model',
    'generative ai', 'generative model', 'diffusion model', 'transformer',
    'bert', 'gpt', 'chatgpt', 'alignment', 'ai safety', 'fairness',
    'explainable ai', 'xai', 'robotic', 'autonomous driving', 'autonomous vehicle',
    'recommendation system', 'conversational ai', 'multimodal', 'speech recognition',
    'language model', 'pre-trained', 'fine-tuning', 'prompt engineering',
    'ai ethics', 'responsible ai', 'trustworthy ai', 'interpretability',
    'hallucination', 'rlhf', 'proximal policy', 'reward model',
    'ai for science', 'scientific discovery ai', 'drug discovery ai',
    'protein structure', 'alphafold', 'copilot', 'code generation',
  ],
  'Computer Science': [
    'algorithm', 'algorithms', 'complexity', 'distributed systems',
    'database', 'databases', 'networking', 'network protocol',
    'cybersecurity', 'security', 'cryptography', 'zero-knowledge',
    'programming language', 'compiler', 'operating system', 'cloud computing',
    'quantum computing', 'hardware', 'chip design', 'semiconductor',
    'embedded systems', 'blockchain', 'web development', 'mobile computing',
    'systems software', 'formal verification', 'program analysis',
    'data structure', 'graph theory', 'combinatorics', 'information theory',
    'human-computer interaction', 'hci', 'user interface', 'software engineering',
    'memory', 'cache', 'processor', 'parallel computing', 'gpu',
    'internet', 'protocol', 'peer-to-peer', 'cloud', 'edge computing',
    'iot', 'internet of things', 'fpga', 'vlsi', 'computer architecture',
  ],
  'Medicine & Health': [
    'medicine', 'medical', 'clinical', 'patient', 'disease', 'cancer',
    'oncology', 'genomics', 'proteomics', 'drug discovery', 'pharmaceutical',
    'therapy', 'therapeutics', 'treatment', 'diagnosis', 'neurology', 'cardiology',
    'epidemiology', 'public health', 'nursing', 'surgery', 'radiology',
    'pathology', 'immunology', 'vaccination', 'crispr', 'gene editing',
    'gene therapy', 'cell therapy', 'biomarker', 'clinical trial',
    'neurodegenerative', 'alzheimer', 'parkinson', 'microbiome',
    'precision medicine', 'personalized medicine', 'wearable health',
    'digital health', 'telemedicine', 'mental health', 'psychiatry',
    'pediatrics', 'geriatrics', 'global health', 'infectious disease',
    'antibiotic', 'pandemic', 'vaccine', 'mri', 'imaging', 'genomic medicine',
  ],
  'Business & Economics': [
    'economics', 'economy', 'market', 'startup', 'entrepreneurship',
    'venture capital', 'investment', 'finance', 'fintech', 'banking',
    'strategy', 'management', 'leadership', 'supply chain',
    'marketing', 'consumer behavior', 'behavioral economics',
    'macroeconomics', 'labor market', 'labor economics', 'productivity',
    'innovation', 'competition', 'antitrust', 'regulation policy',
    'digital economy', 'platform economy', 'gig economy', 'trade',
    'globalization', 'development economics', 'growth', 'inequality',
    'founder', 'ceo', 'board', 'corporate governance', 'merger',
    'acquisition', 'ipo', 'private equity', 'hedge fund', 'recession',
  ],
  'Law & Policy': [
    'law', 'legal', 'policy', 'regulation', 'legislation', 'court',
    'constitutional', 'civil rights', 'privacy', 'intellectual property',
    'patent', 'copyright', 'antitrust law', 'international law',
    'human rights', 'justice', 'governance', 'democracy', 'election',
    'treaty', 'contract', 'liability', 'tort', 'criminal law',
    'regulatory', 'compliance', 'data protection', 'gdpr',
    'congressional', 'senate', 'judicial', 'supreme court',
    'geopolitics', 'foreign policy', 'national security', 'defense policy',
    'technology law', 'ai regulation', 'ai governance',
  ],
  'Physics & Mathematics': [
    'physics', 'quantum', 'quantum mechanics', 'cosmology', 'astrophysics',
    'relativity', 'particle physics', 'condensed matter', 'materials science',
    'optics', 'photonics', 'thermodynamics', 'statistical mechanics',
    'mathematics', 'algebra', 'geometry', 'topology', 'analysis',
    'probability', 'statistics', 'number theory', 'combinatorics math',
    'differential equations', 'stochastic', 'optimization', 'convex',
    'dark matter', 'dark energy', 'gravitational wave', 'ligo',
    'superconductor', 'quantum field theory', 'string theory',
    'higgs boson', 'collider', 'telescope', 'galaxy', 'black hole',
    'neutron star', 'exoplanet', 'astro', 'plasma', 'nuclear',
  ],
  'Social Sciences': [
    'psychology', 'cognitive science', 'sociology', 'anthropology',
    'political science', 'communication', 'education', 'urban planning',
    'demography', 'criminology', 'social work', 'immigration',
    'race', 'gender', 'identity', 'inequality', 'poverty',
    'social media', 'misinformation', 'polarization', 'media',
    'journalism', 'survey', 'experiment social', 'field experiment',
    'behavioral', 'decision making', 'cognitive bias', 'attention',
    'social network', 'community', 'society', 'culture',
    'public opinion', 'voter', 'deliberative', 'civic',
  ],
  'Humanities & Arts': [
    'history', 'philosophy', 'literature', 'art', 'music', 'film',
    'theater', 'architecture', 'design', 'linguistics', 'language',
    'religion', 'classics', 'archaeology', 'ethics', 'moral',
    'narrative', 'poetry', 'visual art', 'digital humanities',
    'humanities', 'cultural heritage', 'manuscript', 'translation',
    'memoir', 'biography', 'intellectual history', 'political philosophy',
    'continental philosophy', 'analytic philosophy', 'epistemology',
    'metaphysics', 'aesthetics', 'rhetoric', 'posthumanism',
  ],
  'Environment & Climate': [
    'climate', 'climate change', 'environment', 'sustainability',
    'energy', 'renewable energy', 'solar energy', 'wind energy',
    'carbon', 'emissions', 'conservation', 'ecology', 'biodiversity',
    'ocean', 'atmosphere', 'weather', 'natural resources', 'green',
    'clean energy', 'decarbonization', 'net zero', 'carbon capture',
    'electric vehicle', 'energy storage', 'battery', 'grid',
    'water', 'wildfire', 'drought', 'flood', 'extreme weather',
    'deforestation', 'land use', 'agriculture sustainability',
    'circular economy', 'waste', 'pollution', 'ecosystem',
  ],
  Other: [],
};

// Normalize text for comparison
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Score a text against a keyword list
function scoreText(text: string, keywords: string[]): number {
  const normalized = normalize(text);
  let score = 0;
  for (const kw of keywords) {
    if (normalized.includes(kw)) {
      // Longer keyword matches get higher score (more specific)
      score += kw.split(' ').length;
    }
  }
  return score;
}

export function categorize(title: string, description: string, tags: string[] = []): TopicCategory {
  const fullText = [title, description, ...tags].join(' ');
  let best: TopicCategory = 'Other';
  let bestScore = 0;

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS) as [TopicCategory, string[]][]) {
    if (topic === 'Other') continue;
    const score = scoreText(fullText, keywords);
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }

  return best;
}
