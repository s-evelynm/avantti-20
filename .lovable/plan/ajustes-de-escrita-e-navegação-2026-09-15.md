# Ajustes de escrita e navegação

Foco: deixar o protótipo pronto para ser apresentado a usuários reais e stakeholders de negócio. Duas frentes — linguagem consistente e orientação/navegação clara. Nenhuma regra de negócio muda.

## 1. Escrita e terminologia

Padronizar o vocabulário em todas as telas, com um termo único por conceito:

- "Sponsor / dono" passa a ser **Patrocinador do desafio**
- "Gestor responsável" mantém, descrito como quem conduz o desafio
- "Pool de avaliadores" passa a ser **Grupo de avaliadores**
- Etapa de "gate" passa a ser **Etapa de aprovação**; "revisão" mantém
- "Critério de prontidão" passa a ser **Quando a etapa está pronta para avançar**
- "Consolidação ponderada" passa a ser **Média com pesos**
- "Capacidade" mantém (é o termo do modelo), sempre com a frase de apoio explicando o que libera

Revisão de textos:

- Cada tela ganha título e uma linha de apoio que diz a decisão que ela pede, não o que ela contém
- Avisos de capacidade passam a nomear pessoa e papel: "Camila Torres não tem 'Decidir resultado final' habilitada — ela pode ser atribuída mesmo assim"
- Mensagens de erro de formulário no mesmo padrão: o que falta e como resolver
- Toasts sempre em passado e específicos ("Avaliação enviada", "Etapa salva")
- Selo "sugestão" sempre acompanhado de frase curta dizendo que é exemplo fixo, não cálculo
- Estados vazios com uma frase + a ação de saída (botão ou link), nas telas de desafios, minhas ideias, avaliações, painel, programas, objetivos e usuários

## 2. Navegação e "Ver como"

- **Tela inicial de verdade** em `/`: saudação com o nome do usuário atual, resumo do que ele pode fazer agora (desafios abertos, avaliações pendentes, ideias em andamento) e atalhos. Substitui o redirecionamento atual.
- **Faixa de protótipo** no topo: aviso curto de que os dados são fictícios e as mudanças não são salvas.
- **"Ver como" mais visível**: passa a ser um bloco identificado no cabeçalho, com nome, área e a lista de capacidades da pessoa em um popover, além de texto explicando que trocar muda o que aparece no menu.
- **Menu no celular**: botão de abrir/fechar com painel lateral deslizante, em vez da barra empilhada atual.
- **Seção Configurar**: quando só houver um item liberado, ele aparece sem o agrupamento; quando nenhum, a seção some.
- **Breadcrumbs** revisados para usar os mesmos nomes do menu.

## Detalhes técnicos

- `src/lib/permissions.ts`: atualizar `capabilityLabel`, `capabilityHint` e os rótulos de `challengeRoleRequirement`
- `src/components/AppLayout.tsx`: bloco "Ver como" com popover de capacidades, faixa de protótipo, menu mobile com `Sheet`, ajuste da seção Configurar
- `src/routes/index.tsx`: deixa de redirecionar e passa a renderizar a tela inicial
- `src/components/RoleAssignments.tsx`: mensagem de aviso nomeando pessoa e papel
- Passada de revisão de texto em todas as rotas de `src/routes` e nos componentes `FunnelBuilder`, `FunnelBoard`, `EvaluationSetup`, `FormBuilder`
- Sem mudanças no store, nos tipos ou nas regras de avaliação
