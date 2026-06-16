import os
import requests
import feedparser
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/release-notes")
def get_release_notes():
    try:
        # User-Agent header is set to bypass simple bot detection shields
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Parse the Atom feed content
        feed = feedparser.parse(response.content)
        
        entries = []
        for entry in feed.entries:
            content_val = ""
            if "content" in entry and len(entry.content) > 0:
                content_val = entry.content[0].value
            elif "summary" in entry:
                content_val = entry.summary
            elif "description" in entry:
                content_val = entry.description
                
            entries.append({
                "id": entry.get("id", ""),
                "title": entry.get("title", "BigQuery Update"),
                "updated": entry.get("updated", ""),
                "published": entry.get("published", entry.get("updated", "")),
                "link": entry.get("link", "https://cloud.google.com/bigquery/docs/release-notes"),
                "content": content_val
            })
            
        return jsonify({
            "status": "success",
            "title": feed.feed.get("title", "BigQuery Release Notes"),
            "entries": entries
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
