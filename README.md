# 💸 FinWise — Educação Financeira Inteligente

> Plataforma web completa de educação e organização financeira pessoal, com dashboard interativo, controle de transações e autenticação segura via Firebase.

---

## 📋 Sobre o Projeto

O **FinWise** é uma aplicação web fullstack voltada para educação financeira. Ele permite que usuários cadastrem receitas e despesas, acompanhem seu saldo em tempo real por meio de gráficos interativos e consumam conteúdo educacional sobre finanças pessoais e investimentos.

---

## ✨ Funcionalidades

- **Página Inicial** — apresentação da plataforma com animações, depoimentos de usuários e estatísticas em tempo real
- **Autenticação** — cadastro e login com e-mail/senha ou conta Google, gerenciados pelo Firebase Authentication
- **Dashboard** — resumo financeiro com salário, receitas, despesas, saldo e gráficos de categorias (Chart.js)
- **Transações** — adição, listagem e exclusão de transações (receitas e despesas) por categoria
- **Recursos** — página com conteúdo educacional sobre finanças
- **Sobre** — página institucional com referências a investidores renomados (Warren Buffett, Luiz Barsi, Nath Finanças)
- **Contato** — formulário de contato para suporte
- **Modo Escuro** — alternância de tema claro/escuro em todas as páginas

---

## 🗂️ Estrutura do Projeto

```
FinWise_final/
├── JS/
│   ├── index.html              # Página inicial
│   ├── style.css               # Estilos globais
│   ├── script.js               # Scripts globais
│   ├── app.js                  # Servidor Node.js (Express)
│   ├── auth/
│   │   ├── firebase.js         # Configuração do Firebase (client-side)
│   │   └── check-auth.js       # Verificação de autenticação
│   ├── Pages/
│   │   ├── Dashboard/          # Dashboard financeiro
│   │   ├── Login/              # Telas de login e registro
│   │   ├── Recurso/            # Página de recursos educacionais
│   │   ├── Sobre/              # Página institucional
│   │   └── Contato/            # Página de contato
│   └── Images/                 # Imagens e assets
├── database.sqlite             # Banco de dados SQLite
├── package.json
└── .env                        # Variáveis de ambiente (não versionar)
```

---

## 🛠️ Tecnologias Utilizadas

| Camada      | Tecnologia                        |
|-------------|-----------------------------------|
| Frontend    | HTML5, CSS3, JavaScript (ES Modules) |
| Backend     | Node.js, Express.js               |
| Banco de dados | SQLite (via `sqlite3` + `sqlite`) |
| Autenticação | Firebase Authentication + Firebase Admin SDK |
| Gráficos    | Chart.js                          |
| Animações   | Animate.css, AOS                  |
| Ícones      | Font Awesome 6                    |
| Tipografia  | Google Fonts (Poppins)            |

---

## 🔐 Autenticação e Segurança

- Login com **e-mail/senha** e **Google OAuth** via Firebase Authentication
- O backend valida o **Firebase ID Token** (JWT) em cada requisição protegida via middleware `firebaseAuthMiddleware`
- Sessões gerenciadas com `express-session`, com cookies `httpOnly` e `sameSite: strict`
- As credenciais do Firebase Admin são carregadas exclusivamente via variáveis de ambiente (`.env`), nunca expostas no código

---

## 🗃️ Banco de Dados

O projeto usa **SQLite** com três tabelas principais:

- `users` — armazena e-mail e `firebase_uid` de cada usuário
- `salary` — salário atual do usuário (um registro por usuário)
- `transactions` — histórico de transações (receitas e despesas) com tipo, descrição, valor, categoria e data

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- Conta no [Firebase](https://firebase.google.com/) com um projeto criado

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/andresrp4/Project_DensenvolvimentoWeb.git
   cd Project_DensenvolvimentoWeb
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   Crie um arquivo `.env` na raiz do projeto com as credenciais do Firebase Admin SDK:
   ```env
   FIREBASE_TYPE=service_account
   FIREBASE_PROJECT_ID=seu_project_id
   FIREBASE_PRIVATE_KEY_ID=seu_private_key_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=seu_client_email
   FIREBASE_CLIENT_ID=seu_client_id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_CERT_URL=seu_client_cert_url
   FIREBASE_UNIVERSE_DOMAIN=googleapis.com
   ```

4. **Atualize a configuração do Firebase no frontend:**

   Em `JS/auth/firebase.js`, preencha o objeto `firebaseConfig` com as credenciais do seu projeto Firebase (disponíveis no Console do Firebase → Configurações do projeto → SDK).

5. **Inicie o servidor:**
   ```bash
   npm start
   ```
   Ou, para desenvolvimento com hot-reload:
   ```bash
   npm run dev
   ```

6. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

---

## 🔌 API REST

Todas as rotas abaixo exigem o header `Authorization: Bearer <firebase_id_token>`.

| Método | Rota                    | Descrição                        |
|--------|-------------------------|----------------------------------|
| POST   | `/api/salary`           | Cadastra ou atualiza o salário   |
| GET    | `/api/transactions`     | Lista todas as transações        |
| POST   | `/api/transactions`     | Adiciona uma nova transação      |
| DELETE | `/api/transactions/:id` | Remove uma transação por ID      |
| GET    | `/api/summary`          | Retorna resumo financeiro completo |

---

## ⚠️ Atenção

- O arquivo `.env` **não deve ser versionado** (já está no `.gitignore`). Ele contém credenciais sensíveis do Firebase Admin.
- O `database.sqlite` gerado localmente também não deve ser enviado para o repositório em produção.

---

## 📄 Licença

Este projeto foi desenvolvido como trabalho acadêmico. Todos os direitos reservados © 2025 FinWise.
