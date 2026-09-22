document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const categoryLinks = document.querySelectorAll('.cat-filter');
    const regionCheckboxes = document.querySelectorAll('.region-filter');
    const serviceCards = document.querySelectorAll('.service-card');
    const resultsCount = document.getElementById('results-count');

    let selectedCategory = 'todos';

    // 1. Verificar se veio alguma busca pela URL (Ex: servicos.html?busca=eletricista)
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('busca');

    if (searchParam && searchInput) {
        searchInput.value = searchParam;
    }

    // 2. Função Principal de Filtragem
    function filterServices() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        // Obter regiões marcadas
        const selectedRegions = Array.from(regionCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        let visibleCount = 0;

        serviceCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            const cardLocation = card.getAttribute('data-location');
            const cardText = card.innerText.toLowerCase();

            // Regras de validação
            const matchesCategory = (selectedCategory === 'todos' || cardCategory === selectedCategory);
            const matchesSearch = cardText.includes(searchTerm);
            const matchesRegion = selectedRegions.length === 0 || selectedRegions.includes(cardLocation);

            // Exibir ou Ocultar Card
            if (matchesCategory && matchesSearch && matchesRegion) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Atualizar contador de resultados
        if (resultsCount) {
            resultsCount.textContent = `Mostrando ${visibleCount} profissional(is) encontrado(s)`;
        }
    }

    // 3. Eventos dos Filtros de Categoria
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            categoryLinks.forEach(l => l.classList.remove('active-cat'));
            link.classList.add('active-cat');

            selectedCategory = link.getAttribute('data-category');
            filterServices();
        });
    });

    // 4. Eventos do Campo de Texto e Checkboxes
    if (searchInput) {
        searchInput.addEventListener('input', filterServices);
    }

    regionCheckboxes.forEach(cb => {
        cb.addEventListener('change', filterServices);
    });

    // Executar filtragem inicial para aplicar buscas vindas da index.html
    filterServices();
});