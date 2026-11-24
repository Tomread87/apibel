// Apibel Google review carousel. Reads the language-specific JSON snapshot;
// no browser-side Google Maps API key or Place Details request is needed.
(() => {
    "use strict";

    const PLACE_URL = "https://maps.app.goo.gl/JiFdwPf9znurrA3i6";
    const DATA_URL = "/static/data/google-reviews.json";
    const supportedLanguages = ["it", "en", "de", "fr"];
    const detectedLanguage = (document.documentElement.lang || "it").toLowerCase().split("-")[0];
    const language = supportedLanguages.includes(detectedLanguage) ? detectedLanguage : "it";

    console.log(language, detectedLanguage, supportedLanguages);

    const labels = {
        it: {
            reviewOnMaps: "Leggi su Google Maps",
            viewOnMaps: "Visualizza le recensioni su Google Maps",
            basedOn: count => `Basato su ${count} valutazioni`,
            reviewer: "Cliente Google",
            translated: "Traduzione fornita da Google",
            unavailable: "Impossibile caricare le recensioni.",
            scrollText: "Testo della recensione: scorri per leggere tutto"
        },
        en: {
            reviewOnMaps: "Read on Google Maps",
            viewOnMaps: "View reviews on Google Maps",
            basedOn: count => `Based on ${count} ratings`,
            reviewer: "Google reviewer",
            translated: "Translated by Google",
            unavailable: "Unable to load reviews.",
            scrollText: "Review text: scroll to read more"
        },
        de: {
            reviewOnMaps: "Auf Google Maps lesen",
            viewOnMaps: "Bewertungen auf Google Maps ansehen",
            basedOn: count => `Basierend auf ${count} Bewertungen`,
            reviewer: "Google-Rezensent",
            translated: "Von Google übersetzt",
            unavailable: "Bewertungen konnten nicht geladen werden.",
            scrollText: "Bewertungstext: zum Weiterlesen scrollen"
        },
        fr: {
            reviewOnMaps: "Lire sur Google Maps",
            viewOnMaps: "Voir les avis sur Google Maps",
            basedOn: count => `Basé sur ${count} évaluations`,
            reviewer: "Utilisateur Google",
            translated: "Traduit par Google",
            unavailable: "Impossible de charger les avis.",
            scrollText: "Texte de l'avis : faire défiler pour tout lire"
        }
    };

    const copy = labels[language];

    function createLink(url, text, cssClass = "") {
        const link = document.createElement("a");
        link.href = url || PLACE_URL;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = text;
        if (cssClass) link.className = cssClass;
        return link;
    }


    function moveReviews(direction) {
        const track = document.getElementById("google-reviews");
        const card = track?.querySelector(".review-card");
        if (!track || !card) return;

        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        const step = card.getBoundingClientRect().width + gap;
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

        const atEnd = track.scrollLeft >= maxScroll - 4;
        const atStart = track.scrollLeft <= 4;

        const destination = direction > 0
            ? (atEnd ? 0 : Math.min(track.scrollLeft + step, maxScroll))
            : (atStart ? maxScroll : Math.max(track.scrollLeft - step, 0));

        track.scrollTo({
            left: destination,
            behavior: "smooth"
        });
    }

    function setupReviewNavigation(reviewCount) {
        const prev = document.getElementById("reviews-prev");
        const next = document.getElementById("reviews-next");
        const track = document.getElementById("google-reviews");
        const carousel = document.querySelector("#recensioni .reviews-carousel");

        if (!prev || !next || !track || !carousel) return;

        let resetTimer = () => { };

        prev.addEventListener("click", () => {
            moveReviews(-1);
            resetTimer();
        });

        next.addEventListener("click", () => {
            moveReviews(1);
            resetTimer();
        });

        // Autoplay only when there are more than 3 reviews.
        // Respect reduced-motion preferences.
        if (
            reviewCount <= 3 ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            return;
        }

        next.classList.add("has-auto-timer");

        const DURATION = 5000; // 5 seconds

        let elapsed = 0;
        let lastTimestamp = null;
        let frameId = 0;
        let visible = true;

        // Pause when the carousel is outside the viewport.
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting;
                lastTimestamp = null;
            }, {
                threshold: 0.25
            });

            observer.observe(carousel);
        }

        document.addEventListener("visibilitychange", () => {
            lastTimestamp = null;
        });

        function tick(timestamp) {
            if (lastTimestamp === null) {
                lastTimestamp = timestamp;
            }

            // Pause while a visitor interacts with the reviews.
            const paused =
                document.hidden ||
                !visible ||
                track.matches(":hover") ||
                prev.matches(":hover") ||
                next.matches(":hover") ||
                !!track.querySelector(":focus-visible") ||
                prev.matches(":focus-visible") ||
                next.matches(":focus-visible");


            if (!paused) {
                elapsed += Math.max(0, timestamp - lastTimestamp);
            }

            lastTimestamp = timestamp;

            const progress = Math.min(
                100,
                (elapsed / DURATION) * 100
            );

            // Clockwise fill from green to gold.
            next.style.setProperty(
                "--timer-progress",
                `${progress}%`
            );

            if (elapsed >= DURATION + 160 && !paused) {
                next.click();
                return;
            }

            frameId = window.requestAnimationFrame(tick);
        }

        resetTimer = () => {
            if (frameId) cancelAnimationFrame(frameId);
            elapsed = 0;
            lastTimestamp = null;

            next.style.setProperty("--timer-progress", "0%");

            frameId = window.requestAnimationFrame(tick);
        };

        resetTimer();
    }


    function renderSummary(container, place) {
        const card = document.createElement("div");
        card.className = "card review-card";
        const rating = Number(place.rating);
        const count = Number(place.userRatingCount);

        if (Number.isFinite(rating)) {
            const stars = document.createElement("div");
            stars.className = "review-stars";
            stars.textContent = "★".repeat(Math.max(0, Math.min(5, Math.round(rating))));
            const title = document.createElement("h3");
            title.textContent = `${rating.toFixed(1)} / 5 Google`;
            card.append(stars, title);
        }
        if (Number.isFinite(count) && count > 0) {
            const countText = document.createElement("p");
            countText.textContent = copy.basedOn(count);
            card.appendChild(countText);
        }
        card.appendChild(createLink(place.googleMapsURI, copy.viewOnMaps));
        container.appendChild(card);
    }

    function renderReview(container, review, place) {
        const card = document.createElement("div");
        card.className = "card review-card";

        const stars = document.createElement("div");
        stars.className = "review-stars";
        stars.setAttribute("aria-label", `${review.rating || 0} / 5`);
        stars.textContent = "★".repeat(Math.max(0, Math.min(5, Math.round(review.rating || 0))));
        card.appendChild(stars);

        if (review.text) {
            const text = document.createElement("p");
            text.className = "review-text";
            text.textContent = review.text;
            card.appendChild(text);
        }

        if (review.translated) {
            const notice = document.createElement("small");
            notice.className = "review-translation-notice";
            notice.textContent = copy.translated;
            card.appendChild(notice);
        }

        const attribution = review.authorAttribution || {};
        const author = document.createElement("div");
        author.className = "review-author";

        const authorInfo = document.createElement(attribution.uri ? "a" : "span");
        authorInfo.className = "review-author-info";
        if (attribution.uri) {
            authorInfo.href = attribution.uri;
            authorInfo.target = "_blank";
            authorInfo.rel = "noopener noreferrer";
        }
        if (attribution.photoURI) {
            const photo = document.createElement("img");
            photo.src = attribution.photoURI;
            photo.alt = attribution.displayName || copy.reviewer;
            photo.className = "review-author-photo";
            photo.width = 44;
            photo.height = 44;
            photo.loading = "lazy";
            photo.referrerPolicy = "no-referrer";
            photo.onerror = () => photo.remove();
            authorInfo.appendChild(photo);
        }

        const name = document.createElement("span");
        name.textContent = attribution.displayName || copy.reviewer;
        authorInfo.appendChild(name);
        author.appendChild(authorInfo);
        card.appendChild(author);
        card.appendChild(createLink(
            review.googleMapsURI || place.googleMapsURI,
            copy.reviewOnMaps,
            "review-source"
        ));
        container.appendChild(card);
    }

    function renderAttributions(place) {
        const attributionContainer = document.getElementById("reviews-attributions");
        if (attributionContainer) {
            attributionContainer.replaceChildren();
            for (const attribution of place.attributions || []) {
                const item = document.createElement("div");
                if (attribution.providerURI) {
                    item.appendChild(createLink(
                        attribution.providerURI,
                        attribution.provider || "Source"
                    ));
                } else {
                    item.textContent = attribution.provider || "";
                }
                attributionContainer.appendChild(item);
            }
        }
        const googleLink = document.getElementById("reviews-google-link");
        if (googleLink) googleLink.href = place.googleMapsURI || PLACE_URL;
    }

    async function initApibelReviews() {
        const container = document.getElementById("google-reviews");
        if (!container) return;

        try {
            const response = await fetch(DATA_URL, { cache: "no-cache" });
            if (!response.ok) throw new Error(`Reviews JSON HTTP ${response.status}`);
            const data = await response.json();

            // Legacy JSON (one language) works until the first multilingual refresh.
            // Never silently use another locale when the requested one is missing;
            // if a locale has zero reviews, fall back to the summary card.
            const place = data.languages
                ? data.languages[language]
                : data;
            if (!place) throw new Error(`No data for language '${language}'`);

            const reviews = Array.isArray(place.reviews) ? place.reviews : [];
            const carousel = document.querySelector("#recensioni .reviews-carousel");
            carousel?.classList.toggle("has-summary", reviews.length <= 1);
            container.replaceChildren();

            if (reviews.length === 0) {
                renderSummary(container, place);
            } else {
                for (const review of reviews) renderReview(container, review, place);
            }

            renderAttributions(place);

            setupReviewNavigation(reviews.length);

            // Give keyboard focus only to review text boxes that actually scroll.
            requestAnimationFrame(() => {
                for (const el of container.querySelectorAll(".review-text")) {
                    if (el.scrollHeight > el.clientHeight + 1) {
                        el.tabIndex = 0;
                        el.setAttribute("role", "region");
                        el.setAttribute("aria-label", copy.scrollText);
                    }
                }
            });
        } catch (error) {
            console.error("Apibel reviews:", error);
            container.textContent = copy.unavailable;
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initApibelReviews, { once: true });
    } else {
        initApibelReviews();
    }
})();
