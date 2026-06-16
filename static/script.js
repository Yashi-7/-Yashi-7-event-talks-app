let releaseNotes = [];
let selectedNote = null;
let textSelectionVal = "";
let selectedNoteForSelection = null;
let currentFilter = "all";
let searchQuery = "";

// Initialize application on load
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    // DOM Element selections
    const themeToggle = document.getElementById("theme-toggle");
    const refreshBtn = document.getElementById("refresh-btn");
    const searchInput = document.getElementById("search-input");
    const clearSearch = document.getElementById("clear-search");
    const tagFilters = document.getElementById("tag-filters");
    const tweetTextarea = document.getElementById("tweet-textarea");
    const tweetBtn = document.getElementById("tweet-btn");
    const floatingTweetBtn = document.getElementById("floating-tweet-btn");
    const retryBtn = document.getElementById("retry-btn");

    // Theme Config
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcon(newTheme);
    });

    // Refresh Action
    refreshBtn.addEventListener("click", fetchReleaseNotes);
    retryBtn.addEventListener("click", fetchReleaseNotes);

    // Search Operations
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (searchQuery.length > 0) {
            clearSearch.style.display = "block";
        } else {
            clearSearch.style.display = "none";
        }
        applyFiltersAndRender();
    });

    clearSearch.addEventListener("click", () => {
        searchInput.value = "";
        searchQuery = "";
        clearSearch.style.display = "none";
        applyFiltersAndRender();
    });

    // Filter Pills Click
    tagFilters.addEventListener("click", (e) => {
        const targetPill = e.target.closest(".pill");
        if (!targetPill) return;

        // Remove active class from all pills
        tagFilters.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
        // Add to active
        targetPill.classList.add("active");

        currentFilter = targetPill.dataset.filter;
        applyFiltersAndRender();
    });

    // Textarea Input Tracker
    tweetTextarea.addEventListener("input", handleTweetTextareaChange);

    // Tweet Trigger Action
    tweetBtn.addEventListener("click", () => {
        const tweetText = tweetTextarea.value.trim();
        if (tweetText) {
            shareOnTwitter(tweetText);
        }
    });

    // Floating Tweet Button for Selection
    floatingTweetBtn.addEventListener("click", () => {
        if (textSelectionVal && selectedNoteForSelection) {
            draftTweetFromSelection(textSelectionVal, selectedNoteForSelection);
            floatingTweetBtn.classList.add("hidden");
            // Focus on Tweet Composer card and scroll it into view if needed
            document.querySelector(".composer-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
            tweetTextarea.focus();
        }
    });

    // Selection Listener
    document.addEventListener("mouseup", handleTextSelection);

    // Initial Fetch
    fetchReleaseNotes();
}

// Update icon on Theme Switch
function updateThemeIcon(theme) {
    const themeIcon = document.querySelector("#theme-toggle i");
    if (theme === "dark") {
        themeIcon.className = "fa-solid fa-sun";
    } else {
        themeIcon.className = "fa-solid fa-moon";
    }
}

// Fetch notes via API
async function fetchReleaseNotes() {
    const refreshBtn = document.getElementById("refresh-btn");
    const refreshIcon = document.getElementById("refresh-icon");
    const loadingState = document.getElementById("loading-state");
    const errorState = document.getElementById("error-state");
    const emptyState = document.getElementById("empty-state");
    const notesList = document.getElementById("notes-list");

    // Add spinner rotation class
    refreshIcon.classList.add("spinning");
    refreshBtn.disabled = true;

    // Show loading UI
    loadingState.classList.remove("hidden");
    errorState.classList.add("hidden");
    emptyState.classList.add("hidden");
    notesList.classList.add("hidden");

    try {
        const response = await fetch("/api/release-notes");
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === "success") {
            releaseNotes = data.entries.map((note, index) => {
                // Determine tags dynamically based on entry title and content
                const tags = classifyNoteTags(note.title, note.content);
                return { ...note, index, tags };
            });

            // Calculate metrics
            updateStatsAndPills();
            applyFiltersAndRender();
        } else {
            throw new Error(data.message || "Unknown error processing feed.");
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        document.getElementById("error-message").innerText = err.message || "Failed to load release notes. Check server logs.";
        errorState.classList.remove("hidden");
        loadingState.classList.add("hidden");
    } finally {
        refreshIcon.classList.remove("spinning");
        refreshBtn.disabled = false;
    }
}

// Helper: Parse XML Content for standard categories
function classifyNoteTags(title, content) {
    const tags = new Set();
    const textToSearch = `${title} ${content}`.toLowerCase();

    // Check for Features
    if (textToSearch.includes("feature") || textToSearch.includes("new feature") || textToSearch.includes("introduced")) {
        tags.add("feature");
    }
    // Check for Changes
    if (textToSearch.includes("changed") || textToSearch.includes("updated") || textToSearch.includes("modified")) {
        tags.add("changed");
    }
    // Check for Deprecations
    if (textToSearch.includes("deprecated") || textToSearch.includes("deprecation") || textToSearch.includes("removed")) {
        tags.add("deprecated");
    }
    // Check for Beta / Preview
    if (textToSearch.includes("beta") || textToSearch.includes("preview") || textToSearch.includes("pre-release")) {
        tags.add("beta");
    }
    // Check for General Availability (GA)
    if (textToSearch.includes("ga") || textToSearch.includes("general availability") || textToSearch.includes("generally available")) {
        tags.add("ga");
    }

    // Default tag if none matched
    if (tags.size === 0) {
        tags.add("feature");
    }

    return Array.from(tags);
}

// Update Stats Board
function updateStatsAndPills() {
    document.getElementById("total-count").innerText = releaseNotes.length;
    
    const featureCount = releaseNotes.filter(n => n.tags.includes("feature")).length;
    const gaCount = releaseNotes.filter(n => n.tags.includes("ga")).length;
    const betaCount = releaseNotes.filter(n => n.tags.includes("beta")).length;

    document.getElementById("feature-count").innerText = featureCount;
    document.getElementById("ga-count").innerText = gaCount;
    document.getElementById("beta-count").innerText = betaCount;
}

// Filter and Render logic
function applyFiltersAndRender() {
    const loadingState = document.getElementById("loading-state");
    const emptyState = document.getElementById("empty-state");
    const notesList = document.getElementById("notes-list");

    // Apply Filter Pills & Search query
    let filtered = releaseNotes;

    if (currentFilter !== "all") {
        filtered = filtered.filter(note => note.tags.includes(currentFilter));
    }

    if (searchQuery) {
        filtered = filtered.filter(note => {
            const inTitle = note.title.toLowerCase().includes(searchQuery);
            const inContent = note.content.toLowerCase().includes(searchQuery);
            return inTitle || inContent;
        });
    }

    loadingState.classList.add("hidden");

    if (filtered.length === 0) {
        emptyState.classList.remove("hidden");
        notesList.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    notesList.classList.remove("hidden");

    renderNotes(filtered);
}

// Render cards
function renderNotes(notes) {
    const notesList = document.getElementById("notes-list");
    notesList.innerHTML = "";

    notes.forEach(note => {
        const card = document.createElement("div");
        card.className = "note-card";
        card.dataset.index = note.index;
        
        if (selectedNote && selectedNote.index === note.index) {
            card.classList.add("selected-active");
        }

        // Render Date nicely
        const dateString = formatFeedDate(note.published);

        // Build Badge HTML
        let badgesHtml = "";
        note.tags.forEach(tag => {
            badgesHtml += `<span class="badge badge-${tag}">${tag}</span> `;
        });

        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${note.title}</h3>
                <span class="card-date"><i class="fa-regular fa-calendar"></i> ${dateString}</span>
            </div>
            <div class="card-badges">
                ${badgesHtml}
            </div>
            <div class="card-body">
                ${note.content}
            </div>
            <div class="card-actions">
                <button class="btn btn-card-link view-docs-btn" data-link="${note.link}">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Docs
                </button>
                <button class="btn btn-card-tweet card-tweet-btn">
                    <i class="fa-brands fa-x-twitter"></i> Tweet Update
                </button>
            </div>
        `;

        // Event: select card
        card.addEventListener("click", (e) => {
            // Check if user clicked links/buttons inside card
            if (e.target.closest("button") || e.target.closest("a")) return;
            selectNoteCard(note, card);
        });

        // Event: Tweet Update button on card
        card.querySelector(".card-tweet-btn").addEventListener("click", () => {
            selectNoteCard(note, card);
            draftTweetFromCard(note);
        });

        // Event: Docs button
        card.querySelector(".view-docs-btn").addEventListener("click", (e) => {
            const link = e.currentTarget.dataset.link;
            window.open(link, "_blank");
        });

        notesList.appendChild(card);
    });
}

// Format Feed Date String
function formatFeedDate(dateStr) {
    if (!dateStr) return "Recent Update";
    try {
        const d = new Date(dateStr);
        // Returns "Jan 24, 2026"
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return dateStr;
    }
}

// Card Selection action
function selectNoteCard(note, cardElement) {
    // Remove selected state from other cards
    document.querySelectorAll(".note-card").forEach(c => c.classList.remove("selected-active"));
    
    // Add selected state
    cardElement.classList.add("selected-active");
    selectedNote = note;

    // Update Composer Preview area
    const previewContainer = document.getElementById("selected-note-preview");
    previewContainer.innerHTML = `
        <div class="preview-title">${note.title}</div>
        <div class="preview-date"><i class="fa-regular fa-calendar"></i> ${formatFeedDate(note.published)}</div>
    `;

    // Populate draft in Tweet Composer area if textarea is empty or has another draft
    draftTweetFromCard(note);
}

// Draft Tweet from entire Note Card details
function draftTweetFromCard(note) {
    const textContent = cleanHtmlText(note.content);
    
    const prefix = `🚀 BigQuery Update: ${note.title}\n\n`;
    const suffix = `\n\nRead detail: ${note.link} #BigQuery #GoogleCloud`;
    
    const maxSnippetLen = 280 - prefix.length - suffix.length - 4; // 4 for quotes and ellipsis
    
    let snippet = textContent;
    if (textContent.length > maxSnippetLen) {
        snippet = textContent.substring(0, maxSnippetLen - 3) + "...";
    }

    const tweetText = `${prefix}"${snippet}"${suffix}`;
    
    const tweetTextarea = document.getElementById("tweet-textarea");
    tweetTextarea.value = tweetText;
    tweetTextarea.disabled = false;
    
    handleTweetTextareaChange();
}

// Draft Tweet from custom highlighted selection
function draftTweetFromSelection(selection, note) {
    const prefix = `💡 From BigQuery Update: "${note.title}"\n\n`;
    const suffix = `\n\nRead more: ${note.link} #BigQuery`;
    
    const maxSelectionLen = 280 - prefix.length - suffix.length - 4; // 4 for quotes
    
    let tweetSelection = selection;
    if (selection.length > maxSelectionLen) {
        tweetSelection = selection.substring(0, maxSelectionLen - 3) + "...";
    }
    
    const tweetText = `${prefix}"${tweetSelection}"${suffix}`;
    
    const tweetTextarea = document.getElementById("tweet-textarea");
    tweetTextarea.value = tweetText;
    tweetTextarea.disabled = false;
    
    // Select this note card visual border
    const cardElement = document.querySelector(`.note-card[data-index="${note.index}"]`);
    if (cardElement) {
        selectNoteCard(note, cardElement);
    }
    
    handleTweetTextareaChange();
}

// Helper: Clean HTML tags to raw text
function cleanHtmlText(html) {
    let doc = new DOMParser().parseFromString(html, 'text/html');
    let text = doc.body.textContent || "";
    return text.replace(/\s+/g, ' ').trim();
}

// Character counter and limit check
function handleTweetTextareaChange() {
    const tweetTextarea = document.getElementById("tweet-textarea");
    const tweetBtn = document.getElementById("tweet-btn");
    const charCounter = document.getElementById("char-count");
    const counterContainer = document.querySelector(".char-counter");
    const warningText = document.getElementById("warning-text");
    
    const currentLen = tweetTextarea.value.length;
    charCounter.innerText = currentLen;

    // Remove all warning/danger styles first
    counterContainer.className = "char-counter";
    warningText.innerText = "";
    
    if (currentLen > 0 && currentLen <= 280) {
        tweetBtn.disabled = false;
        if (currentLen > 250) {
            counterContainer.classList.add("warning");
        }
    } else {
        tweetBtn.disabled = true;
        if (currentLen > 280) {
            counterContainer.classList.add("danger");
            warningText.innerText = "Exceeds 280 characters limit!";
        }
    }
}

// Handle text highlight on cards
function handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    const floatingTweetBtn = document.getElementById("floating-tweet-btn");
    
    if (selectedText.length > 0) {
        // Trace back if selection is inside a release note card body
        let parentNode = selection.anchorNode.parentNode;
        let cardElement = null;
        
        while (parentNode && parentNode !== document.body) {
            if (parentNode.classList && parentNode.classList.contains("note-card")) {
                cardElement = parentNode;
                break;
            }
            parentNode = parentNode.parentNode;
        }

        if (cardElement) {
            const index = cardElement.dataset.index;
            selectedNoteForSelection = releaseNotes[index];
            textSelectionVal = selectedText;

            // Position bubble exactly above selection
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Adjust coordinates taking scroll into account
            floatingTweetBtn.style.top = `${window.scrollY + rect.top - 45}px`;
            floatingTweetBtn.style.left = `${window.scrollX + rect.left + (rect.width / 2) - 60}px`;
            floatingTweetBtn.classList.remove("hidden");
            return;
        }
    }

    // Hide bubble if not clicking inside the bubble itself
    if (e.target.id !== "floating-tweet-btn" && !e.target.closest("#floating-tweet-btn")) {
        floatingTweetBtn.classList.add("hidden");
    }
}

// Redirect and open X Tweet Dialog box
function shareOnTwitter(tweetContent) {
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetContent)}`;
    window.open(xUrl, "_blank", "width=600,height=400");
}
