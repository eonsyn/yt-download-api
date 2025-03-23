import yt_dlp
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/download", methods=["GET"])
def download():
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    ydl_opts = {"format": "mp4"}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return jsonify({"url": info["url"]})

if __name__ == "__main__":
    app.run()
