# Editor visual do funil de avaliação

## Objetivo
Transformar a configuração atual do funil em uma área de trabalho visual, seguindo a direção “Pro visual editor” escolhida, sem alterar as regras ou os dados já existentes.

## Experiência
- Criar um editor em duas áreas: diagrama do fluxo à esquerda e propriedades da etapa selecionada à direita.
- Exibir cada etapa como um nó compacto com nome, mecanismo, prazo e estado de seleção.
- Desenhar conexões entre etapas e identificar visualmente rotas condicionais.
- Permitir selecionar, arrastar e reordenar etapas diretamente no diagrama, mantendo também controles acessíveis por teclado.
- Manter “Nova etapa” como única ação primária; remoção e inclusão de transições ficam como ações secundárias/contextuais.
- Adaptar a tela para larguras menores, empilhando diagrama e propriedades sem perder acesso aos controles.

## Painel de propriedades
- Editar nome, mecanismo, responsável, prazo, sinal de prontidão e opções de classificação da etapa selecionada.
- Mostrar as transições de saída da etapa no próprio painel, com origem implícita, destino, condição e remoção.
- Permitir adicionar uma transição a partir da etapa selecionada.
- Manter confirmação imediata por toast e o histórico de alterações já existente.

## Direção visual
- Aplicar a paleta escolhida: fundo `#F7F6FB`, superfície `#FFFFFF`, roxo `#6D28D9` e verde-petróleo `#0F766E`, convertidos em tokens semânticos do projeto.
- Usar Sora nos títulos e Manrope no corpo, carregadas pela página.
- Usar bordas finas, cantos moderados, grade pontilhada discreta, sombras leves e realces claros de seleção/foco.
- Manter os demais padrões e componentes da interface Avantti.

## Limites
- Não criar novas regras de avaliação, automações ou dados.
- Não alterar a navegação do programa ou outras telas.
- Preservar toda a lógica atual de criação, edição, reordenação e transições.

## Validação
- Verificar seleção e edição de etapas, criação/remoção, reordenação e transições.
- Conferir visualmente o editor em desktop e largura reduzida.
- Confirmar que a aplicação permanece sem erros.
