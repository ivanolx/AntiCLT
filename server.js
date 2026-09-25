const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'database.sqlite');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        console.error('Erro ao abrir banco de dados:', error.message);
        process.exit(1);
    }

    console.log('Banco SQLite conectado em:', dbPath);
});

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS pessoas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    endereco TEXT NOT NULL,
                    cep TEXT,
                    telefone TEXT NOT NULL,
                    servico TEXT NOT NULL,
                    dataCadastro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `, (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                db.run(`
                    CREATE TABLE IF NOT EXISTS contatos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        profissional TEXT NOT NULL,
                        servico TEXT NOT NULL,
                        cliente TEXT NOT NULL,
                        telefone TEXT NOT NULL,
                        mensagem TEXT NOT NULL,
                        dataContato TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                `, (contatoError) => {
                    if (contatoError) {
                        reject(contatoError);
                        return;
                    }

                    db.run(`
                        CREATE TABLE IF NOT EXISTS diarias (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            categoria TEXT NOT NULL,
                            servico TEXT NOT NULL,
                            titulo TEXT NOT NULL,
                            descricao TEXT NOT NULL,
                            contratante TEXT NOT NULL,
                            telefone TEXT NOT NULL,
                            local TEXT NOT NULL,
                            regiao TEXT NOT NULL,
                            data TEXT NOT NULL,
                            pagamento TEXT NOT NULL,
                            imagem TEXT NOT NULL,
                            dataPublicacao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                        )
                    `, (diariaError) => {
                        if (diariaError) {
                            reject(diariaError);
                            return;
                        }

                        db.run(`
                            CREATE TABLE IF NOT EXISTS usuarios (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                nome TEXT NOT NULL,
                                email TEXT NOT NULL UNIQUE,
                                senha TEXT NOT NULL,
                                dataCadastro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                            )
                        `, (usuarioError) => {
                            if (usuarioError) {
                                reject(usuarioError);
                                return;
                            }

                            resolve();
                        });
                    });
                });
            });
        });
    });
}

function hashSenha(senha) {
    return crypto.createHash('sha256').update(senha).digest('hex');
}

function validarCadastro(dados) {
    const pessoa = validarPessoa(dados);
    const email = String(dados.email || '').trim().toLowerCase();
    const senha = String(dados.senha || '');

    if (!pessoa || !email || senha.length < 6) {
        return false;
    }

    return { ...pessoa, email, senha };
}

app.post('/api/auth/register', (req, res) => {
    const cadastroValido = validarCadastro(req.body);

    if (!cadastroValido) {
        return res.status(400).json({ error: 'Preencha os campos e use uma senha com pelo menos 6 caracteres.' });
    }

    const { nome, endereco, cep, telefone, servico, email, senha } = cadastroValido;

    db.run(
        'INSERT INTO usuarios (nome, email, senha, dataCadastro) VALUES (?, ?, ?, ?)',
        [nome, email, hashSenha(senha), new Date().toISOString()],
        function (usuarioError) {
            if (usuarioError) {
                if (usuarioError.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
                }

                return res.status(500).json({ error: 'Erro ao criar conta.' });
            }

            db.run(
                'INSERT INTO pessoas (nome, endereco, cep, telefone, servico, dataCadastro) VALUES (?, ?, ?, ?, ?, ?)',
                [nome, endereco, cep, telefone, servico, new Date().toISOString()],
                (pessoaError) => {
                    if (pessoaError) {
                        return res.status(500).json({ error: 'Conta criada, mas não foi possível salvar o perfil.' });
                    }

                    res.status(201).json({ id: this.lastID, nome, email });
                }
            );
        }
    );
});

app.post('/api/auth/login', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');

    if (!email || !senha) {
        return res.status(400).json({ error: 'Informe seu e-mail e sua senha.' });
    }

    db.get(
        'SELECT id, nome, email FROM usuarios WHERE email = ? AND senha = ?',
        [email, hashSenha(senha)],
        (error, usuario) => {
            if (error) {
                return res.status(500).json({ error: 'Erro ao entrar na conta.' });
            }

            if (!usuario) {
                return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            }

            res.json({ message: 'Login realizado com sucesso.', usuario });
        }
    );
});

function validarContato(dados) {
    const profissional = String(dados.profissional || '').trim();
    const servico = String(dados.servico || '').trim();
    const cliente = String(dados.cliente || '').trim();
    const telefone = String(dados.telefone || '').trim();
    const mensagem = String(dados.mensagem || '').trim();

    if (!profissional || !servico || !cliente || !telefone || !mensagem) {
        return false;
    }

    return { profissional, servico, cliente, telefone, mensagem };
}

app.post('/api/contatos', (req, res) => {
    const contatoValido = validarContato(req.body);

    if (!contatoValido) {
        return res.status(400).json({ error: 'Preencha todos os campos do contato.' });
    }

    const { profissional, servico, cliente, telefone, mensagem } = contatoValido;

    db.run(
        'INSERT INTO contatos (profissional, servico, cliente, telefone, mensagem, dataContato) VALUES (?, ?, ?, ?, ?, ?)',
        [profissional, servico, cliente, telefone, mensagem, new Date().toISOString()],
        function (error) {
            if (error) {
                return res.status(500).json({ error: 'Erro ao enviar contato.' });
            }

            res.status(201).json({
                id: this.lastID,
                message: 'Contato enviado com sucesso.'
            });
        }
    );
});

function validarDiaria(dados) {
    const categoria = String(dados.categoria || '').trim();
    const servico = String(dados.servico || '').trim();
    const titulo = String(dados.titulo || '').trim();
    const descricao = String(dados.descricao || '').trim();
    const contratante = String(dados.contratante || 'Anunciante').trim();
    const telefone = String(dados.telefone || '').trim();
    const local = String(dados.local || '').trim();
    const regiao = String(dados.regiao || '').trim();
    const data = String(dados.data || '').trim();
    const pagamento = String(dados.pagamento || '').trim();

    if (!categoria || !servico || !titulo || !descricao || !telefone || !local || !regiao || !data || !pagamento) {
        return false;
    }

    return {
        categoria,
        servico,
        titulo,
        descricao,
        contratante: contratante || 'Anunciante',
        telefone,
        local,
        regiao,
        data,
        pagamento,
        imagem: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600'
    };
}

app.get('/api/diarias', (req, res) => {
    db.all('SELECT * FROM diarias ORDER BY id DESC', (error, rows) => {
        if (error) {
            return res.status(500).json({ error: 'Erro ao listar diárias publicadas.' });
        }

        res.json(rows);
    });
});

app.post('/api/diarias', (req, res) => {
    const diariaValida = validarDiaria(req.body);

    if (!diariaValida) {
        return res.status(400).json({ error: 'Preencha todos os campos da diária.' });
    }

    const { categoria, servico, titulo, descricao, contratante, telefone, local, regiao, data, pagamento, imagem } = diariaValida;

    db.run(
        `INSERT INTO diarias
        (categoria, servico, titulo, descricao, contratante, telefone, local, regiao, data, pagamento, imagem, dataPublicacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [categoria, servico, titulo, descricao, contratante, telefone, local, regiao, data, pagamento, imagem, new Date().toISOString()],
        function (error) {
            if (error) {
                return res.status(500).json({ error: 'Erro ao publicar diária.' });
            }

            res.status(201).json({ id: this.lastID, ...diariaValida });
        }
    );
});

function validarPessoa(dados) {
    const nome = String(dados.nome || '').trim();
    const endereco = String(dados.endereco || '').trim();
    const telefone = String(dados.telefone || '').trim();
    const servico = String(dados.servico || '').trim();

    if (!nome || !endereco || !telefone || !servico) {
        return false;
    }

    return { nome, endereco, cep: String(dados.cep || '').trim(), telefone, servico };
}

app.get('/api/pessoas', (req, res) => {
    db.all('SELECT * FROM pessoas ORDER BY id DESC', (error, rows) => {
        if (error) {
            return res.status(500).json({ error: 'Erro ao listar pessoas.' });
        }

        res.json(rows);
    });
});

app.get('/api/pessoas/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM pessoas WHERE id = ?', [id], (error, row) => {
        if (error) {
            return res.status(500).json({ error: 'Erro ao buscar pessoa.' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Pessoa não encontrada.' });
        }

        res.json(row);
    });
});

app.post('/api/pessoas', (req, res) => {
    const dadosValidos = validarPessoa(req.body);

    if (!dadosValidos) {
        return res.status(400).json({ error: 'Preencha os campos obrigatórios.' });
    }

    const { nome, endereco, cep, telefone, servico } = dadosValidos;

    db.run(
        'INSERT INTO pessoas (nome, endereco, cep, telefone, servico, dataCadastro) VALUES (?, ?, ?, ?, ?, ?)',
        [nome, endereco, cep, telefone, servico, new Date().toISOString()],
        function (error) {
            if (error) {
                return res.status(500).json({ error: 'Erro ao salvar pessoa.' });
            }

            res.status(201).json({
                id: this.lastID,
                nome,
                endereco,
                cep,
                telefone,
                servico,
                dataCadastro: new Date().toISOString()
            });
        }
    );
});

app.put('/api/pessoas/:id', (req, res) => {
    const pessoaId = Number(req.params.id);
    const dadosValidos = validarPessoa(req.body);

    if (!dadosValidos) {
        return res.status(400).json({ error: 'Preencha os campos obrigatórios.' });
    }

    const { nome, endereco, cep, telefone, servico } = dadosValidos;

    db.run(
        'UPDATE pessoas SET nome = ?, endereco = ?, cep = ?, telefone = ?, servico = ? WHERE id = ?',
        [nome, endereco, cep, telefone, servico, pessoaId],
        function (error) {
            if (error) {
                return res.status(500).json({ error: 'Erro ao atualizar pessoa.' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Pessoa não encontrada.' });
            }

            res.json({ id: pessoaId, nome, endereco, cep, telefone, servico });
        }
    );
});

app.delete('/api/pessoas/:id', (req, res) => {
    const pessoaId = Number(req.params.id);

    db.run('DELETE FROM pessoas WHERE id = ?', [pessoaId], function (error) {
        if (error) {
            return res.status(500).json({ error: 'Erro ao excluir pessoa.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Pessoa não encontrada.' });
        }

        res.json({ message: 'Pessoa excluída com sucesso.' });
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
});

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Erro ao inicializar o banco:', error.message);
        process.exit(1);
    });
