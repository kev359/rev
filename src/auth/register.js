// ============================================
// REGISTER LOGIC
// ============================================

import authService from './auth.service.js';
import driversService from '../drivers/drivers.service.js';
import { setButtonLoading, showMessage } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    async function handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!name || !email || !phone || !password) {
            showError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        setButtonLoading(registerBtn, true);
        showError(''); // Clear error
        successMessage.style.display = 'none';

        try {
            // 1. Sign Up
            const { success, data, error } = await authService.signUp(email, password);

            if (!success) {
                throw new Error(error);
            }

            const user = data.user;
            if (!user) {
                throw new Error('Registration failed. Please try again.');
            }

            // 2. Create Driver Profile
            // We use the registerProfile method which uses standard INSERT (assuming RLS allows it)
            await driversService.register({
                user_id: user.id,
                name,
                email,
                phone
                // route_id is left null, admin will assign
            });

            // 3. Success
            registerForm.reset();
            successMessage.textContent = 'Account created successfully! Redirecting...';
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            showError(error.message || 'Failed to register. Please try again.');
            
            // If user was created but profile failed, we might have a consistency issue.
            // But usually RLS prevents insert if something is wrong.
            // For MVP, we just show error.
            if (error.message.includes('already registered')) {
                showError('This email is already registered.');
            }
        } finally {
            setButtonLoading(registerBtn, false);
        }
    }

    function showError(message) {
        if (message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    }
});
