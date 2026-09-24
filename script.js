const body = document.body;
const header = document.querySelector('.site-header');
const backToTop = document.getElementById('backToTop');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileNav = document.getElementById('mobileNav');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const cartHeaderCountEl = document.getElementById('cartHeaderCount');
const cartTotalEl = document.getElementById('cartTotal');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');

const cart = [];
let toastTimer;

const money = (value) => `₹${value.toLocaleString('en-IN')}`;

function showToast(message) {
  toastText.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  body.classList.add('drawer-open');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  body.classList.remove('drawer-open');
}

function renderCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  cartCountEl.textContent = itemCount;
  cartHeaderCountEl.textContent = `(${itemCount})`;
  cartTotalEl.textContent = money(subtotal);

  if (!cart.length) {
    cartItemsEl.innerHTML = `<div class="empty-cart"><span class="empty-icon">✦</span><h3>Your bag is waiting.</h3><p>Add a little mithaas to your day.</p><button class="button button-primary" id="startShopping">Browse treats</button></div>`;
    document.getElementById('startShopping').addEventListener('click', () => {
      closeCart();
      document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
    });
    return;
  }

  cartItemsEl.innerHTML = cart.map((item) => `
    <div class="cart-item" data-cart-name="${item.name}">
      <img class="cart-item-image" src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p>${money(item.price)} · ${item.unit}</p>
        <div class="cart-item-quantity">
          <button class="quantity-button" data-action="decrease" data-name="${item.name}" aria-label="Decrease ${item.name} quantity">−</button>
          <span>${item.quantity}</span>
          <button class="quantity-button" data-action="increase" data-name="${item.name}" aria-label="Increase ${item.name} quantity">+</button>
        </div>
      </div>
      <strong class="cart-item-price">${money(item.price * item.quantity)}</strong>
    </div>
  `).join('');

  cartItemsEl.querySelectorAll('.quantity-button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = cart.find((cartItem) => cartItem.name === button.dataset.name);
      if (!item) return;
      if (button.dataset.action === 'increase') item.quantity += 1;
      else item.quantity -= 1;
      const itemIndex = cart.indexOf(item);
      if (item.quantity <= 0) cart.splice(itemIndex, 1);
      renderCart();
    });
  });
}

function addToCart(card) {
  const data = {
    name: card.dataset.name,
    price: Number(card.dataset.price),
    unit: card.dataset.unit,
    image: card.querySelector('img').getAttribute('src'),
    quantity: 1,
  };
  const existing = cart.find((item) => item.name === data.name);
  if (existing) existing.quantity += 1;
  else cart.push(data);
  renderCart();
  showToast(`${data.name} added to your bag`);

  const button = card.querySelector('[data-add]');
  button.classList.add('added');
  button.textContent = '✓';
  window.setTimeout(() => {
    button.classList.remove('added');
    button.textContent = '+';
  }, 850);
}

document.querySelectorAll('[data-add]').forEach((button) => {
  button.addEventListener('click', () => addToCart(button.closest('.product-card')));
});

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter-button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    document.querySelectorAll('.product-card').forEach((card) => {
      const shouldShow = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !shouldShow);
      if (shouldShow) {
        card.classList.remove('visible');
        requestAnimationFrame(() => card.classList.add('visible'));
      }
    });
  });
});

document.getElementById('cartOpen').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeCart();
});

document.getElementById('checkoutButton').addEventListener('click', () => {
  if (!cart.length) {
    showToast('Your bag is empty — pick a treat first');
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
    closeCart();
    return;
  }
  showToast('Checkout is coming soon — we saved your selection');
});

document.getElementById('viewAll').addEventListener('click', (event) => {
  event.preventDefault();
  document.querySelector('[data-filter="all"]').click();
  showToast('Showing our full sweet selection');
});

mobileMenuButton.addEventListener('click', () => {
  mobileMenuButton.classList.toggle('open');
  mobileNav.classList.toggle('open');
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileMenuButton.classList.remove('open');
  mobileNav.classList.remove('open');
}));

document.getElementById('themeToggle').addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  const isDark = body.classList.contains('dark-mode');
  localStorage.setItem('sidhbali-theme', isDark ? 'dark' : 'light');
  showToast(isDark ? 'Night mode on' : 'Daylight mode on');
});
if (localStorage.getItem('sidhbali-theme') === 'dark') body.classList.add('dark-mode');

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

window.addEventListener('scroll', () => {
  const isScrolled = window.scrollY > 20;
  header.classList.toggle('scrolled', isScrolled);
  backToTop.classList.toggle('visible', window.scrollY > 450);
});
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const heroVisual = document.querySelector('.hero-visual');
if (window.matchMedia('(pointer: fine)').matches) {
  heroVisual.addEventListener('pointermove', (event) => {
    const bounds = heroVisual.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    heroVisual.style.setProperty('--mouse-x', `${x * 10}px`);
    heroVisual.style.setProperty('--mouse-y', `${y * 7}px`);
    heroVisual.querySelector('.main-photo').style.translate = `var(--mouse-x) var(--mouse-y)`;
  });
  heroVisual.addEventListener('pointerleave', () => {
    heroVisual.querySelector('.main-photo').style.translate = '0 0';
  });
}

renderCart();
