Markdown
# AntiCLT

Plataforma web para conectar profissionais autonomos, pessoas que precisam de servicos e oportunidades de trabalho por diaria.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- SQLite

## Requisitos

- Node.js instalado
- npm disponivel no terminal

## Como instalar

Na pasta do projeto, execute:

```powershell
npm install
```

## Como executar

Inicie o servidor:

```powershell
npm start
```

Depois abra no navegador:

```text
http://localhost:3000/index.html
```

O terminal precisa continuar aberto enquanto o site estiver sendo usado. O projeto deve ser acessado pelo servidor local, e nao abrindo os arquivos HTML diretamente, porque o cadastro, login, contatos e publicacao de diarias usam a API.

## Paginas principais

- `index.html`: pagina inicial e busca de oportunidades.
- `diarias.html`: mural de diarias publicadas, com busca e filtros.
- `publicar-diaria.html`: formulario para publicar uma diaria sem criar conta.
- `servicos.html`: profissionais disponiveis para contratacao.
- `cadastro.html`: cadastro de profissional e criacao de conta.
- `login.html`: entrada na conta cadastrada.
- `cadastros.html`: painel de cadastros salvos.
- `comofunciona.html`: explicacao do funcionamento da plataforma.

## Funcionalidades

- Cadastro de profissionais com e-mail e senha.
- Login com validacao de credenciais.
- Listagem e filtros de profissionais.
- Formulario de contato com profissionais.
- Publicacao anonima de diarias.
- Busca de diarias por servico, bairro e regiao.
- Cadastro, edicao e exclusao de pessoas no painel.
- Banco SQLite criado automaticamente pelo servidor.

## Banco de dados

O arquivo `database.sqlite` e criado ou atualizado quando o servidor inicia. As tabelas principais sao:

- `usuarios`: contas de acesso.
- `pessoas`: perfis de profissionais.
- `contatos`: mensagens enviadas aos profissionais.
- `diarias`: oportunidades publicadas.

O banco local pode conter dados de desenvolvimento e, por isso, nao deve ser usado como substituto do codigo da aplicacao. Em outro computador, execute `npm install` e `npm start`; o servidor cria as tabelas automaticamente.

## Roteiro rapido para demonstracao

1. Abra a pagina inicial.
2. Acesse `Encontrar Diarias` e use os filtros.
3. Publique uma diaria em `Publicar Diaria`.
4. Volte ao mural e veja a oportunidade publicada.
5. Acesse `Profissionais` e envie um contato.
6. Crie uma conta em `Cadastro` e teste o `Login`.

## Scripts npm

```powershell
npm start
npm run dev
```

Os dois scripts iniciam o servidor Express na porta `3000`.
