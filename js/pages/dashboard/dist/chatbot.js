// ============================================================
// chatbot.js — FinWise Assistente Financeiro
// Versão: apenas perguntas frequentes fixas (sem IA/API)
// ============================================================

// ---- Perguntas frequentes ----
const FAQS = [
  // ── Indicadores ──
  {
    question: "O que é CDI?",
    answer:
      "O <strong>CDI (Certificado de Depósito Interbancário)</strong> é uma taxa usada como referência para investimentos de renda fixa no Brasil. Ele acompanha de perto a taxa Selic e serve de base para CDBs, LCIs, LCAs e fundos. Quando um investimento rende \"100% do CDI\", significa que ele acompanha essa taxa de referência.",
    links: [
      { label: "Banco Central — Taxa Selic", url: "https://www.bcb.gov.br/controleinflacao/taxaselic" },
      { label: "Tesouro Nacional", url: "https://www.tesourodireto.com.br" },
    ],
  },
  {
    question: "O que é IPCA?",
    answer:
      "O <strong>IPCA (Índice de Preços ao Consumidor Amplo)</strong> é o índice oficial de inflação do Brasil, medido mensalmente pelo IBGE. Ele mostra o quanto os preços subiram para as famílias. Investimentos como o Tesouro IPCA+ rendem a inflação + uma taxa extra, protegendo seu dinheiro da desvalorização.",
    links: [
      { label: "IBGE — IPCA", url: "https://www.ibge.gov.br/explica/inflacao.php" },
      { label: "Tesouro IPCA+", url: "https://www.tesourodireto.com.br/titulos/tesouro-ipca.htm" },
    ],
  },
  {
    question: "O que é a taxa Selic?",
    answer:
      "A <strong>Selic</strong> é a taxa básica de juros da economia brasileira, definida pelo Banco Central a cada 45 dias nas reuniões do COPOM. Ela influencia diretamente o rendimento de investimentos de renda fixa (CDB, Tesouro Direto, LCI/LCA) e também o custo do crédito. Quando a Selic sobe, a renda fixa fica mais atrativa.",
    links: [
      { label: "Banco Central — Selic", url: "https://www.bcb.gov.br/controleinflacao/taxaselic" },
    ],
  },
  {
    question: "O que é o FGC?",
    answer:
      "O <strong>FGC (Fundo Garantidor de Créditos)</strong> é uma entidade privada que protege seus investimentos em caso de falência de uma instituição financeira. Ele garante até <strong>R$ 250.000 por CPF por instituição</strong> (com limite global de R$ 1 milhão). Cobrem CDB, LCI, LCA, poupança e outros. O Tesouro Direto não precisa do FGC — é garantido pelo governo federal.",
    links: [
      { label: "FGC — Garantias", url: "https://www.fgc.org.br/garantia-fgc/sobre-a-garantia-fgc" },
    ],
  },

  // ── Orçamento ──
  {
    question: "O que é a regra 50-30-20?",
    answer:
      "A <strong>regra 50-30-20</strong> é um método simples de organizar seu orçamento:<br>• <strong>50%</strong> para necessidades (aluguel, comida, contas)<br>• <strong>30%</strong> para desejos (lazer, restaurantes, assinaturas)<br>• <strong>20%</strong> para poupança e investimentos.",
    links: [
      { label: "Nubank — Regra 50-30-20", url: "https://blog.nubank.com.br/regra-50-30-20/" },
    ],
  },
  {
    question: "Qual a diferença entre poupar e investir?",
    answer:
      "<strong>Poupar</strong> é gastar menos do que se ganha e guardar o dinheiro — geralmente em conta corrente ou poupança, com baixo rendimento.<br><br><strong>Investir</strong> é aplicar esse dinheiro guardado em produtos financeiros (CDB, Tesouro Direto, ações, FIIs) para que ele cresça acima da inflação com o tempo.<br><br>Só poupar pode fazer seu dinheiro <em>perder poder de compra</em> com a inflação. O ideal é poupar <strong>e</strong> investir.",
    links: [
      { label: "Tesouro Direto — Como começar", url: "https://www.tesourodireto.com.br/conheca/como-funciona.htm" },
    ],
  },
  {
    question: "Por que não deixar dinheiro na poupança?",
    answer:
      "A poupança rende <strong>0,5% ao mês + TR</strong> quando a Selic está acima de 8,5% ao ano. Isso frequentemente fica <em>abaixo da inflação</em>, fazendo seu dinheiro perder poder de compra.<br><br>Alternativas melhores com a mesma segurança:<br>• <strong>Tesouro Selic</strong> — rende quase 100% da Selic, liquidez diária<br>• <strong>CDB de liquidez diária</strong> — de bancos digitais, costuma render 100%+ do CDI",
    links: [
      { label: "Tesouro Selic", url: "https://www.tesourodireto.com.br/titulos/tesouro-selic.htm" },
    ],
  },
  {
    question: "O que são juros compostos?",
    answer:
      "Juros compostos são os <strong>\"juros sobre juros\"</strong>. Cada rendimento é reinvestido e passa a render também no próximo período. Com o tempo, esse efeito é poderoso — chamado de <strong>bola de neve</strong>.<br><br>Exemplo: R$ 1.000 a 10% ao ano:<br>• Simples: R$ 1.100 em 1 ano, R$ 1.200 em 2 anos<br>• Compostos: R$ 1.100 em 1 ano, <strong>R$ 1.210</strong> em 2 anos<br><br>Nos investimentos, os juros compostos trabalham <em>a seu favor</em>. Nas dívidas, trabalham <em>contra você</em>.",
    links: [
      { label: "Simulador do Tesouro Direto", url: "https://www.tesourodireto.com.br/investindo/simulador.htm" },
    ],
  },

  // ── Reserva de emergência ──
  {
    question: "Como montar uma reserva de emergência?",
    answer:
      "A <strong>reserva de emergência</strong> é um valor guardado para imprevistos (desemprego, saúde, reparos). O ideal é ter <strong>6 meses de despesas mensais</strong>. Onde guardar: Tesouro Selic ou CDB com liquidez diária — rendem bem e você pode resgatar a qualquer hora sem perda.",
    links: [
      { label: "Tesouro Selic", url: "https://www.tesourodireto.com.br/titulos/tesouro-selic.htm" },
      { label: "Guia Serasa", url: "https://www.serasa.com.br/ensina/dicas/reserva-de-emergencia/" },
    ],
  },

  // ── Dívidas ──
  {
    question: "Como sair das dívidas?",
    answer:
      "Para sair das dívidas:<br>1. <strong>Liste tudo</strong> — valor, juros e credor de cada dívida.<br>2. <strong>Priorize as mais caras</strong> — cartão de crédito tem juros altíssimos.<br>3. <strong>Negocie</strong> — muitas empresas oferecem descontos.<br>4. <strong>Corte gastos</strong> e direcione para as dívidas.<br>5. <strong>Evite novas dívidas</strong> enquanto quita as antigas.",
    links: [
      { label: "Serasa Limpa Nome", url: "https://www.serasa.com.br/limpa-nome-online/" },
    ],
  },
  {
    question: "Vale a pena usar cartão de crédito?",
    answer:
      "Sim, <strong>se usado com disciplina</strong>. Vantagens: prazo extra para pagar, milhas/cashback, controle dos gastos na fatura.<br><br>Mas atenção aos perigos:<br>• <strong>Juros rotativos</strong> chegam a mais de 400% ao ano — nunca pague o mínimo<br>• Parcelamentos embutem juros disfarçados<br>• Facilita gastar mais do que se ganha<br><br>Regra de ouro: só gaste no cartão o que você já tem na conta.",
    links: [
      { label: "Banco Central — Juros do cartão", url: "https://www.bcb.gov.br/estatisticas/reporttxjuros" },
    ],
  },
  {
    question: "O que é o método bola de neve?",
    answer:
      "O <strong>método bola de neve</strong> (snowball) é uma estratégia para quitar dívidas:<br><br>1. Liste todas as dívidas do <strong>menor para o maior valor</strong><br>2. Pague o mínimo em todas<br>3. Coloque todo o dinheiro extra na <strong>menor dívida</strong> até quitá-la<br>4. Use o valor que sobrou para atacar a próxima<br><br>A motivação de quitar dívidas rapidamente ajuda a manter o foco. Alternativa: o método <strong>avalanche</strong> prioriza a dívida de <em>maior juros</em>, economizando mais dinheiro no total.",
    links: [
      { label: "Serasa — Dicas para quitar dívidas", url: "https://www.serasa.com.br/ensina/dicas/como-quitar-dividas/" },
    ],
  },

  // ── Investimentos ──
  {
    question: "Diferença entre CDB, LCI e LCA?",
    answer:
      "São todos <strong>renda fixa</strong>:<br>• <strong>CDB</strong> — tributado pelo IR, costuma render mais.<br>• <strong>LCI</strong> (imóveis) — <strong>isento de IR</strong> para pessoa física.<br>• <strong>LCA</strong> (agronegócio) — também <strong>isento de IR</strong>.<br>Todos têm garantia do FGC até R$ 250 mil por CPF.",
    links: [
      { label: "FGC — Garantias", url: "https://www.fgc.org.br/garantia-fgc/sobre-a-garantia-fgc" },
    ],
  },
  {
    question: "O que é o Tesouro Direto?",
    answer:
      "O <strong>Tesouro Direto</strong> é um programa do governo federal que permite que qualquer pessoa compre títulos públicos pela internet a partir de R$ 30. É considerado o <strong>investimento mais seguro do Brasil</strong>, pois é garantido pelo governo.<br><br>Tipos principais:<br>• <strong>Tesouro Selic</strong> — rende a Selic, ideal para reserva de emergência<br>• <strong>Tesouro IPCA+</strong> — protege da inflação + taxa extra, bom para longo prazo<br>• <strong>Tesouro Prefixado</strong> — taxa definida no momento da compra",
    links: [
      { label: "Tesouro Direto — Como funciona", url: "https://www.tesourodireto.com.br/conheca/como-funciona.htm" },
    ],
  },
  {
    question: "O que é um FII?",
    answer:
      "Um <strong>FII (Fundo de Investimento Imobiliário)</strong> é um fundo que investe em imóveis (shoppings, galpões, hospitais, prédios) ou papéis do setor imobiliário. As cotas são negociadas na bolsa (B3) como ações.<br><br>Vantagem principal: distribuem <strong>rendimentos mensais isentos de IR</strong> para pessoa física — é como receber aluguel sem precisar comprar um imóvel. É possível começar com menos de R$ 100.",
    links: [
      { label: "B3 — FIIs", url: "https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/fundos-de-investimentos/fii/" },
    ],
  },
  {
    question: "O que é diversificação?",
    answer:
      "Diversificar é <strong>não colocar todos os ovos na mesma cesta</strong>. No mundo dos investimentos, significa distribuir o dinheiro entre diferentes tipos de ativos (renda fixa, ações, FIIs, etc.), setores e emissores.<br><br>Por que diversificar?<br>• Reduz o risco: se um investimento vai mal, os outros compensam<br>• Equilibra rentabilidade e segurança<br><br>Exemplo simples: parte em Tesouro Selic (segurança), parte em CDB (renda fixa), parte em FIIs (renda variável).",
    links: [
      { label: "Tesouro Direto — Simulador", url: "https://www.tesourodireto.com.br/investindo/simulador.htm" },
    ],
  },
  {
    question: "O que é renda fixa e renda variável?",
    answer:
      "<strong>Renda fixa</strong>: você sabe (ou pode prever) o rendimento no momento da aplicação. Exemplos: CDB, LCI, LCA, Tesouro Direto. Menor risco.<br><br><strong>Renda variável</strong>: o rendimento não é garantido — pode ser maior ou menor, inclusive negativo. Exemplos: ações, FIIs, ETFs. Maior risco, mas potencial de retorno maior no longo prazo.<br><br>Para iniciantes, o recomendado é começar pela renda fixa, formando a reserva de emergência antes de partir para a variável.",
    links: [
      { label: "Tesouro Nacional — Renda Fixa", url: "https://www.tesourodireto.com.br" },
      { label: "B3 — Renda Variável", url: "https://www.b3.com.br" },
    ],
  },
  {
    question: "O que é o IR em investimentos?",
    answer:
      "O <strong>Imposto de Renda</strong> incide sobre o lucro dos investimentos de renda fixa seguindo uma tabela regressiva — quanto mais tempo investido, menos imposto:<br><br>• Até 180 dias: <strong>22,5%</strong><br>• 181 a 360 dias: <strong>20%</strong><br>• 361 a 720 dias: <strong>17,5%</strong><br>• Acima de 720 dias: <strong>15%</strong><br><br><strong>Isentos de IR</strong> para pessoa física: LCI, LCA, FIIs (rendimentos mensais) e dividendos de ações.",
    links: [
      { label: "Receita Federal — IR em investimentos", url: "https://www.gov.br/receitafederal" },
    ],
  },
];

const STORAGE_KEY = "finwise_chat_history";
const MAX_HISTORY = 50;

let messages = [];
let isOpen = false;

// ============================================================
// INICIALIZAÇÃO
// ============================================================

export function initChatbot() {
  injectChatbotStyles();
  loadHistory();
  renderFAB();
  renderChatWindow();
  attachEvents();
}

// ============================================================
// CSS INJETADO
// ============================================================

function injectChatbotStyles() {
  if (document.getElementById("finwise-chatbot-css")) return;

  const style = document.createElement("style");
  style.id = "finwise-chatbot-css";
  style.textContent = `
    /* ---- FAB (botão flutuante) ---- */
    .chatbot-fab {
      position: fixed;
      bottom: 1.75rem;
      right: 1.75rem;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: .5rem;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      border-radius: 50px;
      padding: .75rem 1.25rem;
      font-size: .9rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(16,185,129,.45);
      transition: transform .2s, box-shadow .2s;
    }
    .chatbot-fab:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 28px rgba(16,185,129,.5);
    }
    .chatbot-fab i { font-size: 1.1rem; }

    /* ---- Janela do chat ---- */
    .chatbot-window {
      position: fixed;
      bottom: 5.5rem;
      right: 1.75rem;
      z-index: 1000;
      width: 380px;
      max-width: calc(100vw - 2rem);
      max-height: 600px;
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(16px) scale(.97);
      transition: opacity .25s ease, transform .25s ease;
    }
    .chatbot-window--open {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0) scale(1);
    }

    /* Header */
    .chatbot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: .875rem 1rem;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      flex-shrink: 0;
    }
    .chatbot-header-info { display: flex; align-items: center; gap: .75rem; }
    .chatbot-avatar {
      width: 38px; height: 38px;
      background: rgba(255,255,255,.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    .chatbot-name { display: block; font-weight: 700; font-size: .95rem; }
    .chatbot-status {
      display: flex; align-items: center; gap: .3rem;
      font-size: .75rem; opacity: .85;
    }
    .chatbot-status i { font-size: .5rem; color: #a7f3d0; }
    .chatbot-header-actions { display: flex; gap: .4rem; }
    .chatbot-icon-btn {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.15);
      border: none; border-radius: 8px;
      color: white; font-size: .875rem; cursor: pointer;
      transition: background .15s;
    }
    .chatbot-icon-btn:hover { background: rgba(255,255,255,.25); }

    /* FAQs */
    .chatbot-faqs {
      padding: .75rem 1rem .5rem;
      border-bottom: 1px solid var(--border, #e5e7eb);
      flex-shrink: 0;
      background: var(--surface-alt, #f9fafb);
      max-height: 140px;
      overflow-y: auto;
    }
    .chatbot-faqs::-webkit-scrollbar { width: 4px; }
    .chatbot-faqs::-webkit-scrollbar-thumb { background: var(--border, #e5e7eb); border-radius: 4px; }
    .chatbot-faqs-label {
      font-size: .75rem;
      font-weight: 600;
      color: var(--text-secondary, #6b7280);
      margin-bottom: .5rem;
      display: flex; align-items: center; gap: .3rem;
    }
    .chatbot-faqs-label i { color: #10b981; }
    .chatbot-faq-chips { display: flex; flex-wrap: wrap; gap: .375rem; padding-bottom: .25rem; }
    .chatbot-faq-chip {
      background: var(--surface, #fff);
      border: 1.5px solid var(--border, #e5e7eb);
      border-radius: 20px;
      padding: .3rem .75rem;
      font-size: .78rem;
      font-family: inherit;
      color: var(--text-primary, #111827);
      cursor: pointer;
      transition: border-color .15s, background .15s;
      white-space: nowrap;
    }
    .chatbot-faq-chip:hover {
      border-color: #10b981;
      background: #ecfdf5;
      color: #059669;
    }

    /* Mensagens */
    .chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: .875rem 1rem;
      display: flex;
      flex-direction: column;
      gap: .625rem;
      background: var(--bg, #f9fafb);
    }
    .chatbot-messages::-webkit-scrollbar { width: 4px; }
    .chatbot-messages::-webkit-scrollbar-thumb {
      background: var(--border, #e5e7eb);
      border-radius: 4px;
    }

    /* Boas-vindas */
    .chatbot-welcome {
      text-align: center;
      padding: 1.5rem .5rem;
      color: var(--text-secondary, #6b7280);
    }
    .chatbot-welcome-icon { font-size: 2.5rem; margin-bottom: .75rem; }
    .chatbot-welcome p { font-size: .875rem; line-height: 1.55; margin-bottom: .4rem; }
    .chatbot-welcome strong { color: var(--text-primary, #111827); }

    /* Balões */
    .chatbot-msg { display: flex; }
    .chatbot-msg--user  { justify-content: flex-end; }
    .chatbot-msg--assistant { justify-content: flex-start; }

    .chatbot-msg-bubble {
      max-width: 82%;
      padding: .625rem .875rem;
      border-radius: 14px;
      font-size: .875rem;
      line-height: 1.55;
      position: relative;
    }
    .chatbot-msg--user .chatbot-msg-bubble {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .chatbot-msg--assistant .chatbot-msg-bubble {
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e5e7eb);
      color: var(--text-primary, #111827);
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .chatbot-msg-content { word-break: break-word; }
    .chatbot-msg-time {
      display: block;
      font-size: .68rem;
      opacity: .65;
      margin-top: .25rem;
      text-align: right;
    }

    /* Links das FAQs */
    .chatbot-links {
      display: flex;
      flex-direction: column;
      gap: .35rem;
      margin-top: .625rem;
    }
    .chatbot-link {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      color: #059669;
      font-size: .8rem;
      font-weight: 600;
      text-decoration: none;
      padding: .25rem .5rem;
      background: #ecfdf5;
      border-radius: 6px;
      transition: background .15s;
    }
    .chatbot-link:hover { background: #d1fae5; }
    .chatbot-link i { font-size: .75rem; }

    /* Mensagem de resposta não encontrada */
    .chatbot-not-found {
      background: rgba(245,158,11,.08);
      border: 1px solid rgba(245,158,11,.2);
      border-radius: 10px;
      padding: .6rem .85rem;
      font-size: .82rem;
      color: var(--text-secondary, #6b7280);
      line-height: 1.5;
    }
    .chatbot-not-found i { color: #f59e0b; margin-right: .3rem; }

    /* Input area */
    .chatbot-input-area {
      display: flex;
      align-items: flex-end;
      gap: .5rem;
      padding: .75rem 1rem;
      border-top: 1px solid var(--border, #e5e7eb);
      background: var(--surface, #fff);
      flex-shrink: 0;
    }
    .chatbot-input {
      flex: 1;
      resize: none;
      border: 1.5px solid var(--border, #e5e7eb);
      border-radius: 10px;
      padding: .6rem .85rem;
      font-family: inherit;
      font-size: .875rem;
      background: var(--bg, #f9fafb);
      color: var(--text-primary, #111827);
      outline: none;
      line-height: 1.45;
      max-height: 120px;
      transition: border-color .2s;
    }
    .chatbot-input:focus { border-color: #10b981; }
    .chatbot-send-btn {
      width: 38px; height: 38px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: #10b981; color: white;
      border: none; border-radius: 10px;
      font-size: 1rem; cursor: pointer;
      transition: background .15s, transform .15s;
    }
    .chatbot-send-btn:hover  { background: #059669; transform: scale(1.05); }

    /* Disclaimer */
    .chatbot-disclaimer {
      padding: .4rem 1rem .6rem;
      font-size: .72rem;
      color: var(--text-muted, #9ca3af);
      text-align: center;
      background: var(--surface, #fff);
      display: flex; align-items: center; justify-content: center; gap: .3rem;
      flex-shrink: 0;
    }
    .chatbot-disclaimer i { color: #10b981; }

    /* Dark mode */
    [data-theme="dark"] .chatbot-window {
      background: #1a1d27;
      border-color: #2a2d3e;
    }
    [data-theme="dark"] .chatbot-faqs       { background: #232635; border-color: #2a2d3e; }
    [data-theme="dark"] .chatbot-faq-chip   { background: #1a1d27; border-color: #2a2d3e; color: #e8eaf0; }
    [data-theme="dark"] .chatbot-faq-chip:hover { background: rgba(16,185,129,.1); border-color: #10b981; }
    [data-theme="dark"] .chatbot-messages   { background: #111320; }
    [data-theme="dark"] .chatbot-msg--assistant .chatbot-msg-bubble { background: #1a1d27; border-color: #2a2d3e; color: #e8eaf0; }
    [data-theme="dark"] .chatbot-input-area { background: #1a1d27; border-color: #2a2d3e; }
    [data-theme="dark"] .chatbot-input      { background: #111320; border-color: #2a2d3e; color: #e8eaf0; }
    [data-theme="dark"] .chatbot-disclaimer { background: #1a1d27; }
    [data-theme="dark"] .chatbot-link       { background: rgba(16,185,129,.1); }
    [data-theme="dark"] .chatbot-link:hover { background: rgba(16,185,129,.2); }
    [data-theme="dark"] .chatbot-not-found  { background: rgba(245,158,11,.05); }

    /* Mobile */
    @media (max-width: 480px) {
      .chatbot-window { right: .75rem; left: .75rem; width: auto; bottom: 5rem; }
      .chatbot-fab    { right: .75rem; bottom: 1.25rem; }
    }
  `;
  document.head.appendChild(style);
}

// ============================================================
// localStorage
// ============================================================

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    messages = saved ? JSON.parse(saved) : [];
  } catch {
    messages = [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

// ============================================================
// FAB
// ============================================================

function renderFAB() {
  if (document.getElementById("chatbot-fab")) return;
  const fab = document.createElement("button");
  fab.id = "chatbot-fab";
  fab.className = "chatbot-fab";
  fab.title = "Assistente Financeiro";
  fab.innerHTML = `
    <span class="chatbot-fab-icon chatbot-fab-icon--open">
      <i class="fas fa-comments"></i>
    </span>
    <span class="chatbot-fab-icon chatbot-fab-icon--close" style="display:none">
      <i class="fas fa-xmark"></i>
    </span>
    <span class="chatbot-fab-label">Assistente</span>
  `;
  document.body.appendChild(fab);
}

// ============================================================
// JANELA DO CHAT
// ============================================================

function renderChatWindow() {
  if (document.getElementById("chatbot-window")) return;

  const win = document.createElement("div");
  win.id = "chatbot-window";
  win.className = "chatbot-window";
  win.setAttribute("aria-hidden", "true");
  win.innerHTML = `
    <div class="chatbot-header">
      <div class="chatbot-header-info">
        <div class="chatbot-avatar"><i class="fas fa-robot"></i></div>
        <div>
          <span class="chatbot-name">FinBot</span>
          <span class="chatbot-status"><i class="fas fa-circle"></i> Online</span>
        </div>
      </div>
      <div class="chatbot-header-actions">
        <button id="chatbot-clear-btn" class="chatbot-icon-btn" title="Limpar conversa">
          <i class="fas fa-trash"></i>
        </button>
        <button id="chatbot-close-btn" class="chatbot-icon-btn" title="Fechar">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
    </div>

    <div class="chatbot-faqs">
      <p class="chatbot-faqs-label"><i class="fas fa-bolt"></i> Perguntas frequentes</p>
      <div class="chatbot-faq-chips" id="chatbot-faq-chips"></div>
    </div>

    <div class="chatbot-messages" id="chatbot-messages"></div>

    <div class="chatbot-input-area">
      <textarea
        id="chatbot-input"
        class="chatbot-input"
        placeholder="Digite sua dúvida ou clique em uma pergunta acima..."
        rows="1"
        maxlength="500"
      ></textarea>
      <button id="chatbot-send-btn" class="chatbot-send-btn" title="Enviar">
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
    <p class="chatbot-disclaimer">
      <i class="fas fa-circle-info"></i>
      Conteúdo educativo — consulte um profissional para decisões importantes.
    </p>
  `;
  document.body.appendChild(win);
  renderFAQChips();
  renderMessages();
}

// ============================================================
// FAQ chips
// ============================================================

function renderFAQChips() {
  const container = document.getElementById("chatbot-faq-chips");
  if (!container) return;
  container.innerHTML = "";
  FAQS.forEach((faq) => {
    const chip = document.createElement("button");
    chip.className = "chatbot-faq-chip";
    chip.textContent = faq.question;
    chip.addEventListener("click", () => handleFAQ(faq));
    container.appendChild(chip);
  });
}

// ============================================================
// RENDERIZAÇÃO DE MENSAGENS
// ============================================================

function renderMessages() {
  const container = document.getElementById("chatbot-messages");
  if (!container) return;
  container.innerHTML = "";

  if (!messages.length) {
    container.innerHTML = `
      <div class="chatbot-welcome">
        <div class="chatbot-welcome-icon">🤖</div>
        <p>Olá! Sou o <strong>FinBot</strong>, seu assistente financeiro.</p>
        <p>Clique em uma das perguntas acima ou escreva sua dúvida sobre <strong>investimentos, dívidas ou planejamento financeiro</strong>.</p>
      </div>
    `;
    return;
  }

  messages.forEach((msg) => container.appendChild(createMessageEl(msg)));
  scrollToBottom();
}

function createMessageEl(msg) {
  const el = document.createElement("div");
  el.className = `chatbot-msg chatbot-msg--${msg.role}`;
  el.dataset.id = msg.id;
  const time = new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  });
  el.innerHTML = `
    <div class="chatbot-msg-bubble">
      <div class="chatbot-msg-content">${msg.content}</div>
      <span class="chatbot-msg-time">${time}</span>
    </div>
  `;
  return el;
}

function appendMessage(msg) {
  const container = document.getElementById("chatbot-messages");
  if (!container) return;
  container.querySelector(".chatbot-welcome")?.remove();
  container.appendChild(createMessageEl(msg));
  scrollToBottom();
}

function scrollToBottom() {
  const c = document.getElementById("chatbot-messages");
  if (c) c.scrollTop = c.scrollHeight;
}

// ============================================================
// FAQ HANDLER — busca na lista e responde localmente
// ============================================================

function handleFAQ(faq) {
  const userMsg = {
    id: generateId(),
    role: "user",
    content: escapeHtml(faq.question),
    timestamp: new Date().toISOString(),
  };
  messages.push(userMsg);
  appendMessage(userMsg);

  let answerHtml = faq.answer;
  if (faq.links?.length) {
    answerHtml += `<div class="chatbot-links">`;
    faq.links.forEach((link) => {
      answerHtml += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="chatbot-link">
        <i class="fas fa-external-link-alt"></i> ${link.label}
      </a>`;
    });
    answerHtml += `</div>`;
  }

  const botMsg = {
    id: generateId(),
    role: "assistant",
    content: answerHtml,
    timestamp: new Date().toISOString(),
  };
  messages.push(botMsg);
  appendMessage(botMsg);
  saveHistory();
}

// ============================================================
// ENVIO DE TEXTO LIVRE — busca aproximada nas FAQs
// ============================================================

function handleSend() {
  const input = document.getElementById("chatbot-input");
  const text = input?.value.trim();
  if (!text) return;

  input.value = "";
  input.style.height = "auto";

  const userMsg = {
    id: generateId(),
    role: "user",
    content: escapeHtml(text),
    timestamp: new Date().toISOString(),
  };
  messages.push(userMsg);
  appendMessage(userMsg);
  saveHistory();

  // Busca pela FAQ mais próxima
  const matched = findBestFAQ(text);

  let botContent;
  if (matched) {
    let answerHtml = matched.answer;
    if (matched.links?.length) {
      answerHtml += `<div class="chatbot-links">`;
      matched.links.forEach((link) => {
        answerHtml += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="chatbot-link">
          <i class="fas fa-external-link-alt"></i> ${link.label}
        </a>`;
      });
      answerHtml += `</div>`;
    }
    botContent = answerHtml;
  } else {
    botContent = `<div class="chatbot-not-found">
      <i class="fas fa-circle-info"></i>
      Não encontrei uma resposta exata para isso. Tente clicar em uma das <strong>perguntas frequentes</strong> acima — elas cobrem os principais temas de finanças pessoais.
    </div>`;
  }

  const botMsg = {
    id: generateId(),
    role: "assistant",
    content: botContent,
    timestamp: new Date().toISOString(),
  };
  messages.push(botMsg);
  appendMessage(botMsg);
  saveHistory();
}

// Busca simples por palavras-chave no texto digitado
function findBestFAQ(text) {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Palavras-chave para cada FAQ
  const keywords = [
    { faq: FAQS.find(f => f.question.includes("CDI")),         words: ["cdi", "certificado de deposito interbancario"] },
    { faq: FAQS.find(f => f.question.includes("IPCA")),        words: ["ipca", "inflacao", "inflação", "indice de preco"] },
    { faq: FAQS.find(f => f.question.includes("Selic")),       words: ["selic", "taxa basica", "copom", "taxa de juros"] },
    { faq: FAQS.find(f => f.question.includes("FGC")),         words: ["fgc", "fundo garantidor", "garantia", "falencia banco"] },
    { faq: FAQS.find(f => f.question.includes("50-30-20")),    words: ["50", "30", "20", "orcamento", "organizar gastos", "dividir renda"] },
    { faq: FAQS.find(f => f.question.includes("poupar")),      words: ["poupar", "poupanca", "diferenca investir", "guardar dinheiro"] },
    { faq: FAQS.find(f => f.question.includes("poupança")),    words: ["poupanca", "deixar na poupanca", "conta poupanca", "rendimento poupanca"] },
    { faq: FAQS.find(f => f.question.includes("juros compostos")), words: ["juros compostos", "juros sobre juros", "bola de neve rendimento", "efeito"] },
    { faq: FAQS.find(f => f.question.includes("reserva")),     words: ["reserva", "emergencia", "imprevisto", "desemprego", "guardar"] },
    { faq: FAQS.find(f => f.question.includes("dívidas") && f.question.includes("Como sair")), words: ["divida", "endividado", "sair da divida", "quitar", "negativado"] },
    { faq: FAQS.find(f => f.question.includes("cartão")),      words: ["cartao", "credito", "fatura", "rotativo", "parcelar"] },
    { faq: FAQS.find(f => f.question.includes("bola de neve")), words: ["bola de neve", "snowball", "avalanche", "metodo divida", "ordem de pagamento"] },
    { faq: FAQS.find(f => f.question.includes("CDB")),         words: ["cdb", "lci", "lca", "renda fixa", "certificado", "letra de credito"] },
    { faq: FAQS.find(f => f.question.includes("Tesouro Direto")), words: ["tesouro", "titulo publico", "governo", "tesouro selic", "tesouro ipca", "prefixado"] },
    { faq: FAQS.find(f => f.question.includes("FII")),         words: ["fii", "fundo imobiliario", "imovel", "aluguel", "shopping", "galp"] },
    { faq: FAQS.find(f => f.question.includes("diversificação")), words: ["diversificar", "diversificacao", "carteira", "distribuir", "ovos"] },
    { faq: FAQS.find(f => f.question.includes("renda fixa e renda variável")), words: ["renda variavel", "acoes", "bolsa", "b3", "etf", "diferenca renda"] },
    { faq: FAQS.find(f => f.question.includes("IR em")),       words: ["imposto de renda", "ir ", "tributo", "isento", "tributacao"] },
  ];

  for (const { faq, words } of keywords) {
    if (!faq) continue;
    if (words.some(w => lower.includes(w))) return faq;
  }
  return null;
}

// ============================================================
// ABRIR / FECHAR
// ============================================================

function openChat() {
  isOpen = true;
  document.getElementById("chatbot-window")?.classList.add("chatbot-window--open");
  document.getElementById("chatbot-window")?.setAttribute("aria-hidden", "false");

  const fab = document.getElementById("chatbot-fab");
  if (fab) {
    fab.querySelector(".chatbot-fab-icon--open").style.display = "none";
    fab.querySelector(".chatbot-fab-icon--close").style.display = "";
    fab.querySelector(".chatbot-fab-label").textContent = "Fechar";
  }

  scrollToBottom();
  setTimeout(() => document.getElementById("chatbot-input")?.focus(), 300);
}

function closeChat() {
  isOpen = false;
  document.getElementById("chatbot-window")?.classList.remove("chatbot-window--open");
  document.getElementById("chatbot-window")?.setAttribute("aria-hidden", "true");

  const fab = document.getElementById("chatbot-fab");
  if (fab) {
    fab.querySelector(".chatbot-fab-icon--open").style.display = "";
    fab.querySelector(".chatbot-fab-icon--close").style.display = "none";
    fab.querySelector(".chatbot-fab-label").textContent = "Assistente";
  }
}

function clearHistory() {
  messages = [];
  localStorage.removeItem(STORAGE_KEY);
  renderMessages();
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function attachEvents() {
  document.getElementById("chatbot-fab")?.addEventListener("click", () => {
    isOpen ? closeChat() : openChat();
  });

  document.getElementById("chatbot-close-btn")?.addEventListener("click", closeChat);

  document.getElementById("chatbot-clear-btn")?.addEventListener("click", () => {
    if (confirm("Limpar todo o histórico do chat?")) clearHistory();
  });

  document.getElementById("chatbot-send-btn")?.addEventListener("click", handleSend);

  document.getElementById("chatbot-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  document.getElementById("chatbot-input")?.addEventListener("input", (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  });
}