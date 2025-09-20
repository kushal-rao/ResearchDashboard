"use client"
import { useState, useEffect, useCallback } from "react"
import { Calendar, User, Building2, BookOpen, X, ExternalLink, Globe, MessageCircle, Send, Bot, Download, FileText, AlertCircle, CheckCircle, Eye, Zap, Plus, Loader2, Settings, Search } from "lucide-react"

type Paper = {
  id: string
  title: string
  authors: string[]
  summary: string
  link: string
  published: string
  category?: string
  institution?: string
  source?: string
  has_full_text?: boolean
}

type ChatMessage = {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

type PaperDownloadStatus = {
  [paperId: string]: {
    isDownloading: boolean
    hasFullText: boolean
    error?: string
    textLength?: number
  }
}

// Predefined research areas to load
const initialResearchQueries = [
  "computer architecture",
  "machine learning",
  "artificial intelligence",
  "quantum computing",
  "distributed systems",
  "neural networks",
]

const INSTITUTIONS = [
  // Tech Companies
  "Google", "Microsoft", "Meta", "Apple", "Amazon", "OpenAI", "Anthropic", "NVIDIA", "Intel", "IBM", "Tesla", "DeepMind",

  // US Universities
  "MIT", "Stanford", "Carnegie Mellon", "UC Berkeley", "Harvard", "Princeton", "Caltech", "University of Washington",
  "Georgia Tech", "Cornell", "Yale", "Columbia", "NYU", "University of Chicago", "Johns Hopkins", "UCLA",
  "University of Michigan", "UT Austin", "UIUC", "University of Pennsylvania", "Duke", "Northwestern",

  // International Universities
  "Oxford", "Cambridge", "ETH Zurich", "University of Toronto", "McGill", "Technical University of Munich",
  "Imperial College London", "University College London", "King's College London", "Sorbonne", "Tsinghua University",
  "Peking University", "University of Tokyo", "Kyoto University", "Seoul National University", "KAIST",
  "National University of Singapore", "Nanyang Technological University", "Australian National University",
  "University of Melbourne", "University of Sydney", "Hebrew University", "Technion", "Weizmann Institute"
]

// Simple LaTeX renderer for basic expressions
const renderLatex = (text: string) => {
  return text
    .replace(/\$\$([^$]+)\$\$/g, '<span class="font-mono bg-gray-100 px-1 rounded">$1</span>')
    .replace(/\$([^$]+)\$/g, '<span class="font-mono bg-gray-100 px-1 rounded">$1</span>')
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\cite\{([^}]+)\}/g, '[$1]')
    .replace(/\\ref\{([^}]+)\}/g, '($1)')
}

// =================================================================================
//  COMPONENT DEFINITIONS
// =================================================================================

const PaperWidget = ({ paper, downloadStatus, formatDate, setSelectedPaper }: { paper: Paper, downloadStatus: PaperDownloadStatus, formatDate: (date: string) => string, setSelectedPaper: (paper: Paper) => void }) => {
  const status = downloadStatus[paper.id]
  const hasFullText = status?.hasFullText || paper.has_full_text

  return (
    <div
      onClick={() => setSelectedPaper(paper)}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-black overflow-hidden cursor-pointer group"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold rounded-full capitalize">
            {paper.category}
          </span>
          <div className="flex items-center gap-2">
            {status?.isDownloading && (
              <div className="flex items-center text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full font-bold">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                Downloading...
              </div>
            )}
            {hasFullText && (
              <div className="flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full font-bold">
                <FileText className="w-3 h-3 mr-1" />
                Full Text
              </div>
            )}
            {status?.error && (
              <div className="flex items-center text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full font-bold">
                <AlertCircle className="w-3 h-3 mr-1" />
                Failed
              </div>
            )}
            <div className="flex items-center text-xs text-gray-700 font-medium">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(paper.published)}
            </div>
          </div>
        </div>

        <h3 className="font-bold text-xl mb-3 line-clamp-3 text-gray-900 group-hover:text-black transition-colors">
          {paper.title}
        </h3>

        <div className="flex items-center mb-3 text-sm text-gray-800 font-medium">
          <User className="w-4 h-4 mr-2 flex-shrink-0 text-gray-600" />
          <span className="truncate">
            {paper.authors.slice(0, 2).join(", ")}
            {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
          </span>
        </div>

        <div className="flex items-center mb-3 text-sm text-gray-800 font-medium">
          <Building2 className="w-4 h-4 mr-2 flex-shrink-0 text-gray-600" />
          <span className="truncate">{paper.institution}</span>
        </div>

        <div className="flex items-center mb-4 text-sm text-gray-800 font-medium">
          <Globe className="w-4 h-4 mr-2 flex-shrink-0 text-gray-600" />
          <span className="truncate">{paper.source}</span>
        </div>

        <p className="text-gray-800 text-sm line-clamp-4 mb-4 leading-relaxed font-medium">
          {paper.summary}
        </p>

        <div className="flex items-center justify-between">
          <button className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center text-sm font-bold shadow-lg">
            <BookOpen className="w-4 h-4 mr-2" />
            Read More
          </button>
          <a
            href={paper.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-black hover:text-gray-600 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  )
}

const PdfViewer = ({ paper, getPdfUrl, setShowPdfViewer }: { paper: Paper, getPdfUrl: (paper: Paper) => string, setShowPdfViewer: (show: boolean) => void }) => {
  const pdfUrl = getPdfUrl(paper)

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col">
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5" />
          <span className="font-medium truncate">PDF: {paper.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPdfViewer(false)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <iframe
        src={pdfUrl}
        className="w-full h-full border-none flex-grow"
        title={`PDF: ${paper.title}`}
      />
    </div>
  )
}

const PaperModal = ({ paper, onClose, downloadStatus, showPdfViewer, setShowPdfViewer, showChat, setShowChat, chatMessages, currentMessage, setCurrentMessage, isLoadingResponse, handleSendMessage, handleKeyPress, downloadPaper, getPdfUrl }: { paper: Paper, onClose: () => void, downloadStatus: PaperDownloadStatus, showPdfViewer: boolean, setShowPdfViewer: (show: boolean) => void, showChat: boolean, setShowChat: (show: boolean) => void, chatMessages: ChatMessage[], currentMessage: string, setCurrentMessage: (msg: string) => void, isLoadingResponse: boolean, handleSendMessage: () => Promise<void>, handleKeyPress: (e: React.KeyboardEvent) => void, downloadPaper: (paper: Paper) => Promise<void>, getPdfUrl: (paper: Paper) => string }) => {
  const status = downloadStatus[paper.id]
  const hasFullText = status?.hasFullText || paper.has_full_text

  return (
    <div className="fixed inset-0 z-50">
      <div className="bg-white w-full h-screen flex">

        {showPdfViewer ? (
          <div className="flex-1 border-r border-gray-300 flex">
            <PdfViewer paper={paper} getPdfUrl={getPdfUrl} setShowPdfViewer={setShowPdfViewer}/>
          </div>
        ) : (
          <div className={'flex-1 overflow-y-auto'}>
            <div className="sticky top-0 bg-black text-white px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                <span className="text-lg font-bold">Research Paper</span>
                <span className="text-sm opacity-75">(Press ESC to close)</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowPdfViewer(!showPdfViewer)}
                  className={`p-2 rounded-full transition-colors ${showPdfViewer ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-20'}`}
                  title="Toggle PDF viewer"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-2 rounded-full transition-colors ${showChat ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-20'}`}
                  title="Ask questions about this paper"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold">
                  {paper.category}
                </span>
                <span className="px-4 py-2 bg-gray-800 text-white rounded-full text-sm font-bold">
                  {paper.institution}
                </span>
                <span className="px-4 py-2 bg-gray-600 text-white rounded-full text-sm font-bold">
                  {paper.source}
                </span>
                {hasFullText && (
                  <span className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Full Text Available
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-6 leading-tight text-gray-900">
                {paper.title}
              </h1>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl border-l-4 border-gray-800">
                <h3 className="font-bold mb-3 text-lg flex items-center text-gray-800">
                  <User className="w-5 h-5 mr-2" />
                  Authors
                </h3>
                <div className="text-gray-800 font-medium">
                  {paper.authors.join(", ")}
                </div>
              </div>
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg flex items-center text-blue-800">
                    <Download className="w-5 h-5 mr-2" />
                    Full Paper Access
                  </h3>
                  {hasFullText && status?.textLength && (
                    <span className="text-sm text-green-700 font-medium">
                      {Math.round(status.textLength / 1000)}k characters loaded
                    </span>
                  )}
                </div>

                {!hasFullText && !status?.isDownloading && (
                  <div className="space-y-3">
                    <p className="text-blue-700 text-sm">
                      Download the full PDF to enable detailed AI analysis and questioning beyond just the abstract.
                    </p>
                    <button
                      onClick={() => downloadPaper(paper)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center font-bold shadow-lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF &amp; Extract Text
                    </button>
                  </div>
                )}

                {status?.isDownloading && (
                  <div className="flex items-center text-blue-700">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-sm font-medium">Downloading and processing PDF...</span>
                  </div>
                )}

                {status?.error && (
                  <div className="flex items-start text-red-700 bg-red-100 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Download failed:</div>
                      <div>{status.error}</div>
                      <button
                        onClick={() => downloadPaper(paper)}
                        className="mt-2 text-red-800 hover:text-red-900 underline text-sm"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}

                {hasFullText && (
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Full text available for detailed AI analysis</span>
                  </div>
                )}
              </div>
              <div className="mb-6 flex gap-4 flex-wrap">
                <button
                  onClick={() => {
                    setShowPdfViewer(!showPdfViewer);
                    if (!showPdfViewer) {
                      setShowChat(true);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center font-bold shadow-lg"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  {showPdfViewer ? 'Hide PDF Viewer' : 'View PDF & Chat'}
                </button>

                <a
                  href={paper.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center font-bold shadow-lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Open in New Tab
                </a>
              </div>

              <div className="mb-8 p-6 bg-gray-50 rounded-xl border-l-4 border-black">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl flex items-center text-black">
                    <BookOpen className="w-6 h-6 mr-2" />
                    Abstract
                  </h3>
                  <button
                    onClick={() => setShowChat(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center text-sm font-bold shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {hasFullText ? 'Ask AI (Full Text)' : 'Ask AI (Abstract)'}
                  </button>
                </div>
                <div
                  className="text-gray-900 leading-relaxed text-base font-medium"
                  dangerouslySetInnerHTML={{ __html: renderLatex(paper.summary) }}
                />
              </div>
            </div>
          </div>
        )}
        
        {showChat && (
          <div className="w-96 border-l border-gray-300 flex flex-col bg-white">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center gap-3 flex-shrink-0">
              <Bot className="w-5 h-5" />
              <div className="flex flex-col">
                <span className="font-bold">Ask about this paper</span>
                <span className="text-xs text-blue-200">
                  {hasFullText ? 'Using full paper content' : 'Using abstract only'}
                </span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="ml-auto hover:bg-blue-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Ask me anything about this research paper!</p>
                  <div className="text-xs mt-2 space-y-1">
                    {hasFullText ? (
                      <>
                        <p>✅ Full text available - ask detailed questions!</p>
                        <p>Try: &quot;What methodology did they use?&quot;</p>
                      </>
                    ) : (
                      <>
                        <p>📄 Abstract only - download for full analysis</p>
                        <p>Try: &quot;What problem does this solve?&quot;</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900' 
                    }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoadingResponse && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-300 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={hasFullText ? "Ask detailed questions about this paper..." : "Ask about this paper (abstract only)..."}
                  className="flex-1 p-3 border border-gray-300 rounded-lg resize-none text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  disabled={isLoadingResponse}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoadingResponse}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


export default function ResearchDashboard() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<PaperDownloadStatus>({})
  const [researchQueries, setResearchQueries] = useState<string[]>(initialResearchQueries)
  const [newQuery, setNewQuery] = useState("")
  
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const [showQueryManager, setShowQueryManager] = useState(false);

  const [titleQuery, setTitleQuery] = useState("");
  const [isFindingPaper, setIsFindingPaper] = useState(false);
  const [findPaperError, setFindPaperError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const extractInstitution = (authors: string[], title: string, summary: string) => {
    const text = `${authors.join(' ')} ${title} ${summary}`.toLowerCase()

    const foundInstitution = INSTITUTIONS.find(inst => {
      const instLower = inst.toLowerCase()
      return text.includes(instLower) ||
        text.includes(instLower.replace(' ', '')) ||
        text.includes(instLower.replace('university', 'univ')) ||
        text.includes(instLower.replace('institute', 'inst'))
    })

    if (foundInstitution) {
      return foundInstitution
    }

    const universityPatterns = [
      /university of ([a-z ]+)/gi,
      /([a-z ]+) university/gi,
      /([a-z ]+) institute of technology/gi,
      /([a-z ]+) technical university/gi,
    ]

    for (const pattern of universityPatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        const match = matches[0].replace(/[^\w\s]/gi, '').trim()
        if (match.length > 3) {
          return match.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
        }
      }
    }

    return "Research Institution"
  }

  const extractSource = (link: string) => {
    try {
      const url = new URL(link)
      const domain = url.hostname.replace('www.', '')

      if (domain.includes('arxiv.org')) return 'arXiv'
      if (domain.includes('acm.org')) return 'ACM Digital Library'
      if (domain.includes('ieee.org')) return 'IEEE Xplore'
      if (domain.includes('springer.com')) return 'Springer'
      if (domain.includes('nature.com')) return 'Nature'
      if (domain.includes('science.org')) return 'Science'
      if (domain.includes('pnas.org')) return 'PNAS'
      if (domain.includes('cell.com')) return 'Cell'
      if (domain.includes('elsevier.com')) return 'Elsevier'
      if (domain.includes('wiley.com')) return 'Wiley'
      if (domain.includes('jstor.org')) return 'JSTOR'
      if (domain.includes('pubmed.ncbi.nlm.nih.gov')) return 'PubMed'

      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
    } catch {
      return 'Unknown Source'
    }
  }

  const downloadPaper = async (paper: Paper) => {
    if (downloadStatus[paper.id]?.isDownloading) return;

    setDownloadStatus(prev => ({
        ...prev,
        [paper.id]: {
            isDownloading: true,
            hasFullText: false,
        }
    }));

    try {
        console.log(`Downloading paper: ${paper.title}`);
        const response = await fetch(`http://127.0.0.1:8000/download-paper/${paper.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                link: paper.link
            })
        });
        
        const result = await response.json();

        if (result.success) {
            setDownloadStatus(prev => ({
                ...prev,
                [paper.id]: {
                    isDownloading: false,
                    hasFullText: true,
                    textLength: result.text_length,
                }
            }));
            setPapers(prev => prev.map(p =>
                p.id === paper.id ? { ...p, has_full_text: true } : p
            ));
            console.log(`Successfully extracted and cached text: ${paper.title}`);
        } else {
            throw new Error(result.message || 'Download failed');
        }
    } catch (error) {
        console.error('Download error:', error);
        setDownloadStatus(prev => ({
            ...prev,
            [paper.id]: {
                isDownloading: false,
                hasFullText: false,
                error: error instanceof Error ? error.message : 'Download failed',
            }
        }));
    }
};

  const fetchPapersForQuery = useCallback(async (query: string, pageNum: number) => {
    try {
      console.log(`Fetching papers for: ${query}, page: ${pageNum}`)
      const res = await fetch(`http://127.0.0.1:8000/search?query=${encodeURIComponent(query)}&max_results=10&page=${pageNum}`)
      if (!res.ok) {
        console.error(`HTTP error for ${query}: ${res.status}`)
        return []
      }
      const data = await res.json()
      if (!data.success) {
        console.error(`API error for ${query}:`, data.error)
        return []
      }
      if (!data.papers || data.papers.length === 0) {
        console.log(`No more papers found for ${query} on page ${pageNum}`)
        return []
      }
      return data.papers.map((paper: Paper) => ({
        ...paper,
        category: query,
        institution: extractInstitution(paper.authors, paper.title, paper.summary),
        source: extractSource(paper.link)
      }))
    } catch (error) {
      console.error(`Error fetching papers for ${query}:`, error)
      return []
    }
  }, [])
  
  const loadAllPapers = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setPage(1);
    setHasMore(true);

    const promises = researchQueries.map(query => fetchPapersForQuery(query, 1));
    const results = await Promise.all(promises);
    const allPapers = results.flat();

    const uniquePapers = allPapers.filter((paper, index, self) =>
      index === self.findIndex(p => p.link === paper.link)
    );
    const shuffled = uniquePapers.sort(() => Math.random() - 0.5);
    setPapers(shuffled);
    setLoading(false);
  }, [fetchPapersForQuery, researchQueries]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    console.log(`Attempting to load more papers for page ${nextPage}...`);

    const promises = researchQueries.map(query => fetchPapersForQuery(query, nextPage));
    const results = await Promise.all(promises);
    const allNewPapers = results.flat();
    
    if (allNewPapers.length > 0) {
        setPapers(prevPapers => {
            const combined = [...prevPapers, ...allNewPapers];
            return combined.filter((paper, index, self) =>
                index === self.findIndex(p => p.link === paper.link)
            );
        });
        setPage(nextPage);
    } else {
        console.log("No more papers to load.");
        setHasMore(false);
    }

    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, page, researchQueries, fetchPapersForQuery]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedPaper) {
        setSelectedPaper(null);
        setShowChat(false);
        setShowPdfViewer(false);
        setChatMessages([]);
      }
    };

    if (selectedPaper) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPaper]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowQueryManager(false);
      }
    };

    if (showQueryManager) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQueryManager]);


  useEffect(() => {
    loadAllPapers(false)
  }, [loadAllPapers])

  const askGeminiWithFullText = async (question: string, paper: Paper) => { /* ... unchanged ... */ }
  const askGeminiWithAbstract = async (question: string, paper: Paper) => { /* ... unchanged ... */ }
  const handleSendMessage = async () => { /* ... unchanged ... */ }
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }
  const getPdfUrl = (paper: Paper) => { if (paper.link.includes('arxiv.org/abs/')) { return paper.link.replace('/abs/', '/pdf/') + '.pdf' } return paper.link }
  const handleCloseModal = useCallback(() => { setSelectedPaper(null); setShowChat(false); setShowPdfViewer(false); setChatMessages([]) }, [])
  
  const handleAddQuery = async () => {
    const trimmedQuery = newQuery.trim().toLowerCase();
    if (trimmedQuery && !researchQueries.includes(trimmedQuery)) {
        setResearchQueries(prev => [...prev, trimmedQuery]);
        setNewQuery("");
    }
  }

  const handleRemoveQuery = (queryToRemove: string) => {
    setResearchQueries(prev => prev.filter(q => q !== queryToRemove))
    setPapers(prev => prev.filter(p => p.category !== queryToRemove))
  }

  const handleFindPaper = async () => {
    if (!titleQuery.trim()) return;

    setIsFindingPaper(true);
    setFindPaperError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/find-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleQuery }),
      });

      const result = await response.json();

      if (result.success && result.paper) {
        const foundPaper = {
          ...result.paper,
          institution: extractInstitution(result.paper.authors, result.paper.title, result.paper.summary),
          source: extractSource(result.paper.link)
        };
        // Add the new paper to the top of the list
        setPapers(prevPapers => [foundPaper, ...prevPapers]);
        setShowQueryManager(false); // Close panel on success
        setTitleQuery(""); // Clear input
      } else {
        setFindPaperError(result.error || 'Could not find the paper.');
      }
    } catch (error) {
      setFindPaperError('An unexpected error occurred.');
      console.error('Error finding paper:', error);
    } finally {
      setIsFindingPaper(false);
    }
  };


  useEffect(() => {
    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 500;
      if (isAtBottom && !loading && !isLoadingMore && hasMore) { handleLoadMore(); }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, isLoadingMore, hasMore, handleLoadMore]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Research Papers</h2>
          <p className="text-gray-500">Discovering the latest research from top institutions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-black mb-4">
            Research Explorer
          </h1>
          <p className="text-xl text-gray-800 max-w-3xl mx-auto font-medium">
            Discover cutting-edge research. Add topics, download papers, and ask questions with AI.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {papers.map((paper, index) => (
            <PaperWidget
              key={`${paper.id}-${index}`}
              paper={paper}
              setSelectedPaper={setSelectedPaper}
              downloadStatus={downloadStatus}
              formatDate={formatDate}
            />
          ))}
        </div>
        
        {isLoadingMore && (
          <div className="text-center mt-12">
            <div className="inline-flex items-center">
              <Loader2 className="w-6 h-6 mr-3 animate-spin text-gray-600" />
              <span className="text-lg font-medium text-gray-700">Loading more papers...</span>
            </div>
          </div>
        )}

        {papers.length === 0 && !loading && (
          <div className="text-center py-20">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-medium text-gray-900 mb-2">No papers found</h3>
            <p className="text-gray-500">Try adding a research area above or check your backend connection.</p>
          </div>
        )}

        {selectedPaper && (
          <PaperModal
            paper={selectedPaper}
            onClose={handleCloseModal}
            downloadStatus={downloadStatus}
            showPdfViewer={showPdfViewer}
            setShowPdfViewer={setShowPdfViewer}
            showChat={showChat}
            setShowChat={setShowChat}
            chatMessages={chatMessages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            isLoadingResponse={isLoadingResponse}
            handleSendMessage={handleSendMessage}
            handleKeyPress={handleKeyPress}
            downloadPaper={downloadPaper}
            getPdfUrl={getPdfUrl}
          />
        )}
      </div>

      <button
        onClick={() => setShowQueryManager(true)}
        className="fixed bottom-8 right-8 z-30 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        aria-label="Manage research topics"
      >
        <Settings className="w-6 h-6" />
      </button>

      {showQueryManager && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowQueryManager(false)}
          ></div>
          <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Manage Content</h2>
              <button onClick={() => setShowQueryManager(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-900" />
              </button>
            </div>
            
            <div className="p-4 flex-grow overflow-y-auto">
              <h3 className="font-bold text-gray-900 mb-2">Research Topics</h3>
              <div className="space-y-2 mb-4">
                {researchQueries.map(query => (
                  <div key={query} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                    <span className="capitalize font-medium text-gray-900">{query}</span>
                    <button onClick={() => handleRemoveQuery(query)} className="text-gray-500 hover:text-red-500 p-1 rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddQuery()}
                  placeholder="Add new topic..."
                  className="flex-grow p-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddQuery}
                  className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 border-t bg-white">
              <h3 className="font-bold text-gray-900 mb-2">Find a Specific Paper</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={titleQuery}
                  onChange={(e) => {
                    setTitleQuery(e.target.value);
                    setFindPaperError(null);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleFindPaper()}
                  placeholder="Enter paper title..."
                  className="flex-grow p-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isFindingPaper}
                />
                <button
                  onClick={handleFindPaper}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center disabled:bg-gray-400"
                  disabled={isFindingPaper}
                >
                  {isFindingPaper ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
              {findPaperError && <p className="text-red-600 text-sm mt-2">{findPaperError}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}