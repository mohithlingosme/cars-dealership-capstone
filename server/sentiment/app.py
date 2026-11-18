"""Flask sentiment-analysis microservice using VADER."""
import os

from flask import Flask, jsonify, request
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

app = Flask(__name__)
analyzer = SentimentIntensityAnalyzer()


def score(text):
    compound = analyzer.polarity_scores(text)['compound']
    if compound >= 0.05:
        label = 'positive'
    elif compound <= -0.05:
        label = 'negative'
    else:
        label = 'neutral'
    return {'sentiment': label, 'compound': round(compound, 4), 'text': text}


@app.get('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'sentiment-analyzer'})


@app.post('/analyze')
def analyze_post():
    body = request.get_json(silent=True) or {}
    text = str(body.get('text', '')).strip()
    if not text:
        return jsonify({'error': 'text is required'}), 400
    return jsonify(score(text))


@app.get('/analyze/<path:text>')
def analyze_get(text):
    text = text.strip()
    if not text:
        return jsonify({'error': 'text is required'}), 400
    return jsonify(score(text))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', '5000')))
