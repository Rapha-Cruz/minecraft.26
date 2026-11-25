const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const bd = require('../conexao');; // Importa a conexão com o banco

// Rota para a página de cadastro (HTML)
router.get('/login', (req, res) => {
    res.render('login', {
        mensagem: req.query.mensagem || null
    });
});

// Rota para processar o login (assumindo que o formulário envia dados JSON)
router.post('/login', async (req, res) => {
  const { usuario, senha} = req.body; // Desestruturação do objeto JSON enviado

  try {
    const resultado = await bd.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
    const usuarioSel = resultado.rows[0];
    if (usuarioSel && bcrypt.compareSync(senha, usuarioSel.senha)) {
      req.session.user = {
          id_usuario: usuarioSel.id_usuario,
          usuario: usuarioSel.usuario
      };

      res.redirect('/painel');
    } else {
      res.status(401).render('login', { mensagem: 'Usuário ou senha inválidos' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

// Rota para a página de cadastro (HTML)
router.get('/novo_usuario', (req, res) => {
  res.render('novo_usuario');
});

// Rota para processar o cadastro
router.post('/cadastro', async (req, res) => {
  const { usuario, nome, senha } = req.body;
  // Criptografar a senha antes de salvar no banco de dados
  const saltRounds = 10; // Número de rodadas de hash
  const senhaCripto = await bcrypt.hash(senha, saltRounds);  
  try {
    // Inserir o novo usuário no banco de dados
    await bd.query('INSERT INTO usuarios (usuario, nome, senha) VALUES ($1, $2, $3)', [usuario, nome, senhaCripto]);
    res.render('login', { mensagem: 'Usuário criado com sucesso!!!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao cadastrar usuário');
  }
});

//rota para a listagem de categorias
router.get('/listar', async (req, res) => {
  try {
    const mensagem = req.query.mensagem;

    if (!req.session.user || !req.session.user.usuario) {
      const mensagem = 'Você precisa estar logado para acessar esta página.';
      return res.redirect(`/usuarios/login?mensagem=${mensagem}`);
    }
    
    const resultado = await bd.query('SELECT id_usuario, nome, usuario FROM usuarios');
    res.render('usuario', {
      usuarios: resultado.rows,
      mensagem: mensagem
    });
  } catch (err) {
    res.status(500).send('Erro no servidor ao listar usuarios');
  }
});

//rota para a pesquisa de usuarios
router.post('/pesquisar', async (req, res) => {
  try {
    const { pesquisa } = req.body;
    
    // Consulta ao banco de dados com filtro usando ILIKE 
    const resultado = await bd.query(
      'SELECT id_usuario, nome, usuario FROM usuarios WHERE nome ILIKE $1',
      [`%${pesquisa}%`]
    );
    
    // Renderiza a página com os resultados da pesquisa
    res.render('usuario', {
      usuarios: resultado.rows,
      mensagem: ""
    });
    
  } catch (err) {
    res.status(500).send('Erro no servidor ao listar usuarios');
  }  
});

// Rota para abrir a página de alteração de um usuario específico
router.get('/alterar/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  try {
    // Consulta o usuario pelo ID para exibir seus dados na página de alteração
    const resultado = await bd.query('SELECT id_usuario, nome, usuario FROM usuarios WHERE id_usuario = $1', [id_usuario]);
    
    // Verifica se o usuario foi encontrado
    if (resultado.rows.length > 0) {
      res.render('alterar_usuario', { usuario: resultado.rows[0] });
    } else {
      res.status(404).send('Usuario não encontrado');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao abrir a página de alteração');
  }
});

// Rota para incluir a alteração de um usuario no banco de dados
router.post('/alterar/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  const { nome, usuario, senha } = req.body;
  
  try {
	if (senha) { 
    // Criptografar a senha antes de salvar no banco de dados
    const saltRounds = 10; // Número de rodadas de hash
    const senhaCripto = await bcrypt.hash(senha, saltRounds); 
    // Atualiza o usuario com o novo nome
    await bd.query('UPDATE usuarios SET nome = $1, usuario = $2, senha = $3 WHERE 		    id_usuario = $4', [nome, usuario, senhaCripto, id_usuario]);
    } else {     
       // Se deixou em branco, mantém a senha atual            
	   await bd.query('UPDATE usuarios SET nome = $1, usuario = $2 WHERE id_usuario = $3',  [nome, usuario, id_usuario]);
    }
    // Busca todos os usuários para exibir a lista atualizada
    const resultado = await bd.query('SELECT id_usuario, nome, usuario FROM usuarios');
    const mensagem = 'Usuário alterado com sucesso!';
    res.redirect(`/usuarios/listar?mensagem=${mensagem}`);
  } catch (err) {
   
    console.error(err);
    res.status(500).send('Erro ao alterar usuarios');
  }
});

// Rota para excluir um usuario usando POST
router.post('/excluir/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  
  try {
    // Executa a query para excluir o usuario pelo ID
    await bd.query('DELETE FROM usuarios WHERE id_usuario = $1', [id_usuario]);
    
    // Define a mensagem de sucesso em uma variável
    const mensagem = 'Usuario excluído com sucesso!';
    
    res.redirect(`/usuarios/listar?mensagem=${mensagem}`);
  } catch (err) {
    console.error('Erro ao excluir o usuario:', err);
    res.status(500).send('Erro no servidor ao excluir usuário');
  }
});  

module.exports = router; 
