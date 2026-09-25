document.addEventListener('DOMContentLoaded', async () => {
    const cadastroForm = document.getElementById('cadastro-form');
    const cadastroMessage = document.getElementById('cadastro-message');
    const cadastrosBody = document.getElementById('cadastros-body');
    const searchInput = document.getElementById('search-input');
    const categoryLinks = document.querySelectorAll('.cat-filter');
    const regionCheckboxes = document.querySelectorAll('.region-filter');
    const servicesGrid = document.getElementById('services-grid');
    const resultsCount = document.getElementById('results-count');
    const contactModal = document.getElementById('contact-modal');
    const contactForm = document.getElementById('contact-form');
    const contactProfessional = document.getElementById('contact-professional');
    const contactFeedback = document.getElementById('contact-feedback');
    const closeContactButton = document.getElementById('close-contact');
    let selectedContact = null;
    let activeContactButton = null;

    function formatarData(dataIso) {
        if (!dataIso) return '—';
        const data = new Date(dataIso);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    async function getPessoas() {
        try {
            const resposta = await fetch('/api/pessoas');
            if (!resposta.ok) throw new Error('API indisponível');
            return await resposta.json();
        } catch (error) {
            console.warn('Usando fallback localStorage para cadastros.');
            try {
                return JSON.parse(localStorage.getItem('anticltPessoas') || '[]');
            } catch (storageError) {
                console.error('Erro ao ler cadastros:', storageError);
                return [];
            }
        }
    }

    function salvarPessoasFallback(pessoas) {
        localStorage.setItem('anticltPessoas', JSON.stringify(pessoas));
    }

    function fecharContato() {
        if (contactModal) {
            contactModal.hidden = true;
        }
    }

    function abrirContato(service, button) {
        if (!contactModal || !contactForm) return;

        selectedContact = service;
        activeContactButton = button;
        contactForm.reset();
        contactFeedback.textContent = '';
        contactFeedback.className = 'contact-feedback';
        contactProfessional.textContent = `${service.profissional} - ${service.servico}`;
        contactModal.hidden = false;
        document.getElementById('contact-name')?.focus();
    }

    closeContactButton?.addEventListener('click', fecharContato);
    contactModal?.querySelector('[data-close-contact]')?.addEventListener('click', fecharContato);

    contactForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedContact) return;

        const dados = new FormData(contactForm);
        const payload = {
            profissional: selectedContact.profissional,
            servico: selectedContact.servico,
            cliente: dados.get('cliente'),
            telefone: dados.get('telefone'),
            mensagem: dados.get('mensagem')
        };

        const submitButton = contactForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const resposta = await fetch('/api/contatos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const resultado = await resposta.json().catch(() => ({}));

            if (!resposta.ok) throw new Error(resultado.error || 'Não foi possível enviar o contato.');

            contactFeedback.textContent = 'Contato enviado. O profissional poderá responder pelo WhatsApp informado.';
            contactFeedback.className = 'contact-feedback success';
            if (activeContactButton) {
                activeContactButton.innerHTML = '<i class="fa-solid fa-check"></i> Contato enviado';
                activeContactButton.classList.add('contacted');
            }
            contactForm.reset();
        } catch (error) {
            contactFeedback.textContent = error.message;
            contactFeedback.className = 'contact-feedback error';
        } finally {
            submitButton.disabled = false;
        }
    });

    if (cadastroForm) {
        const editId = new URLSearchParams(window.location.search).get('editar');
        const submitButton = cadastroForm.querySelector('button[type="submit"]');

        if (editId) {
            try {
                const resposta = await fetch(`/api/pessoas/${editId}`);
                if (resposta.ok) {
                    const pessoa = await resposta.json();
                    document.getElementById('nome').value = pessoa.nome || '';
                    document.getElementById('endereco').value = pessoa.endereco || '';
                    document.getElementById('cep').value = pessoa.cep || '';
                    document.getElementById('telefone').value = pessoa.telefone || '';
                    document.getElementById('servico').value = pessoa.servico || '';
                    if (submitButton) {
                        submitButton.textContent = 'Salvar Alterações';
                    }
                }
            } catch (error) {
                console.warn('Não foi possível carregar pessoa para edição.', error);
            }
        }

        cadastroForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nome = document.getElementById('nome')?.value.trim();
            const endereco = document.getElementById('endereco')?.value.trim();
            const cep = document.getElementById('cep')?.value.trim();
            const telefone = document.getElementById('telefone')?.value.trim();
            const servico = document.getElementById('servico')?.value;
            const email = document.getElementById('email')?.value.trim();
            const senha = document.getElementById('senha')?.value;
            const pessoaEditandoId = new URLSearchParams(window.location.search).get('editar');

            if (!nome || !endereco || !telefone || !servico) {
                if (cadastroMessage) {
                    cadastroMessage.textContent = 'Preencha os campos obrigatórios antes de continuar.';
                    cadastroMessage.className = 'cadastro-message error';
                }
                return;
            }

            const payload = { nome, endereco, cep, telefone, servico, email, senha };

            try {
                const metodo = pessoaEditandoId ? 'PUT' : 'POST';
                const url = pessoaEditandoId ? `/api/pessoas/${pessoaEditandoId}` : '/api/auth/register';
                const resposta = await fetch(url, {
                    method: metodo,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const resultado = await resposta.json().catch(() => ({}));

                if (!resposta.ok) {
                    throw new Error(resultado.error || 'Erro ao salvar cadastro.');
                }

                if (cadastroMessage) {
                    cadastroMessage.textContent = pessoaEditandoId
                        ? `Cadastro atualizado com sucesso para ${nome}!`
                        : `Cadastro realizado com sucesso para ${nome}!`;
                    cadastroMessage.className = 'cadastro-message success';
                }

                cadastroForm.reset();

                if (pessoaEditandoId && submitButton) {
                    submitButton.textContent = 'Criar Minha Conta';
                    window.history.replaceState({}, '', 'cadastro.html');
                }
            } catch (error) {
                if (cadastroMessage) {
                    cadastroMessage.textContent = error.message;
                    cadastroMessage.className = 'cadastro-message error';
                }
            }
        });
    }

    if (cadastrosBody) {
        async function renderCadastros() {
            const pessoas = await getPessoas();
            cadastrosBody.innerHTML = '';

            if (!pessoas.length) {
                cadastrosBody.innerHTML = `
                    <tr class="cadastro-row-empty">
                        <td colspan="7">Nenhuma pessoa cadastrada ainda.</td>
                    </tr>
                `;
                return;
            }

            pessoas.forEach((pessoa) => {
                const linha = document.createElement('tr');
                linha.innerHTML = `
                    <td>${pessoa.nome || '—'}</td>
                    <td>${pessoa.endereco || '—'}</td>
                    <td>${pessoa.cep || '—'}</td>
                    <td>${pessoa.telefone || '—'}</td>
                    <td>${pessoa.servico || '—'}</td>
                    <td>${formatarData(pessoa.dataCadastro)}</td>
                    <td class="actions-cell">
                        <button class="btn-edit" data-id="${pessoa.id}">Editar</button>
                        <button class="btn-delete" data-id="${pessoa.id}">Excluir</button>
                    </td>
                `;
                cadastrosBody.appendChild(linha);
            });

            cadastrosBody.querySelectorAll('.btn-edit').forEach((botao) => {
                botao.addEventListener('click', () => {
                    const id = botao.dataset.id;
                    window.location.href = `cadastro.html?editar=${id}`;
                });
            });

            cadastrosBody.querySelectorAll('.btn-delete').forEach((botao) => {
                botao.addEventListener('click', async () => {
                    const id = Number(botao.dataset.id);
                    const pessoa = pessoas.find(item => Number(item.id) === id);

                    if (!pessoa) return;

                    const confirmar = window.confirm(`Deseja excluir o cadastro de ${pessoa.nome}?`);
                    if (!confirmar) return;

                    try {
                        const resposta = await fetch(`/api/pessoas/${id}`, { method: 'DELETE' });
                        if (!resposta.ok) throw new Error('Erro ao excluir cadastro.');
                        renderCadastros();
                    } catch (error) {
                        console.error(error);
                        salvarPessoasFallback(pessoas.filter(item => Number(item.id) !== id));
                        renderCadastros();
                    }
                });
            });
        }

        renderCadastros();
    }

    if (!servicesGrid) {
        return;
    }

    let selectedCategory = 'todos';
    let serviceCards = [];

    function createServiceCard(service) {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.dataset.category = service.categoria;
        card.dataset.location = service.regiao;

        const cardImage = document.createElement('div');
        cardImage.className = 'card-img';

        const image = document.createElement('img');
        image.src = service.imagem;
        image.alt = service.servico;
        cardImage.appendChild(image);

        const cardInfo = document.createElement('div');
        cardInfo.className = 'card-info';

        const tag = document.createElement('span');
        tag.className = 'service-tag';
        tag.textContent = service.servico.toUpperCase();

        const professional = document.createElement('h3');
        professional.textContent = service.profissional;

        const cardMeta = document.createElement('div');
        cardMeta.className = 'card-meta';

        const location = document.createElement('span');
        location.className = 'location';
        location.innerHTML = '<i class="fa-solid fa-location-dot"></i> ';
        location.append(service.local);

        const rating = document.createElement('span');
        rating.className = 'rating';
        rating.innerHTML = '<i class="fa-solid fa-star"></i> ';
        rating.append(service.nota);

        cardMeta.append(location, rating);

        const contactButton = document.createElement('button');
        contactButton.type = 'button';
        contactButton.className = 'contact-button';
        contactButton.innerHTML = '<i class="fa-solid fa-comment-dots"></i> Contatar profissional';
        contactButton.addEventListener('click', () => {
            abrirContato(service, contactButton);
        });

        cardInfo.append(tag, professional, cardMeta, contactButton);
        card.append(cardImage, cardInfo);

        return card;
    }

    function filterServices() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedRegions = Array.from(regionCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        let visibleCount = 0;

        serviceCards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            const matchesCategory = selectedCategory === 'todos'
                || card.dataset.category === selectedCategory;
            const matchesSearch = cardText.includes(searchTerm);
            const matchesRegion = selectedRegions.length === 0
                || selectedRegions.includes(card.dataset.location);
            const isVisible = matchesCategory && matchesSearch && matchesRegion;

            card.style.display = isVisible ? '' : 'none';
            if (isVisible) {
                visibleCount++;
            }
        });

        if (resultsCount) {
            resultsCount.textContent = `Mostrando ${visibleCount} profissional(is) encontrado(s)`;
        }
    }

    categoryLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            categoryLinks.forEach(categoryLink => categoryLink.classList.remove('active-cat'));
            link.classList.add('active-cat');
            selectedCategory = link.dataset.category;
            filterServices();
        });
    });

    searchInput?.addEventListener('input', filterServices);
    regionCheckboxes.forEach(checkbox => checkbox.addEventListener('change', filterServices));

    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('busca');
    if (searchParam && searchInput) {
        searchInput.value = searchParam;
    }

    try {
        const response = await fetch('servicos.json');
        if (!response.ok) {
            throw new Error(`Falha ao carregar serviços: ${response.status}`);
        }

        const services = await response.json();
        services.forEach(service => servicesGrid.appendChild(createServiceCard(service)));
        serviceCards = Array.from(servicesGrid.querySelectorAll('.service-card'));
        filterServices();
    } catch (error) {
        console.error(error);
        if (resultsCount) {
            resultsCount.textContent = 'Não foi possível carregar os serviços.';
        }
    }
});