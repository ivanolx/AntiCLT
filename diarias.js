document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('diarias-grid');
    const searchInput = document.getElementById('diarias-search');
    const categorySelect = document.getElementById('diarias-category');
    const regionSelect = document.getElementById('diarias-region');
    const count = document.getElementById('diarias-count');

    function createDiariaCard(diaria) {
        const card = document.createElement('article');
        card.className = 'diaria-card';
        card.dataset.category = diaria.categoria;
        card.dataset.region = diaria.regiao;
        card.innerHTML = `
            <img src="${diaria.imagem}" alt="${diaria.servico}">
            <div class="diaria-info">
                <span class="diaria-tag">${diaria.servico}</span>
                <h2>${diaria.titulo}</h2>
                <p class="diaria-description">${diaria.descricao}</p>
                <div class="diaria-details">
                    <span><i class="fa-solid fa-location-dot"></i>${diaria.local}</span>
                    <span><i class="fa-regular fa-calendar"></i>${diaria.data}</span>
                    <strong><i class="fa-solid fa-wallet"></i>${diaria.pagamento}</strong>
                </div>
                <div class="diaria-footer">
                    <span>Publicado por ${diaria.contratante}</span>
                    <button type="button" class="interest-button">Tenho interesse</button>
                </div>
            </div>
        `;
        return card;
    }

    function renderDiarias(diarias) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const category = categorySelect.value;
        const region = regionSelect.value;
        const filtered = diarias.filter(diaria => {
            const searchableText = `${diaria.servico} ${diaria.titulo} ${diaria.local}`.toLowerCase();
            return searchableText.includes(searchTerm)
                && (category === 'todos' || diaria.categoria === category)
                && (region === 'todas' || diaria.regiao === region);
        });

        grid.innerHTML = '';
        filtered.forEach(diaria => grid.appendChild(createDiariaCard(diaria)));
        count.textContent = `${filtered.length} diária(s) disponível(is)`;

        grid.querySelectorAll('.interest-button').forEach(button => {
            button.addEventListener('click', () => {
                button.textContent = 'Interesse enviado';
                button.disabled = true;
            });
        });
    }

    try {
        const response = await fetch('diarias.json');
        if (!response.ok) throw new Error('Não foi possível carregar as diárias.');
        const diarias = await response.json();
        renderDiarias(diarias);
        searchInput.addEventListener('input', () => renderDiarias(diarias));
        categorySelect.addEventListener('change', () => renderDiarias(diarias));
        regionSelect.addEventListener('change', () => renderDiarias(diarias));
    } catch (error) {
        count.textContent = error.message;
    }
});
