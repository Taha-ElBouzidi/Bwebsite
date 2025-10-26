# Resto business website template

A ready-to-customize business landing page backed by an Express API, SQLite database, and lightweight dashboard for editing content and reviewing leads. Use it as a starting point for almost any service business or product idea.

## Features

- **Dynamic landing page** – Pulls business info, services, and testimonials from the database to keep the homepage in sync with your messaging.
- **Self-hosted dashboard** – Manage copy, services, testimonials, and review contact form submissions without touching the code.
- **SQLite persistence** – Portable database with automatic migrations and seed data for quick prototyping.
- **API endpoints** – REST endpoints for content and lead intake make it easy to extend or integrate with other systems.

## Project structure

```
.
├── public/
│   ├── app.js              # Landing page client logic
│   ├── dashboard.js        # Dashboard client logic
│   ├── dashboard.html      # Admin dashboard UI
│   ├── index.html          # Public landing page template
│   └── styles/
│       ├── dashboard.css
│       └── main.css
├── src/
│   ├── db/
│   │   ├── connection.js   # SQLite connection helper
│   │   └── setup.js        # Migration + seed helpers
│   └── server.js           # Express app and API routes
├── database.sqlite         # Created automatically on first run
├── package.json
└── README.md
```

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run migrations and seed default content (optional if you run the server – it happens automatically):

   ```bash
   npm run migrate
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   or start without hot reloading:

   ```bash
   npm start
   ```

4. Visit [`http://localhost:3000`](http://localhost:3000) for the public site and [`http://localhost:3000/dashboard.html`](http://localhost:3000/dashboard.html) for the dashboard.

## Customization tips

- Update the brand details and colors from the dashboard under **Brand & messaging**.
- Add, reorder, or delete services to adapt the template for different offerings.
- Add testimonials to highlight client wins and build trust.
- Contact form submissions land in the **Incoming leads** panel; export them from the API (`GET /api/leads`) if you need to integrate with a CRM.
- Extend the Express API or adjust the database schema in `src/server.js` and `src/db/setup.js` as your project grows.

## API overview

| Method | Path                | Description                         |
| ------ | ------------------- | ----------------------------------- |
| GET    | `/api/content`      | Aggregate landing page content      |
| GET    | `/api/business`     | Fetch business profile details      |
| PUT    | `/api/business`     | Update business profile             |
| GET    | `/api/services`     | List services                       |
| POST   | `/api/services`     | Create a new service                |
| PUT    | `/api/services/:id` | Update an existing service          |
| DELETE | `/api/services/:id` | Remove a service                    |
| GET    | `/api/testimonials` | List testimonials                   |
| POST   | `/api/testimonials` | Create a testimonial                |
| PUT    | `/api/testimonials/:id` | Update a testimonial            |
| DELETE | `/api/testimonials/:id` | Delete a testimonial            |
| GET    | `/api/leads`        | List contact form submissions       |
| POST   | `/api/leads`        | Create a new lead from the contact form |

## Environment variables

The server uses sensible defaults. Override them as needed:

- `PORT` – Port for the Express server (defaults to `3000`).
- `DATABASE_PATH` – File path for the SQLite database (defaults to `./database.sqlite`).

## License

ISC
