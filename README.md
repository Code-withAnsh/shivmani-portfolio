# Shivmani Singh · Portfolio

This is the project portfolio of **Shivmani Singh**, a full stack developer and BCA final-year student from Varanasi. It shows my work, my education and the tools I build with, and it has a contact form that sends messages to a private admin inbox.

## About me

I build full stack products: the interface, the API and the database. I care about how a product feels as much as how it works, so this site is built around smooth scrolling, motion and clean structure. I started with school projects and a drop year of self-study, and now I build solo products end to end.

## Projects

- **JS Arena:** a Java practice platform with an AI tutor that explains what went wrong, without giving the answer away.
- **HackWave Dispatch:** an emergency dispatch prototype that finds the nearest unit, with live updates.
- **JRC Inter College:** an online school portal, in Hindi and English.

## What's on the site

- **Intro:** press and hold to start a short cinematic intro.
- **About, Education and Projects:** who I am, where I studied, and the work I have built. Each project opens into a full case study.
- **Tech stack:** the tools I use, grouped by Frontend, Backend, Database, Languages and Tools.
- **Gallery:** photos from campus, hack days and builds.
- **Contact:** a footer form with validation, social links and a résumé download.
- **Admin inbox** at `/admin`: a private, password-protected view of contact messages.

## Tech

- **Frontend:** React 18, Vite, GSAP with ScrollTrigger, Lenis for smooth scrolling, Three.js.
- **Backend:** Node.js, Express, MongoDB with Mongoose, JWT for admin sessions, rate limiting and Helmet.

## Run it locally

1. Install dependencies:
   ```bash
   npm install
   npm install --prefix client
   ```
2. Create `backend/.env` with `MONGO_URI`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `FRONTEND_URL` and `PORT`. Secrets are never committed.
3. Start the backend:
   ```bash
   npm start
   ```
4. In another terminal, start the frontend:
   ```bash
   npm run dev --prefix client
   ```

To build the site for production, run `npm run build`. Then `npm start` serves the site and `/admin` from one port.

## Contact

Reach me through the contact form on the site, or through the social links in the footer.
