from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import xml.etree.ElementTree as ET
import re
from datetime import datetime
import os
import tempfile
import PyPDF2
from io import BytesIO
import fitz  # PyMuPDF - alternative PDF parser

application = Flask(__name__)

# Enable CORS for all routes and origins
CORS(application, origins=["*"])

# Store downloaded paper content in memory (in production, use a database)
paper_content_cache = {}

# Mock data as fallback (keeping your existing mock data)
MOCK_PAPERS = [
    {
        "title": "Attention Is All You Need",
        "authors": ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
        "summary": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        "link": "https://arxiv.org/abs/1706.03762",
        "published": "2017-06-12T17:18:52Z"
    },
    # ... (rest of your mock papers)
]

def download_paper_pdf(paper_link, paper_id):
    """Download and extract text from a paper PDF"""
    try:
        # For arXiv papers, convert to PDF download link
        if 'arxiv.org/abs/' in paper_link:
            pdf_link = paper_link.replace('/abs/', '/pdf/') + '.pdf'
        else:
            pdf_link = paper_link
        
        print(f"📄 Downloading PDF from: {pdf_link}")
        
        # Download the PDF
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(pdf_link, headers=headers, timeout=30)
        response.raise_for_status()
        
        if response.status_code != 200:
            print(f"❌ Failed to download PDF: HTTP {response.status_code}")
            return None
        
        # Extract text using PyMuPDF (more reliable than PyPDF2)
        try:
            pdf_document = fitz.open(stream=response.content, filetype="pdf")
            full_text = ""
            
            for page_num in range(pdf_document.page_count):
                page = pdf_document.load_page(page_num)
                text = page.get_text()
                full_text += f"\n--- Page {page_num + 1} ---\n{text}"
            
            pdf_document.close()
            
            if len(full_text.strip()) < 100:
                print("⚠️  Extracted text too short, might be a scan or protected PDF")
                return None
                
            print(f"✅ Successfully extracted {len(full_text)} characters from PDF")
            return full_text
            
        except Exception as pdf_error:
            print(f"❌ Error extracting text from PDF: {pdf_error}")
            
            # Fallback to PyPDF2
            try:
                pdf_reader = PyPDF2.PdfReader(BytesIO(response.content))
                full_text = ""
                
                for page in pdf_reader.pages:
                    full_text += page.extract_text() + "\n"
                
                if len(full_text.strip()) < 100:
                    print("⚠️  PyPDF2 extraction also yielded minimal text")
                    return None
                    
                print(f"✅ PyPDF2 fallback extracted {len(full_text)} characters")
                return full_text
                
            except Exception as fallback_error:
                print(f"❌ PyPDF2 fallback also failed: {fallback_error}")
                return None
                
    except Exception as e:
        print(f"❌ Error downloading paper PDF: {e}")
        return None

# MODIFIED FUNCTION TO SUPPORT PAGINATION
def fetch_arxiv_papers_simple(query="Computer Architecture", max_results=6, page=1):
    """Simple arXiv fetch with pagination support"""
    print(f"🔍 Searching for: '{query}', Page: {page}")
    start_index = (page - 1) * max_results

    try:
        # Simple arXiv API call
        base_url = "http://export.arxiv.org/api/query"
        params = {
            'search_query': f'all:{query}',
            'start': start_index,
            'max_results': max_results,
            'sortBy': 'submittedDate',
            'sortOrder': 'descending'
        }
        
        print(f"📡 Calling arXiv API...")
        response = requests.get(base_url, params=params, timeout=10)
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ arXiv API failed with status {response.status_code}")
            return get_mock_papers_for_query(query, max_results)
        
        # Parse XML
        root = ET.fromstring(response.content)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = root.findall('atom:entry', ns)
        print(f"📄 Found {len(entries)} entries from arXiv for page {page}")
        
        if len(entries) == 0:
            # Return empty list for subsequent pages, mock data only for page 1
            return [] if page > 1 else get_mock_papers_for_query(query, max_results)

        papers = []
        for entry in entries:
            try:
                title = entry.find('atom:title', ns).text.strip()
                summary = entry.find('atom:summary', ns).text.strip()
                published = entry.find('atom:published', ns).text.strip()
                link = entry.find('atom:id', ns).text.strip()
                
                authors = []
                for author in entry.findall('atom:author', ns):
                    name = author.find('atom:name', ns)
                    if name is not None:
                        authors.append(name.text.strip())
                
                # Generate a unique paper ID
                paper_id = f"{hash(link)}_{len(papers)}"
                
                papers.append({
                    'id': paper_id,
                    'title': title,
                    'authors': authors if authors else ['Unknown Author'],
                    'summary': re.sub(r'\s+', ' ', summary),
                    'link': link,
                    'published': published,
                    'has_full_text': False  # Will be updated when PDF is downloaded
                })
                
            except Exception as e:
                print(f"⚠️  Error parsing entry: {e}")
                continue
        
        print(f"✅ Successfully parsed {len(papers)} papers from arXiv")
        return papers
        
    except Exception as e:
        print(f"❌ arXiv API error: {e}")
        print("🎭 Falling back to mock data if page 1")
        return get_mock_papers_for_query(query, max_results) if page == 1 else []

def get_mock_papers_for_query(query, max_results):
    """Get mock papers relevant to query"""
    print(f"🎭 Using mock data for query: {query}")
    
    # Filter mock papers based on query keywords
    query_words = query.lower().split()
    relevant_papers = []
    
    for i, paper in enumerate(MOCK_PAPERS):
        paper_text = f"{paper['title']} {paper['summary']}".lower()
        if any(word in paper_text for word in query_words):
            paper_copy = paper.copy()
            paper_copy['id'] = f"mock_{i}"
            paper_copy['has_full_text'] = False
            relevant_papers.append(paper_copy)
    
    # If no relevant papers found, return some random papers
    if not relevant_papers:
        for i, paper in enumerate(MOCK_PAPERS[:max_results]):
            paper_copy = paper.copy()
            paper_copy['id'] = f"mock_{i}"
            paper_copy['has_full_text'] = False
            relevant_papers.append(paper_copy)
    
    # Add query-specific category
    for paper in relevant_papers:
        paper['category'] = query
    
    return relevant_papers[:max_results]

# MODIFIED ROUTE TO SUPPORT PAGINATION
@application.route('/search', methods=['GET', 'POST'])
def search():
    """Main search endpoint"""
    try:
        if request.method == 'POST':
            data = request.get_json()
            query = data.get('query', 'machine learning')
            max_results = data.get('max_results', 6)
            page = data.get('page', 1)
        else:
            query = request.args.get('query', 'machine learning')
            max_results = int(request.args.get('max_results', 6))
            page = int(request.args.get('page', 1))
        
        print(f"\n🚀 New search request: '{query}' (max: {max_results}, page: {page})")
        
        papers = fetch_arxiv_papers_simple(query, max_results, page=page)
        
        response = {
            'success': True,
            'query': query,
            'page': page,
            'count': len(papers),
            'papers': papers,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"📤 Returning {len(papers)} papers for page {page}")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Search endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@application.route('/download-paper/<paper_id>', methods=['POST'])
def download_paper(paper_id):
    """Download and cache the full text of a paper"""
    try:
        data = request.get_json()
        paper_link = data.get('link')
        
        if not paper_link:
            return jsonify({
                'success': False,
                'error': 'Paper link is required'
            }), 400
        
        print(f"📥 Download request for paper {paper_id}: {paper_link}")
        
        # Check if already cached
        if paper_id in paper_content_cache:
            print(f"📚 Paper {paper_id} already cached")
            return jsonify({
                'success': True,
                'message': 'Paper already downloaded',
                'has_full_text': True,
                'text_length': len(paper_content_cache[paper_id])
            })
        
        # Download and extract text
        full_text = download_paper_pdf(paper_link, paper_id)
        
        if full_text is None:
            return jsonify({
                'success': False,
                'error': 'Failed to download or extract text from PDF',
                'message': 'The paper might be a scanned document, behind a paywall, or in an unsupported format.'
            }), 400
        
        # Cache the content
        paper_content_cache[paper_id] = full_text
        
        print(f"✅ Successfully cached paper {paper_id}")
        return jsonify({
            'success': True,
            'message': 'Paper downloaded and processed successfully',
            'has_full_text': True,
            'text_length': len(full_text)
        })
        
    except Exception as e:
        print(f"❌ Download error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@application.route('/paper-content/<paper_id>', methods=['GET'])
def get_paper_content(paper_id):
    """Get cached paper content for AI questioning"""
    try:
        if paper_id not in paper_content_cache:
            return jsonify({
                'success': False,
                'error': 'Paper not found in cache. Please download it first.'
            }), 404
        
        content = paper_content_cache[paper_id]
        
        # Return truncated content for preview (full content will be used by AI)
        preview = content[:1000] + "..." if len(content) > 1000 else content
        
        return jsonify({
            'success': True,
            'has_content': True,
            'preview': preview,
            'full_length': len(content),
            'message': f'Full text available ({len(content)} characters)'
        })
        
    except Exception as e:
        print(f"❌ Content retrieval error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@application.route('/ask-paper/<paper_id>', methods=['POST'])
def ask_paper_question(paper_id):
    """Answer questions about a specific paper using its full content"""
    try:
        data = request.get_json()
        question = data.get('question', '')
        paper_info = data.get('paper_info', {})
        
        if not question:
            return jsonify({
                'success': False,
                'error': 'Question is required'
            }), 400
        
        if paper_id not in paper_content_cache:
            return jsonify({
                'success': False,
                'error': 'Paper content not available. Please download the paper first.',
                'needs_download': True
            }), 404
        
        # Get the full paper content
        full_content = paper_content_cache[paper_id]
        
        # Truncate content if too long (most LLMs have token limits)
        max_content_length = 15000  # Adjust based on your LLM's context window
        if len(full_content) > max_content_length:
            # Try to keep the beginning and end, which often contain important info
            truncated_content = full_content[:max_content_length//2] + "\n\n[... content truncated ...]\n\n" + full_content[-max_content_length//2:]
        else:
            truncated_content = full_content
        
        return jsonify({
            'success': True,
            'paper_content': truncated_content,
            'content_length': len(full_content),
            'is_truncated': len(full_content) > max_content_length,
            'paper_info': paper_info,
            'question': question
        })
        
    except Exception as e:
        print(f"❌ Question processing error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@application.route('/papers', methods=['GET'])
def get_papers():
    """Legacy papers endpoint"""
    query = request.args.get('query', 'computer science')
    max_results = int(request.args.get('max_results', 6))
    
    papers = fetch_arxiv_papers_simple(query, max_results)
    return jsonify(papers)

@application.route('/cache-status', methods=['GET'])
def cache_status():
    """Get information about cached papers"""
    cache_info = {}
    for paper_id, content in paper_content_cache.items():
        cache_info[paper_id] = {
            'length': len(content),
            'preview': content[:200] + "..." if len(content) > 200 else content
        }
    
    return jsonify({
        'cached_papers': len(paper_content_cache),
        'papers': cache_info
    })

@application.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'arXiv Research Dashboard API with PDF Processing',
        'version': '4.0',
        'port': 8000,
        'cached_papers': len(paper_content_cache),
        'endpoints': {
            '/search': 'GET/POST - Search papers',
            '/download-paper/<id>': 'POST - Download paper PDF',
            '/paper-content/<id>': 'GET - Get cached paper content',
            '/ask-paper/<id>': 'POST - Ask questions with full paper context',
            '/cache-status': 'GET - View cached papers',
            '/papers': 'GET - Legacy search',
            '/': 'GET - Health check'
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Enhanced Research Dashboard API on port 8000...")
    print("📚 Will try arXiv API first, fallback to mock data if needed")
    print("📄 PDF processing enabled with PyMuPDF and PyPDF2 fallback")
    print("🌐 CORS enabled for localhost:3000")
    print("💡 Test endpoint: http://127.0.0.1:8000/search?query=machine+learning&page=1")
    print("-" * 50)
    
    # Install required packages reminder
    print("📦 Make sure you have installed: pip install PyPDF2 PyMuPDF")
    print("-" * 50)
    
    application.run(debug=True, host='0.0.0.0', port=8000)