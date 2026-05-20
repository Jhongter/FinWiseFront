// ============================================================
// finwise-integration.js
// Camada de integração FinWise Web ↔ App Android
//
// COMO USAR:
//   Importe este arquivo no lugar de api.js quando o backend
//   estiver pronto. Enquanto isso, tudo cai no localStorage.
//
// PARA O DEV ANDROID:
//   Procure todos os comentários marcados com TODO e preencha
//   com as chamadas do seu backend (Firebase, Supabase, etc.)
// ============================================================

// ─────────────────────────────────────────
// CONFIGURAÇÃO — preencher com o backend
// ─────────────────────────────────────────

const FINWISE_CONFIG = {
  // TODO: cole aqui a URL base da sua API ou projeto Supabase
  // Exemplos:
  //   Supabase:  "https://xyzxyz.supabase.co"
  //   Firebase:  não usa baseUrl, usa SDK diretamente
  //   API REST:  "https://api.seudominio.com/v1"
  baseUrl: null,

  // TODO: cole aqui a chave pública (anon key) do Supabase,
  // ou deixe null se usar Firebase SDK
  anonKey: null,

  // Versão do schema — útil para migrations futuras
  schemaVersion: 1,
};

// ─────────────────────────────────────────
// DETECÇÃO DE BACKEND
// ─────────────────────────────────────────

function backendDisponivel() {
  return FINWISE_CONFIG.baseUrl !== null;
}

// ─────────────────────────────────────────
// AUTENTICAÇÃO
// Compatível com Firebase Auth já usado na dash
// ─────────────────────────────────────────

export const FinWiseAuth = {
  // Retorna o user_id do usuário logado.
  // Já funciona com o Firebase que vocês têm.
  getUserId() {
    // Firebase já está configurado no projeto — usa ele
    try {
      const { auth } = window._firebaseInstances || {};
      if (auth?.currentUser) return auth.currentUser.uid;
    } catch (_) {}

    // TODO: se migrar para Supabase Auth, substitua por:
    // const { data } = await supabase.auth.getUser();
    // return data?.user?.id ?? null;

    // Fallback: ID anônimo salvo localmente
    let anonId = localStorage.getItem("fw_anon_id");
    if (!anonId) {
      anonId = "anon_" + Math.random().toString(36).slice(2, 11);
      localStorage.setItem("fw_anon_id", anonId);
    }
    return anonId;
  },

  // TODO: Login com Google via Supabase (se migrar do Firebase)
  // async loginGoogle() {
  //   const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  //   return { data, error };
  // },

  // TODO: Logout via Supabase
  // async logout() {
  //   await supabase.auth.signOut();
  // },
};

// ─────────────────────────────────────────
// SYNC ENGINE
// Estratégia: local-first com sync em background
//
// Fluxo:
//   1. Lê do localStorage imediatamente (UI responde rápido)
//   2. Em background, busca do backend e atualiza se houver diff
//   3. Ao salvar, grava local + envia pro backend
//   4. Se offline, enfileira na fila de sync
// ─────────────────────────────────────────

const SyncQueue = {
  _key: "fw_sync_queue",

  get() {
    try { return JSON.parse(localStorage.getItem(this._key)) || []; }
    catch { return []; }
  },

  push(operation) {
    const queue = this.get();
    queue.push({ ...operation, timestamp: Date.now(), attempts: 0 });
    localStorage.setItem(this._key, JSON.stringify(queue));
  },

  clear() {
    localStorage.removeItem(this._key);
  },

  // Processa fila quando volta online
  async flush() {
    if (!backendDisponivel() || !navigator.onLine) return;
    const queue = this.get();
    if (!queue.length) return;

    const failed = [];
    for (const op of queue) {
      try {
        await BackendAdapter[op.method](op.table, op.data);
      } catch (err) {
        op.attempts++;
        if (op.attempts < 3) failed.push(op); // tenta até 3 vezes
        console.warn("[FinWise Sync] Falha ao sincronizar:", op, err);
      }
    }
    localStorage.setItem(this._key, JSON.stringify(failed));
    if (failed.length === 0) {
      console.info("[FinWise Sync] Fila sincronizada com sucesso.");
    }
  },
};

// Processa fila automaticamente quando volta online
window.addEventListener("online", () => SyncQueue.flush());

// ─────────────────────────────────────────
// BACKEND ADAPTER
// Aqui ficam as chamadas HTTP ao backend.
// TODO: implemente cada método com seu backend.
// ─────────────────────────────────────────

const BackendAdapter = {
  // ── SUPABASE (descomente e preencha se usar Supabase) ──

  // _client() {
  //   // Importe o SDK: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
  //   return window.supabase.createClient(FINWISE_CONFIG.baseUrl, FINWISE_CONFIG.anonKey);
  // },

  // async select(table, userId) {
  //   const sb = this._client();
  //   const { data, error } = await sb.from(table).select('*').eq('user_id', userId);
  //   if (error) throw error;
  //   return data;
  // },

  // async upsert(table, data) {
  //   const sb = this._client();
  //   const { error } = await sb.from(table).upsert(data, { onConflict: 'id' });
  //   if (error) throw error;
  // },

  // async delete(table, id) {
  //   const sb = this._client();
  //   const { error } = await sb.from(table).delete().eq('id', id);
  //   if (error) throw error;
  // },

  // ── FIREBASE FIRESTORE (descomente se usar Firebase) ──

  // async select(table, userId) {
  //   const { collection, query, where, getDocs } = window.firestore;
  //   const db = window._firebaseInstances.db;
  //   const q = query(collection(db, table), where("user_id", "==", userId));
  //   const snapshot = await getDocs(q);
  //   return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  // },

  // async upsert(table, data) {
  //   const { doc, setDoc, collection } = window.firestore;
  //   const db = window._firebaseInstances.db;
  //   await setDoc(doc(collection(db, table), data.id), data, { merge: true });
  // },

  // async delete(table, id) {
  //   const { doc, deleteDoc, collection } = window.firestore;
  //   const db = window._firebaseInstances.db;
  //   await deleteDoc(doc(collection(db, table), id));
  // },

  // ── API REST genérica (descomente se tiver API própria) ──

  // async select(table, userId) {
  //   const res = await fetch(`${FINWISE_CONFIG.baseUrl}/${table}?user_id=${userId}`, {
  //     headers: { 'Authorization': `Bearer ${await getToken()}` }
  //   });
  //   if (!res.ok) throw new Error(res.statusText);
  //   return res.json();
  // },

  // async upsert(table, data) {
  //   await fetch(`${FINWISE_CONFIG.baseUrl}/${table}`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getToken()}` },
  //     body: JSON.stringify(data),
  //   });
  // },

  // async delete(table, id) {
  //   await fetch(`${FINWISE_CONFIG.baseUrl}/${table}/${id}`, {
  //     method: 'DELETE',
  //     headers: { 'Authorization': `Bearer ${await getToken()}` }
  //   });
  // },

  // Stubs enquanto backend não está pronto
  async select() { return null; },
  async upsert() { return null; },
  async delete() { return null; },
};

// ─────────────────────────────────────────
// REPOSITÓRIO DE DADOS
// Interface única para todos os dados do app.
// A dashboard usa apenas isso — não importa
// se está no localStorage ou no backend.
// ─────────────────────────────────────────

function localKey(table, userId) {
  return `fw_${table}_${userId}`;
}

async function syncRead(table) {
  const userId = FinWiseAuth.getUserId();
  const key = localKey(table, userId);

  // 1. Retorna local imediatamente
  let local;
  try { local = JSON.parse(localStorage.getItem(key)) || []; }
  catch { local = []; }

  // 2. Busca backend em background (sem bloquear UI)
  if (backendDisponivel() && navigator.onLine) {
    BackendAdapter.select(table, userId).then(remote => {
      if (!remote) return;
      // Merge: remoto ganha em caso de conflito (last-write-wins)
      localStorage.setItem(key, JSON.stringify(remote));
    }).catch(err => console.warn("[FinWise Sync] read error:", err));
  }

  return local;
}

async function syncWrite(table, records) {
  const userId = FinWiseAuth.getUserId();
  const key = localKey(table, userId);

  // Salva localmente sempre
  localStorage.setItem(key, JSON.stringify(records));

  // Envia pro backend
  if (backendDisponivel()) {
    if (navigator.onLine) {
      try {
        await BackendAdapter.upsert(table, { user_id: userId, data: records });
      } catch (err) {
        // Se falhar, enfileira para tentar depois
        SyncQueue.push({ method: "upsert", table, data: { user_id: userId, data: records } });
        console.warn("[FinWise Sync] write queued:", err);
      }
    } else {
      SyncQueue.push({ method: "upsert", table, data: { user_id: userId, data: records } });
    }
  }
}

// ─────────────────────────────────────────
// API PÚBLICA — mesma interface do api.js atual
// Troque os imports do dashboard.js para cá
// quando o backend estiver pronto.
// ─────────────────────────────────────────

// ── Salário ──
export async function getSalary() {
  const userId = FinWiseAuth.getUserId();
  return Number(localStorage.getItem(`fw_salary_${userId}`)) || 0;
}

export async function updateSalary(value) {
  const userId = FinWiseAuth.getUserId();
  localStorage.setItem(`fw_salary_${userId}`, String(value));
  if (backendDisponivel() && navigator.onLine) {
    BackendAdapter.upsert("profiles", { user_id: userId, salary: value }).catch(console.warn);
  }
  return true;
}

// ── Transações ──
export async function fetchTransactions() {
  return syncRead("transactions");
}

export async function createTransaction(transaction) {
  const transactions = await fetchTransactions();
  transaction.id = String(Date.now());
  transaction.created_at = new Date().toISOString();
  transactions.push(transaction);
  await syncWrite("transactions", transactions);
  return transaction;
}

export async function deleteTransaction(id) {
  let transactions = await fetchTransactions();
  transactions = transactions.filter(t => String(t.id) !== String(id));
  await syncWrite("transactions", transactions);
}

// ── Metas ──
export async function fetchGoals() {
  return syncRead("goals");
}

export async function createGoal(goal) {
  const goals = await fetchGoals();
  goal.id = String(Date.now());
  goal.status = goal.status || "em_andamento";
  goal.created_at = new Date().toISOString();
  goals.push(goal);
  await syncWrite("goals", goals);
  return goal;
}

export async function updateGoalAmount(id, amountToAdd) {
  const goals = await fetchGoals();
  const goal = goals.find(g => String(g.id) === String(id));
  if (!goal) throw new Error("Meta não encontrada");
  goal.currentAmount = (goal.currentAmount || 0) + amountToAdd;
  if (goal.currentAmount >= goal.targetAmount) goal.status = "concluida";
  goal.updated_at = new Date().toISOString();
  await syncWrite("goals", goals);
  return goal;
}

export async function updateGoalStatus(id, newStatus) {
  const goals = await fetchGoals();
  const goal = goals.find(g => String(g.id) === String(id));
  if (!goal) throw new Error("Meta não encontrada");
  goal.status = newStatus;
  goal.updated_at = new Date().toISOString();
  await syncWrite("goals", goals);
  return goal;
}

export async function deleteGoal(id) {
  let goals = await fetchGoals();
  goals = goals.filter(g => String(g.id) !== String(id));
  await syncWrite("goals", goals);
}

// ── Desafio em Grupo (desafio-grupo.html) ──
export async function fetchDesafioState() {
  const userId = FinWiseAuth.getUserId();
  const local = JSON.parse(localStorage.getItem(`fw_desafio_state`)) || {};
  return local;
}

export async function saveDesafioState(state) {
  const userId = FinWiseAuth.getUserId();
  localStorage.setItem("fw_desafio_state", JSON.stringify(state));
  if (backendDisponivel() && navigator.onLine) {
    BackendAdapter.upsert("desafio_state", { user_id: userId, ...state }).catch(console.warn);
  }
}

// ── Resumo ──
export async function fetchSummary() {
  const salary = await getSalary();
  const transactions = await fetchTransactions();
  const now = new Date();

  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income = monthTransactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const expenses = monthTransactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = salary + income - expenses;

  const categories = {};
  monthTransactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
    });

  return { salary, income, expenses, balance, categories };
}

// ── Status de conexão ──
export function getConnectionStatus() {
  return {
    online: navigator.onLine,
    backendConfigured: backendDisponivel(),
    pendingSyncs: SyncQueue.get().length,
  };
}

// ─────────────────────────────────────────
// SCHEMA SUPABASE (cole no SQL Editor)
// ─────────────────────────────────────────
//
// TODO para o dev Android — execute isso no Supabase:
//
// -- Habilitar RLS em todas as tabelas
//
// create table profiles (
//   user_id uuid primary key references auth.users(id),
//   salary numeric default 0,
//   updated_at timestamptz default now()
// );
//
// create table transactions (
//   id text primary key,
//   user_id uuid references auth.users(id),
//   type text,           -- 'income' | 'expense'
//   amount numeric,
//   category text,
//   description text,
//   date date,
//   created_at timestamptz default now()
// );
//
// create table goals (
//   id text primary key,
//   user_id uuid references auth.users(id),
//   title text,
//   targetAmount numeric,
//   currentAmount numeric default 0,
//   status text default 'em_andamento',
//   deadline date,
//   created_at timestamptz default now(),
//   updated_at timestamptz default now()
// );
//
// create table desafio_state (
//   user_id uuid primary key references auth.users(id),
//   streak int default 0,
//   last_checkin date,
//   start_date date,
//   dias jsonb,
//   nickname text,
//   conquistas jsonb,
//   updated_at timestamptz default now()
// );
//
// -- Políticas RLS (cada usuário só vê seus dados)
// alter table profiles enable row level security;
// alter table transactions enable row level security;
// alter table goals enable row level security;
// alter table desafio_state enable row level security;
//
// create policy "user_own" on profiles for all using (auth.uid() = user_id);
// create policy "user_own" on transactions for all using (auth.uid() = user_id);
// create policy "user_own" on goals for all using (auth.uid() = user_id);
// create policy "user_own" on desafio_state for all using (auth.uid() = user_id);