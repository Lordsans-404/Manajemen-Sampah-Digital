/**
 * @fileoverview
 * Shared logic for all pages.
 */

const CONFIG = {
  API_BASE_URL:
    ["localhost", "127.0.0.1", "0.0.0.0", ""].includes(location.hostname) || location.hostname.startsWith("192.168.")
      ? "http://localhost:3000/api"
      : "https://manajemen-sampah-digital-production.up.railway.app/api"
};

document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.style.animationPlayState = 'running';
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
});
