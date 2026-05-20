// ============================================================
// importar-extrato.js — Importação OFX e CSV para FinWise
// Cole em dist/ e adicione no dashboard.html:
//   <script type="module" src="importar-extrato.js"></script>
// ============================================================

import { fetchTransactions, createTransaction } from "./api.js";

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────

function parseDate(str) {
  if (!str) return null;
  str = str.trim();

  // OFX: 20240115 ou 20240115120000
  if (/^\d{8}/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const [d, m, y] = str.split("/");
    return `${y}-${m}-${d}`;
  }
  // YYYY-MM-DD (já no formato certo)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  return null;
}

function cleanAmount(str) {
  if (typeof str === "number") return str;
  return parseFloat(
    str.replace(/[^\d,.-]/g, "").replace(",", ".")
  );
}

// Categoria automática por palavra-chave na descrição
const CATEGORY_RULES = [
  { keywords: ["supermercado", "mercado", "ifood", "rappi", "restaurante", "padaria", "lanchonete", "alimenta"], category: "alimentacao" },
  { keywords: ["uber", "99", "combustivel", "gasolina", "estacionamento", "metro", "onibus", "passagem"], category: "transporte" },
  { keywords: ["aluguel", "condominio", "luz", "energia", "agua", "gas", "internet", "net ", "claro", "vivo"], category: "moradia" },
  { keywords: ["farmacia", "drogaria", "hospital", "clinica", "medico", "plano de saude", "unimed"], category: "saude" },
  { keywords: ["escola", "faculdade", "curso", "livro", "amazon", "udemy"], category: "educacao" },
  { keywords: ["netflix", "spotify", "cinema", "teatro", "show", "steam", "jogo", "lazer", "bar "], category: "lazer" },
];

function guessCategory(description) {
  const desc = (description || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => desc.includes(k))) return rule.category;
  }
  return "outros";
}

// ─────────────────────────────────────────
// PARSERS
// ─────────────────────────────────────────

function parseOFX(text) {
  const transactions = [];

  // Normaliza quebras de linha
  text = text.replace(/\r\n|\r/g, "\n");

  // Extrai blocos <STMTTRN>
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];

  for (const block of blocks) {
    const get = (tag) => {
      const match = block.match(new RegExp(`<${tag}>([^<\n]+)`, "i"));
      return match ? match[1].trim() : null;
    };

    const trntype = get("TRNTYPE") || "DEBIT";
    const dtposted = get("DTPOSTED");
    const trnamt = get("TRNAMT");
    const memo = get("MEMO") || get("NAME") || "Sem descrição";
    const fitid = get("FITID");

    if (!dtposted || !trnamt) continue;

    const amount = parseFloat(trnamt);
    const absAmount = Math.abs(amount);

    transactions.push({
      _importId: fitid || `ofx_${dtposted}_${trnamt}`,
      date: parseDate(dtposted),
      description: memo,
      amount: absAmount,
      type: amount >= 0 ? "income" : "expense",
      category: amount < 0 ? guessCategory(memo) : "outros",
    });
  }

  return transactions;
}

function parseCSV(text) {
  const transactions = [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return transactions;

  // Detecta separador (vírgula ou ponto-e-vírgula)
  const separator = lines[0].includes(";") ? ";" : ",";

  // Normaliza header
  const header = lines[0].split(separator).map(h =>
    h.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
  );

  // Mapeia colunas pelos nomes mais comuns
  const colMap = {
    date: ["data", "date", "data_lancamento", "data_transacao", "data_pagamento"],
    description: ["descricao", "description", "historico", "memo", "estabelecimento", "titulo", "lancamento"],
    amount: ["valor", "amount", "value", "montante", "preco"],
    type: ["tipo", "type", "natureza", "lancamento"],
  };

  function findCol(candidates) {
    for (const c of candidates) {
      const idx = header.indexOf(c);
      if (idx !== -1) return idx;
    }
    // Busca parcial
    for (const c of candidates) {
      const idx = header.findIndex(h => h.includes(c));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const colDate = findCol(colMap.date);
  const colDesc = findCol(colMap.description);
  const colAmount = findCol(colMap.amount);
  const colType = findCol(colMap.type);

  if (colDate === -1 || colAmount === -1) {
    throw new Error("Não consegui identificar as colunas de data e valor. Verifique se o arquivo está no formato correto.");
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Suporte a campos com vírgula dentro de aspas
    const cols = line.match(/(".*?"|[^,;]+)(?=[,;]|$)/g) || line.split(separator);
    const clean = cols.map(c => c.trim().replace(/^"|"$/g, ""));

    const dateStr = clean[colDate];
    const desc = colDesc !== -1 ? clean[colDesc] : "Importado";
    const amtStr = clean[colAmount];
    const typeStr = colType !== -1 ? (clean[colType] || "") : "";

    const date = parseDate(dateStr);
    if (!date) continue;

    const rawAmount = cleanAmount(amtStr);
    if (isNaN(rawAmount)) continue;

    const absAmount = Math.abs(rawAmount);

    // Detecta tipo pela coluna "tipo" ou pelo sinal do valor
    let type = "expense";
    const typeNorm = typeStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (["credito", "credit", "entrada", "receita", "income", "c"].some(k => typeNorm.includes(k))) {
      type = "income";
    } else if (rawAmount > 0 && colType === -1) {
      // CSV sem coluna tipo: positivo = receita, negativo = despesa
      type = "income";
    }

    transactions.push({
      _importId: `csv_${date}_${absAmount}_${i}`,
      date,
      description: desc,
      amount: absAmount,
      type,
      category: type === "expense" ? guessCategory(desc) : "outros",
    });
  }

  return transactions;
}

// ─────────────────────────────────────────
// DETECÇÃO DE DUPLICATAS
// ─────────────────────────────────────────

async function detectDuplicates(parsed) {
  const existing = await fetchTransactions();

  // Fingerprint simples: data + valor arredondado
  const existingSet = new Set(
    existing.map(t => `${t.date}_${Math.round(Number(t.amount) * 100)}`)
  );

  return parsed.map(t => ({
    ...t,
    isDuplicate: existingSet.has(`${t.date}_${Math.round(t.amount * 100)}`),
  }));
}

// ─────────────────────────────────────────
// RENDERIZAÇÃO DA PRÉVIA
// ─────────────────────────────────────────

const CATEGORY_LABELS = {
  alimentacao: "Alimentação",
  moradia: "Moradia",
  transporte: "Transporte",
  lazer: "Lazer",
  saude: "Saúde",
  educacao: "Educação",
  outros: "Outros",
};

let _parsedTransactions = [];

function renderPreview(transactions, hideduplicates) {
  const tbody = document.getElementById("import-preview-body");
  tbody.innerHTML = "";

  const visible = hideduplicates
    ? transactions.filter(t => !t.isDuplicate)
    : transactions;

  const countInfo = document.getElementById("import-count-info");
  const dupes = transactions.filter(t => t.isDuplicate).length;
  countInfo.textContent = `${visible.length} transações encontradas${dupes ? ` · ${dupes} duplicata(s) ocultada(s)` : ""}`;

  visible.forEach((t, i) => {
    const tr = document.createElement("tr");
    if (t.isDuplicate) tr.classList.add("import-row--duplicate");

    tr.innerHTML = `
      <td><input type="checkbox" class="import-row-check" data-idx="${t._idx}" ${!t.isDuplicate ? "checked" : ""}></td>
      <td>${t.date}</td>
      <td class="import-desc" title="${t.description}">${t.description}</td>
      <td class="import-amount import-amount--${t.type}">
        ${t.type === "expense" ? "-" : "+"}R$ ${t.amount.toFixed(2).replace(".", ",")}
      </td>
      <td>
        <select class="import-type-select" data-idx="${t._idx}">
          <option value="expense" ${t.type === "expense" ? "selected" : ""}>Despesa</option>
          <option value="income" ${t.type === "income" ? "selected" : ""}>Receita</option>
        </select>
      </td>
      <td>
        <select class="import-cat-select" data-idx="${t._idx}">
          ${Object.entries(CATEGORY_LABELS).map(([v, l]) =>
            `<option value="${v}" ${t.category === v ? "selected" : ""}>${l}</option>`
          ).join("")}
        </select>
      </td>
      <td>${t.isDuplicate
        ? '<span class="import-badge import-badge--dupe">Duplicata</span>'
        : '<span class="import-badge import-badge--new">Nova</span>'
      }</td>
    `;
    tbody.appendChild(tr);
  });

  updateSelectedCount();
}

function updateSelectedCount() {
  const total = document.querySelectorAll(".import-row-check:checked").length;
  document.getElementById("import-selected-count").textContent =
    `${total} selecionada(s)`;
}

// ─────────────────────────────────────────
// CONTROLLER DO MODAL
// ─────────────────────────────────────────

function showStep(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById(`importar-step-${i}`).style.display = i === n ? "" : "none";
  });
}

function openModal() {
  document.getElementById("modal-importar").style.display = "flex";
  showStep(1);
  _parsedTransactions = [];
  document.getElementById("import-preview-body").innerHTML = "";
}

function closeModal() {
  document.getElementById("modal-importar").style.display = "none";
}

async function handleFile(file) {
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  if (!["ofx", "csv", "txt"].includes(ext)) {
    alert("Formato não suportado. Use arquivos .ofx ou .csv");
    return;
  }

  const text = await file.text();

  let parsed;
  try {
    parsed = ext === "ofx" ? parseOFX(text) : parseCSV(text);
  } catch (err) {
    alert("Erro ao ler o arquivo: " + err.message);
    return;
  }

  if (!parsed.length) {
    alert("Nenhuma transação encontrada no arquivo. Verifique o formato.");
    return;
  }

  // Adiciona índice interno para rastrear edições
  _parsedTransactions = parsed.map((t, i) => ({ ...t, _idx: i }));
  _parsedTransactions = await detectDuplicates(_parsedTransactions);

  showStep(2);
  const hideduplicates = document.getElementById("import-only-new").checked;
  renderPreview(_parsedTransactions, hideduplicates);
}

async function confirmarImportacao() {
  // Coleta quais estão selecionados
  const checkedIdxs = new Set(
    [...document.querySelectorAll(".import-row-check:checked")]
      .map(el => Number(el.dataset.idx))
  );

  // Lê categorias e tipos editados pelo usuário
  document.querySelectorAll(".import-cat-select").forEach(sel => {
    const idx = Number(sel.dataset.idx);
    const t = _parsedTransactions.find(t => t._idx === idx);
    if (t) t.category = sel.value;
  });
  document.querySelectorAll(".import-type-select").forEach(sel => {
    const idx = Number(sel.dataset.idx);
    const t = _parsedTransactions.find(t => t._idx === idx);
    if (t) t.type = sel.value;
  });

  const toImport = _parsedTransactions.filter(t => checkedIdxs.has(t._idx));
  if (!toImport.length) {
    alert("Nenhuma transação selecionada.");
    return;
  }

  const btn = document.getElementById("btn-confirmar-importacao");
  btn.disabled = true;
  btn.textContent = "Importando...";

  let count = 0;
  for (const t of toImport) {
    try {
      await createTransaction({
        type: t.type,
        description: t.description,
        amount: t.amount,
        category: t.category,
        date: t.date,
      });
      count++;
    } catch (err) {
      console.warn("Erro ao importar transação:", t, err);
    }
  }

  // Dispara evento para o dashboard.js atualizar a lista e os gráficos
  window.dispatchEvent(new CustomEvent("finwise:transactions-updated"));

  showStep(3);
  document.getElementById("import-success-msg").textContent =
    `${count} transação(ões) importada(s) com sucesso!`;

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-check"></i> Confirmar importação';
}

// ─────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────

export function initImportarExtrato() {
  // Botão abrir modal
  document.getElementById("btn-importar-extrato")
    ?.addEventListener("click", openModal);

  // Fechar modal
  document.getElementById("btn-fechar-importar")
    ?.addEventListener("click", closeModal);
  document.getElementById("btn-importar-fechar-ok")
    ?.addEventListener("click", closeModal);
  document.getElementById("modal-importar")
    ?.addEventListener("click", e => {
      if (e.target === e.currentTarget) closeModal();
    });

  // Voltar passo
  document.getElementById("btn-importar-voltar")
    ?.addEventListener("click", () => showStep(1));

  // Dropzone — click
  const dropzone = document.getElementById("import-dropzone");
  const fileInput = document.getElementById("import-file-input");

  dropzone?.addEventListener("click", () => fileInput.click());
  fileInput?.addEventListener("change", e => handleFile(e.target.files[0]));

  // Dropzone — drag and drop
  dropzone?.addEventListener("dragover", e => {
    e.preventDefault();
    dropzone.classList.add("import-dropzone--active");
  });
  dropzone?.addEventListener("dragleave", () => {
    dropzone.classList.remove("import-dropzone--active");
  });
  dropzone?.addEventListener("drop", e => {
    e.preventDefault();
    dropzone.classList.remove("import-dropzone--active");
    handleFile(e.dataTransfer.files[0]);
  });

  // Checkbox "ocultar duplicatas"
  document.getElementById("import-only-new")
    ?.addEventListener("change", e => {
      renderPreview(_parsedTransactions, e.target.checked);
    });

  // Select-all
  document.getElementById("import-check-all")
    ?.addEventListener("change", e => {
      document.querySelectorAll(".import-row-check")
        .forEach(cb => cb.checked = e.target.checked);
      updateSelectedCount();
    });

  // Contador de selecionados (delegação de eventos)
  document.getElementById("import-preview-body")
    ?.addEventListener("change", e => {
      if (e.target.classList.contains("import-row-check")) updateSelectedCount();
    });

  // Aplicar categoria a todos
  document.getElementById("btn-aplicar-categoria")
    ?.addEventListener("click", () => {
      const cat = document.getElementById("import-default-category").value;
      if (!cat) return;
      document.querySelectorAll(".import-cat-select")
        .forEach(sel => sel.value = cat);
    });

  // Confirmar
  document.getElementById("btn-confirmar-importacao")
    ?.addEventListener("click", confirmarImportacao);
}