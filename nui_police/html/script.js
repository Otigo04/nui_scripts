// Function to handle messages from the Lua client
window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.action === "setVisible") {
        const container = document.getElementById('app-container');
        if (data.status) {
            container.style.display = 'flex';
        } else {
            container.style.display = 'none';
        }
    }
});

// Listener for the Escape Key to close the UI
window.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        // Send a request back to the Lua side to handle focus removal
        fetch(`https://${GetParentResourceName()}/closeUI`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({})
        });
    }
});

// Function to handle Tab Switching
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page-content');

function playClickSound() {
    // const audio = new Audio('assets/click.mp3');
    // audio.volume = 0.2;
    // audio.play();
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.getAttribute('data-page');

        if (targetPage) {
            // 1. Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // 2. Add active class to clicked item
            item.classList.add('active');

            // 3. Hide all pages
            pages.forEach(page => page.classList.remove('active'));
            // 4. Show targeted page
            const activePage = document.getElementById(targetPage);
            if (activePage) {
                activePage.classList.add('active');
            }
        }
    });
});