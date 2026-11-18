
window.initApibelReviews = async function () {
    const container = document.getElementById("google-reviews");
    const footerLink = document.getElementById("reviews-google-link");
    const attributions = document.getElementById("reviews-attributions");

    try {
        const { Place } = await google.maps.importLibrary("places");

        // Replace with Apibel's actual Google Place ID
        const place = new Place({
            id: "YOUR_APIBEL_PLACE_ID"
        });

        await place.fetchFields({
            fields: [
                "reviews",
                "rating",
                "userRatingCount",
                "googleMapsURI",
                "attributions"
            ]
        });

        const reviews = (place.reviews || [])
            .filter(review => review.text?.trim());

        container.replaceChildren();

        if (place.googleMapsURI) {
            footerLink.href = place.googleMapsURI;
        }

        if (!reviews.length) {
            container.textContent =
                "Non ci sono ancora recensioni disponibili.";
            return;
        }

        reviews.forEach(review => {
            const card = document.createElement("article");
            card.className = "card review-card";

            const stars = document.createElement("div");
            stars.className = "review-stars";
            stars.textContent =
                "★".repeat(Math.round(review.rating || 0));

            const text = document.createElement("p");
            text.className = "review-text";
            text.textContent = "“" + review.text + "”";

            const author = document.createElement("div");
            author.className = "review-author";

            const authorName =
                review.authorAttribution?.displayName || "Cliente Google";

            if (review.authorAttribution?.uri) {
                const link = document.createElement("a");
                link.href = review.authorAttribution.uri;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = authorName;
                author.appendChild(link);
            } else {
                author.textContent = authorName;
            }

            const source = document.createElement("div");
            source.className = "review-source";

            const sourceLink = document.createElement("a");
            sourceLink.textContent = "Leggi su Google Maps";
            sourceLink.href =
                review.googleMapsURI ||
                place.googleMapsURI ||
                footerLink.href;
            sourceLink.target = "_blank";
            sourceLink.rel = "noopener noreferrer";

            source.appendChild(sourceLink);

            card.append(stars, text, author, source);
            container.appendChild(card);
        });

        // Display any additional data-provider attributions
        (place.attributions || []).forEach(item => {
            if (!item.provider) return;

            const element = document.createElement("div");

            if (item.providerURI) {
                const link = document.createElement("a");
                link.href = item.providerURI;
                link.textContent = item.provider;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                element.appendChild(link);
            } else {
                element.textContent = item.provider;
            }

            attributions.appendChild(element);
        });

    } catch (error) {
        console.error("Google Reviews:", error);
        container.textContent =
            "Impossibile caricare le recensioni al momento.";
    }
};

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




window.initApibelReviews = async function () {
    try {
        // Load Google Places library
        const { Place } =
            await google.maps.importLibrary("places");

        // Apibel's Google Place ID
        const place = new Place({
            id: "ChIJWVfiXABzhkcRh_osv744VoU"
        });

        // Request Google reviews and business details
        await place.fetchFields({
            fields: [
                "displayName",
                "rating",
                "userRatingCount",
                "reviews",
                "googleMapsURI"
            ]
        });

        console.log("Business:", place.displayName);
        console.log("Average rating:", place.rating);
        console.log("Total ratings:", place.userRatingCount);
        console.log("Google reviews:", place.reviews);

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
            const card = document.createElement("div");
            card.className = "card review-card";

            const stars = document.createElement("div");
            stars.className = "review-stars";
            stars.textContent =
                "★".repeat(Math.round(review.rating || 0));

            const text = document.createElement("p");
            text.textContent = review.text || "";
            text.style.fontStyle = "italic";

            const author = document.createElement("h4");
            const attribution = review.authorAttribution;

            if (attribution?.uri) {
                const link = document.createElement("a");
                link.href = attribution.uri;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent =
                    attribution.displayName || "Cliente Google";
                author.appendChild(link);
            } else {
                author.textContent =
                    attribution?.displayName || "Cliente Google";
            }

            const reviewLink = document.createElement("a");
            reviewLink.href =
                review.googleMapsURI ||
                place.googleMapsURI ||
                "https://maps.app.goo.gl/JiFdwPf9znurrA3i6";
            reviewLink.target = "_blank";
            reviewLink.rel = "noopener noreferrer";
            reviewLink.textContent = "Leggi su Google Maps";

            card.append(stars, text, author, reviewLink);
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

