const servicesList = document.querySelector('#services-list');
const testimonialList = document.querySelector('#testimonial-list');
const form = document.querySelector('#contact-form');
const feedback = document.querySelector('#form-feedback');
const businessNameEl = document.querySelector('#business-name');
const footerBusinessNameEl = document.querySelector('#footer-business-name');
const taglineEl = document.querySelector('#hero-tagline');
const titleEl = document.querySelector('#hero-title');
const descriptionEl = document.querySelector('#hero-description');
const phoneEl = document.querySelector('#hero-phone');
const emailEl = document.querySelector('#hero-email');
const addressEl = document.querySelector('#hero-address');
const footerYearEl = document.querySelector('#footer-year');

footerYearEl.textContent = new Date().getFullYear();

async function loadContent() {
  try {
    const response = await fetch('/api/content');
    if (!response.ok) throw new Error('Failed to load content');
    const { profile, services, testimonials } = await response.json();

    if (profile) {
      businessNameEl.textContent = profile.name;
      footerBusinessNameEl.textContent = profile.name;
      taglineEl.textContent = profile.tagline || taglineEl.textContent;
      titleEl.textContent = profile.name ? `${profile.name} — ${profile.tagline || 'Trusted Partner'}` : titleEl.textContent;
      descriptionEl.textContent = profile.description || descriptionEl.textContent;
      phoneEl.textContent = profile.phone || phoneEl.textContent;
      emailEl.textContent = profile.email || emailEl.textContent;
      addressEl.textContent = profile.address || addressEl.textContent;

      if (profile.primary_color) {
        document.documentElement.style.setProperty('--color-primary', profile.primary_color);
      }
      if (profile.secondary_color) {
        document.documentElement.style.setProperty('--color-secondary', profile.secondary_color);
      }
      if (profile.accent_color) {
        document.documentElement.style.setProperty('--color-accent', profile.accent_color);
      }
    }

    servicesList.innerHTML = '';
    services.forEach((service) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <h3>${service.title}</h3>
        <p>${service.summary}</p>
      `;
      servicesList.appendChild(card);
    });

    testimonialList.innerHTML = '';
    testimonials.forEach((testimonial) => {
      const item = document.createElement('article');
      item.className = 'testimonial';
      item.innerHTML = `
        <p class="quote">${testimonial.quote}</p>
        <div>
          <p class="author">${testimonial.author}</p>
          ${testimonial.role ? `<p class="role">${testimonial.role}</p>` : ''}
        </div>
      `;
      testimonialList.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
}

loadContent();

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    feedback.textContent = 'Sending…';

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Unable to submit form');

      form.reset();
      feedback.textContent = 'Thanks for reaching out! We will reply soon.';
    } catch (error) {
      feedback.textContent = 'Something went wrong. Please try again.';
      console.error(error);
    }
  });
}
