import express from 'express';
import session from 'express-session';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { createRequire } from 'module';

// Carrega variáveis de ambiente do arquivo .env
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config();

// Importações do Firebase Admin
import admin from 'firebase-admin';

// Configuração do diretório
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// INICIALIZAÇÃO DO FIREBASE ADMIN via variáveis de ambiente
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  })
});

// Configurações CORS
app.set('trust proxy', 1);
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Configuração de sessão
app.use(session({
    secret: 'finwise_seguro_123!@#',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: false,
        httpOnly: true,
        sameSite: 'strict'
    }
}));

// Banco de dados
let db;
(async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            firebase_uid TEXT UNIQUE
        );
        CREATE TABLE IF NOT EXISTS salary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            amount REAL NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (firebase_uid)
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            date TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (firebase_uid)
        );
    `);
})();

// MIDDLEWARE DE AUTENTICAÇÃO FIREBASE
const firebaseAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Não autorizado: Token não fornecido' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.session.userId = decodedToken.uid;
        
        let user = await db.get('SELECT * FROM users WHERE firebase_uid = ?', decodedToken.uid);
        if (!user) {
            await db.run('INSERT INTO users (email, firebase_uid) VALUES (?, ?)', decodedToken.email, decodedToken.uid);
        }

        next();
    } catch (error) {
        console.error('Erro ao verificar token Firebase:', error);
        return res.status(401).json({ success: false, error: 'Não autorizado: Token inválido' });
    }
};

// ========== ROTAS DA API (PROTEGIDAS) ==========

app.post('/api/salary', firebaseAuthMiddleware, async (req, res) => {
    const { amount } = req.body;
    const userId = req.session.userId;

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Valor de salário inválido' });
    }

    try {
        await db.run(
            'INSERT INTO salary (user_id, amount) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET amount = excluded.amount',
            [userId, amount]
        );
        res.json({ success: true, salary: amount });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erro ao salvar salário' });
    }
});

app.post('/api/transactions', firebaseAuthMiddleware, async (req, res) => {
    const { type, description, amount, category, date } = req.body;
    const userId = req.session.userId;

    if (!type || !description || !amount || !date) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios faltando' });
    }

    try {
        const result = await db.run(
            'INSERT INTO transactions (user_id, type, description, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, type, description, amount, category, date]
        );
        res.json({ success: true, id: result.lastID });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erro ao adicionar transação' });
    }
});

app.get('/api/transactions', firebaseAuthMiddleware, async (req, res) => {
    const userId = req.session.userId;
    try {
        const transactions = await db.all(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
            [userId]
        );
        res.json({ success: true, transactions });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erro ao buscar transações' });
    }
});

app.delete('/api/transactions/:id', firebaseAuthMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;
    try {
        const result = await db.run(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Transação não encontrada' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erro ao deletar transação' });
    }
});

app.get('/api/summary', firebaseAuthMiddleware, async (req, res) => {
    const userId = req.session.userId;
    try {
        const salary = await db.get('SELECT amount FROM salary WHERE user_id = ?', userId);
        const income = await db.get('SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "income"', userId);
        const expenses = await db.get('SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense"', userId);
        
        const categoriesResult = await db.all(
            'SELECT category, SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense" GROUP BY category',
            userId
        );
        
        const categories = categoriesResult.reduce((acc, row) => {
            acc[row.category] = row.total;
            return acc;
        }, {});
        
        res.json({
            success: true,
            summary: {
                salary: salary?.amount || 0,
                income: (salary?.amount || 0) + (income.total || 0),
                expenses: expenses.total || 0,
                balance: (salary?.amount || 0) + (income.total || 0) - (expenses.total || 0),
                categories
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erro ao calcular resumo' });
    }
});

// ========== FUNÇÕES ==========
const serveRoot = (file) => (req, res) => {
  res.sendFile(path.join(__dirname, file));
};

const servePage = (folder, file) => (req, res) => {
  res.sendFile(path.join(__dirname, 'Pages', folder, file));
};

// ========== ROTAS PARA PÁGINAS HTML ==========

app.get('/', serveRoot('index.html'));
app.get('/index.html', serveRoot('index.html'));

app.get('/login.html', servePage('Login', 'login.html'));
app.get('/contato.html', servePage('Contato', 'contato.html'));
app.get('/sobre.html', servePage('Sobre', 'sobre.html'));

app.get('/dashboard.html', servePage('Dashboard', 'dashboard.html'));
app.get('/recurso.html', servePage('Recurso', 'recurso.html'));
app.get('/videos.html', servePage('Dashboard', 'videos.html'));
app.get('/pesquisa.html', servePage('Dashboard', 'pesquisa.html'));

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🟢 Servidor FinWise rodando na porta ${PORT}`);
    console.log(`\n🔗 URLs importantes:`);
    console.log(`- Página inicial: http://localhost:${PORT}`);
    console.log('🌐 Rede Local: http://seuIp(ipconfig):3000');
});
