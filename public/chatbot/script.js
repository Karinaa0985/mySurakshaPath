// SurakshaPath Chatbot - Safety & Transport Q&A
const chatbotData = {
    greetings: ["Hi! I'm SurakshaPath Assistant. Ask about road safety or transport.", "Hello! How can I help with safe travel today?"],
    "road safety": "Always wear helmet/seatbelt, follow traffic rules, avoid drunk driving, use pedestrian crossings. For women: Trust instincts, avoid isolated areas.",
    "womens safety": "1. Share live location with family. 2. Use SOS button. 3. Fake call escape. 4. Trusted transport only. 5. Pepper spray/whistle ready.",
    "solo travel": "Avoid late night solo trips. Use buddy system or app-tracked rides. Fake incoming call feature available.",
    "harassment": "Shout, use SOS, record evidence. Dial 100/1091 (women helpline). Share location immediately.",
    "night safety": "Well-lit paths only, share route, emergency contacts set, SOS ready. Fake call for escape.",
    "emergency": "Women Helpline: 1091/181. Police: 100/112. SOS button records audio + sends location.",
    "pepper spray": "Legal in India (up to 300ml). Carry whistle too. Use SOS first for evidence.",
    "fake call": "Feeling unsafe? Trigger fake call from 'Mom' to escape situation safely.",
    "default": "Specialized in women's safety + transport. Ask: 'womens safety', 'solo travel', 'harassment'."
};

const messagesEl = document.getElementById('chat-messages');
const userInputEl = document.getElementById('user-input');
const sendBtnEl = document.getElementById('send-btn');

function addMessage(text, isUser = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageEl.textContent = text;
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function getBotResponse(query) {
    const lowerQuery = query.toLowerCase();
    for (const key in chatbotData) {
        if (lowerQuery.includes(key)) {
            return chatbotData[key];
        }
    }
    return chatbotData.default[Math.floor(Math.random() * chatbotData.default.length)];
}

function sendMessage() {
    const query = userInputEl.value.trim();
    if (!query) return;

    addMessage(query, true);
    userInputEl.value = '';

    setTimeout(() => {
        const response = getBotResponse(query);
        addMessage(response);
    }, 500);
}

sendBtnEl.addEventListener('click', sendMessage);
userInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Welcome message
addMessage(chatbotData.greetings[Math.floor(Math.random() * chatbotData.greetings.length)]);

// Q&A Buttons for guided experience
const qaButtons = [
    'Women\'s Safety',
    'Solo Travel Tips',
    'Harassment Help',
    'Night Safety',
    'Emergency Contacts',
    'Fake Call Escape',
    'Pepper Spray Info'
];

const buttonsContainer = document.createElement('div');
buttonsContainer.className = 'qa-buttons';
buttonsContainer.innerHTML = qaButtons.map(q => 
    `<button class="qa-btn" onclick="quickQuery('${q.toLowerCase().replace(/ /g, ' ')}')">${q}</button>`
).join('');
messagesEl.parentNode.insertBefore(buttonsContainer, messagesEl.nextSibling);

function quickQuery(query) {
    addMessage(query, true);
    setTimeout(() => {
        const response = getBotResponse(query);
        addMessage(response);
    }, 500);
}

// Access from main app: Add <a href="../chatbot/chatboxindex.html">Chat</a> in index.html