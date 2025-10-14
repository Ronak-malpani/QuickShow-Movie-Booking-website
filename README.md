<div align="center">

  <br />
  <img src="./Client/src/assets/logo.svg" alt="QuickShow Logo" width="80" height="80">
  
  <h1 align="center">🎟️ QuickShow - MERN Movie Booking Platform</h1>
  
  <p align="center">
    A feature-rich, full-stack web application built with the MERN stack for a seamless movie browsing and seat booking experience.
    <br />
    <a href="https://github.com/Ronak-code-coder/QuickShow-Movie-Booking-website"><strong>Explore the Repo »</strong></a>
    <br />
  </p>
</div>

<div align="center">

![License](https://img.shields.io/github/license/Ronak-code-coder/QuickShow-Movie-Booking-website?style=for-the-badge&color=blue)
![Stars](https://img.shields.io/github/stars/Ronak-code-coder/QuickShow-Movie-Booking-website?style=for-the-badge&color=yellow)
![Forks](https://img.shields.io/github/forks/Ronak-code-coder/QuickShow-Movie-Booking-website?style=for-the-badge&color=green)
![Issues](https://img.shields.io/github/issues/Ronak-code-coder/QuickShow-Movie-Booking-website?style=for-the-badge&color=orange)

</div>

---

<details>
  <summary>📚 Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

---

### About The Project

**QuickShow** is a modern, responsive web application designed to streamline the movie-going experience. It allows users to effortlessly discover movies, watch trailers, and book their preferred seats in a virtual theater. Built on the robust MERN stack, it features a secure JWT-based authentication system, a dynamic and interactive frontend powered by React, and a comprehensive backend API built with Node.js and Express.

The project also includes a complete administrative interface, allowing site managers to add new movies, schedule shows, and monitor booking activity, making it a full-fledged solution for a small-scale theater business.

---

### Key Features

-   **🎬 Dynamic Movie Catalog:** Browse, search, and filter movies. View detailed information including synopsis, cast, and trailers.
-   **🔐 Secure Authentication:** Robust user registration and login system using JSON Web Tokens (JWT).
-   **💺 Interactive Seat Selection:** An intuitive, clickable seat map that shows available, selected, and booked seats in real-time.
-   **👤 User Profile & History:** A dedicated dashboard for users to view and manage their booking history and profile details.
-   **👑 Admin Dashboard:** A protected, feature-rich panel for administrators to perform CRUD operations on movies, shows, and theaters.
-   **📱 Responsive Design:** Fully responsive UI that provides a seamless experience on all devices, from desktops to mobile phones.

---

### Tech Stack

| **Frontend** | **Backend** | **Database** |
| :---: | :---: | :---: |
| ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) | ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) | ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) | ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white) |
| ![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white) | ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) | |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) | | |

---

### Project Structure

/
├── Client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── redux/
│       └── App.jsx
├── server/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js
└── README.md


---

### Getting Started

To get a local copy up and running, follow these steps.

#### **Prerequisites**
-   Node.js & npm (v18 or higher)
-   Git
-   A MongoDB database instance (local or from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

#### **Installation & Setup**

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/Ronak-code-coder/QuickShow-Movie-Booking-website.git](https://github.com/Ronak-code-coder/QuickShow-Movie-Booking-website.git)
    cd QuickShow-Movie-Booking-website
    ```

2.  **Setup the Backend (in a new terminal):**
    ```sh
    cd server
    npm install
    # Create a .env file and add your variables. See the placeholder below.
    ```
    Your `server/.env` file should look like this:
    ```env
    MONGO_URI=<YOUR_MONGODB_CONNECTION_STRING>
    JWT_SECRET=<YOUR_SUPER_SECRET_JWT_KEY>
    PORT=8080
    ```
    Then start the server:
    ```sh
    npm start
    ```

3.  **Setup the Frontend (in another new terminal):**
    ```sh
    cd client
    npm install
    # Create a .env file with your server URL.
    ```
    Your `client/.env` file should look like this:
    ```env
    VITE_API_URL=http://localhost:8080
    ```
    Then start the client:
    ```sh
    npm run dev
    ```
The application will be available at `http://localhost:5173`.

---

### Roadmap

-   [ ] User Authentication (JWT)
-   [ ] Movie & Show CRUD Operations for Admin
-   [ ] Interactive Seat Booking
-   [ ] Payment Gateway Integration (Stripe/Razorpay)
-   [ ] User Reviews and Ratings System
-   [ ] Email Notifications for Bookings
-   [ ] Multiple Theater & Location Management

See the [open issues](https://github.com/Ronak-code-coder/QuickShow-Movie-Booking-website/issues) for a full list of proposed features (and known issues).

---

### License

Distributed under the MIT License. See `LICENSE` for more information.

---

### Acknowledgements

-   A big thank you to **[GreatStack]** for their insightful tutorial video **[Link to Video]** which was a great help in developing parts of this application.

---

### Contact

Ronak - [malpanironak11@gmail.com](mailto:malpanironak11@gmail.com) - [LinkedIn Profile](https://linkedin.com/in/ronakmalpani15)

Project Link: [https://github.com/Ronak-code-coder/QuickShow-Movie-Booking-website](https://github.com/Ronak-code-coder/QuickShow-Movie-Booking-website)
