document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let targetUser = urlParams.get('user');

    const isAuth = await checkAuth();
    if (!targetUser) {
        if (!isAuth) {
            window.location.href = '/login.html';
            return;
        }
        // fetch current user
        targetUser = JSON.parse(localStorage.getItem('user')).username;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/users/${targetUser}`);
        if (!res.ok) throw new Error('User not found');

        const user = await res.json();
        const initial = user.username.charAt(0).toUpperCase();

        const html = `
            <div class="profile-header">
                <div class="profile-avatar">${initial}</div>
                <div class="profile-info">
                    <h1>${user.username}</h1>
                    <p style="color:var(--text-secondary)">Joined ${new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            <section class="stats-row">
                <div class="card stat-box">
                    <h3>Total Solved</h3>
                    <div class="stat-value">${user.totalSolved}</div>
                </div>
                <div class="card stat-box">
                    <h3>Current Streak</h3>
                    <div class="stat-value">${user.currentStreak}</div>
                </div>
                <div class="card stat-box">
                    <h3>Badges</h3>
                    <div class="stat-value">${user.badges.length}</div>
                </div>
            </section>
            <section class="card badges-section mt-4">
                <h2>Badges</h2>
                <div class="badges-grid" id="badges-container">
                    ${user.badges.map(b => `
                        <div class="badge-card badge-earned">
                            <div class="badge-icon">🎖️</div>
                            <h4>${b.name}</h4>
                            <p>${b.description}</p>
                            <small style="color:var(--accent-yellow)">${b.rarity}</small>
                        </div>
                    `).join('')}
                    ${user.badges.length === 0 ? '<p style="color:var(--text-secondary)">No badges yet.</p>' : ''}
                </div>
            </section>
        `;

        let apiSettingsHtml = '';
        if (isAuth && JSON.parse(localStorage.getItem('user')).username === user.username) {
            let hasKey = false;
            try {
                const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const meData = await meRes.json();
                hasKey = !!meData.groqApiKey;
            } catch(e){}

            apiSettingsHtml = `
            <section class="card progress-section mt-4" style="border: 1px solid var(--accent-green);">
                <h2>🤖 Groq AI Settings (BYOK)</h2>
                <p style="color:var(--text-secondary); margin-bottom:15px; font-size:0.9rem;">
                    JSArena uses a Bring Your Own Key (BYOK) model to keep AI features 100% free and scalable. 
                    ${hasKey ? '<span style="color:var(--accent-green); font-weight:bold;">✅ You have an active API key saved.</span>' : '<span style="font-weight:bold; color:var(--text-secondary)">❌ No API key found. AI features are locked.</span>'}
                </p>
                
                <div class="api-guide" style="background-color: rgba(0,255,136,0.05); border: 1px solid rgba(0,255,136,0.2); border-radius:8px; padding:15px; margin-bottom:15px;">
                    <span style="font-weight:bold;">How to get your FREE key:</span>
                    <ol style="margin-top:10px; padding-left:20px; color:var(--text-secondary); font-size:0.85rem;">
                        <li>Go to <a href="https://console.groq.com/keys" target="_blank" style="color:var(--accent-green); text-decoration:underline;">🎟️ console.groq.com/keys</a></li>
                        <li>Login with Google and click "Create API Key"</li>
                        <li>Name it JSArena, copy the key (starts with gsk_) and paste it below.</li>
                    </ol>
                </div>

                <div class="form-group" style="display:flex; gap:10px;">
                    <input type="text" id="updateGroqKey" placeholder="${hasKey ? '••••••••••••••••••••••••••••' : 'Enter Groq API Key (gsk_...)'}" style="flex:1;">
                    <button class="btn-primary" id="saveKeyBtn">Save Key</button>
                </div>
            </section>
            `;
        }

        document.getElementById('profile-content').innerHTML = html + apiSettingsHtml;

        const saveKeyBtn = document.getElementById('saveKeyBtn');
        if (saveKeyBtn) {
            saveKeyBtn.addEventListener('click', async () => {
                const keyInput = document.getElementById('updateGroqKey').value;
                if (!keyInput.startsWith('gsk_')) {
                    showToast('Invalid Groq API Key. Must start with gsk_', 'error');
                    return;
                }
                saveKeyBtn.textContent = 'Saving...';
                try {
                    const updateRes = await fetch(`${API_BASE_URL}/users/api-key`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ groqApiKey: keyInput })
                    });
                    if (updateRes.ok) {
                        showToast('API Key saved successfully!');
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        showToast('Failed to save key', 'error');
                    }
                } catch(e) {
                    showToast('Network error', 'error');
                }
                saveKeyBtn.textContent = 'Save Key';
            });
        }

        if (typeof gsap !== 'undefined') {
            gsap.from('.profile-header', { y: -20, opacity: 0, duration: 0.6 });
            gsap.from('.stat-box', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.2 });
        }

    } catch (e) {
        document.getElementById('profile-content').innerHTML = `<h2>User not found</h2>`;
    }
});
