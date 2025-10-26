const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db/connection');
const { runMigrations, seedDefaults } = require('./db/setup');

runMigrations();
seedDefaults();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'dashboard.sid',
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

app.use(express.static(path.join(__dirname, '..', 'public')));

const requireAuth = (req, res, next) => {
  if (req.session?.ownerId) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
};

const getBusinessProfile = () =>
  db.prepare(
    `SELECT id, name, tagline, description, phone, email, address, primary_color, secondary_color, accent_color
     FROM business_profile WHERE id = 1`
  ).get();

app.get('/api/content', (_req, res) => {
  const profile = getBusinessProfile();
  const services = db
    .prepare('SELECT id, title, summary, display_order FROM services ORDER BY display_order ASC, id ASC')
    .all();
  const testimonials = db.prepare('SELECT id, author, quote, role FROM testimonials ORDER BY id ASC').all();

  res.json({
    profile,
    services,
    testimonials
  });
});

app.get('/api/business', (_req, res) => {
  res.json(getBusinessProfile());
});

app.get('/api/auth/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session?.ownerId) });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const owner = db.prepare('SELECT id, username, password_hash FROM owners WHERE username = ?').get(username);

  if (!owner) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const isValid = bcrypt.compareSync(password, owner.password_hash);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  req.session.ownerId = owner.id;
  res.json({ authenticated: true, username: owner.username });
});

app.post('/api/auth/logout', (req, res) => {
  req.session?.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to log out.' });
    }

    res.clearCookie('dashboard.sid');
    return res.status(204).end();
  });
});

app.put('/api/business', requireAuth, (req, res) => {
  const {
    name,
    tagline,
    description,
    phone,
    email,
    address,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    accent_color: accentColor
  } = req.body;

  const update = db.prepare(`
    UPDATE business_profile
    SET name = @name,
        tagline = @tagline,
        description = @description,
        phone = @phone,
        email = @email,
        address = @address,
        primary_color = @primary_color,
        secondary_color = @secondary_color,
        accent_color = @accent_color
    WHERE id = 1
  `);

  update.run({
    name,
    tagline,
    description,
    phone,
    email,
    address,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    accent_color: accentColor
  });

  res.json(getBusinessProfile());
});

app.get('/api/services', (_req, res) => {
  const services = db
    .prepare('SELECT id, title, summary, display_order FROM services ORDER BY display_order ASC, id ASC')
    .all();
  res.json(services);
});

app.post('/api/services', requireAuth, (req, res) => {
  const { title, summary, display_order: displayOrder = 0 } = req.body;
  const stmt = db.prepare(
    'INSERT INTO services (title, summary, display_order) VALUES (@title, @summary, @display_order)'
  );
  const result = stmt.run({ title, summary, display_order: displayOrder });
  const service = db
    .prepare('SELECT id, title, summary, display_order FROM services WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(service);
});

app.put('/api/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { title, summary, display_order: displayOrder } = req.body;
  const stmt = db.prepare(
    `UPDATE services SET title = @title, summary = @summary, display_order = @display_order WHERE id = @id`
  );
  stmt.run({ id, title, summary, display_order: displayOrder });
  const service = db
    .prepare('SELECT id, title, summary, display_order FROM services WHERE id = ?')
    .get(id);
  res.json(service);
});

app.delete('/api/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM services WHERE id = ?');
  stmt.run(id);
  res.status(204).end();
});

app.get('/api/testimonials', (_req, res) => {
  const testimonials = db.prepare('SELECT id, author, quote, role FROM testimonials ORDER BY id ASC').all();
  res.json(testimonials);
});

app.post('/api/testimonials', requireAuth, (req, res) => {
  const { author, quote, role } = req.body;
  const stmt = db.prepare(
    'INSERT INTO testimonials (author, quote, role) VALUES (@author, @quote, @role)'
  );
  const result = stmt.run({ author, quote, role });
  const testimonial = db
    .prepare('SELECT id, author, quote, role FROM testimonials WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(testimonial);
});

app.put('/api/testimonials/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { author, quote, role } = req.body;
  const stmt = db.prepare(
    'UPDATE testimonials SET author = @author, quote = @quote, role = @role WHERE id = @id'
  );
  stmt.run({ id, author, quote, role });
  const testimonial = db
    .prepare('SELECT id, author, quote, role FROM testimonials WHERE id = ?')
    .get(id);
  res.json(testimonial);
});

app.delete('/api/testimonials/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
  res.status(204).end();
});

app.get('/api/leads', requireAuth, (_req, res) => {
  const leads = db
    .prepare(
      'SELECT id, name, email, phone, message, created_at FROM leads ORDER BY datetime(created_at) DESC'
    )
    .all();
  res.json(leads);
});

app.post('/api/leads', (req, res) => {
  const { name, email, phone, message } = req.body;
  const stmt = db.prepare(
    'INSERT INTO leads (name, email, phone, message) VALUES (@name, @email, @phone, @message)'
  );
  const result = stmt.run({ name, email, phone, message });
  const lead = db
    .prepare('SELECT id, name, email, phone, message, created_at FROM leads WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(lead);
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
