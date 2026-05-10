async function loadAppData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load app data:', error);
    return null;
  }
}

async function init() {
  const data = await loadAppData();
  if (!data) return;

  const settings = data.sections.app_settings;

  // Apply CSS Variables
  document.documentElement.style.setProperty('--primary-color', settings.primary_color.value);
  document.documentElement.style.setProperty('--secondary-color', settings.secondary_color.value);
  document.documentElement.style.setProperty('--background-color', settings.background_color.value);
  document.documentElement.style.setProperty('--text-color', settings.text_color.value);

  // Apply Storefront Data
  const storefront = data.sections.storefront;
  document.querySelector('.logo').src = storefront.logo.value;
  document.querySelector('.store-name').textContent = storefront.store_name.value;
  document.querySelector('.tagline').textContent = storefront.tagline.value;
  document.getElementById('bg-layer').style.backgroundImage = `url(${storefront.hero_image.value})`;

  // Time-based mode check
  const now = new Date();
  const currentHour = now.getHours(); // 0-23

  const lunchStart = settings.lunch_start_hour.value;
  const lunchEnd = settings.lunch_end_hour.value;
  const lateStart = settings.late_night_start_hour.value;

  let mode = 'regular';
  if (currentHour >= lunchStart && currentHour < lunchEnd) {
    mode = 'lunch';
  } else if (currentHour >= lateStart || currentHour < 5) {
    mode = 'late';
  }

  // Update App Container and Banner based on mode
  const appContainer = document.getElementById('app-container');
  const modeBanner = document.getElementById('mode-banner');

  if (mode === 'lunch') {
    modeBanner.textContent = 'Lunch Rush: Combo Deals!';
    modeBanner.classList.remove('hidden');
  } else if (mode === 'late') {
    modeBanner.textContent = 'Late Night Menu';
    modeBanner.classList.remove('hidden');
    document.body.classList.add('late-night-mode');
  } else {
    modeBanner.classList.add('hidden');
  }

  // Render Daily Special
  renderSpecial(data);

  // Render Menu
  renderMenu(data, mode);

  // Reveal App
  appContainer.classList.add('loaded');

  // Update mode periodically (every minute)
  setInterval(() => {
    // In a real signage app, we might check time and re-render or reload
    // but we'll keep it simple here. A full refresh could be triggered if mode changes.
  }, 60000);
}

function renderSpecial(data) {
  const specials = data.sections.specials.value;
  if (!specials || specials.length === 0) return;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];

  // Find today's special, or fallback to 'Everyday' or the first one
  let activeSpecial = specials.find(s => s.day_of_week === todayName) ||
                      specials.find(s => s.day_of_week === 'Everyday') ||
                      specials[0];

  const originalIndex = specials.indexOf(activeSpecial);

  const container = document.querySelector('.special-card');
  container.innerHTML = `
    <img class="special-image" src="${activeSpecial.thumbnail}" data-bind-src="specials.${originalIndex}.thumbnail" data-bind-attr="alt:specials.${originalIndex}.title" alt="${activeSpecial.title}">
    <div class="special-info">
      <div class="special-title" data-bind-text="specials.${originalIndex}.title">${activeSpecial.title}</div>
      <div class="special-desc" data-bind-text="specials.${originalIndex}.description">${activeSpecial.description}</div>
      <div class="special-price" data-bind-currency="specials.${originalIndex}.price">$${activeSpecial.price.toFixed(2)}</div>
    </div>
  `;
}

function renderMenu(data, mode) {
  const categories = data.sections.categories.value;
  const allProducts = data.sections.products.value;
  const menuContainer = document.querySelector('.menu-categories');
  menuContainer.innerHTML = '';

  categories.forEach((cat, catIdx) => {
    // Flatten with original index
    let catProducts = allProducts
      .map((p, idx) => ({ ...p, _idx: idx }))
      .filter(p => p.category === cat.id);

    // Apply late night filter
    if (mode === 'late') {
      catProducts = catProducts.filter(p => p.available_late_night);
    }

    if (catProducts.length === 0) return;

    const section = document.createElement('div');
    section.className = 'category-section';
    section.innerHTML = `<h2 class="category-name" data-bind-text="categories.${catIdx}.name">${cat.name}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'products-grid';

    catProducts.forEach(product => {
      const idx = product._idx;
      const isLunchCombo = mode === 'lunch' && product.is_combo;

      const card = document.createElement('div');
      card.className = `product-card ${isLunchCombo ? 'combo-highlight' : ''}`;

      // Note: we're using data-bind-* attributes so the live preview works.
      card.innerHTML = `
        <img class="product-image" data-bind-src="products.${idx}.thumbnail" src="${product.thumbnail}" data-bind-attr="alt:products.${idx}.name" alt="${product.name}">
        <div class="product-info">
          <h3 class="product-name" data-bind-text="products.${idx}.name">${product.name}</h3>
          <p class="product-desc" data-bind-text="products.${idx}.description">${product.description}</p>
          <span class="product-price" data-bind-currency="products.${idx}.price">$${product.price.toFixed(2)}</span>
        </div>
      `;
      grid.appendChild(card);
    });

    section.appendChild(grid);
    menuContainer.appendChild(section);
  });
}

init();