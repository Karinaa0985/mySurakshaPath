function toggleForm(formId) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(form => {
        form.classList.remove('active');
        form.classList.add('hidden');
    });
    
    // Show the requested section
    const activeForm = document.getElementById(formId);
    activeForm.classList.remove('hidden');
    activeForm.classList.add('active');
}

// Handle Registrations
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Extract data from the form
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert("Registration successful! You can now login.");
            toggleForm('loginForm'); // Switch to login view
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        alert("Failed to connect to the server.");
    }
});

// Handle Logins
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert("Login successful!");
            
            // Save the login state so the main app knows the user is authenticated
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("token", data.token); // Save the secure JWT token
            
            // Redirect to the main SurakshaPath dashboard
            window.location.href = 'index.html'; 
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        alert("Failed to connect to the server.");
    }
});

// Handle OTP Forgot Password
document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/forgot-password', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }) 
        });
        
        const data = await response.json();
        if (response.ok) {
            alert("OTP sent! Please check your email inbox.");
            toggleForm('resetPasswordForm'); // Switch to the OTP entry form
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        alert("Failed to connect to the server.");
    }
});

// Handle OTP Verification & Password Reset
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // We need the email from the previous form to identify the user
    const email = document.getElementById('forgotEmail').value;
    const otp = document.getElementById('resetOtp').value;
    const newPassword = document.getElementById('resetNewPassword').value;
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert("Success! Your password has been changed.");
            toggleForm('loginForm');
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        alert("Failed to connect to the server.");
    }
});
