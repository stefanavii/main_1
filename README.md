# Agent Vacancy Application System (MySQL version)

This website has a real backend server that saves job applications into a
**MySQL** database. When someone fills out the "Apply Now" form on the
Agent Vacancy page, their details (Full Name, Email, Phone Number, NIC
Number) are saved as a new row in a MySQL table.

## What's included

```
agent-backend/
├── server.js          <- Backend server (Node.js + Express + MySQL)
├── schema.sql          <- Reference copy of the database structure
├── .env.example         <- Template for your database password (copy this)
├── package.json
└── public/              <- All website pages (served by the server)
    ├── index.html
    ├── ai-course.html
    ├── cosmetic-product.html
    ├── agent-vacancy.html  <- Has the real application form
    └── admin.html           <- View all submitted applications
```

## Before you start: set your MySQL password

1. In the `agent-backend` folder, find the file called **`.env.example`**
2. Make a copy of it and rename the copy to exactly **`.env`** (just `.env`,
   no other text)
   - In IntelliJ: right-click `.env.example` → Copy, then right-click the
     folder → Paste, then rename it to `.env`
3. Open `.env` and replace `PUT_YOUR_MYSQL_PASSWORD_HERE` with your real
   MySQL root password (the one you use in MySQL Workbench)
4. Save the file

Your `.env` file should look like this when done:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourActualPasswordHere
DB_NAME=agent_vacancy_db
PORT=3000
```

**Never share this `.env` file with anyone** — it contains your real
password.

## How to run it

1. Make sure **MySQL is running** (open MySQL Workbench and confirm you can
   connect — if that works, MySQL is running).
2. Open a terminal in the `agent-backend` folder.
3. Install dependencies (only needed once):
   ```
   npm install
   ```
4. Start the server:
   ```
   node server.js
   ```
5. You should see:
   ```
   Server running at http://localhost:3000
   Connected to MySQL database: agent_vacancy_db
   ```
   The server automatically creates the `agent_vacancy_db` database and the
   `applicants` table for you the first time it runs — you don't need to
   create anything manually in Workbench.
6. Open your browser to:
   ```
   http://localhost:3000
   ```

## How to see who has submitted

**Option A — In your browser:**
```
http://localhost:3000/admin.html
```
This shows a live table of every Agent Vacancy applicant AND every AI Course
enrollment.

**Option B — In MySQL Workbench:**
1. Connect to your local MySQL server as you normally would
2. In the schema list on the left, find **`agent_vacancy_db`**
3. Expand it → Tables → `applicants` (job applicants) or `enrollments`
   (AI course sign-ups)
4. Right-click a table → "Select Rows - Limit 1000"

Or just run these queries directly in a Workbench SQL tab:
```sql
SELECT * FROM agent_vacancy_db.applicants ORDER BY id DESC;
SELECT * FROM agent_vacancy_db.enrollments ORDER BY id DESC;
```

## Troubleshooting

**"Failed to initialize database" / "Access denied"**
Your password in `.env` is wrong, or MySQL isn't running. Open MySQL
Workbench and confirm you can connect with the same username/password first.

**"ECONNREFUSED"**
MySQL isn't running. Start it from XAMPP/WAMP's control panel, or however
you normally start your MySQL server.

## Important security note

The `/admin.html` page and `/api/applicants` endpoint have **no password
protection**. Anyone who knows the URL can see every applicant's personal
data, including NIC numbers. Add a login step before using this with real
applicants or putting it online. Let me know if you'd like this added.
