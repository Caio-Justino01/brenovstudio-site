import type { StoryScrollSettings } from '../lib/storyMotion';

export type ServiceId = 'vfx' | 'edit' | 'shot' | 'art';

export type ProjectMedia = {
  kind: 'image' | 'video';
  src: string;
  alt: string;
  width: number;
  height: number;
  poster?: string;
};

export type Project = {
  id: string;
  title: string;
  format: 'Fotografia' | 'Vídeo' | 'Arte visual';
  cover: ProjectMedia;
  services: ServiceId[];
  media: ProjectMedia[];
  credits?: string;
  sourceUrl?: string;
  temporary?: boolean;
};

export const site = {
  name: 'Breno',
  studioName: 'Bemov Studio',
  location: 'Belo Horizonte, MG',
  tagline: 'Creativity Forge',
  logo: '/media/brand/studio-logo.jpeg',
  instagram: 'https://www.instagram.com/brenobe.mov/',
  studioInstagram: 'https://www.instagram.com/bemovstudio/',
  whatsappNumber: null as string | null,
};

export const titleHighlights = ['Breno', 'História', 'Portfólio', 'Orçamento'] as const;

export const services = [
  { id: 'vfx', label: 'VFX', shortLabel: 'Efeitos visuais', description: 'Efeitos e composição visual.' },
  { id: 'edit', label: 'EDIT', shortLabel: 'Edição', description: 'Montagem e edição de vídeo.' },
  { id: 'shot', label: 'SHOT', shortLabel: 'Captação', description: 'Captação de foto e vídeo.' },
  { id: 'art', label: 'ART', shortLabel: 'Arte visual', description: 'Criação visual.' },
] as const;

export const quoteContent = {
  title: 'Fazer orçamento', intro: 'Organize sua ideia e prepare um briefing para conversar com Breno.',
  servicesTitle: 'O que você precisa?', servicesHint: 'Você pode escolher mais de um serviço.',
  detailsTitle: 'Sobre o projeto', submit: 'Preparar briefing', submitHint: 'Você revisa tudo antes de enviar.',
} as const;

export const about = {
  facts: {
    label: 'Sobre o trabalho', base: 'Belo Horizonte, MG', reach: 'Projetos em todo o Brasil',
    more: 'Saiba mais', less: 'Mostrar menos', resultsLabel: 'Resultados', servicesLabel: 'Áreas de atuação',
  },
  contact: {
    quote: 'Fazer orçamento',
    profiles: ['Instagram de Breno', 'Bemov Studio'],
  },
  presentation: {
    invitation: 'Conheça um pouco da minha história.',
    label: 'Apresentação de Breno',
    scroll: {
      distanceRatio: 1.15, minDistance: 600, maxDistance: 1000, inset: 24, scrub: .45,
      eyes: [.32, .72], invitation: [.40, .53], identity: [.57, .71],
      light: { appear: [.57, .72], fade: [.78, .98] },
    } satisfies StoryScrollSettings,
  },
  firstName: 'Breno',
  lastName: 'Estevam',
  lines: ['Fotografia e audiovisual.', 'Artistas, eventos e criação visual.'],
  scene: {
    open: '/media/portrait/breno-original-clean-preview.png', closed: '/media/portrait/breno-original-rest.png',
    width: 1241, height: 1268,
    eyeLights: [{ x: 36.7, y: 55.3 }, { x: 63.5, y: 55.3 }],
    alt: 'Olhos de Breno sob a iluminação azul da fotografia original, cercados pelo preto',
    credits: 'Limpeza leve com IA da fotografia fornecida pelo usuário, aprovada em 18/10/2026. Quadro de olhos fechados gerado para a interação.',
    source: '/media/portrait/breno-original-source.png',
  },
  results: [
    { value: '+200', label: 'projetos entregues' },
    { value: '+5', label: 'anos de experiência' },
  ],
  profileLabel: 'Conheça Breno no Instagram',
  portrait: { src: '/media/portrait/breno-historia.webp', alt: 'Retrato de Breno com o rosto parcialmente coberto sob luz azul', width: 1254, height: 1254,
    sourceUrl: '/media/portrait/breno-historia.webp', temporary: false },
  featuredWork: { src: '/media/projects/dops-ensaio.webp', alt: 'Silhueta de Dops em ensaio criativo de Breno',
    width: 1080, height: 720, caption: 'Ensaio criativo com @dopszin',
    sourceUrl: 'https://www.instagram.com/brenobe.mov/p/DceenYRG_hj/', temporary: true },
} as const;

export type PreviewMedia = {
  media: ProjectMedia; title: string; credits?: string; sourceUrl: string; temporary: boolean; portrait?: boolean; logo?: boolean; closedSrc?: string;
};
type SectionPreview = {
  id: string; label: string; title: string; variant: 'folder' | 'production';
  preview: { items: readonly PreviewMedia[]; detail: string; note: string };
};
export const sections = [
  { id: 'historia', label: 'Ver história', title: 'História', variant: 'folder', preview: {
    items: [{ media: { kind: 'image', src: about.scene.open, alt: about.scene.alt, width: about.scene.width, height: about.scene.height }, closedSrc: about.scene.closed, title: 'Breno Estevam', credits: about.scene.credits, sourceUrl: about.scene.source, temporary: false, portrait: true }],
    detail: 'Breno Estevam. Audiovisual.', note: '',
  } },
  { id: 'portfolio', label: 'Ver portfólio', title: 'Portfólio', variant: 'folder', preview: {
    items: [
      { media: { kind: 'image', src: '/media/projects/dops-ensaio.webp', alt: 'Ensaio criativo com Dops', width: 1080, height: 720 }, title: 'Dops', credits: 'Ensaio criativo de Breno com @dopszin.', sourceUrl: about.featuredWork.sourceUrl, temporary: true },
      { media: { kind: 'image', src: '/media/projects/clandestina-1.webp', alt: 'Fotografia na Clandestina', width: 1080, height: 798 }, title: 'Clandestina', credits: 'Registros fotográficos de Breno na Clandestina.', sourceUrl: 'https://www.instagram.com/brenobe.mov/p/DbBA5_5kXxb/', temporary: true },
      { media: { kind: 'image', src: '/media/projects/mascara.jpg', alt: 'Composição de Peppnx', width: 640, height: 640 }, title: 'Peppnx', credits: 'Publicação de Breno com Peppnx. Créditos na publicação original.', sourceUrl: 'https://www.instagram.com/brenobe.mov/p/DcJwDTrtpYk/', temporary: true },
    ], detail: 'Fotografia, edição e arte visual.', note: 'Mais projetos',
  } },
  { id: 'orcamento', label: 'Fazer orçamento', title: 'Orçamento', variant: 'production', preview: {
    items: [],
    detail: 'Um evento, um lançamento ou uma ideia visual. Conte o que você quer criar.', note: '',
  } },
] as const satisfies readonly SectionPreview[];

export const productionPreview = {
  brand: site.studioName, accessibleName: 'Orçamento do Bemov Studio', question: 'O que você precisa?',
  hint: 'Você pode escolher mais de um serviço', cta: 'Continuar orçamento',
  projectIds: ['dops', 'clandestina', 'peppnx-capa'],
  choices: [
    { id: 'shot', label: 'Captação' }, { id: 'edit', label: 'Edição' },
    { id: 'vfx', label: 'VFX' }, { id: 'art', label: 'Arte visual' },
  ],
} as const satisfies { brand: string; accessibleName: string; question: string; hint: string; cta: string; projectIds: readonly string[]; choices: readonly { id: ServiceId; label: string }[] };

export const navigationItems = [
  { id: 'inicio', label: 'Início', menuLabel: 'Início', headerLabel: 'Início', header: false },
  { id: 'indice', label: 'Índice', menuLabel: 'Índice', headerLabel: 'Índice', header: false },
  ...sections.map(section => ({ id: section.id, label: section.id === 'orcamento' ? section.label : section.title,
    menuLabel: section.label, headerLabel: section.title, header: true })),
] as const;

export const footerContent = {
  credit: { prefix: 'Desenvolvido por', name: 'Roupla', href: 'https://roupla.com.br/' },
  navigationTitle: 'Navegação', contactTitle: 'Contato',
  contacts: [
    { label: 'Instagram do estúdio', handle: '@bemovstudio', href: site.studioInstagram },
    { label: 'Instagram de Breno', handle: '@brenobe.mov', href: site.instagram },
  ],
} as const;

const photo = (src: string, alt: string, width: number, height: number): ProjectMedia => ({ kind: 'image', src, alt, width, height });

export const projects: Project[] = [
  {
    id: 'dops', title: 'Dops', format: 'Fotografia', services: ['shot'],
    cover: photo('/media/projects/dops-ensaio.webp', 'Silhueta de Dops em ensaio criativo', 1080, 720),
    media: [photo('/media/projects/dops-ensaio.webp', 'Silhueta de Dops em ensaio criativo', 1080, 720),
      photo('/media/projects/dops-ensaio-2.webp', 'Dops de boné e óculos em outra imagem do ensaio', 1080, 720)],
    credits: 'Ensaio criativo de Breno com @dopszin.',
    sourceUrl: 'https://www.instagram.com/brenobe.mov/p/DceenYRG_hj/', temporary: true,
  },
  {
    id: 'peppnx-capa', title: 'Peppnx', format: 'Arte visual', services: ['art'],
    cover: photo('/media/projects/mascara.jpg', 'Composição de Peppnx com máscaras em preto e branco', 640, 640),
    media: [photo('/media/projects/mascara.jpg', 'Composição de Peppnx com máscaras em preto e branco', 640, 640)],
    credits: 'Publicação de Breno com Peppnx. Créditos na publicação original.',
    sourceUrl: 'https://www.instagram.com/brenobe.mov/p/DcJwDTrtpYk/', temporary: true,
  },
  {
    id: 'kayg', title: 'KayG', format: 'Vídeo', services: ['edit'],
    cover: photo('/media/projects/kayg-palco.jpg', 'KayG no palco do Baile do Mago sob luz azul', 640, 480),
    media: [photo('/media/projects/kayg-palco.jpg', 'Capa do vídeo de KayG no Baile do Mago', 640, 480)],
    credits: 'Edição por Breno. Publicação de demarco.tv no Baile do Mago.',
    sourceUrl: 'https://www.instagram.com/demarco_tv/reel/DceagrSIrex/', temporary: true,
  },
  {
    id: 'tevito', title: 'Tevito', format: 'Vídeo', services: ['edit'],
    cover: photo('/media/projects/tevito-aftermovie.jpg', 'Capa do aftermovie do Baile do Mago', 640, 480),
    media: [photo('/media/projects/tevito-aftermovie.jpg', 'Capa do aftermovie de Tevito no Baile do Mago', 640, 480)],
    credits: 'Edição por Breno. Captação: @marquinhosptn, @andreycmuniz e @philipskkk.',
    sourceUrl: 'https://www.instagram.com/demarco_tv/reel/DcWrVbjIMZT/', temporary: true,
  },
  {
    id: 'clandestina', title: 'Clandestina', format: 'Fotografia', services: ['shot'],
    cover: photo('/media/projects/clandestina-1.webp', 'Registro de MC ao microfone na Clandestina no Viaduto Santa Tereza', 1080, 798),
    media: [photo('/media/projects/clandestina-1.webp', 'Registro de MC ao microfone na Clandestina', 1080, 798),
      photo('/media/projects/clandestina-2.webp', 'Público da Clandestina em fotografia em preto e branco', 1080, 798)],
    credits: 'Registros fotográficos de Breno na Clandestina, realizada com a MCD Brasil no Viaduto Santa Tereza.',
    sourceUrl: 'https://www.instagram.com/brenobe.mov/p/DbBA5_5kXxb/', temporary: true,
  },
  {
    id: 'lptzlatan', title: 'LPTZLATAN', format: 'Vídeo', services: ['edit'],
    cover: photo('/media/projects/lptzlatan-palco.jpg', 'Luzes e plateia no show de LPTZLATAN', 360, 640),
    media: [photo('/media/projects/lptzlatan-palco.jpg', 'Capa do vídeo de LPTZLATAN no Baile do Mago', 360, 640)],
    credits: 'Edição por Breno. Publicação de demarco.tv no Baile do Mago.',
    sourceUrl: 'https://www.instagram.com/demarco_tv/reel/DcjUCjqRKaZ/', temporary: true,
  },
];

export const portfolioShowcase = {
  title: 'Portfólio', openLabel: 'Ver projeto',
  pauseLabel: 'Pausar prévias', resumeLabel: 'Retomar prévias',
  unavailableLabel: 'Prévia indisponível. Abra o projeto para ver os detalhes.',
  intervalMs: 5000, resumeMs: 4000, transitionMs: 650,
  items: [
    { projectId: 'clandestina', position: '50% 48%', mobilePosition: '48% 50%' },
    { projectId: 'dops', position: '50% 46%', mobilePosition: '57% 50%' },
    { projectId: 'peppnx-capa', position: '50% 45%', mobilePosition: '50% 42%' },
  ],
} as const satisfies {
  title: string; openLabel: string; pauseLabel: string; resumeLabel: string; unavailableLabel: string;
  intervalMs: number; resumeMs: number; transitionMs: number;
  items: readonly { projectId: string; position: string; mobilePosition: string }[];
};
