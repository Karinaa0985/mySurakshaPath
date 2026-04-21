// --- Global Variables ---
let map, marker;
let userLat = 28.7041, userLng = 77.1025; // Default to central location
let watchId;
let timerInterval;
let totalTime = 0;
let timeRemaining = 0;
let safetyScore = 100;
let lastLat = null;
let lastLng = null;
let movementTicks = 0;
let guardians = JSON.parse(localStorage.getItem('guardians')) || [];

let mediaRecorder;
let audioChunks = [];

// --- Initialization ---
window.onload = function() {
    checkLoginState();
    loadPrimaryContact();
    getLocation();
    refreshPoliceStations();
    renderGuardians();

    // Stop audio playback when the modal is closed (via cross button or clicking outside)
    const evidenceModal = document.getElementById('evidenceModal');
    if (evidenceModal) {
        evidenceModal.addEventListener('hidden.bs.modal', () => {
            const audio = document.getElementById('audioPlayback');
            if (audio) {
                audio.pause();
                audio.currentTime = 0; // Reset to start
            }
        });
    }

    // Listen for messages from the chatbot iframe to close itself
    window.addEventListener('message', (event) => {
        // Ensure the message is from a trusted origin if the chatbot was external
        // For same-origin iframes, '*' is fine, but more specific origin is better in production
        if (event.data === 'closeChatbot') {
            toggleChatbot(); // Call the function to close the chatbot window
        }
    });
};

// --- 1. Google Maps & Geolocation ---
async function initMap() {
    if (typeof google === 'undefined') {
        console.error("Google Maps script failed to load. Check your network or API key.");
        return;
    }

    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    // Load required libraries for Advanced Markers
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    // Use current userLat/Lng if available, otherwise default
    const startLoc = { lat: userLat, lng: userLng };
    map = new Map(mapContainer, {
        zoom: 15,
        center: startLoc,
        disableDefaultUI: true, // Clean look
        mapId: "DEMO_MAP_ID" // Required for AdvancedMarkerElement
    });

    const pin = new PinElement({
        background: "#4285F4",
        borderColor: "white",
        glyphColor: "white",
    });

    marker = new AdvancedMarkerElement({
        map: map,
        position: startLoc,
        title: "You are here",
        content: pin.element
    });
}

function getLocation() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                const pos = { lat: userLat, lng: userLng };

                const locStatus = document.getElementById("locationStatus");
                if (locStatus) {
                    locStatus.innerHTML = 
                        `<i class="fas fa-map-marker-alt indigo-text"></i> Location Active: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;
                }

                if(map && marker) {
                    marker.position = pos;
                    map.setCenter(pos);
                }
            },
            (error) => {
                document.getElementById("locationStatus").innerText = "Location Access Denied. SOS features limited.";
                alert("Please enable location services for SurakshaPath to work.");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// --- Load Contact from Profile ---
function loadPrimaryContact() {
    // Default if not set in profile
    const phone = localStorage.getItem("primaryContact") || "918149919375"; 
    const displayEl = document.getElementById("displayEmergencyPhone");
    if (displayEl) displayEl.innerText = phone;
    return phone;
}

// --- 2. SOS Functionality (WhatsApp + Audio) ---
async function triggerSOS() {
    // A. Visual Feedback
    const btn = document.querySelector('.btn-sos');
    btn.style.backgroundColor = "darkred";
    btn.innerText = "SENDING...";
    const phone = loadPrimaryContact();

    // B. Start Audio Recording
    startRecording();

    // Show 'I Reached Safely' button to allow stopping the recording manually
    const safeBtn = document.getElementById("safeBtn");
    if (safeBtn) {
        safeBtn.style.display = "block";
    }

    // C. Send WhatsApp Message
    const mapLink = `https://www.google.com/maps?q=${userLat},${userLng}`;
    const message = `🚨 SOS! I feel unsafe. Here is my live location: ${mapLink}. Audio evidence is being recorded.`;
    
    // Send to Backend API (Automatic) - Removes the "Open App" popup
    const apiUrl = 'http://localhost:3000/send-sos';

    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone, message: message })
    })
    .catch(error => {
        console.error("Backend failed, falling back to manual WhatsApp");
        // Only open WhatsApp manually if the automatic backend fails
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    });

    // Reset Button UI after delay
    setTimeout(() => {
        btn.style.backgroundColor = "#e63946";
        btn.innerText = "SOS";
    }, 3000);
}

// --- 3. Audio Recording Logic (MediaRecorder API) ---
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        const recStatus = document.getElementById("recordingStatus");
        if (recStatus) {
            recStatus.style.display = "block";
        }

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            // Stop all audio tracks to release microphone hardware
            stream.getTracks().forEach(track => track.stop());

            // Use the actual recording format (fixes playback issues on different devices)
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Update all audio playback sources (handles multiple elements with same ID)
            document.querySelectorAll('#audioPlayback').forEach(audio => audio.src = audioUrl);

            // Update modal text if present
            const now = new Date();
            const dateTimeStr = now.toLocaleString();
            const modalBody = document.querySelector('#evidenceModal .modal-body p');
            if (modalBody) {
                modalBody.innerHTML = `<strong>Recording completed:</strong> ${dateTimeStr}<br>Evidence has been saved to your profile.`;
            }
            
            // Show Modal if present and auto-hide after 15 seconds
            const modalEl = document.getElementById('evidenceModal');
            if (modalEl) {
                const evidenceModal = bootstrap.Modal.getOrCreateInstance(modalEl);
                evidenceModal.show();

                setTimeout(() => {
                    evidenceModal.hide();
                }, 15000);
            }
            
            if (recStatus) {
                recStatus.style.display = "none";
            }
        };

        mediaRecorder.start();
        
    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access required for evidence recording.");
    }
}

// --- 4. Smart Travel Timer ---
function startTimer() {
    const minutesSelect = document.getElementById("timeSelect");
    totalTime = parseInt(minutesSelect.value) * 60;
    timeRemaining = totalTime;
    safetyScore = 100;
    movementTicks = 0;

    document.getElementById("timerControls").style.display = "none";
    document.getElementById("timerDisplayContainer").style.display = "flex";
    document.getElementById("timerActiveControls").style.display = "flex";
    document.getElementById("safeBtn").style.display = "block";

    runTimerInterval();
}

function runTimerInterval() {
    const circle = document.getElementById('progressRing');
    const circumference = 2 * Math.PI * 52; // Radius is 52
    circle.style.strokeDasharray = `${circumference} ${circumference}`;

    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (timeRemaining < 0) {
            clearInterval(timerInterval);
            alert("⚠️ Timer Expired! Sending Alert...");
            triggerSOS(); // Auto-trigger SOS
            resetTimerUI();
            return;
        }

        const m = Math.floor(timeRemaining / 60);
        const s = timeRemaining % 60;
        const display = document.getElementById("timerDisplay");
        display.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        const percent = (timeRemaining / totalTime) * 100;
        const offset = circumference - (percent / 100 * circumference);
        circle.style.strokeDashoffset = offset;

        // Smart Mode Movement Detection (Every 10 seconds)
        movementTicks++;
        if (movementTicks % 10 === 0 && document.getElementById("smartModeToggle").checked) {
            checkSmartMovement();
        }

        updateSafetyIndicator(percent);

        timeRemaining--;
    }, 1000);
}

function checkSmartMovement() {
    if (lastLat && lastLng) {
        const dist = Math.sqrt(Math.pow(userLat - lastLat, 2) + Math.pow(userLng - lastLng, 2));
        // Threshold for no movement (approx ~5 meters in coordinate delta)
        if (dist < 0.00005) {
            safetyScore = Math.max(0, safetyScore - 15);
            if (safetyScore < 40) {
                alert("⚠️ Warning: No significant movement detected. Are you okay?");
            }
        } else {
            safetyScore = Math.min(100, safetyScore + 5);
        }
    }
    lastLat = userLat;
    lastLng = userLng;
}

function updateSafetyIndicator(timePercent) {
    const badge = document.getElementById("safetyScoreBadge");
    const display = document.getElementById("timerDisplay");
    
    // Composite Score: Average of time remaining and movement score
    let currentRiskScore = (timePercent + safetyScore) / 2;
    
    let status = "Safe";
    let color = "var(--safe-color)";
    badge.className = "badge bg-success shadow-sm";

    if (currentRiskScore <= 30) {
        status = "Risky";
        color = "var(--sos-red)";
        badge.className = "badge bg-danger shadow-sm";
    } else if (currentRiskScore <= 60) {
        status = "Moderate";
        color = "var(--warning-color)";
        badge.className = "badge bg-warning text-dark shadow-sm";
    }

    badge.innerText = `Score: ${Math.round(currentRiskScore)} (${status})`;
    display.style.color = color;
}

function togglePause() {
    const pauseBtn = document.getElementById("pauseBtn");
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
        runTimerInterval();
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
}

function resetTimer() {
    if (confirm("Are you sure you want to reset the timer?")) {
        clearInterval(timerInterval);
        timerInterval = null;
        resetTimerUI();
    }
}

function shareLiveLocation() {
    const mapLink = `https://www.google.com/maps?q=${userLat},${userLng}`;
    const message = `📍 My current live location: ${mapLink}`;
    const phone = loadPrimaryContact();
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
}

function markSafe() {
    clearInterval(timerInterval);
    
    // Stop Audio Recording if it is active
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    }

    const phone = loadPrimaryContact();
    const message = "✅ I have reached my destination safely.";
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    resetTimerUI();
}

function resetTimerUI() {
    document.getElementById("timerControls").style.display = "block";
    document.getElementById("timerDisplayContainer").style.display = "none";
    document.getElementById("timerActiveControls").style.display = "none";
    document.getElementById("safeBtn").style.display = "none";
    
    // Reset Pause Button State
    const pauseBtn = document.getElementById("pauseBtn");
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
}

// --- 5. Fake Call Logic ---
function scheduleFakeCall() {
    alert("Incoming call scheduled in 5 seconds. Get ready!");
    setTimeout(() => {
        const overlay = document.getElementById("fakeCallOverlay");
        overlay.style.display = "flex";
        // Optional: Play a ringtone here
    }, 5000);
}

function endFakeCall() {
    document.getElementById("fakeCallOverlay").style.display = "none";
}

// --- 6. Helper Functions ---
function callPrimary() {
    const phone = loadPrimaryContact();
    window.location.href = `tel:${phone}`;
}

// --- 9. Guardian Management Logic ---
function renderGuardians() {
    const list = document.getElementById('guardianList');
    if (!list) return;

    list.innerHTML = '';
    if (guardians.length === 0) {
        list.innerHTML = '<div class="text-center text-muted py-4 small border rounded bg-light">No guardians linked yet. Click "Add" to authorize a family member.</div>';
    }

    guardians.forEach((g, index) => {
        const div = document.createElement('div');
        div.className = 'driver-item py-2 px-1 border-bottom d-flex justify-content-between align-items-center';
        div.innerHTML = `
            <div class="flex-grow-1">
                <div class="fw-bold small indigo-text">${g.name}</div>
                <div class="text-muted" style="font-size: 0.7rem;">${g.phone}</div>
            </div>
            <div class="d-flex align-items-center gap-3">
                <div class="form-check form-switch mb-0">
                    <input class="form-check-input" type="checkbox" role="switch" ${g.canTrack ? 'checked' : ''} onchange="toggleTracking(${index})">
                </div>
                <button class="btn btn-sm btn-link text-danger p-0" onclick="removeGuardian(${index})"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        list.appendChild(div);
    });
}

function addGuardian() {
    const modalEl = document.getElementById('addGuardianModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        // Fallback for pages without the modal
        const name = prompt("Enter Name:");
        const phone = prompt("Enter Phone Number:");
        if (name && phone) {
            guardians.push({ name, phone, canTrack: true });
            saveGuardians();
        }
    }
}

function saveNewGuardian() {
    const nameInput = document.getElementById('newGuardianName');
    const phoneInput = document.getElementById('newGuardianPhone');

    if (nameInput && phoneInput && nameInput.value.trim() && phoneInput.value.trim()) {
        guardians.push({ name: nameInput.value.trim(), phone: phoneInput.value.trim(), canTrack: true });
        saveGuardians();
        bootstrap.Modal.getInstance(document.getElementById('addGuardianModal')).hide();
        nameInput.value = '';
        phoneInput.value = '';
    } else {
        alert("Please enter both a name and a phone number.");
    }
}

function toggleTracking(index) {
    guardians[index].canTrack = !guardians[index].canTrack;
    saveGuardians();
}

function removeGuardian(index) {
    if (confirm(`Revoke access for ${guardians[index].name}?`)) {
        guardians.splice(index, 1);
        saveGuardians();
    }
}

function saveGuardians() {
    localStorage.setItem('guardians', JSON.stringify(guardians));
    renderGuardians();
}

// --- 8. Nearby Police Stations Logic ---
const policeStations = [
    { name: "Hingna Police Station", address: "Hingna Road, Nagpur", phone: "+91712232041", lat: 21.1039, lng: 79.0021 },
    { name: "Ambazari Police Station", address: "Amravati Rd, Nagpur", phone: "+91712253131", lat: 21.1401, lng: 79.0435 },
    { name: "Sitabuldi Police Station", address: "Wardha Rd, Nagpur", phone: "+91712256123", lat: 21.1458, lng: 79.0832 },
    { name: "MIDC Police Station", address: "MIDC Area, Nagpur", phone: "+91712281123", lat: 21.1150, lng: 78.9950 }
];

function refreshPoliceStations() {
    const list = document.getElementById('policeStationsList');
    if (!list) return;

    list.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary" role="status"></div><div class="small text-muted mt-1">Locating...</div></div>';
    
    // Simulate network delay for a realistic feel
    setTimeout(() => {
        list.innerHTML = '';
        policeStations.forEach(station => {
            // Rough distance calculation in KM
            const dist = (Math.sqrt(Math.pow(station.lat - userLat, 2) + Math.pow(station.lng - userLng, 2)) * 111).toFixed(1);
            
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center mb-3 border-bottom pb-2';
            div.innerHTML = `
                <div class="flex-grow-1 pe-2">
                    <div class="fw-bold small indigo-text">${station.name}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${station.address}</div>
                    <div class="badge bg-light text-dark fw-normal mt-1" style="font-size: 0.65rem;"><i class="fas fa-location-arrow me-1"></i>${dist} km away</div>
                </div>
                <div class="d-flex gap-2">
                    <a href="tel:${station.phone}" class="btn btn-sm btn-outline-success rounded-circle shadow-sm" title="Call"><i class="fas fa-phone"></i></a>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}" target="_blank" class="btn btn-sm btn-outline-primary rounded-circle shadow-sm" title="Directions"><i class="fas fa-directions"></i></a>
                </div>
            `;
            list.appendChild(div);
        });
    }, 1200);
}

// --- 7. UI Management ---
function checkLoginState() {
    // Simple simulation of login state using localStorage
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    // If not logged in, redirect to registration page
    if (!isLoggedIn) {
        window.location.href = "register.html";
        return;
    }

    const authLinks = document.getElementById("authLinks");
    const logoutSection = document.getElementById("logoutSection");

    if (authLinks) authLinks.style.display = "none";
    if (logoutSection) logoutSection.style.display = "block";
}

function handleLogout() {
    localStorage.setItem("isLoggedIn", "false");
    window.location.href = "register.html";
}

// --- Chatbot Widget Logic ---
function toggleChatbot() {
    const chatWindow = document.getElementById('chatbotWindow');
    if (!chatWindow) return;
    const isVisible = chatWindow.style.display === 'block';
    chatWindow.style.display = isVisible ? 'none' : 'block';
}