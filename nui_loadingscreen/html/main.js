document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('background-music');
    const musicContainer = document.getElementById('music-container')
    const musicToggle = document.getElementById('music-toggle');
    const volumeIcon = document.getElementById('volume-icon');
    const volumeText = document.getElementById('volume-text');
    const tipElement = document.querySelector('.loader-tip span');
    const progressInner = document.querySelector(".loader-bar-inner");
    const progressText = document.querySelector(".loader-percentage");

    audio.volume = 0.025;
    const isMuted = audio.muted;
    musicToggle.setAttribute('aria-pressed', isMuted);
    volumeIcon.src = isMuted ? 'assets/img/volume-muted.svg' : 'assets/img/volume-full.svg';
    volumeText.textContent = isMuted ? 'PLAY MUSIC' : 'MUTE MUSIC';

    const toggleMusic = () => {
        const muted = !audio.muted;
        audio.muted = muted;
        musicToggle.setAttribute('aria-pressed', muted);

        volumeText.classList.add('fade-out');
        volumeIcon.classList.add('fade-out');

        setTimeout(() => {
            volumeIcon.src = muted ? 'assets/img/volume-muted.svg' : 'assets/img/volume-full.svg';
            volumeText.textContent = muted ? 'PLAY MUSIC' : 'MUTE MUSIC';
            volumeText.classList.remove('fade-out');
            volumeIcon.classList.remove('fade-out');
        }, 400);
    };

    musicContainer.addEventListener('click', toggleMusic);
    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            toggleMusic();
        }
    });

    const tips = [
        "Tip: Press F9 to open the NUI-Labs Guide and view all information about the current showcased script — including features, controls, and preview screenshots.",
        "Tip: Certain scripts allow you to edit settings live — changes appear instantly!"
    ];
    let lastTipIndex = -1;

    const changeTip = () => {
        tipElement.classList.add('fade-out');
        setTimeout(() => {
            let newTipIndex;
            do {
                newTipIndex = Math.floor(Math.random() * tips.length);
            } while (tips.length > 1 && newTipIndex === lastTipIndex);
            
            lastTipIndex = newTipIndex;
            tipElement.textContent = tips[newTipIndex];
            tipElement.classList.remove('fade-out');
        }, 400);
    };

    changeTip();
    setInterval(changeTip, 10000);

    window.addEventListener("message", (e) => {
        if (e.data.eventName === "loadProgress") {
            const percentage = Math.round(e.data.loadFraction * 100);
            progressInner.style.width = `${percentage}%`;
            progressText.textContent = `${percentage}%`;
        }
    });
});
