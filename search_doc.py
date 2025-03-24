from flask import Flask, request, jsonify
import fitz  # PyMuPDF

app = Flask(__name__)

PDF_PATH = r'C:\Program Files (x86)\ACS Motion Control\SPiiPlus Documentation Kit\Software Guides\ACSPL-Commands-Variables-Reference-Guide.pdf'
@app.route('/search', methods=['GET'])
def search_pdf():
    keyword = request.args.get('query', '').strip().lower()
    results = []

    if not keyword:
        print("No keyword provided.")
        return jsonify({'error': 'No query provided'}), 400

    try:
        print(f"Searching for keyword: {keyword}")
        doc = fitz.open(PDF_PATH)
        for page_num, page in enumerate(doc):
            text = page.get_text()
            if keyword in text.lower():
                print(f"Match found on page {page_num + 1}")
                results.append(text)

        doc.close()

        if not results:
            print("No matches found.")
            return jsonify({'text': f'No results found for \"{keyword}\".'})

        print(f"Returning first match, length: {len(results[0])}")
        return jsonify({'text': results[0][:8000]})  # limit to 8k chars
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500
