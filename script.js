/* ===========================================================
   CREMOSINHOS GOURMET — sistema de pedidos B2B
   Vanilla JS — sem dependências externas
   =========================================================== */

/* -----------------------------------------------------------
   1. CONFIGURAÇÃO DO NEGÓCIO
   ----------------------------------------------------------- */

// Pedido mínimo obrigatório (em unidades)
const PEDIDO_MINIMO = 40;

// Catálogo de sabores — fácil de editar: adicione ou remova objetos aqui.
// Cada sabor precisa de: id (único), nome, preco (5.00 a 8.00), emoji e descricao.
const SABORES = [
  {
    id: 'choc-belga',
    nome: 'Chocolate Belga',
    preco: 6.00,
    emoji: '🍫',
    descricao: 'Cremosinho de chocolate belga meio amargo, textura aveludada.'
  },
  {
    id: 'morango-cream',
    nome: 'Morango Cream',
    preco: 5.50,
    emoji: '🍓',
    descricao: 'Morango natural com creme leve, sabor fresco e equilibrado.'
  },
  {
    id: 'doce-leite-premium',
    nome: 'Doce de Leite Premium',
    preco: 7.00,
    emoji: '🍮',
    descricao: 'Doce de leite argentino, cozido lentamente, sabor intenso.'
  },
  {
    id: 'ninho-nutella',
    nome: 'Ninho com Nutella',
    preco: 8.00,
    emoji: '🌰',
    descricao: 'Combinação clássica de leite Ninho com Nutella original.',
  },
  {
    id: 'limao-siciliano',
    nome: 'Limão Siciliano',
    preco: 5.00,
    emoji: '🍋',
    descricao: 'Sabor cítrico e refrescante, com toque levemente adocicado.'
  },
];

/* -----------------------------------------------------------
   2. ESTADO DO CARRINHO
   ----------------------------------------------------------- */

// carrinho = { [saborId]: quantidade }
let carrinho = {};

/* -----------------------------------------------------------
   3. REFERÊNCIAS DO DOM
   ----------------------------------------------------------- */

const flavorGrid     = document.getElementById('flavorGrid');
const cartItemsEl     = document.getElementById('cartItems');
const cartEmptyEl     = document.getElementById('cartEmpty');
const unitCountEl     = document.getElementById('unitCount');
const progressFillEl  = document.getElementById('progressFill');
const progressTrackEl = document.getElementById('progressTrack');
const progressMsgEl   = document.getElementById('progressMsg');
const progressBlockEl = document.querySelector('.progress');
const sumQtyEl        = document.getElementById('sumQty');
const sumTotalEl      = document.getElementById('sumTotal');
const btnFinish       = document.getElementById('btnFinish');

const modalOverlay  = document.getElementById('modalOverlay');
const modalSummary  = document.getElementById('modalSummary');
const modalClose    = document.getElementById('modalClose');
const btnCopy       = document.getElementById('btnCopy');
const btnWhatsapp   = document.getElementById('btnWhatsapp');
const toastEl       = document.getElementById('toast');

/* -----------------------------------------------------------
   4. HELPERS
   ----------------------------------------------------------- */

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buscarSabor(id) {
  return SABORES.find((s) => s.id === id);
}

let toastTimeout = null;
function mostrarToast(mensagem) {
  toastEl.textContent = mensagem;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('is-visible');
  }, 2200);
}

/* -----------------------------------------------------------
   5. RENDERIZAÇÃO DO CATÁLOGO
   ----------------------------------------------------------- */

function renderizarCatalogo() {
  flavorGrid.innerHTML = '';

  SABORES.forEach((sabor) => {
    const qty = carrinho[sabor.id] || 0;

    const card = document.createElement('article');
    card.className = 'flavor-card' + (qty > 0 ? ' is-active' : '');
    card.dataset.id = sabor.id;
    card.setAttribute('role', 'listitem');

    card.innerHTML = `
      <div class="flavor-card__swatch" style="background:${corDeFundo(sabor.id)}">
        <span aria-hidden="true">${sabor.emoji}</span>
      </div>
      <div class="flavor-card__top">
        <h3 class="flavor-card__name">${sabor.nome}</h3>
        <span class="flavor-card__price">${formatarMoeda(sabor.preco)}</span>
      </div>
      <p class="flavor-card__desc">${sabor.descricao}</p>
      <div class="qty-control">
        <button type="button" class="qty-btn qty-btn--minus" data-action="diminuir" data-id="${sabor.id}" aria-label="Diminuir quantidade de ${sabor.nome}" ${qty === 0 ? 'disabled' : ''}>&minus;</button>
        <span class="qty-value" data-qty-for="${sabor.id}">${qty}</span>
        <button type="button" class="qty-btn qty-btn--plus" data-action="aumentar" data-id="${sabor.id}" aria-label="Aumentar quantidade de ${sabor.nome}">&plus;</button>
      </div>
      <div class="flavor-card__subtotal" data-subtotal-for="${sabor.id}">
        ${qty > 0 ? `${qty} un. · <strong>${formatarMoeda(qty * sabor.preco)}</strong>` : '&nbsp;'}
      </div>
    `;

    flavorGrid.appendChild(card);
  });
}

// gera uma cor de fundo suave e determinística para o swatch de cada sabor
function corDeFundo(id) {
  const paleta = ['#F3E2D3', '#F3C6CE', '#E9DCC9', '#E3D4C2', '#F0DCE0'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return paleta[hash % paleta.length];
}

/* -----------------------------------------------------------
   6. FUNÇÕES DE CONTROLE DO CARRINHO
   ----------------------------------------------------------- */

function adicionarItem(id) {
  carrinho[id] = (carrinho[id] || 0) + 1;
  atualizarTudo();
  animarCard(id);
}

function removerItem(id) {
  if (!carrinho[id]) return;
  carrinho[id] -= 1;
  if (carrinho[id] <= 0) delete carrinho[id];
  atualizarTudo();
}

function removerSaborCompleto(id) {
  delete carrinho[id];
  atualizarTudo();
}

function animarCard(id) {
  const card = flavorGrid.querySelector(`.flavor-card[data-id="${id}"]`);
  if (!card) return;
  card.classList.remove('is-bumping');
  // força reflow para permitir re-disparar a animação
  void card.offsetWidth;
  card.classList.add('is-bumping');
}

/* -----------------------------------------------------------
   7. CÁLCULOS
   ----------------------------------------------------------- */

function calcularQuantidadeTotal() {
  return Object.values(carrinho).reduce((soma, qty) => soma + qty, 0);
}

function calcularTotal() {
  return Object.entries(carrinho).reduce((soma, [id, qty]) => {
    const sabor = buscarSabor(id);
    return sabor ? soma + sabor.preco * qty : soma;
  }, 0);
}

function validarPedidoMinimo() {
  return calcularQuantidadeTotal() >= PEDIDO_MINIMO;
}

/* -----------------------------------------------------------
   8. RENDERIZAÇÃO DO CARRINHO / RESUMO
   ----------------------------------------------------------- */

function renderizarCarrinho() {
  const itensIds = Object.keys(carrinho).filter((id) => carrinho[id] > 0);

  if (itensIds.length === 0) {
    cartItemsEl.innerHTML = '';
    cartItemsEl.appendChild(cartEmptyEl);
    cartEmptyEl.style.display = 'block';
    return;
  }

  cartEmptyEl.style.display = 'none';
  cartItemsEl.innerHTML = '';

  itensIds.forEach((id) => {
    const sabor = buscarSabor(id);
    const qty = carrinho[id];
    const subtotal = sabor.preco * qty;

    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="cart-row__info">
        <span class="cart-row__name">${sabor.emoji} ${sabor.nome}</span>
        <span class="cart-row__meta">${qty} × ${formatarMoeda(sabor.preco)}</span>
      </div>
      <div class="cart-row__right">
        <span class="cart-row__subtotal">${formatarMoeda(subtotal)}</span>
        <button type="button" class="cart-row__remove" data-action="remover-sabor" data-id="${id}" aria-label="Remover ${sabor.nome} do carrinho">&times;</button>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });
}

function atualizarResumoNumeros() {
  const qtyTotal = calcularQuantidadeTotal();
  const valorTotal = calcularTotal();
  const minimoAtingido = validarPedidoMinimo();

  unitCountEl.innerHTML = `${qtyTotal} <small>un.</small>`;
  sumQtyEl.textContent = `${qtyTotal} unidade${qtyTotal === 1 ? '' : 's'}`;
  sumTotalEl.textContent = formatarMoeda(valorTotal);

  // barra de progresso até o pedido mínimo
  const pct = Math.min(100, (qtyTotal / PEDIDO_MINIMO) * 100);
  progressFillEl.style.width = `${pct}%`;
  progressTrackEl.setAttribute('aria-valuenow', String(qtyTotal));

  if (minimoAtingido) {
    progressTrackEl.classList.add('is-complete');
    progressBlockEl.classList.add('is-complete');
    progressMsgEl.innerHTML = `✓ Pedido mínimo atingido — pode finalizar!`;
  } else {
    progressTrackEl.classList.remove('is-complete');
    progressBlockEl.classList.remove('is-complete');
    const faltam = PEDIDO_MINIMO - qtyTotal;
    progressMsgEl.innerHTML = `Faltam <strong>${faltam}</strong> unidade${faltam === 1 ? '' : 's'} para o pedido mínimo`;
  }

  btnFinish.disabled = !minimoAtingido;
}

function atualizarTudo() {
  renderizarCatalogo();
  renderizarCarrinho();
  atualizarResumoNumeros();
}

/* -----------------------------------------------------------
   9. GERAÇÃO DO RESUMO DO PEDIDO (texto formatado)
   ----------------------------------------------------------- */

function gerarResumoPedido() {
  const itensIds = Object.keys(carrinho).filter((id) => carrinho[id] > 0);
  const qtyTotal = calcularQuantidadeTotal();
  const valorTotal = calcularTotal();
  const dataHora = new Date().toLocaleString('pt-BR');

  let linhas = [];
  linhas.push('🧁 *PEDIDO — CREMOSINHOS GOURMET*');
  linhas.push(`📅 ${dataHora}`);
  linhas.push('');
  linhas.push('*Itens do pedido:*');

  itensIds.forEach((id) => {
    const sabor = buscarSabor(id);
    const qty = carrinho[id];
    const subtotal = sabor.preco * qty;
    linhas.push(`• ${sabor.nome} — ${qty} un. × ${formatarMoeda(sabor.preco)} = ${formatarMoeda(subtotal)}`);
  });

  linhas.push('');
  linhas.push(`Quantidade total: ${qtyTotal} unidades`);
  linhas.push(`*Total do pedido: ${formatarMoeda(valorTotal)}*`);
  linhas.push('');
  linhas.push('— Pedido gerado pelo sistema de atacado Cremosinhos Gourmet.');

  return linhas.join('\n');
}

// Estrutura preparada para futura integração com WhatsApp Business API.
// Hoje monta apenas o link "wa.me" com o texto pré-preenchido;
// no futuro, o ideal é substituir por uma chamada real à API (backend).
function montarLinkWhatsapp(textoResumo) {
  const numeroWhatsappEmpresa = '5500000000000'; // TODO: substituir pelo número real (DDI+DDD+numero)
  const texto = encodeURIComponent(textoResumo.replace(/\*/g, '')); // wa.me não precisa de markdown
  return `https://wa.me/${numeroWhatsappEmpresa}?text=${texto}`;
}

/* -----------------------------------------------------------
   10. MODAL DE FINALIZAÇÃO
   ----------------------------------------------------------- */

function abrirModalResumo() {
  modalSummary.textContent = gerarResumoPedido();
  modalOverlay.classList.add('is-open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  modalClose.focus();
}

function fecharModal() {
  modalOverlay.classList.remove('is-open');
  modalOverlay.setAttribute('aria-hidden', 'true');
}

function finalizarPedido() {
  if (!validarPedidoMinimo()) {
    mostrarToast(`Pedido mínimo de ${PEDIDO_MINIMO} cremosinhos necessário`);
    return;
  }
  abrirModalResumo();
}

/* -----------------------------------------------------------
   11. EVENTOS
   ----------------------------------------------------------- */

// delegação de eventos no catálogo (+ / -)
flavorGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'aumentar') adicionarItem(id);
  if (btn.dataset.action === 'diminuir') removerItem(id);
});

// delegação de eventos no carrinho (remover sabor inteiro)
cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="remover-sabor"]');
  if (!btn) return;
  removerSaborCompleto(btn.dataset.id);
});

btnFinish.addEventListener('click', finalizarPedido);

modalClose.addEventListener('click', fecharModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) fecharModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) fecharModal();
});

btnCopy.addEventListener('click', async () => {
  const texto = gerarResumoPedido();
  try {
    await navigator.clipboard.writeText(texto);
    mostrarToast('Resumo copiado!');
  } catch (err) {
    mostrarToast('Não foi possível copiar automaticamente.');
  }
});

btnWhatsapp.addEventListener('click', () => {
  const texto = gerarResumoPedido();
  const link = montarLinkWhatsapp(texto);
  // Por enquanto, apenas simulamos: mostramos o link que seria aberto.
  // Quando a integração for ativada, basta trocar por: window.open(link, '_blank');
  console.log('[Integração futura] Link do WhatsApp gerado:', link);
  mostrarToast('Integração com WhatsApp em breve 🚀');
});

/* -----------------------------------------------------------
   12. INICIALIZAÇÃO
   ----------------------------------------------------------- */

function init() {
  atualizarTudo();
}

init();