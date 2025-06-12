// Update rating value display
const ratingInput = document.getElementById('rating');
const ratingValue = document.getElementById('rating-value');

if (ratingInput) {
    ratingInput.addEventListener('input', (e) => {
        ratingValue.textContent = e.target.value;
    });
}

// Reveal punchline
function revealPunchline() {
    const punchlineText = document.getElementById('punchline-text');
    const revealBtn = document.getElementById('reveal-btn');
    
    punchlineText.classList.remove('hidden');
    revealBtn.style.display = 'none';
}

// Submit rating
async function submitRating(jokeId) {
    const rating = document.getElementById('rating').value;
    const rateBtn = document.getElementById('rate-btn');
    const averageRating = document.getElementById('average-rating');
    
    try {
        rateBtn.disabled = true;
        const response = await fetch('/rate-joke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jokeId,
                rating: parseInt(rating)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            averageRating.textContent = `Average Rating: ${data.averageRating}`;
            rateBtn.textContent = 'Rating Submitted!';
        } else {
            throw new Error('Failed to submit rating');
        }
    } catch (error) {
        console.error('Error:', error);
        rateBtn.textContent = 'Error submitting rating';
    } finally {
        setTimeout(() => {
            rateBtn.disabled = false;
            rateBtn.textContent = 'Submit Rating';
        }, 2000);
    }
} 