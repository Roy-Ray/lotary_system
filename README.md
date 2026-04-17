# 🎡 Interactive Lucky Draw & Leaderboard System

A dynamic, full-stack web application built to host a live, interactive lucky draw event ("আশার আলো, ছকে খেলো"). The platform features a responsive glassmorphism UI, real-time visitor tracking, dynamic leaderboard shuffling, and a physics-based wheel spinner with grand reveal animations.

## ✨ Key Features

* **Dynamic Physics-Based Spinner:** A custom-built wheel that automatically calculates the exact mathematical stopping angle to land perfectly on the server-verified winner.
* **Grand Winner Reveal:** Synchronized 5-second suspense timer followed by an exploding confetti overlay, victory sound effects, and a centralized winner profile popup.
* **Live Leaderboard Shuffle:** Fetches top scorers (90-100 points) and utilizes a smooth, animated 1.5-second fade transition to shuffle their display every 7 seconds.
* **Real-Time Visitor Tracking:** A glowing, pulsing live counter that queries the database periodically and smoothly animates the count up as new users arrive.
* **Secure Organizer Access:** A hidden modal requiring an access code to trigger the backend spin algorithm, preventing unauthorized users from rolling the wheel.
* **Responsive Glassmorphism UI:** Advanced CSS techniques including blurred backdrops, animated floating background blobs, and CSS Grid. Fully optimized for flawless rendering on 4K desktop displays down to small mobile devices.

## 🛠️ Tech Stack

**Frontend:**
* HTML5 (Semantic structuring, Audio integrations)
* CSS3 (Glassmorphism, Keyframe Animations, CSS Grid/Flexbox, Media Queries)
* Vanilla JavaScript (DOM manipulation, Fetch API, Math logic, Asynchronous functions)
* Third-Party Libraries: `canvas-confetti` (for the winner reveal)

**Backend & Cloud Infrastructure:**
* RESTful API architecture (e.g., Node.js/Express)
* **Aiven Cloud MySQL** (Database Service)
* **Render** (Application Hosting)
* **Cloudinary** (Asset Storage)

## ☁️ Cloud Services & Deployment

This project leverages modern cloud infrastructure for high availability, reliable asset delivery, and secure data management.

### 1. Render Deployment
The application is configured for seamless, automated deployment on [Render](https://render.com/).
* **Setup:** Connect your GitHub repository to a new Render "Web Service".
* **Configuration:** Set your build command (e.g., `npm install`) and start command (e.g., `node server.js`).
* **Environment:** Add your secure environment variables (Database URI, Ports) directly in the Render dashboard. Render will automatically deploy your application every time you push new commits to your main branch.

### 2. Aiven Cloud MySQL Database Service
Participant data, live scores, and event configurations are securely managed using [Aiven's Cloud MySQL](https://aiven.io/).
* **Provisioning:** Create a new MySQL service within the Aiven Console.
* **Connection:** Retrieve your `Service URI` or individual connection parameters (Host, Port, User, Password).
* **Integration:** Store these credentials securely in your backend's `.env` file (e.g., `DB_URL="mysql://user:pass@host:port/dbname"`). Aiven ensures fast, secure, and reliable queries for live leaderboard updates and wheel results.

### 3. Cloudinary Image Storage
To guarantee instant loading times and prevent hotlinking restrictions, all static assets and dynamic participant profile pictures are hosted on [Cloudinary](https://cloudinary.com/).
* **Management:** Upload primary assets (like the event's Asha Bhosle marquee image) and winner avatars to your Cloudinary media library.
* **Delivery:** Copy the secure, optimized delivery URLs provided by Cloudinary.
* **Integration:** Save these URLs in your Aiven MySQL database. The frontend dynamically fetches and renders these optimized URLs, ensuring the wheel and popups load instantaneously without broken image links.

## 📂 Project Structure

* `index.html`: The main entry point. Contains the UI layout, modal structures, and imports the Confetti library and audio assets.
* `style.css`: Contains all styling, including the `.glass-panel` effects, the `.wheel` pseudo-elements, and extensive `@media` queries for mobile alignment.
* `script.js`: The core engine. Handles API requests, spinner physics (`currentRotation`, angles), the countdown timer, the animated shuffle loop, and the synchronized winner reveal logic.

## 🔌 Expected API Endpoints

The frontend (`script.js`) relies on the following backend endpoints located at `window.location.origin`:

| Endpoint | Method | Description | Expected Response |
| :--- | :--- | :--- | :--- |
| `/participants` | `GET` | Fetches all users. Used to build the Top 10 scorers list and the Eligible VIP wheel/marquee. | `[{ name, district, score, is_eligible, image_url }]` |
| `/event` | `GET` | Fetches dynamic event details and the target countdown time. | `{ event_name, organizer_name, event_time }` |
| `/spin` | `POST` | Receives the organizer code. Calculates and saves the winner on the backend. | `{ name, district, image_url }` |
| `/visit` | `GET` | Registers a new unique visit to the site. | `{ views: <number> }` |
| `/visitors` | `GET` | Returns the current total live visitor count. | `{ views: <number> }` |

## 🚀 Setup & Usage (Local Development)

1. **Clone the repository:** Download the source code to your local machine.
2. **Environment Configuration:** Create a `.env` file in your backend directory containing your Aiven MySQL credentials and port assignments.
3. **Run the App:** Start your backend server and open the application via your local host (e.g., `http://localhost:3000`).
4. **Trigger the Draw:** * Click the central `▶` play button on the wheel.
   * Enter the secure organizer code (default: `1234`).
   * Watch the wheel spin, trigger the confetti, and reveal the winner!

## 🎨 Acknowledgements
* Sound effects provided by [Mixkit](https://mixkit.co/) and [MyInstants](https://www.myinstants.com/).
* Confetti animations powered by [canvas-confetti](https://www.npmjs.com/package/canvas-confetti).
