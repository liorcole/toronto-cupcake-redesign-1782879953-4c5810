const header = document.querySelector("[data-header]");
const toggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const productScript = document.getElementById("product-data");
const products = productScript ? JSON.parse(productScript.textContent || "[]") : [];
const productMap = new Map(products.map((product) => [product.id, product]));
const cartKey = "toronto-cupcake-cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey) || "[]");
  } catch {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(count);
  });
}

toggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    header.classList.remove("nav-open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open navigation");
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((item, index) => {
  item.style.setProperty("--reveal-delay", `${Math.min(index * 42, 320)}ms`);
  revealObserver.observe(item);
});

document.querySelectorAll(".magnetic").forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
    item.style.transform = `translate(${x}px, ${y}px)`;
  });
  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

const canAnimate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (canAnimate) {
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      document.querySelectorAll("[data-parallax]").forEach((node, index) => {
        node.style.setProperty("transform", `translateY(${Math.sin((y + index * 120) / 260) * 6}px)`);
      });
    },
    { passive: true }
  );
}

document.querySelectorAll("[data-drag-rail]").forEach((rail) => {
  let startX = 0;
  let scrollLeft = 0;
  let active = false;

  rail.addEventListener("pointerdown", (event) => {
    active = true;
    startX = event.clientX;
    scrollLeft = rail.scrollLeft;
    rail.classList.add("is-dragging");
    rail.setPointerCapture(event.pointerId);
  });

  rail.addEventListener("pointermove", (event) => {
    if (!active) return;
    rail.scrollLeft = scrollLeft - (event.clientX - startX);
  });

  rail.addEventListener("pointerup", () => {
    active = false;
    rail.classList.remove("is-dragging");
  });
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
    document.querySelectorAll(".product-card[data-category]").forEach((card) => {
      card.classList.toggle("is-hidden", value !== "all" && card.dataset.category !== value);
    });
  });
});

const modal = document.querySelector("[data-product-modal]");
const modalCard = document.querySelector("[data-modal-card]");
const modalClose = document.querySelector("[data-modal-close]");

function openProduct(id) {
  const product = productMap.get(id);
  if (!product || !modal || !modalCard) return;
  modalCard.innerHTML = `
    <div class="modal-images">
      ${(product.detailImages || [product.image])
        .map((src) => `<img src="${src}" alt="${product.name}">`)
        .join("")}
    </div>
    <div class="modal-body">
      <p class="eyebrow">${product.category}</p>
      <h2 id="modal-title">${product.name}</h2>
      <p>${product.description || "Toronto Cupcake selection."}</p>
      <div class="product-actions">
        <strong>${product.price ? `$${product.price}` : "Custom"}</strong>
        <button class="button primary" type="button" data-add-cart="${product.id}">Add to cart</button>
      </div>
      ${
        product.ingredients
          ? `<details><summary>Ingredients and allergens</summary><p>${product.ingredients}</p></details>`
          : `<details><summary>Allergen note</summary><p>Toronto Cupcake is NOT a nut-free bakery. Please contact the bakery with allergy questions.</p></details>`
      }
    </div>`;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

document.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-product]");
  if (openButton) openProduct(openButton.dataset.openProduct);

  const addButton = event.target.closest("[data-add-cart]");
  if (addButton) {
    const product = productMap.get(addButton.dataset.addCart);
    if (product) {
      const cart = getCart();
      const existing = cart.find((item) => item.id === product.id);
      if (existing) existing.qty += 1;
      else cart.push({ id: product.id, name: product.name, price: Number(product.price || 0), image: product.image, qty: 1 });
      setCart(cart);
      addButton.textContent = "Added";
      setTimeout(() => {
        addButton.textContent = "Add";
      }, 900);
    }
  }
});

function closeModal() {
  modal?.classList.remove("is-open");
  modal?.setAttribute("aria-hidden", "true");
}

modalClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

function renderCart() {
  const shell = document.querySelector("[data-cart-shell]");
  if (!shell) return;
  const itemsNode = shell.querySelector("[data-cart-items]");
  const totalNode = shell.querySelector("[data-cart-total]");
  const mailNode = shell.querySelector("[data-cart-mail]");
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  shell.querySelector(".section-intro h2").textContent = cart.length ? "Your cupcake order board." : "Your shopping cart is empty.";
  itemsNode.innerHTML = cart.length
    ? cart
        .map(
          (item) => `
        <article class="cart-item">
          <img src="${item.image}" alt="${item.name}">
          <div>
            <h3>${item.name}</h3>
            <p>${item.qty} x $${item.price.toFixed(2)}</p>
          </div>
          <button type="button" data-remove-cart="${item.id}">Remove</button>
        </article>`
        )
        .join("")
    : `<p>Add cupcakes from the catalogue and they will appear here.</p>`;
  totalNode.textContent = `$${total.toFixed(2)}`;
  const body = cart.map((item) => `${item.qty} x ${item.name} - $${(item.qty * item.price).toFixed(2)}`).join("%0D%0A");
  mailNode.href = `mailto:inquiry@torontocupcake.com?subject=Toronto%20Cupcake%20order%20inquiry&body=${body || "Hello Toronto Cupcake,"}`;
}

document.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-cart]");
  if (!removeButton) return;
  const cart = getCart().filter((item) => item.id !== removeButton.dataset.removeCart);
  setCart(cart);
  renderCart();
});

updateCartCount();
renderCart();
