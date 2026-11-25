
const express = require('express');

const session = require('express-session'); 
const PgStore = require('connect-pg-simple')(session); 
const bd = require('./conexao'); 

const rota_usuario = require('./routes/usuarios');
const rota_categoria = require('./routes/categorias');
const rota_produto = require('./routes/produtos');
const rota_movimentacao = require('./routes/movimentacoes');
const rota_painel = require('./routes/painel');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

const app = express();
const port = 3000;

// Configuração do layout padrão
app.use(expressLayouts);
app.set('layout', 'layouts/principal');

// Configuração do EJS
app.set('view engine', 'ejs');

// Arquivos estáticos
app.use(express.static('public'));

// Recebimento de dados
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Configuração da sessão
// app.use(
//     session({
//         secret: process.env.SESSION_KEY,
//         resave: false,
//         saveUninitialized: false,
//         cookie: { maxAge: 900000 }
//     })
// );
app.set('trust proxy', 1); 
app.use(session({ 
    store: new PgStore({ pool: bd, tableName: 'session', 
        pruneSessionInterval: false }), 
    secret: process.env.SESSION_KEY, 
    resave: false, 
    saveUninitialized: false, 
    cookie: { 
        maxAge: 900000, 
        httpOnly: true, 
        sameSite: 'lax', 
        secure: process.env.VERCEL === '1' 
    } 
})); 


// 2. Disponibiliza o usuário logado para o EJS
app.use((req, res, next) => {
    res.locals.usuarioLogado = req.session.user || null;
    next();
});

// 3. Configuração das rotas
app.use('/usuarios', rota_usuario);
app.use('/categorias', rota_categoria);
app.use('/produtos', rota_produto);
app.use('/movimentacoes', rota_movimentacao);
app.use('/painel', rota_painel);

// Rota inicial
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/painel');
    } else {
        res.render('index', {
            mensagem: 'Bem-vindo ao Armazém Minecraft!'
        });
    }
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send('Erro ao encerrar a sessão.');
        }

        res.clearCookie('connect.sid');
        res.redirect('/usuarios/login');
    });
});

// Inicialização do servidor
// app.listen(port, () => {
//     console.log(`Servidor executando em: http://localhost:${port}`);
// });
if (require.main === module && !process.env.VERCEL) { 
    app.listen(process.env.PORT || 3000); 
} 
module.exports = app; 