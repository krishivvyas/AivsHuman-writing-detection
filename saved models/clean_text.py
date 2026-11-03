import re

def clean_text(text):
    text = str(text).lower()
    for a, b in {"’": "'", "‘": "'", "“": '"', "”": '"'}.items():
        text = text.replace(a, b)
    return re.sub(r"\s+", " ", text).strip()
