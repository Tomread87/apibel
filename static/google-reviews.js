// Carousel navigation
document.getElementById("reviews-prev")
    .addEventListener("click", () => moveReviews(-1));

document.getElementById("reviews-next")
    .addEventListener("click", () => moveReviews(1));

function moveReviews(direction) {
    const track = document.getElementById("google-reviews");
    const card = track.querySelector(".review-card");
    if (!card) return;

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;

    track.scrollBy({
        left: direction * (card.getBoundingClientRect().width + gap),
        behavior: "smooth"
    });
}




const initApibelReviews = async function () {
    
    try {
        // Load Google Places library
        /*const { Place } =
            await google.maps.importLibrary("places");*/

        // Apibel's Google Place ID
        /*const place = new Place({
            id: "ChIJWVfiXABzhkcRh_osv744VoU"
        });*/
        
        const response = await fetch("/static/data/google-reviews.json");
        const place = response.ok ? await response.json() : {};
        
        console.log("Google Reviews data:", place);

        // Display reviews
        const container = document.getElementById("google-reviews");
        container.replaceChildren();

        const reviews = place.reviews || [];

        const carousel = document.querySelector(
            "#recensioni .reviews-carousel"
        );

        // Use a centered summary layout when Google
        // does not return individual reviews.
        carousel?.classList.toggle(
            "has-summary",
            reviews.length === 0
        );

        if (reviews.length === 0) {
            const card = document.createElement("div");
            card.className = "card review-card";

            const stars = document.createElement("div");
            stars.className = "review-stars";
            stars.textContent = "★★★★★";

            const title = document.createElement("h3");
            title.textContent =
                `${place.rating.toFixed(1)} / 5 su Google`;

            const count = document.createElement("p");
            count.textContent =
                `Basato su ${place.userRatingCount} valutazioni`;

            const link = document.createElement("a");
            link.href = place.googleMapsURI ||
                "https://maps.app.goo.gl/JiFdwPf9znurrA3i6";
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Visualizza le recensioni su Google Maps";

            card.append(stars, title, count, link);
            container.appendChild(card);

            return;
        }


        reviews.forEach(review => {
            // Review card
            const card = document.createElement("div");
            card.className = "card review-card";

            // Star rating
            const stars = document.createElement("div");
            stars.className = "review-stars";
            stars.textContent =
                "★".repeat(Math.round(review.rating || 0));

            // Review text
            const text = document.createElement("p");
            text.className = "review-text";
            text.textContent = review.text || "";
            text.style.fontStyle = "italic";

            // Reviewer attribution
            const attribution = review.authorAttribution;

            // Author container
            const author = document.createElement("div");
            author.className = "review-author";

            // Profile link, if available
            const authorInfo = document.createElement(
                attribution?.uri ? "a" : "span"
            );
            authorInfo.className = "review-author-info";

            if (attribution?.uri) {
                authorInfo.href = attribution.uri;
                authorInfo.target = "_blank";
                authorInfo.rel = "noopener noreferrer";
            }

            // Reviewer profile photo
            if (attribution?.photoURI) {
                const photo = document.createElement("img");

                photo.src = attribution.photoURI;
                photo.alt = attribution.displayName || "Google reviewer";
                photo.className = "review-author-photo";
                photo.width = 44;
                photo.height = 44;
                photo.loading = "lazy";
                photo.referrerPolicy = "no-referrer";

                // Remove broken images gracefully
                photo.onerror = () => photo.remove();

                authorInfo.appendChild(photo);
            }

            // Reviewer name
            const name = document.createElement("span");
            name.textContent =
                attribution?.displayName || "Cliente Google";

            authorInfo.appendChild(name);
            author.appendChild(authorInfo);

            // Google Maps review link
            const reviewLink = document.createElement("a");
            reviewLink.className = "review-source";

            reviewLink.href =
                review.googleMapsURI ||
                place.googleMapsURI ||
                "https://maps.app.goo.gl/JiFdwPf9znurrA3i6";

            reviewLink.target = "_blank";
            reviewLink.rel = "noopener noreferrer";
            reviewLink.textContent = "Leggi su Google Maps";

            // Assemble review card
            card.append(stars, text, author, reviewLink);

            // Add to carousel
            container.appendChild(card);
        });


        // Required Google / third-party attributions
        const attributionContainer =
            document.getElementById("reviews-attributions");

        if (attributionContainer) {
            attributionContainer.replaceChildren();

            for (const attribution of place.attributions || []) {
                const item = document.createElement("div");
                if (attribution.providerURI) {
                    const link = document.createElement("a");
                    link.href = attribution.providerURI;
                    link.textContent = attribution.provider || "Fonte";
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    item.appendChild(link);
                } else {
                    item.textContent = attribution.provider || "";
                }
                attributionContainer.appendChild(item);
            }
        }

        const googleLink =
            document.getElementById("reviews-google-link");

        if (googleLink && place.googleMapsURI) {
            googleLink.href = place.googleMapsURI;
        }

    } catch (error) {
        console.error("Google Reviews error:", error);

        const container = document.getElementById("google-reviews");
        if (container) {
            container.textContent =
                "Impossibile caricare le recensioni.";
        }
    }
};

initApibelReviews();