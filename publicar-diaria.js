document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('publish-form');
    const feedback = document.getElementById('publish-feedback');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dados = new FormData(form);
        const payload = Object.fromEntries(dados.entries());

        submitButton.disabled = true;
        feedback.textContent = 'Publicando sua diária...';
        feedback.className = 'publish-feedback';

        try {
            const response = await fetch('/api/diarias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || 'Não foi possível publicar a diária.');
            }

            feedback.textContent = 'Diária publicada! Ela já está disponível para os profissionais.';
            feedback.className = 'publish-feedback success';
            form.reset();
        } catch (error) {
            feedback.textContent = error.message;
            feedback.className = 'publish-feedback error';
        } finally {
            submitButton.disabled = false;
        }
    });
});
