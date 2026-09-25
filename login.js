document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const message = document.getElementById('login-message');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('password').value;
        submitButton.disabled = true;
        message.textContent = 'Entrando...';
        message.className = 'form-message';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || 'Não foi possível entrar.');
            }

            localStorage.setItem('anticltUsuario', JSON.stringify(result.usuario));
            message.textContent = `Olá, ${result.usuario.nome}! Login realizado.`;
            message.className = 'form-message success';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 700);
        } catch (error) {
            message.textContent = error.message;
            message.className = 'form-message error';
        } finally {
            submitButton.disabled = false;
        }
    });
});
