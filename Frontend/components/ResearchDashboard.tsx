"use client"
import { useState, useEffect, useCallback, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react"
import { Calendar, User, Building2, BookOpen, X, ExternalLink, Globe, MessageCircle, Send, Bot, Download, FileText, AlertCircle, CheckCircle, Eye, Zap } from "lucide-react"

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
const RESEARCH_QUERIES = [
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
    .replace(/\$\$([^$]+)\$\$/g, '<span class="font-mono bg-gray-100 px-1 rounded">$1</span>') // Display math
    .replace(/\$([^$]+)\$/g, '<span class="font-mono bg-gray-100 px-1 rounded">$1</span>')    // Inline math
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>') // Bold
    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')        // Italic
    .replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>')          // Emphasis
    .replace(/\\cite\{([^}]+)\}/g, '[$1]')                 // Citations
    .replace(/\\ref\{([^}]+)\}/g, '($1)')                  // References
}

// =================================================================================
//  COMPONENT DEFINITIONS (Moved outside ResearchDashboard to fix input bug)
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
          <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
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
    // MODIFICATION 1: Removed centering classes and padding to allow the modal to fill the screen.
    <div className="fixed inset-0 z-50">
      {/* MODIFICATION 2: Removed max-width, rounded corners, shadow, border, and set height to h-screen. */}
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
                    if (!showPdfViewer) { // If we are about to show the PDF, also show chat
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
                      : 'bg-white border border-gray-200 text-gray-800'
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
                  className="flex-1 p-3 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  const [autoDownloadEnabled, setAutoDownloadEnabled] = useState(false)

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
        const response = await fetch(`http://paper-dashboard.us-east-2.elasticbeanstalk.com/download-paper/${paper.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                link: paper.link
            })
        });

        // Check if the response is a file download
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${paper.title}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setDownloadStatus(prev => ({
                ...prev,
                [paper.id]: {
                    isDownloading: false,
                    hasFullText: false, // It is a download, not a full text for analysis
                }
            }));
            console.log(`Successfully downloaded PDF: ${paper.title}`);
            return; // Exit the function to prevent further processing
        }
        
        // If not a PDF, continue to handle as JSON response from the API
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
            throw new Error(result.error || 'Download failed');
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

  const downloadAllPapers = useCallback(async () => {
    console.log("Starting batch download of all papers...")
    const papersToDownload = papers.filter(p =>
      !downloadStatus[p.id]?.hasFullText &&
      !downloadStatus[p.id]?.isDownloading &&
      !downloadStatus[p.id]?.error
    )

    console.log(`Found ${papersToDownload.length} papers to download`)

    const batchSize = 3
    for (let i = 0; i < papersToDownload.length; i += batchSize) {
      const batch = papersToDownload.slice(i, i + batchSize)
      console.log(`Downloading batch ${Math.floor(i / batchSize) + 1}: ${batch.length} papers`)
      await Promise.all(batch.map(paper => downloadPaper(paper)))
      if (i + batchSize < papersToDownload.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log("Batch download completed")
  }, [papers, downloadStatus])

  const fetchPapersForQuery = useCallback(async (query: string) => {
    try {
      console.log(`Fetching papers for: ${query}`)
      const res = await fetch(`http://paper-dashboard.us-east-2.elasticbeanstalk.com/search?query=${encodeURIComponent(query)}&max_results=6`)
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
        console.log(`No papers found for ${query}`)
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

  const loadAllPapers = useCallback(async () => {
    setLoading(true)
    const allPapers: Paper[] = []
    for (const query of RESEARCH_QUERIES) {
      const papers = await fetchPapersForQuery(query)
      allPapers.push(...papers)
    }
    const uniquePapers = allPapers.filter((paper, index, self) =>
      index === self.findIndex(p => p.link === paper.link)
    )
    const shuffled = uniquePapers.sort(() => Math.random() - 0.5)
    setPapers(shuffled)
    setLoading(false)
  }, [fetchPapersForQuery])

  useEffect(() => {
    if (papers.length > 0 && autoDownloadEnabled) {
      const timer = setTimeout(() => {
        downloadAllPapers()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [papers, autoDownloadEnabled, downloadAllPapers])

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedPaper) {
        setSelectedPaper(null)
        setShowChat(false)
        setShowPdfViewer(false)
        setChatMessages([])
      }
    }

    if (selectedPaper) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [selectedPaper])

  useEffect(() => {
    loadAllPapers()
  }, [loadAllPapers])

  const askGeminiWithFullText = async (question: string, paper: Paper) => {
    try {
      const backendResponse = await fetch(`http://paper-dashboard.us-east-2.elasticbeanstalk.com/ask-paper/${paper.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, paper_info: { title: paper.title, authors: paper.authors, institution: paper.institution } })
      })
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json()
        if (errorData.needs_download) return "📄 This paper hasn't been downloaded yet. Please click the 'Download PDF' button first to access the full text."
        throw new Error(errorData.error || 'Failed to get paper content')
      }
      const backendData = await backendResponse.json()
      if (!backendData.success) throw new Error(backendData.error || 'Failed to get paper content')
      
      const apiKey = process.env.SERVER_SIDE_API_KEY;
      const prompt = `You are a helpful research assistant with access to the FULL TEXT of a research paper. Please answer the user's question based on the complete paper content, not just the abstract. Paper Title: "${paper.title}". Authors: ${paper.authors.join(", ")}. Institution: ${paper.institution}. FULL PAPER CONTENT: ${backendData.paper_content}. User Question: ${question}. Please provide a detailed, accurate, and breifbrew install cloudflared answer based on the full paper content. You have access to all sections including methodology, results, experiments, and conclusions. If the question asks for specific details, quotes, or technical information, please reference the relevant parts of the paper.`
      
      const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
      let response;
      let lastError;
      for (const modelName of modelNames) {
        try {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          if (response.ok) break;
          lastError = await response.text();
        } catch (err) { lastError = err; }
      }
      if (!response || !response.ok) throw new Error(`All models failed. Last error: ${lastError}`);

      const data = await response.json()
      if (data.candidates?.[0]?.content?.parts) {
        const responseText = data.candidates[0].content.parts[0].text
        const fullTextIndicator = `\n\n📄 *Note: Response based on ${backendData.is_truncated ? `${Math.round(backendData.content_length / 1000)}k characters of paper content (truncated)` : `complete paper content (${Math.round(backendData.content_length / 1000)}k characters)`}*`
        return responseText + fullTextIndicator
      } else {
        console.error('Unexpected response structure:', data)
        return "I received an unexpected response format. Please try again."
      }
    } catch (error) {
      console.error('Error calling Gemini API with full text:', error)
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the browser console for more details.`
    }
  }

  const askGeminiWithAbstract = async (question: string, paper: Paper) => {
    try {
      const apiKey = 'AIzaSyBjZ0VU7fTuxgR6so2hSeKVhK6dVDznZJ4'
      const prompt = `You are a helpful research assistant. Based on the following research paper abstract, please answer the user's question in a clear and informative way. Paper Title: "${paper.title}". Authors: ${paper.authors.join(", ")}. Institution: ${paper.institution}. Abstract: "${paper.summary}". User Question: ${question}. Please provide a helpful explanation based on the abstract content. If the question cannot be answered from the abstract alone, mention that the full paper would be needed for a complete answer.`
      
      const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
      let response;
      let lastError;
      for (const modelName of modelNames) {
        try {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          if (response.ok) break;
          lastError = await response.text();
        } catch (err) { lastError = err; }
      }
      if (!response || !response.ok) throw new Error(`All models failed. Last error: ${lastError}`);
      
      const data = await response.json()
      if (data.candidates?.[0]?.content?.parts) {
        return data.candidates[0].content.parts[0].text + "\n\n📄 *Note: Response based on abstract only. Download the full paper for more detailed analysis.*"
      } else {
        console.error('Unexpected response structure:', data)
        return "I received an unexpected response format. Please try again."
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the browser console for more details.`
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedPaper || isLoadingResponse) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      isUser: true,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    const messageToSend = currentMessage;
    setCurrentMessage("")
    setIsLoadingResponse(true)

    try {
      const hasFullText = downloadStatus[selectedPaper.id]?.hasFullText || selectedPaper.has_full_text
      const response = hasFullText ? await askGeminiWithFullText(messageToSend, selectedPaper) : await askGeminiWithAbstract(messageToSend, selectedPaper)

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, there was an error processing your question. Please try again.",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoadingResponse(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getPdfUrl = (paper: Paper) => {
    if (paper.link.includes('arxiv.org/abs/')) {
      return paper.link.replace('/abs/', '/pdf/') + '.pdf'
    }
    return paper.link
  }

  const handleCloseModal = useCallback(() => {
    setSelectedPaper(null)
    setShowChat(false)
    setShowPdfViewer(false)
    setChatMessages([])
  }, [])

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
            Discover cutting-edge research from leading universities and technology companies.
            Download full papers and ask detailed questions with AI analysis.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <div className="text-sm text-white font-semibold bg-black inline-block px-4 py-2 rounded-full">
              {papers.length} papers loaded across {RESEARCH_QUERIES.length} research areas
            </div>
            <div className="text-sm text-white font-semibold bg-green-600 inline-block px-4 py-2 rounded-full">
              {Object.values(downloadStatus).filter(s => s.hasFullText).length} papers with full text
            </div>
            <div className="text-sm text-white font-semibold bg-blue-600 inline-block px-4 py-2 rounded-full">
              {Object.values(downloadStatus).filter(s => s.isDownloading).length} downloading
            </div>
          </div>
          <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg border-2 border-gray-200 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Bulk Actions</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Auto-download new papers:</span>
                <button
                  onClick={() => setAutoDownloadEnabled(!autoDownloadEnabled)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${autoDownloadEnabled
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}
                >
                  {autoDownloadEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={downloadAllPapers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
                disabled={papers.filter(p => !downloadStatus[p.id]?.hasFullText && !downloadStatus[p.id]?.isDownloading).length === 0}
              >
                <Zap className="w-5 h-5 mr-2" />
                Download All Papers
                <span className="ml-2 text-xs bg-blue-500 px-2 py-1 rounded-full">
                  {papers.filter(p => !downloadStatus[p.id]?.hasFullText && !downloadStatus[p.id]?.isDownloading && !downloadStatus[p.id]?.error).length}
                </span>
              </button>
              <button
                onClick={loadAllPapers}
                className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-bold shadow-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Refresh Papers
              </button>
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-sm text-gray-600 mb-1">Download Progress</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${papers.length > 0 ? (Object.values(downloadStatus).filter(s => s.hasFullText).length / papers.length) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Object.values(downloadStatus).filter(s => s.hasFullText).length} / {papers.length} papers
                </div>
              </div>
            </div>
            {autoDownloadEnabled && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800 font-medium">
                    Auto-download is enabled. New papers will be automatically downloaded when loaded.
                  </span>
                </div>
              </div>
            )}
          </div>
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

        {papers.length === 0 && !loading && (
          <div className="text-center py-20">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-medium text-gray-900 mb-2">No papers found</h3>
            <p className="text-gray-500">Please check your backend connection</p>
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
    </div>
  )
}