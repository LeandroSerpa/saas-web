<template>
  <section class="publicidade-nuvemmais" aria-label="Divulgação NuvemMais">
    <div class="publicidade-nuvemmais-texto">
      <p class="publicidade-nuvemmais-selo">Tecnologia NuvemMais Gestão</p>
      <h2>Quer ter uma página como esta?</h2>
      <p>
        Com o NuvemMais, você pode divulgar seu catálogo, cardápio ou agenda online, receber pedidos pelo WhatsApp e organizar seus clientes em poucos minutos.
      </p>
    </div>

    <div class="publicidade-nuvemmais-acoes">
      <a class="botao secundario" href="/cadastro" target="_blank" rel="noopener noreferrer">
        Criar minha página
      </a>
      <a class="botao principal" href="/cadastro#planos" target="_blank" rel="noopener noreferrer">
        Conhecer planos
      </a>
    </div>
  </section>
</template>

<style scoped>
.publicidade-nuvemmais {
  display: grid;
  gap: 18px;
  padding: 22px;
  border: 1px solid color-mix(in srgb, var(--publico-cor-principal, var(--catalogo-cor-principal, #2563eb)), white 76%);
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--publico-cor-principal, var(--catalogo-cor-principal, #2563eb)), transparent 86%), transparent 34%),
    linear-gradient(135deg, color-mix(in srgb, #ffffff, var(--publico-cor-principal, var(--catalogo-cor-principal, #2563eb)) 5%), #ffffff);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.publicidade-nuvemmais-texto {
  display: grid;
  gap: 8px;
}

.publicidade-nuvemmais-selo {
  margin: 0;
  color: var(--publico-cor-principal, var(--catalogo-cor-principal, #2563eb));
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.publicidade-nuvemmais h2,
.publicidade-nuvemmais p {
  margin: 0;
}

.publicidade-nuvemmais h2 {
  font-size: clamp(22px, 2.6vw, 29px);
  line-height: 1.15;
  color: var(--publico-cor-secundaria, var(--catalogo-cor-secundaria, #0f172a));
}

.publicidade-nuvemmais p {
  color: #475569;
  line-height: 1.6;
}

.publicidade-nuvemmais-acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.botao {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 46px;
  padding: 12px 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-weight: 800;
  text-decoration: none;
  text-align: center;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--publico-cor-principal, var(--catalogo-cor-principal, #2563eb)), white 40%);
  outline-offset: 2px;
}

.principal {
  background: linear-gradient(
    135deg,
    var(--publico-cor-principal, var(--catalogo-cor-principal, #2563eb)),
    color-mix(in srgb, var(--publico-cor-principal, var(--catalogo-cor-principal, #2563eb)), #000000 16%)
  );
  color: white;
  box-shadow: 0 14px 28px color-mix(in srgb, var(--publico-cor-principal, var(--catalogo-cor-principal, #2563eb)), transparent 78%);
}

.secundario {
  background: color-mix(in srgb, #ffffff, var(--publico-cor-principal, var(--catalogo-cor-principal, #2563eb)) 4%);
  color: var(--publico-cor-secundaria, var(--catalogo-cor-secundaria, #0f172a));
  border-color: color-mix(in srgb, var(--publico-cor-secundaria, var(--catalogo-cor-secundaria, #0f172a)), white 82%);
}

@media (max-width: 640px) {
  .publicidade-nuvemmais {
    padding: 18px;
  }

  .publicidade-nuvemmais-acoes {
    display: grid;
    grid-template-columns: 1fr;
  }

  .botao {
    width: 100%;
  }
}
</style>
