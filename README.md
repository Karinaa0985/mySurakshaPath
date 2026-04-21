
# SurakshaPath - Campus Safety Web App

## Project Description
SurakshaPath is a web-based safety application designed to ensure the security of students on campus. It provides real-time location tracking, an SOS emergency alert system, audio evidence recording, and a smart travel timer to monitor safe arrivals.

## Features
- **🚨 SOS Alert System:** Instantly sends live location and a distress message to emergency contacts via WhatsApp/SMS.
- **📍 Live Location Tracking:** Displays the user's real-time position on a Google Map.
- **🎙️ Audio Evidence Recording:** Automatically records audio when SOS is triggered for evidence.
- **⏳ Smart Travel Timer:** Sets a safety timer for journeys; alerts contacts if the user doesn't mark themselves safe in time.
- **🛺 Trusted Auto Drivers:** Directory of verified campus transport drivers.
- **📞 Emergency Contacts:** Quick access to call or message guardians.

## Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend:** Node.js, Express.js
- **APIs:** Google Maps JavaScript API, Twilio (for SMS/WhatsApp automation)

## Prerequisites
Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- A Google Cloud Project with **Maps JavaScript API** enabled.
- A Twilio Account (optional, for backend SMS features).

## Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install Backend Dependencies**
   ```bash
   npm install
   ```
   *Required packages: `express`, `cors`, `body-parser`, `twilio`, `dotenv`*

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

4. **Start the Backend Server**
   ```bash
   node server.js
   ```
   The server will run at `http://localhost:3000`.

5. **Run the Frontend**
   Open `index.html` in your browser.
   *Note: For geolocation and audio recording to work on mobile devices, the site must be served over HTTPS or `localhost`.*

Overview Execution

https://github.com/user-attachments/assets/cb4be607-4b91-4c71-bb4e-324267e3a97d

## Team Details
*   **Team Name:** TA0082
*   **Member 1:** Karina Kaur
*   **Member 2:**Bhakti Pandhare
*   **Member 3:**Gauri Narlawar
*   **Member 4:** Divya Bagde
*   **Member 5:** Bhumi Gupta

---
*Developed for PCE Hackathon*
=======
# my-TAA082
Haxkathon project at PCE, Nagpur
>>>>>>> 0c5363f96af62672ffeb3b4c913206520c2083de
