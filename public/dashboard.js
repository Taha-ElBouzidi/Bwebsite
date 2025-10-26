const businessForm = document.querySelector('#business-form');
const businessFeedback = document.querySelector('#business-feedback');
const serviceForm = document.querySelector('#service-form');
const testimonialForm = document.querySelector('#testimonial-form');
const servicesTable = document.querySelector('#services-table');
const testimonialsTable = document.querySelector('#testimonials-table');
const leadsTable = document.querySelector('#leads-table');
const dashboardHeader = document.querySelector('#dashboard-header');
const dashboardMain = document.querySelector('#dashboard-main');
const loginPanel = document.querySelector('#login-panel');
const loginForm = document.querySelector('#login-form');
const loginFeedback = document.querySelector('#login-feedback');
const logoutButton = document.querySelector('#logout-button');

let isAuthenticated = false;

function setAuthState(authenticated) {
  isAuthenticated = authenticated;

  if (authenticated) {
    dashboardHeader?.classList.remove('hidden');
    dashboardMain?.classList.remove('hidden');
    loginPanel?.classList.add('hidden');
    if (loginFeedback) {
      loginFeedback.textContent = '';
    }
    return;
  }

  dashboardHeader?.classList.add('hidden');
  dashboardMain?.classList.add('hidden');
  loginPanel?.classList.remove('hidden');
}

function handleUnauthorized(message = 'Please sign in to continue.') {
  setAuthState(false);
  if (loginFeedback) {
    loginFeedback.textContent = message;
  }
}

async function apiFetch(url, options) {
  const response = await fetch(url, options);

  if (response.status === 401) {
    handleUnauthorized('Your session has expired. Please sign in again.');
    throw new Error('Unauthorized');
  }

  return response;
}

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

async function loadBusinessProfile() {
  const res = await apiFetch('/api/business');
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
  const res = await apiFetch('/api/services');
  if (!res.ok) throw new Error('Failed to load services');
  const services = await res.json();
  renderServices(services);
}

async function loadTestimonials() {
  const res = await apiFetch('/api/testimonials');
  if (!res.ok) throw new Error('Failed to load testimonials');
  const testimonials = await res.json();
  renderTestimonials(testimonials);
}

async function loadLeads() {
  const res = await apiFetch('/api/leads');
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
          try {
            await apiFetch(`/api/services/${id}`, { method: 'DELETE' });
            await loadServices();
          } catch (error) {
            console.error(error);
          }
        }
        if (action === 'edit') {
          const title = prompt('Service title', service.title);
          if (title === null) return;
          const summary = prompt('Service summary', service.summary);
          if (summary === null) return;
          const order = prompt('Display order', service.display_order ?? 0);
          try {
            await apiFetch(`/api/services/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, summary, display_order: Number(order) || 0 })
            });
            await loadServices();
          } catch (error) {
            console.error(error);
          }
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
          try {
            await apiFetch(`/api/testimonials/${id}`, { method: 'DELETE' });
            await loadTestimonials();
          } catch (error) {
            console.error(error);
          }
        }
        if (action === 'edit') {
          const author = prompt('Name', testimonial.author);
          if (author === null) return;
          const role = prompt('Role / Company', testimonial.role || '');
          if (role === null) return;
          const quote = prompt('Quote', testimonial.quote);
          if (quote === null) return;
          try {
            await apiFetch(`/api/testimonials/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ author, role, quote })
            });
            await loadTestimonials();
          } catch (error) {
            console.error(error);
          }
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
    const res = await apiFetch('/api/business', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save');
    businessFeedback.textContent = 'Saved! Refresh the landing page to see the update.';
  } catch (error) {
    businessFeedback.textContent = 'Unable to save changes. Please retry.';
    console.error(error);
  }
});

serviceForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(serviceForm);
  const payload = Object.fromEntries(formData.entries());
  payload.display_order = Number(payload.display_order) || 0;
  try {
    const res = await apiFetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      serviceForm.reset();
      await loadServices();
    }
  } catch (error) {
    console.error(error);
  }
});

testimonialForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(testimonialForm);
  const payload = Object.fromEntries(formData.entries());
  try {
    const res = await apiFetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      testimonialForm.reset();
      await loadTestimonials();
    }
  } catch (error) {
    console.error(error);
  }
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());
  if (loginFeedback) {
    loginFeedback.textContent = 'Signing in…';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (loginFeedback) {
        loginFeedback.textContent = data.error || 'Invalid credentials. Try again.';
      }
      return;
    }

    loginForm.reset();
    setAuthState(true);
    await loadDashboardData();
  } catch (error) {
    if (loginFeedback) {
      loginFeedback.textContent = 'Unable to sign in. Please try again.';
    }
    console.error(error);
  }
});

logoutButton?.addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } finally {
    handleUnauthorized('You have been signed out. Please sign in again.');
  }
});

async function loadDashboardData() {
  if (!isAuthenticated) return;

  try {
    await Promise.all([loadBusinessProfile(), loadServices(), loadTestimonials(), loadLeads()]);
  } catch (error) {
    console.error(error);
  }
}

async function checkSession() {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) throw new Error('Unable to verify session');
    const data = await res.json();

    if (data.authenticated) {
      setAuthState(true);
      await loadDashboardData();
    } else {
      setAuthState(false);
    }
  } catch (error) {
    setAuthState(false);
    console.error(error);
  }
}

checkSession();
