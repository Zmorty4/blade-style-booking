const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const toggle = document.querySelector('[data-nav-toggle]');
const bookingForm = document.querySelector('.booking-form');
const formNote = document.querySelector('[data-form-note]');

const updateHeader = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 12);
};

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

toggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

nav.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formNote.textContent = 'Thanks. Connect this form to your booking system to receive requests.';
});
