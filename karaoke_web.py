#!/usr/bin/env python3
"""
Karaoké ASS Generator — Interface Web
Serveur Flask pour générer des sous-titres .ass depuis le navigateur
"""
import io
import os
import sys
import tempfile
import threading
import webbrowser
from pathlib import Path

try:
    from flask import Flask, render_template, request, send_file, jsonify
except ImportError:
    print("Flask n'est pas installé.")
    print("Lancez : bash launch_web.sh  (installation automatique)")
    print("Ou manuellement : pip install flask")
    sys.exit(1)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from karaoke_gen import build_ass, WHISPER_MODELS, PRESET_FONTS

app = Flask(__name__, template_folder="templates")
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # 500 MB


@app.route("/")
def index():
    return render_template("karaoke.html", models=WHISPER_MODELS, fonts=PRESET_FONTS)


@app.route("/generate", methods=["POST"])
def generate():
    audio = request.files.get("audio")
    if not audio or not audio.filename:
        return jsonify({"error": "Aucun fichier audio fourni"}), 400

    model_name   = request.form.get("model",        "base")
    font_name    = request.form.get("font",         "Arial")
    font_size    = int(request.form.get("font_size", 60))
    color_before = request.form.get("color_before", "#FFFFFF")
    color_after  = request.form.get("color_after",  "#FFFF00")
    language     = request.form.get("language")     or None

    suffix = Path(audio.filename).suffix or ".mp3"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    audio.save(tmp.name)
    tmp.close()

    try:
        import whisper
        model  = whisper.load_model(model_name)
        result = model.transcribe(
            tmp.name,
            word_timestamps=True,
            verbose=False,
            language=language,
            condition_on_previous_text=False,
            no_speech_threshold=0.6,
            compression_ratio_threshold=2.4,
            temperature=0.0,
            beam_size=5,
        )

        ass_content = build_ass(
            segments=result["segments"],
            font_name=font_name,
            color_before=color_before,
            color_after=color_after,
            font_size=font_size,
        )

        total_words = sum(len(s.get("words") or []) for s in result["segments"])
        total_lines = len(result["segments"])
        language    = result.get("language", "inconnue")
        stem        = Path(audio.filename).stem

        buf  = io.BytesIO(ass_content.encode("utf-8-sig"))
        resp = send_file(
            buf,
            as_attachment=True,
            download_name=f"{stem}_karaoke.ass",
            mimetype="text/plain; charset=utf-8",
        )
        resp.headers["X-Word-Count"] = str(total_words)
        resp.headers["X-Line-Count"] = str(total_lines)
        resp.headers["X-Language"]   = language
        return resp

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.unlink(tmp.name)


def main():
    def _open_browser():
        import time
        time.sleep(1.2)
        webbrowser.open("http://127.0.0.1:5000")

    threading.Thread(target=_open_browser, daemon=True).start()
    print("🎤  Karaoké ASS Generator  →  http://127.0.0.1:5000")
    print("    (Ctrl+C pour arrêter le serveur)")
    app.run(host="127.0.0.1", port=5000, debug=False)


if __name__ == "__main__":
    main()
