import { marked } from 'marked'
import { OutputLine } from '../types'

marked.setOptions({
  breaks: true,
  gfm: true,
})

interface TerminalOutputProps {
  lines: OutputLine[]
  themeColor: string
}

function renderMarkdown(text: string): string {
  try {
    return marked.parse(text, { async: false }) as string
  } catch {
    return text
  }
}

function detectMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headers
    /\*\*.+\*\*/,            // Bold
    /\*.+\*/,                // Italic
    /\[.+\]\(.+\)/,          // Links
    /```[\s\S]+```/,         // Code blocks
    /`[^`]+`/,               // Inline code
    /^\s*[-*+]\s/m,         // Lists
    /^\s*\d+\.\s/m,         // Numbered lists
    /^\>/m,                 // Blockquotes
    /\|.+\|/,               // Tables
  ]
  
  return markdownPatterns.some(pattern => pattern.test(text))
}

export function TerminalOutput({ lines, themeColor }: TerminalOutputProps) {
  return (
    <div className="terminal-output">
      {lines.map((line) => (
        <div key={line.id} className="terminal-line">
          {line.renderMarkdown && detectMarkdown(line.text) ? (
            <div 
              className="markdown-body"
              style={{ 
                backgroundColor: 'transparent',
                color: themeColor,
                fontFamily: "inherit",
                fontSize: 'inherit',
                lineHeight: 'inherit',
                padding: 0,
                margin: 0,
              }}
            >
              <style>{`
                .markdown-body h1, .markdown-body h2, .markdown-body h3, 
                .markdown-body h4, .markdown-body h5, .markdown-body h6,
                .markdown-body p, .markdown-body ul, .markdown-body ol,
                .markdown-body li, .markdown-body blockquote,
                .markdown-body code, .markdown-body pre, .markdown-body a {
                  color: ${themeColor} !important;
                  font-size: inherit !important;
                  line-height: inherit !important;
                  font-family: inherit !important;
                }
                .markdown-body h1 { font-size: inherit !important; font-weight: bold !important; }
                .markdown-body h2 { font-size: inherit !important; font-weight: bold !important; }
                .markdown-body h3 { font-size: inherit !important; font-weight: bold !important; }
                .markdown-body pre { background: transparent !important; padding: 0 !important; }
                .markdown-body code { background: transparent !important; }
                .markdown-body blockquote { border-left-color: ${themeColor} !important; }
                .markdown-body a { text-decoration: underline !important; }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(line.text) }} />
            </div>
          ) : (
            <pre>{line.text}</pre>
          )}
        </div>
      ))}
    </div>
  )
}
