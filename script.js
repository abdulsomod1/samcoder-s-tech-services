// Paginated reviews display (hides excess review cards and reveals them on "Load more")
const INITIAL_VISIBLE = 12; // how many reviews to show initially
const LOAD_BATCH = 12;      // how many to reveal each time "Load more" is clicked
let visibleCount = 0;

function getAllReviewCards() {
    return Array.from(document.querySelectorAll('.reviews-grid .review-card'));
}

function updateVisibility() {
    const cards = getAllReviewCards();
    cards.forEach((card, idx) => {
        if (idx < visibleCount) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;

    if (visibleCount >= cards.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'inline-block';
    }
}

function showMore() {
    visibleCount = Math.min(visibleCount + LOAD_BATCH, getAllReviewCards().length);
    updateVisibility();
}

// When fetching reviews from server, append them and update visibility
async function loadReviewsFromServer() {
    try {
        const response = await fetch('/api/reviews');
        if (!response.ok) return;
        const reviews = await response.json();
        const reviewsGrid = document.querySelector('.reviews-grid');

        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="stars">${review.stars}</div>
                <p>"${review.text}"</p>
                <p class="reviewer">- ${review.name}, ${review.location}</p>
            `;
            reviewsGrid.appendChild(reviewCard);
        });

        // After appending server reviews, ensure visibility rules apply
        updateVisibility();
    } catch (error) {
        // Ignore server errors — fall back to embedded reviews
        console.debug('No server review endpoint or failed to fetch reviews.');
    }
}

// Wire up DOM behavior
document.addEventListener('DOMContentLoaded', async () => {
    const cards = getAllReviewCards();
    visibleCount = Math.min(INITIAL_VISIBLE, cards.length);
    updateVisibility();

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', showMore);
    }

    // Try to load server-side reviews (if any), but don't override local ones
    await loadReviewsFromServer();

    // Attach submit behavior for review form (graceful client-side POST)
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reviewerName').value.trim();
            const location = document.getElementById('reviewerLocation').value.trim();
            const stars = document.getElementById('reviewerStars').value || '★★★★★';
            const text = document.getElementById('reviewText').value.trim();

            const newReview = { name, location, stars, text };

            try {
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newReview)
                });

                if (res.ok) {
                    // Append locally and update visibility
                    const reviewsGrid = document.querySelector('.reviews-grid');
                    const reviewCard = document.createElement('div');
                    reviewCard.className = 'review-card';
                    reviewCard.innerHTML = `\n                        <div class="stars">${stars}</div>\n                        <p>"${text}"</p>\n                        <p class="reviewer">- ${name}, ${location}</p>\n                    `;
                    reviewsGrid.insertBefore(reviewCard, reviewsGrid.firstChild);

                    // Reveal at least one more so user sees their review
                    visibleCount = Math.min(visibleCount + 1, getAllReviewCards().length);
                    updateVisibility();

                    reviewForm.reset();
                    alert('Thanks — your review has been submitted.');
                } else {
                    alert('Failed to submit review to server.');
                }
            } catch (err) {
                console.error('Submit review failed:', err);
                alert('Failed to submit review.');
            }
        });
    }
});
