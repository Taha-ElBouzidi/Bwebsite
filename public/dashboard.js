const businessForm = document.querySelector('#business-form');
const businessFeedback = document.querySelector('#business-feedback');
const serviceForm = document.querySelector('#service-form');
const testimonialForm = document.querySelector('#testimonial-form');
const servicesTable = document.querySelector('#services-table');
const testimonialsTable = document.querySelector('#testimonials-table');
const leadsTable = document.querySelector('#leads-table');

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

async function loadBusinessProfile() {
  const res = await fetch('/api/business');
  if (!res.ok) throw new Error('Failed to load business profile');
  const profile = await res.json();
  const fields = ['name', 'tagline', 'description', 'phone', 'email', 'address', 'primary_color', 'secondary_color', 'accent_color'];
  fields.forEach((field) => {
    const input = businessForm.querySelector(`[name="${field}"]`);
    if (!input) return;
    if (profile[field] && input.type === 'color') {
      input.value = profile[field];
    } else if (profile[field]) {
      input.value = profile[field];
    } else {
      input.value = '';
    }
  });
}

async function loadServices() {
  const res = await fetch('/api/services');
  if (!res.ok) throw new Error('Failed to load services');
  const services = await res.json();
  renderServices(services);
}

async function loadTestimonials() {
  const res = await fetch('/api/testimonials');
  if (!res.ok) throw new Error('Failed to load testimonials');
  const testimonials = await res.json();
  renderTestimonials(testimonials);
}

async function loadLeads() {
  const res = await fetch('/api/leads');
  if (!res.ok) throw new Error('Failed to load leads');
  const leads = await res.json();
  renderLeads(leads);
}

function renderServices(services) {
  servicesTable.innerHTML = '';
  if (!services.length) {
    servicesTable.innerHTML = '<div class="empty-state">No services yet. Add your first offer above.</div>';
    return;
  }

  services.forEach((service) => {
    const item = document.createElement('article');
    item.className = 'list-item';
    item.innerHTML = `
      <header>
        <div>
          <h3>${service.title}</h3>
          <span class="tag">Order ${service.display_order ?? 0}</span>
        </div>
        <div class="item-actions">
          <button data-action="edit" data-id="${service.id}">Edit</button>
          <button data-action="delete" data-id="${service.id}">Delete</button>
        </div>
      </header>
      <p>${service.summary}</p>
    `;

    item.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', async () => {
        const { action, id } = button.dataset;
        if (action === 'delete') {
          const confirmed = confirm('Remove this service?');
          if (!confirmed) return;
          await fetch(`/api/services/${id}`, { method: 'DELETE' });
          await loadServices();
        }
        if (action === 'edit') {
          const title = prompt('Service title', service.title);
          if (title === null) return;
          const summary = prompt('Service summary', service.summary);
          if (summary === null) return;
          const order = prompt('Display order', service.display_order ?? 0);
          await fetch(`/api/services/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, summary, display_order: Number(order) || 0 })
          });
          await loadServices();
        }
      });
    });

    servicesTable.appendChild(item);
  });
}

function renderTestimonials(testimonials) {
  testimonialsTable.innerHTML = '';
  if (!testimonials.length) {
    testimonialsTable.innerHTML = '<div class="empty-state">No testimonials yet. Add one to build trust.</div>';
    return;
  }

  testimonials.forEach((testimonial) => {
    const item = document.createElement('article');
    item.className = 'list-item';
    item.innerHTML = `
      <header>
        <div>
          <h3>${testimonial.author}</h3>
          ${testimonial.role ? `<span class="tag">${testimonial.role}</span>` : ''}
        </div>
        <div class="item-actions">
          <button data-action="edit" data-id="${testimonial.id}">Edit</button>
          <button data-action="delete" data-id="${testimonial.id}">Delete</button>
        </div>
      </header>
      <p>${testimonial.quote}</p>
    `;

    item.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', async () => {
        const { action, id } = button.dataset;
        if (action === 'delete') {
          const confirmed = confirm('Remove this testimonial?');
          if (!confirmed) return;
          await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
          await loadTestimonials();
        }
        if (action === 'edit') {
          const author = prompt('Name', testimonial.author);
          if (author === null) return;
          const role = prompt('Role / Company', testimonial.role || '');
          if (role === null) return;
          const quote = prompt('Quote', testimonial.quote);
          if (quote === null) return;
          await fetch(`/api/testimonials/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, role, quote })
          });
          await loadTestimonials();
        }
      });
    });

    testimonialsTable.appendChild(item);
  });
}

function renderLeads(leads) {
  leadsTable.innerHTML = '';
  if (!leads.length) {
    leadsTable.innerHTML = '<div class="empty-state">No leads yet. Form submissions will show up here.</div>';
    return;
  }

  leads.forEach((lead) => {
    const item = document.createElement('article');
    item.className = 'list-item';
    item.innerHTML = `
      <header>
        <div>
          <h4>${lead.name || 'Unnamed lead'}</h4>
        </div>
        <span class="tag">${formatDate(lead.created_at)}</span>
      </header>
      <div class="lead-meta">
        ${lead.email ? `<span>Email: ${lead.email}</span>` : ''}
        ${lead.phone ? `<span>Phone: ${lead.phone}</span>` : ''}
      </div>
      ${lead.message ? `<p>${lead.message}</p>` : ''}
    `;
    leadsTable.appendChild(item);
  });
}

businessForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(businessForm);
  const payload = Object.fromEntries(formData.entries());
  businessFeedback.textContent = 'Saving…';
  try {
    const res = await fetch('/api/business', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save');
    businessFeedback.textContent = 'Saved! Refresh the landing page to see the update.';
  } catch (error) {
    businessFeedback.textContent = 'Unable to save changes. Please retry.';
  }
});

serviceForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(serviceForm);
  const payload = Object.fromEntries(formData.entries());
  payload.display_order = Number(payload.display_order) || 0;
  const res = await fetch('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    serviceForm.reset();
    await loadServices();
  }
});

testimonialForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(testimonialForm);
  const payload = Object.fromEntries(formData.entries());
  const res = await fetch('/api/testimonials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    testimonialForm.reset();
    await loadTestimonials();
  }
});

Promise.all([loadBusinessProfile(), loadServices(), loadTestimonials(), loadLeads()]).catch((error) => {
  console.error(error);
});
