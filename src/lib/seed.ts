import type {
  AppUser,
  Challenge,
  Criterion,
  FormField,
  Funnel,
  Idea,
  LogEntry,
  Objective,
  Program,
  StageConfig,
} from "./types";
import coverLogistica from "@/assets/cover-logistica.jpg";
import coverFrota from "@/assets/cover-frota.jpg";
import coverAtendimento from "@/assets/cover-atendimento.jpg";
import coverNegocios from "@/assets/cover-negocios.jpg";

export const AREAS = [
  "Tecnologia",
  "Operações",
  "Comercial",
  "Recursos Humanos",
  "Financeiro",
  "Marketing",
  "Jurídico",
];

export const USERS: AppUser[] = [
  { id: "u1", name: "Evelyn Monteiro", area: "Tecnologia", role: "admin" },
  { id: "u2", name: "Rafael Andrade", area: "Operações", role: "gestor" },
  { id: "u3", name: "Camila Torres", area: "Comercial", role: "usuario" },
  { id: "u4", name: "Bruno Salgado", area: "Tecnologia", role: "usuario" },
  { id: "u5", name: "Larissa Pinho", area: "Recursos Humanos", role: "avaliador" },
  { id: "u6", name: "Diego Ferraz", area: "Financeiro", role: "comite" },
  { id: "u7", name: "Marina Bastos", area: "Marketing", role: "avaliador" },
];

export const FIXED_FIELDS_NOTE =
  "Título, descrição, link e anexos são fixos em todo formulário.";

const f = (id: string, label: string, type: FormField["type"], options: string[] = [], required = false): FormField => ({
  id,
  label,
  type,
  options,
  required,
});

const funnelP1: Funnel = {
  stages: [
    {
      id: "s1",
      name: "Triagem inicial",
      mechanism: "gate",
      readiness: "Gestor confirmou aderência da ideia ao desafio",
      ownerId: "u2",
      defaultDays: 3,
      classificationOptions: [],
    },
    {
      id: "s2",
      name: "Avaliação técnica",
      mechanism: "nota",
      readiness: "3 de 3 avaliadores concluíram",
      ownerId: "u2",
      defaultDays: 7,
      classificationOptions: [],
    },
    {
      id: "s3",
      name: "Classificação",
      mechanism: "classificacao",
      readiness: "Comitê registrou a classificação",
      ownerId: "u1",
      defaultDays: 5,
      classificationOptions: ["Quick win", "Projeto"],
    },
    {
      id: "s4",
      name: "Refinamento",
      mechanism: "revisao",
      readiness: "Autor entregou a versão revisada",
      ownerId: "u2",
      defaultDays: 10,
      classificationOptions: [],
    },
    {
      id: "s5",
      name: "Comitê decisor",
      mechanism: "gate",
      readiness: "Comitê deliberou e registrou a decisão",
      ownerId: "u1",
      defaultDays: 7,
      classificationOptions: [],
    },
  ],
  transitions: [
    { id: "t1", fromId: "s1", toId: "s2", condition: "" },
    { id: "t2", fromId: "s2", toId: "s3", condition: "" },
    { id: "t3", fromId: "s3", toId: "s4", condition: 'Classificação = "Projeto"' },
    { id: "t4", fromId: "s3", toId: "s5", condition: 'Classificação = "Quick win"' },
    { id: "t5", fromId: "s4", toId: "s5", condition: "" },
  ],
};

const funnelP2: Funnel = {
  stages: [
    {
      id: "e1",
      name: "Triagem",
      mechanism: "gate",
      readiness: "Ideia revisada pelo time de experiência",
      ownerId: "u6",
      defaultDays: 2,
      classificationOptions: [],
    },
    {
      id: "e2",
      name: "Avaliação de impacto",
      mechanism: "nota",
      readiness: "2 de 2 avaliadores concluíram",
      ownerId: "u6",
      defaultDays: 5,
      classificationOptions: [],
    },
    {
      id: "e3",
      name: "Decisão",
      mechanism: "gate",
      readiness: "Comitê deliberou",
      ownerId: "u1",
      defaultDays: 5,
      classificationOptions: [],
    },
  ],
  transitions: [
    { id: "te1", fromId: "e1", toId: "e2", condition: "" },
    { id: "te2", fromId: "e2", toId: "e3", condition: "" },
  ],
};

const funnelP3: Funnel = {
  stages: [
    {
      id: "x1",
      name: "Análise executiva",
      mechanism: "revisao",
      readiness: "Parecer do comitê executivo registrado",
      ownerId: "u1",
      defaultDays: 15,
      classificationOptions: [],
    },
  ],
  transitions: [],
};

export const seedPrograms: Program[] = [
  {
    id: "p1",
    name: "Programa Eficiência Operacional 2026",
    context:
      "Programa corporativo focado em reduzir custos e retrabalho nas operações de campo, com ciclos trimestrais de avaliação.",
    documentName: "diretrizes-operacao-2026.pdf",
    resourceAmount: 750000,
    resourceCurrency: "BRL",
    resourceNote: "Verba aprovada pelo comitê para pilotos e provas de conceito.",
    audience: { mode: "areas", areas: ["Operações", "Tecnologia"], userIds: [] },
    funnel: funnelP1,
    createdAt: "2026-01-12T13:00:00.000Z",
  },
  {
    id: "p2",
    name: "Inovação Aberta em Experiência do Cliente",
    context:
      "Busca soluções para elevar o NPS dos canais digitais, aberto a toda a companhia.",
    resourceAmount: 320000,
    resourceCurrency: "BRL",
    resourceNote: "Recurso destinado a experimentos rápidos de até 90 dias.",
    audience: { mode: "todos", areas: [], userIds: [] },
    funnel: funnelP2,
    createdAt: "2026-02-03T13:00:00.000Z",
  },
  {
    id: "p3",
    name: "Laboratório Confidencial de Novos Negócios",
    context:
      "Programa privado com participação restrita a um grupo selecionado de líderes.",
    resourceAmount: 1200000,
    resourceCurrency: "BRL",
    resourceNote: "Uso sujeito a aprovação do comitê executivo.",
    audience: { mode: "usuarios", areas: [], userIds: ["u1", "u2", "u6"] },
    funnel: funnelP3,
    createdAt: "2026-02-20T13:00:00.000Z",
  },
];

export const seedObjectives: Objective[] = [
  { id: "o1", name: "Reduzir custo operacional", description: "Diminuir em 15% o custo por ordem de serviço." },
  { id: "o2", name: "Elevar satisfação do cliente", description: "Aumentar o NPS dos canais digitais." },
  { id: "o3", name: "Acelerar time to market", description: "Encurtar o ciclo de lançamento de novos serviços." },
  { id: "o4", name: "Sustentabilidade", description: "Reduzir emissões e desperdício de materiais." },
  { id: "o5", name: "Novas fontes de receita", description: "Explorar modelos de negócio adjacentes." },
];

const critC1: Criterion[] = [
  { id: "cr1", stageId: "s2", name: "Impacto no custo", weight: 40, scaleMax: 10 },
  { id: "cr2", stageId: "s2", name: "Viabilidade técnica", weight: 35, scaleMax: 10 },
  { id: "cr3", stageId: "s2", name: "Originalidade", weight: 25, scaleMax: 10 },
];

const cfgC1: Record<string, StageConfig> = {
  s1: { consolidation: "media", evaluatorsNeeded: 1, vehicle: "Checagem interna do gestor" },
  s2: { consolidation: "ponderada", evaluatorsNeeded: 3, vehicle: "Formulário online + reunião de calibração" },
  s3: { consolidation: "individual", evaluatorsNeeded: 1, vehicle: "Reunião do comitê de classificação" },
  s4: { consolidation: "media", evaluatorsNeeded: 1, vehicle: "Sessão de refinamento com o autor" },
  s5: { consolidation: "media", evaluatorsNeeded: 1, vehicle: "Reunião de decisão com ata" },
};

const critC3: Criterion[] = [
  { id: "cr4", stageId: "e2", name: "Impacto no NPS", weight: 60, scaleMax: 10 },
  { id: "cr5", stageId: "e2", name: "Esforço de implantação", weight: 40, scaleMax: 5 },
];

const cfgC3: Record<string, StageConfig> = {
  e1: { consolidation: "media", evaluatorsNeeded: 1, vehicle: "Triagem por e-mail" },
  e2: { consolidation: "individual", evaluatorsNeeded: 2, vehicle: "Formulário online" },
  e3: { consolidation: "media", evaluatorsNeeded: 1, vehicle: "Reunião de decisão com ata" },
};

const emptyEval = {
  criteria: [] as Criterion[],
  stageConfigs: {} as Record<string, StageConfig>,
  evaluatorPoolIds: [] as string[],
  committeeIds: [] as string[],
};

export const seedChallenges: Challenge[] = [
  {
    id: "c1",
    programId: "p1",
    title: "Como reduzir deslocamentos improdutivos das equipes de campo?",
    context:
      "Hoje 22% das visitas técnicas terminam sem solução por falta de peça ou informação prévia.",
    coverUrl: coverLogistica,
    objectiveIds: ["o1", "o4"],
    formFields: [
      f("ff1", "Qual problema específico sua ideia resolve?", "longo", [], true),
      f("ff2", "Nível de maturidade", "unica", ["Conceito", "Protótipo", "Piloto rodando"], true),
      f("ff3", "Áreas impactadas", "multipla", ["Operações", "Tecnologia", "Suprimentos"]),
    ],
    kind: "pontual",
    deadline: "2026-11-30",
    ownerId: "u2",
    status: "aberto",
    createdAt: "2026-01-15T13:00:00.000Z",
    criteria: critC1,
    stageConfigs: cfgC1,
    evaluatorPoolIds: ["u5", "u7", "u6", "u2"],
    committeeIds: ["u1", "u6"],
  },
  {
    id: "c2",
    programId: "p1",
    title: "Manutenção preditiva na frota leve",
    context: "Buscamos formas de antecipar falhas mecânicas usando dados já coletados pela telemetria.",
    coverUrl: coverFrota,
    objectiveIds: ["o1"],
    formFields: [f("ff4", "Quais dados sua solução utiliza?", "curto", [], true)],
    kind: "continuo",
    ownerId: "u2",
    status: "pausado",
    createdAt: "2026-01-22T13:00:00.000Z",
    ...emptyEval,
    evaluatorPoolIds: ["u5", "u7"],
    committeeIds: ["u1"],
  },
  {
    id: "c3",
    programId: "p2",
    title: "Atendimento digital sem espera",
    context: "Reduzir o tempo médio de primeira resposta nos canais digitais para menos de 2 minutos.",
    coverUrl: coverAtendimento,
    objectiveIds: ["o2", "o3"],
    formFields: [
      f("ff5", "Como a ideia impacta o NPS?", "longo", [], true),
      f("ff6", "Precisa de integração com sistemas legados?", "unica", ["Sim", "Não", "Não sei"]),
    ],
    kind: "pontual",
    deadline: "2026-08-15",
    ownerId: "u6",
    status: "aberto",
    createdAt: "2026-02-05T13:00:00.000Z",
    criteria: critC3,
    stageConfigs: cfgC3,
    evaluatorPoolIds: ["u5", "u4", "u7"],
    committeeIds: ["u1", "u6"],
  },
  {
    id: "c4",
    programId: "p2",
    title: "Autoatendimento para segunda via de documentos",
    context: "Rascunho em construção pela equipe de experiência.",
    objectiveIds: ["o2"],
    formFields: [],
    kind: "continuo",
    ownerId: "u6",
    status: "rascunho",
    createdAt: "2026-02-18T13:00:00.000Z",
    ...emptyEval,
  },
  {
    id: "c5",
    programId: "p3",
    title: "Modelos de receita recorrente para serviços B2B",
    context: "Exploração confidencial de novas linhas de receita.",
    coverUrl: coverNegocios,
    objectiveIds: ["o5"],
    formFields: [f("ff7", "Qual o mercado-alvo?", "curto", [], true)],
    kind: "pontual",
    deadline: "2026-03-01",
    ownerId: "u1",
    status: "encerrado",
    createdAt: "2026-02-21T13:00:00.000Z",
    ...emptyEval,
    committeeIds: ["u1", "u6"],
  },
];

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number, hour = 12) => {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const seedIdeas: Idea[] = [

  {
    id: "i1",
    challengeId: "c1",
    title: "Checklist inteligente antes da visita",
    description:
      "Um roteiro gerado automaticamente com base no histórico do equipamento, enviado ao técnico na véspera.",
    link: "https://intranet.exemplo.com/ideias/checklist",
    attachments: ["fluxo-checklist.pdf"],
    answers: {
      ff1: "Falta de informação prévia sobre o equipamento na visita.",
      ff2: "Protótipo",
      ff3: ["Operações", "Tecnologia"],
    },
    formSnapshot: seedChallenges[0]!.formFields,
    authorId: "u4",
    createdAt: "2026-02-10T13:00:00.000Z",
    currentStageId: "s2",
    stageHistory: [
      { stageId: "s1", enteredAt: daysAgo(6), exitedAt: daysAgo(3), movedBy: "Rafael Andrade" },
      { stageId: "s2", enteredAt: daysAgo(3) },
    ],
    assignments: { s2: ["u5", "u7", "u6", "u1"] },
    evaluations: [
      {
        id: "ev1",
        stageId: "s2",
        evaluatorId: "u7",
        scores: { cr1: 8, cr2: 7, cr3: 6 },
        comment: "Boa relação entre esforço e ganho. Precisa detalhar a origem dos dados do histórico.",
        createdAt: "2026-02-15T18:00:00.000Z",
        edited: false,
        locked: false,
      },
    ],
    classifications: [],
  },
  {
    id: "i2",
    challengeId: "c1",
    title: "Estoque móvel compartilhado entre equipes",
    description: "Peças de alto giro ficam em um veículo itinerante que abastece as equipes na região.",
    link: "",
    attachments: [],
    answers: { ff1: "Ausência de peça no momento da visita.", ff2: "Conceito", ff3: ["Operações"] },
    formSnapshot: seedChallenges[0]!.formFields,
    authorId: "u3",
    createdAt: "2026-02-14T13:00:00.000Z",
    currentStageId: "s1",
    stageHistory: [{ stageId: "s1", enteredAt: "2026-02-14T13:00:00.000Z" }],
    assignments: {},
    evaluations: [],
    classifications: [],
  },
  {
    id: "i3",
    challengeId: "c3",
    title: "Triagem assistida no primeiro contato",
    description: "Classificação automática do assunto para encaminhar direto ao time certo.",
    link: "",
    attachments: ["mockup.png"],
    answers: { ff5: "Reduz o tempo de espera e o número de transferências.", ff6: "Sim" },
    formSnapshot: seedChallenges[2]!.formFields,
    authorId: "u7",
    createdAt: "2026-03-02T13:00:00.000Z",
    currentStageId: "e2",
    stageHistory: [
      { stageId: "e1", enteredAt: daysAgo(6), exitedAt: daysAgo(4), movedBy: "Diego Ferraz" },
      { stageId: "e2", enteredAt: daysAgo(4) },
    ],
    assignments: { e2: ["u5", "u4", "u1"] },
    evaluations: [
      {
        id: "ev2",
        stageId: "e2",
        evaluatorId: "u4",
        scores: { cr4: 9, cr5: 3 },
        comment: "Impacto alto no NPS, mas depende de integração com o legado.",
        createdAt: "2026-03-04T12:00:00.000Z",
        updatedAt: "2026-03-05T09:00:00.000Z",
        edited: true,
        locked: false,
      },
    ],
    classifications: [],
  },
  {
    id: "i4",
    challengeId: "c1",
    title: "Automação de checagem de estoque",
    description:
      "Sensores de RFID nas prateleiras enviando alerta automático quando o estoque de um item cai abaixo do mínimo, eliminando a contagem manual semanal.",
    link: "",
    attachments: [],
    answers: {
      ff1: "Contagem manual semanal atrasa o abastecimento das equipes de campo.",
      ff2: "Piloto rodando",
      ff3: ["Operações", "Suprimentos"],
    },
    formSnapshot: seedChallenges[0]!.formFields,
    authorId: "u3",
    createdAt: daysAgo(9),
    currentStageId: "s2",
    stageHistory: [
      { stageId: "s1", enteredAt: daysAgo(9), exitedAt: daysAgo(3), movedBy: "Rafael Andrade" },
      { stageId: "s2", enteredAt: daysAgo(3) },
    ],
    assignments: { s2: ["u1", "u5", "u7"] },
    evaluations: [],
    classifications: [],
  },
  {
    id: "i5",
    challengeId: "c3",
    title: "App de retorno de embalagens",
    description:
      "Aplicativo que agenda a coleta de embalagens retornáveis direto com o cliente, reduzindo viagens extras da frota.",
    link: "https://intranet.exemplo.com/ideias/retorno",
    attachments: ["estudo-retorno.pdf"],
    answers: {
      ff5: "Diminui o atrito no pós-venda e aumenta a percepção de sustentabilidade.",
      ff6: "Não",
    },
    formSnapshot: seedChallenges[2]!.formFields,
    authorId: "u4",
    createdAt: daysAgo(8),
    currentStageId: "e2",
    stageHistory: [
      { stageId: "e1", enteredAt: daysAgo(8), exitedAt: daysAgo(4), movedBy: "Diego Ferraz" },
      { stageId: "e2", enteredAt: daysAgo(4) },
    ],
    assignments: { e2: ["u1", "u5"] },
    evaluations: [],
    classifications: [],
  },
  {
    id: "i6",
    challengeId: "c1",
    title: "Rota otimizada de entregas",
    description:
      "Roteirizador que recalcula a sequência de visitas a cada hora considerando trânsito e prioridade do chamado.",
    link: "",
    attachments: [],
    answers: {
      ff1: "Deslocamentos longos entre chamados na mesma região.",
      ff2: "Protótipo",
      ff3: ["Operações", "Tecnologia"],
    },
    formSnapshot: seedChallenges[0]!.formFields,
    authorId: "u4",
    createdAt: daysAgo(12),
    currentStageId: "s2",
    stageHistory: [
      { stageId: "s1", enteredAt: daysAgo(12), exitedAt: daysAgo(5), movedBy: "Rafael Andrade" },
      { stageId: "s2", enteredAt: daysAgo(5) },
    ],
    assignments: { s2: ["u1", "u5", "u7"] },
    evaluations: [
      {
        id: "ev3",
        stageId: "s2",
        evaluatorId: "u1",
        scores: { cr1: 9, cr2: 8, cr3: 7 },
        comment: "Ganho claro de produtividade e implantação simples com a telemetria atual.",
        createdAt: daysAgo(0, 9),
        edited: false,
        locked: false,
      },
      {
        id: "ev4",
        stageId: "s2",
        evaluatorId: "u5",
        scores: { cr1: 9, cr2: 8, cr3: 7 },
        comment: "Alto impacto no custo por ordem de serviço.",
        createdAt: daysAgo(0, 10),
        edited: false,
        locked: false,
      },
    ],
    classifications: [],
  },
  {
    id: "i7",
    challengeId: "c1",
    title: "Padronização de embalagens de peças",
    description:
      "Kit único de embalagem para peças de alto giro, reduzindo perdas no transporte e tempo de separação.",
    link: "",
    attachments: [],
    answers: {
      ff1: "Perdas e retrabalho na separação de peças.",
      ff2: "Conceito",
      ff3: ["Suprimentos"],
    },
    formSnapshot: seedChallenges[0]!.formFields,
    authorId: "u3",
    createdAt: daysAgo(14),
    currentStageId: "s2",
    stageHistory: [
      { stageId: "s1", enteredAt: daysAgo(14), exitedAt: daysAgo(6), movedBy: "Rafael Andrade" },
      { stageId: "s2", enteredAt: daysAgo(6) },
    ],
    assignments: { s2: ["u1", "u5"] },
    evaluations: [
      {
        id: "ev5",
        stageId: "s2",
        evaluatorId: "u1",
        scores: { cr1: 7, cr2: 7, cr3: 5 },
        comment: "Ganho moderado; vale testar em uma regional antes de escalar.",
        createdAt: daysAgo(3, 15),
        edited: false,
        locked: false,
      },
      {
        id: "ev6",
        stageId: "s2",
        evaluatorId: "u5",
        scores: { cr1: 7, cr2: 6, cr3: 5 },
        comment: "Solução conhecida, mas resolve uma dor real de separação.",
        createdAt: daysAgo(3, 16),
        edited: false,
        locked: false,
      },
    ],
    classifications: [],
  },
  {
    id: "i8",
    challengeId: "c3",
    title: "Portal único do fornecedor",
    description:
      "Centraliza notas, agendamentos e status de pagamento em um só lugar, eliminando trocas de e-mail.",
    link: "",
    attachments: [],
    answers: { ff5: "Reduz chamados repetidos de fornecedores nos canais digitais.", ff6: "Sim" },
    formSnapshot: seedChallenges[2]!.formFields,
    authorId: "u3",
    createdAt: daysAgo(30),
    currentStageId: "e2",
    stageHistory: [
      { stageId: "e1", enteredAt: daysAgo(30), exitedAt: daysAgo(24), movedBy: "Diego Ferraz" },
      { stageId: "e2", enteredAt: daysAgo(24) },
    ],
    assignments: { e2: ["u1", "u5"] },
    evaluations: [
      {
        id: "ev7",
        stageId: "e2",
        evaluatorId: "u1",
        scores: { cr4: 8, cr5: 4 },
        comment: "Boa redução de esforço do time de atendimento.",
        createdAt: daysAgo(22, 11),
        edited: false,
        locked: true,
      },
      {
        id: "ev8",
        stageId: "e2",
        evaluatorId: "u5",
        scores: { cr4: 8, cr5: 3 },
        comment: "Depende de integração, mas o ganho é consistente.",
        createdAt: daysAgo(22, 14),
        edited: false,
        locked: true,
      },
    ],
    classifications: [],
  },
  {
    id: "i9",
    challengeId: "c1",
    title: "Checklist digital de qualidade",
    description:
      "Formulário digital preenchido pelo técnico ao encerrar a visita, com foto obrigatória e validação automática dos itens críticos.",
    link: "https://intranet.exemplo.com/ideias/checklist-digital",
    attachments: ["checklist-digital.pdf"],
    answers: {
      ff1: "Falhas de qualidade só aparecem semanas depois, no retrabalho.",
      ff2: "Piloto rodando",
      ff3: ["Operações", "Tecnologia"],
    },
    formSnapshot: seedChallenges[0]!.formFields,
    authorId: "u1",
    createdAt: daysAgo(45),
    currentStageId: "s5",
    stageHistory: [
      { stageId: "s1", enteredAt: daysAgo(45), exitedAt: daysAgo(40), movedBy: "Rafael Andrade" },
      { stageId: "s2", enteredAt: daysAgo(40), exitedAt: daysAgo(30), movedBy: "Rafael Andrade" },
      { stageId: "s3", enteredAt: daysAgo(30), exitedAt: daysAgo(22), movedBy: "Diego Ferraz" },
      { stageId: "s4", enteredAt: daysAgo(22), exitedAt: daysAgo(12), movedBy: "Diego Ferraz" },
      { stageId: "s5", enteredAt: daysAgo(12) },
    ],
    assignments: {},
    evaluations: [],
    classifications: [{ stageId: "s3", option: "Quick win", byId: "u6", at: daysAgo(23) }],
    decision: {
      result: "aprovada",
      justification: "Ganho rápido, baixo custo de implantação e piloto já validado em duas regionais.",
      byId: "u6",
      at: daysAgo(10),
      minutes:
        "Ata da reunião do comitê decisor: presentes Evelyn Monteiro e Diego Ferraz. Aprovada a implantação do checklist digital em todas as regionais no próximo trimestre.",
    },
    feedback: {
      message:
        "Sua ideia foi aprovada pelo comitê. A implantação começa pelas regionais Sul e Sudeste e você será convidada a acompanhar o piloto.",
      origin: "manual",
      approved: true,
      approvedBy: "Diego Ferraz",
      approvedAt: daysAgo(10),
    },
  },
  {
    id: "i10",
    challengeId: "c1",
    title: "Etiquetas inteligentes no almoxarifado",
    description:
      "Etiquetas com QR code que registram a retirada da peça pelo celular, mantendo o saldo do almoxarifado sempre atualizado.",
    link: "",
    attachments: [],
    answers: {
      ff1: "Saldo do almoxarifado desatualizado gera visita sem peça.",
      ff2: "Protótipo",
      ff3: ["Operações", "Suprimentos"],
    },
    formSnapshot: seedChallenges[0]!.formFields,
    authorId: "u1",
    createdAt: daysAgo(11),
    currentStageId: "s2",
    stageHistory: [
      { stageId: "s1", enteredAt: daysAgo(11), exitedAt: daysAgo(5), movedBy: "Rafael Andrade" },
      { stageId: "s2", enteredAt: daysAgo(5) },
    ],
    assignments: { s2: ["u5", "u7"] },
    evaluations: [],
    classifications: [],
  },
  {
    id: "i11",
    challengeId: "c3",
    title: "Assistente de dúvidas no portal do cliente",
    description:
      "Busca guiada que resolve as dez dúvidas mais frequentes antes de abrir um atendimento humano.",
    link: "",
    attachments: [],
    answers: { ff5: "Reduz o volume de chamados simples e o tempo de espera.", ff6: "Não" },
    formSnapshot: seedChallenges[2]!.formFields,
    authorId: "u1",
    createdAt: daysAgo(4),
    currentStageId: "e1",
    stageHistory: [{ stageId: "e1", enteredAt: daysAgo(4) }],
    assignments: {},
    evaluations: [],
    classifications: [],
  },
  {
    id: "i12",
    challengeId: "c3",
    title: "Central de agendamento pelo cliente",
    description:
      "O próprio cliente escolhe a janela de atendimento pelo aplicativo, com confirmação automática da equipe.",
    link: "",
    attachments: [],
    answers: { ff5: "Menos remarcações e menos contatos repetidos.", ff6: "Sim" },
    formSnapshot: seedChallenges[2]!.formFields,
    authorId: "u1",
    createdAt: daysAgo(60),
    currentStageId: "e3",
    stageHistory: [
      { stageId: "e1", enteredAt: daysAgo(60), exitedAt: daysAgo(52), movedBy: "Diego Ferraz" },
      { stageId: "e2", enteredAt: daysAgo(52), exitedAt: daysAgo(38), movedBy: "Diego Ferraz" },
      { stageId: "e3", enteredAt: daysAgo(38) },
    ],
    assignments: {},
    evaluations: [],
    classifications: [],
    decision: {
      result: "reprovada",
      justification:
        "A integração com o sistema legado de roteirização inviabiliza o prazo do programa neste ciclo.",
      byId: "u6",
      at: daysAgo(35),
      minutes:
        "Ata da reunião de decisão: presentes Evelyn Monteiro e Diego Ferraz. Ideia não aprovada neste ciclo por dependência crítica do legado de roteirização.",
    },
    feedback: {
      message:
        "A ideia não avançou neste ciclo por depender do sistema legado de roteirização. Vale reapresentá-la após a migração prevista para o próximo semestre.",
      origin: "manual",
      approved: true,
      approvedBy: "Diego Ferraz",
      approvedAt: daysAgo(34),
    },
  },
];

export const seedLogs: LogEntry[] = [
  {
    id: "l1",
    entityType: "programa",
    entityId: "p1",
    entityLabel: "Programa Eficiência Operacional 2026",
    action: "Programa criado",
    detail: "Criação manual do programa.",
    actor: "Evelyn Monteiro",
    at: "2026-01-12T13:00:00.000Z",
  },
  {
    id: "l2",
    entityType: "desafio",
    entityId: "c1",
    entityLabel: "Como reduzir deslocamentos improdutivos das equipes de campo?",
    action: "Status alterado",
    detail: "De Rascunho para Aberto.",
    actor: "Evelyn Monteiro",
    at: "2026-01-16T13:00:00.000Z",
  },
  {
    id: "l3",
    entityType: "desafio",
    entityId: "c2",
    entityLabel: "Manutenção preditiva na frota leve",
    action: "Status alterado",
    detail: "De Aberto para Pausado.",
    actor: "Rafael Andrade",
    at: "2026-02-01T13:00:00.000Z",
  },
];
