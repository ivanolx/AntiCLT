document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('search-input');
    const categoryLinks = document.querySelectorAll('.cat-filter');
    const regionCheckboxes = document.querySelectorAll('.region-filter');
    const servicesGrid = document.getElementById('services-grid');
    const resultsCount = document.getElementById('results-count');

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
        cardInfo.append(tag, professional, cardMeta);
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