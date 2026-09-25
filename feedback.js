const body = document.body;
const feedbackForm = document.getElementById('feedbackForm');
const ratingValue = document.getElementById('ratingValue');
const ratingLabel = document.getElementById('ratingLabel');
const formSuccess = document.getElementById('formSuccess');
const reviewList = document.getElementById('reviewList');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');
let toastTimer;
let db;
let reviewsUnsubscribe;

const REVIEWS_COLLECTION = 'reviews';
const MAX_VISIBLE_REVIEWS = 8;
const ratingNames = {
  0: 'Tap to rate',
  1: 'Needs more mithaas',
  2: 'A little sweet',
  3: 'Pretty tasty',
  4: 'Very delicious',
  5: 'Mithaas certified!'
};

function showToast(message) {
  toastText.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function selectRating(value) {
  ratingValue.value = value;
  ratingLabel.textContent = ratingNames[value] || ratingNames[0];
  document.querySelectorAll('.rating-star').forEach((star) => {
    star.classList.toggle('selected', Number(star.dataset.rating) <= value);
  });
}

document.querySelectorAll('.rating-star').forEach((star) => {
  star.addEventListener('click', () => selectRating(Number(star.dataset.rating)));
  star.addEventListener('mouseenter', () => {
    document.querySelectorAll('.rating-star').forEach((item) => {
      item.classList.toggle('selected', Number(item.dataset.rating) <= Number(star.dataset.rating));
    });
  });
});

document.querySelector('.rating-picker').addEventListener('mouseleave', () => {
  const current = Number(ratingValue.value);
  document.querySelectorAll('.rating-star').forEach((star) => {
    star.classList.toggle('selected', Number(star.dataset.rating) <= current);
  });
});

function normalizeText(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function getReviewFromForm(formData) {
  const name = normalizeText(formData.get('name'), 80);
  const message = normalizeText(formData.get('message'), 500);
  const rating = Number(formData.get('rating'));

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Tap the stars first — every sweet deserves a rating' };
  }

  if (name.length < 2) {
    return { error: 'Add a name with at least 2 letters' };
  }

  if (message.length < 10) {
    return { error: 'Write a slightly longer note before posting' };
  }

  return {
    review: {
      name,
      message,
      rating,
      permission: document.getElementById('permission').checked
    }
  };
}

function createReviewCard(review, index) {
  const card = document.createElement('article');
  const quoteMark = document.createElement('span');
  const message = document.createElement('p');
  const meta = document.createElement('span');
  const safeRating = Math.max(1, Math.min(5, Number(review.rating) || 1));

  const theme = (index % 8) + 1;
  card.className = `meme-card quote-card user-review review-theme-${theme}`;
  quoteMark.className = 'quote-mark-small';
  quoteMark.textContent = '“';
  message.textContent = review.message;
  meta.textContent = `— ${review.name} · ${'★'.repeat(safeRating)}`;

  card.append(quoteMark, message, meta);
  return card;
}

function renderReviews(reviews) {
  reviewList.querySelectorAll('.user-review').forEach((card) => card.remove());

  const fragment = document.createDocumentFragment();
  reviews.slice(0, MAX_VISIBLE_REVIEWS).forEach((review, index) => {
    fragment.appendChild(createReviewCard(review, index));
  });

  reviewList.appendChild(fragment);
}

function connectFirestoreReviews() {
  if (!window.firebase || !firebase.apps.length || !firebase.firestore) {
    renderReviews([]);
    showToast('Firebase is not connected yet, so reviews cannot sync');
    return;
  }

  db = firebase.firestore();
  reviewsUnsubscribe = db
    .collection(REVIEWS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(MAX_VISIBLE_REVIEWS)
    .onSnapshot((snapshot) => {
      const reviews = snapshot.docs.map((doc) => doc.data());
      renderReviews(reviews);
    }, (error) => {
      console.warn('Firebase reviews could not be loaded.', error);
      renderReviews([]);
      showToast(`Could not load Firebase reviews: ${error.code || 'check setup'}`);
    });
}

async function saveReview(review) {
  if (!review.permission) return 'private';

  if (!db || !window.firebase || !firebase.firestore) {
    throw new Error('Firebase is not connected');
  }

  await db.collection(REVIEWS_COLLECTION).add({
    name: review.name,
    message: review.message,
    rating: review.rating,
    permission: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return 'firebase';
}

feedbackForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = feedbackForm.querySelector('button[type="submit"]');
  const formData = new FormData(feedbackForm);
  const { review, error } = getReviewFromForm(formData);

  if (error) {
    showToast(error);
    return;
  }

  submitButton.disabled = true;

  try {
    const saveTarget = await saveReview(review);
    formSuccess.classList.add('show');
    feedbackForm.reset();
    selectRating(0);

    if (saveTarget === 'private') {
      showToast('Thanks — your private feedback will not be published');
    } else {
      showToast('Feedback posted — now visible on every device!');
    }

    setTimeout(() => formSuccess.classList.remove('show'), 4300);
  } catch (error) {
    console.warn('Feedback could not be saved to Firebase.', error);
    showToast(`Could not publish to Firebase: ${error.code || error.message}`);
  } finally {
    submitButton.disabled = false;
  }
});

const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  localStorage.setItem('sidhbali-theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
  showToast(body.classList.contains('dark-mode') ? 'Night mode on' : 'Daylight mode on');
});
if (localStorage.getItem('sidhbali-theme') === 'dark') body.classList.add('dark-mode');

const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileNav = document.getElementById('mobileNav');
mobileMenuButton.addEventListener('click', () => {
  mobileMenuButton.classList.toggle('open');
  mobileNav.classList.toggle('open');
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileMenuButton.classList.remove('open');
  mobileNav.classList.remove('open');
}));

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

window.addEventListener('beforeunload', () => {
  if (reviewsUnsubscribe) reviewsUnsubscribe();
});

connectFirestoreReviews();
