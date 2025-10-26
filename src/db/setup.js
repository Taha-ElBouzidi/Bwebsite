const bcrypt = require('bcryptjs');
const db = require('./connection');

function runMigrations() {
  const statements = `
    CREATE TABLE IF NOT EXISTS business_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      primary_color TEXT DEFAULT '#1f2937',
      secondary_color TEXT DEFAULT '#111827',
      accent_color TEXT DEFAULT '#f59e0b'
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      quote TEXT NOT NULL,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `;

  db.exec(statements);
}

function seedDefaults() {
  const profile = db.prepare('SELECT COUNT(*) as count FROM business_profile').get();
  if (!profile.count) {
    db.prepare(
      `INSERT INTO business_profile (id, name, tagline, description, phone, email, address, primary_color, secondary_color, accent_color)
       VALUES (1, @name, @tagline, @description, @phone, @email, @address, @primary_color, @secondary_color, @accent_color)`
    ).run({
      name: 'Your Business Name',
      tagline: 'Delivering excellence for every client',
      description:
        'Swap this copy with your own story. Highlight what makes your business unique, the problems you solve, and the results customers can expect.',
      phone: '(555) 123-4567',
      email: 'hello@yourbusiness.com',
      address: '123 Main Street, Anytown, USA',
      primary_color: '#1f2937',
      secondary_color: '#111827',
      accent_color: '#f59e0b'
    });
  }

  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (!serviceCount.count) {
    const insertService = db.prepare(
      'INSERT INTO services (title, summary, display_order) VALUES (@title, @summary, @display_order)'
    );

    const services = [
      {
        title: 'Signature Service',
        summary:
          'Describe your flagship service and the tangible outcomes it creates. Focus on the transformation clients experience.',
        display_order: 1
      },
      {
        title: 'Consulting & Strategy',
        summary:
          'Explain how you guide clients, collaborate on strategy, and map out a clear path to their goals.',
        display_order: 2
      },
      {
        title: 'Ongoing Support',
        summary:
          'Reassure prospects with details about support, maintenance, and long-term partnership options.',
        display_order: 3
      }
    ];

    const insertMany = db.transaction((rows) => {
      rows.forEach((row) => insertService.run(row));
    });

    insertMany(services);
  }

  const testimonialCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get();
  if (!testimonialCount.count) {
    const insertTestimonial = db.prepare(
      'INSERT INTO testimonials (author, quote, role) VALUES (@author, @quote, @role)'
    );

    const testimonials = [
      {
        author: 'Jordan Matthews',
        quote:
          '“We saw an immediate lift in customer satisfaction. The team translated our ideas into a polished experience that drives results.”',
        role: 'COO, Summit Industries'
      },
      {
        author: 'Priya Desai',
        quote:
          '“The dashboard gives us clear, actionable insight every day. Implementation was smooth and support has been phenomenal.”',
        role: 'Founder, Brightside Wellness'
      }
    ];

    const insertMany = db.transaction((rows) => {
      rows.forEach((row) => insertTestimonial.run(row));
    });

    insertMany(testimonials);
  }

  const ownerCount = db.prepare('SELECT COUNT(*) as count FROM owners').get();
  if (!ownerCount.count) {
    const passwordHash = bcrypt.hashSync('ownerpass123', 10);
    db.prepare('INSERT INTO owners (username, password_hash) VALUES (@username, @password_hash)').run({
      username: 'owner',
      password_hash: passwordHash
    });
  }
}

module.exports = {
  runMigrations,
  seedDefaults
};
