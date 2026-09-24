const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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

                resolve();
            });
        });
    });
}

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
