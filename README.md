# BigQuery Release Notes Explorer & Tweeter

A sleek, responsive, and feature-rich web application built with **Python Flask** and **vanilla HTML/JS/CSS**. It aggregates Google Cloud BigQuery Release Notes from the official RSS/Atom feed, classifies updates dynamically, and integrates with X (Twitter) using advanced **Highlight-to-Tweet** interactions.

---

## ✨ Features

* **Real-time Live Fetching:** Pulls and parses the live BigQuery Release Notes feed directly from Google Cloud servers.
* **Automatic Categorization:** Auto-detects and tags updates (e.g., `Feature`, `GA`, `Beta`, `Change`, `Deprecated`) by inspecting the title and entry text.
* **Interactive Statistics Dashboard:** Displays current feed metrics highlighting the total quantity of updates, features, and preview releases.
* **Instant Client-side Searching:** Real-time search filter and clickable category filter pills.
* **Smart X/Twitter Composer:**
  * Auto-drafts formatted tweets with a snippet of the update and the official link.
  * Ensures compliance with the 280-character limit with a visual countdown indicator (changes color on warnings).
* **Highlight-to-Tweet:** Highlight any text inside a release card to display a floating action bubble, allowing you to tweet exact highlighted quotes instantly.
* **Persistent Themes:** Seamless, smooth sun/moon toggle between dark and light modes, preserved in the browser's `localStorage`.

---

## 📂 Project Structure

```
bigquery-release-notes-viewer/
│
├── app.py                  # Flask Application Router & REST RSS API
├── templates/
│   └── index.html          # Frontend semantic structure and SEO meta tags
│
├── static/
│   ├── style.css           # UI layout, variables, transitions, and theme states
│   └── script.js           # Client-side feed parsing, logic state, and selectors
│
└── .gitignore              # Files ignored in Git version control
```

### Server-Side ([app.py](app.py))
* Serves the main index template.
* Resolves `/api/release-notes` by making a secure GET request to the Google feed URL using customized `User-Agent` headers to avoid network blockages.
* Parses XML entries into structured JSON.

### Client-Side ([static/script.js](static/script.js))
* Manages the lifecycle of loading, parsing, search queries, and active tags.
* Watches selection ranges (`window.getSelection()`) and handles client coordinates mapping to position the floating composer trigger above selected text.
* Integrates Twitter intent redirection hooks.

---

## 🚀 Setup & Execution

### 1. Prerequisites
Ensure you have Python installed (v3.8+ recommended).

Install project dependencies using pip:
```bash
pip install flask requests feedparser
```

### 2. Start the Server
Navigate to the project directory and launch the Flask server:
```bash
python app.py
```
By default, the server runs on port `5000` under debug mode.

### 3. Open in Browser
Visit the following URL in your web browser:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 💡 How to Use
1. **Explore & Filter:** Use the top search bar or category pills to filter out specific updates.
2. **Read details:** Click a card to highlight it and load a pre-formatted tweet draft into the **Tweet Composer** on the right sidebar.
3. **Draft & Edit:** Edit the draft inside the composer text area. The character counter at the bottom will track your 280-character limit.
4. **Highlight to Tweet:** Highlight a sentence in a card body to see a floating **"Tweet Text"** bubble appear directly above your mouse. Click it to import the quote directly into the composer.
5. **Tweet:** Click the **"Tweet on X"** button to compose the post in a new browser window.
