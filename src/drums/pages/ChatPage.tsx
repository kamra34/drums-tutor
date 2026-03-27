import { useRef, useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAiStore } from '@shared/stores/useAiStore'
import { useUserStore } from '@shared/stores/useUserStore'
import { aiService, parseFollowups } from '@drums/services/aiService'
import { ChatMessage } from '@shared/types/ai'

// ── Markdown renderer (lightweight, no dependencies) ──────────────────────────

function renderMarkdown(text: string): string {
  let html = text
    // Code blocks (``` ... ```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
      `<pre class="md-pre"><code>${escapeHtml(code.trim())}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="md-bold">$1</strong>')
    // Italic
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li class="md-oli">$2</li>')
    // Bullet lists
    .replace(/^[-*] (.+)$/gm, '<li class="md-li">$1</li>')
    // Wrap consecutive <li> in <ul>/<ol>
    .replace(/((?:<li class="md-oli">.*<\/li>\n?)+)/g, '<ol class="md-ol">$1</ol>')
    .replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p class="md-p">')
    // Single newlines (within paragraphs)
    .replace(/\n/g, '<br/>')

  // Wrap in paragraph if not starting with block element
  if (!html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<ul') && !html.startsWith('<ol')) {
    html = `<p class="md-p">${html}</p>`
  }

  return html
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Markdown styles (injected as CSS) ──────────────────────────────────────

const MD_STYLES = `
.md-p { margin-bottom: 0.5rem; line-height: 1.7; }
.md-p:last-child { margin-bottom: 0; }
.md-bold { color: #e2e8f0; font-weight: 600; }
.md-h2 { font-size: 1.15rem; font-weight: 700; color: #f1f5f9; margin: 0.75rem 0 0.35rem; }
.md-h3 { font-size: 1.05rem; font-weight: 600; color: #e2e8f0; margin: 0.6rem 0 0.3rem; }
.md-h4 { font-size: 0.95rem; font-weight: 600; color: #cbd5e1; margin: 0.5rem 0 0.25rem; }
.md-code { background: rgba(245,158,11,0.08); color: #fbbf24; padding: 0.1rem 0.35rem; border-radius: 4px; font-family: ui-monospace, Consolas, monospace; font-size: 0.85em; }
.md-pre { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; padding: 12px 16px; margin: 8px 0; overflow-x: auto; }
.md-pre code { color: #fbbf24; font-family: ui-monospace, Consolas, monospace; font-size: 0.85rem; line-height: 1.6; background: none; padding: 0; }
.md-ul, .md-ol { padding-left: 1.25rem; margin: 0.4rem 0; }
.md-li { margin-bottom: 0.2rem; color: #94a3b8; }
.md-li::marker { color: #f59e0b; }
.md-oli { margin-bottom: 0.2rem; color: #94a3b8; }
.md-oli::marker { color: #f59e0b; }
`

// ── Main component ─────────────────────────────────────────────────────────

export default function ChatPage() {
  const {
    apiKey, isConfigured,
    conversations, activeConversationId, conversationsLoaded,
    isLoading, followups,
    loadConversations, newConversation, setActiveConversation,
    addMessage, syncMessage, updateConversationTitle, deleteConversation,
    getActiveMessages, setLoading, setFollowups,
  } = useAiStore()
  const { progress } = useUserStore()

  const [input, setInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const messages = getActiveMessages()

  // Load conversations from backend on mount
  useEffect(() => {
    if (!conversationsLoaded) {
      loadConversations()
    }
  }, [conversationsLoaded])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || isLoading) return

    // Auto-create conversation if none active
    let convId = activeConversationId
    if (!convId) {
      convId = await newConversation()
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
      image: imagePreview ?? undefined,
    }
    addMessage(userMsg)
    syncMessage(userMsg)
    setInput('')
    setImagePreview(null)
    setFollowups([])
    setLoading(true)

    try {
      aiService.setApiKey(apiKey)
      const avgSkill = Object.values(progress.skillProfile).reduce((a, b) => a + b, 0) / 5
      const currentMessages = useAiStore.getState().getActiveMessages()

      const rawReply = await aiService.chat(text, {
        studentLevel: avgSkill >= 75 ? 'advanced' : avgSkill >= 45 ? 'intermediate' : 'beginner',
        currentModule: progress.currentModule,
        skillProfile: progress.skillProfile,
        chatHistory: currentMessages,
      }, userMsg.image)

      const { text: cleanReply, followups: newFollowups } = parseFollowups(rawReply)
      const assistantMsg: ChatMessage = { role: 'assistant', content: cleanReply, timestamp: Date.now() }
      addMessage(assistantMsg)
      syncMessage(assistantMsg)
      setFollowups(newFollowups)

      // Generate title from first user message
      const conv = useAiStore.getState().getActiveConversation()
      if (conv && conv.messages.length <= 2 && conv.title === 'New conversation') {
        aiService.generateTitle(text).then((title) => {
          updateConversationTitle(conv.id, title)
        })
      }
    } finally {
      setLoading(false)
    }
  }, [input, imagePreview, isLoading, activeConversationId, apiKey, progress])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  function removeImage() {
    setImagePreview(null)
  }

  // Paste image from clipboard (Ctrl+V)
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file || file.size > 5 * 1024 * 1024) return
          const reader = new FileReader()
          reader.onload = () => setImagePreview(reader.result as string)
          reader.readAsDataURL(file)
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  // ── Not configured state ────────────────────────────────────────────────

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#06080d' }}>
        <div className="text-center max-w-sm rounded-2xl p-8 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.10))',
          }}>
            <TutorIcon size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">AI Drum Tutor</h2>
          <p className="text-[#6b7280] text-sm mb-6 leading-relaxed">
            Configure your Anthropic API key to chat with Max, your AI drum tutor.
          </p>
          <Link to="/settings" className="inline-block px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-all hover:brightness-110" style={{
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          }}>
            Go to Settings →
          </Link>
        </div>
      </div>
    )
  }

  // ── Main chat layout ────────────────────────────────────────────────────

  return (
    <div className="flex h-full" style={{ background: '#06080d' }}>
      <style>{MD_STYLES}</style>

      {/* ── Sidebar: conversation list ── */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0 border-r border-white/[0.04] flex flex-col" style={{
          background: 'linear-gradient(180deg, rgba(8,10,16,0.95) 0%, rgba(6,8,13,0.98) 100%)',
        }}>
          {/* New chat button */}
          <div className="p-3">
            <button
              onClick={() => { newConversation() }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {conversations.length === 0 && (
              <div className="text-center text-[#374151] text-xs py-8">No conversations yet</div>
            )}
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all group cursor-pointer flex items-center gap-2 ${
                  conv.id === activeConversationId
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-[#6b7280] hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="truncate flex-1">{conv.title}</span>
                {/* Delete button */}
                <span
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                  className="opacity-0 group-hover:opacity-100 text-[#4b5563] hover:text-rose-400 transition-all flex-shrink-0 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.85) 0%, rgba(10,12,18,0.9) 100%)',
          backdropFilter: 'blur(12px)',
        }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(p => !p)}
              className="p-1.5 rounded-lg text-[#4b5563] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.10))',
            }}>
              <TutorIcon size={16} />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Max — AI Drum Tutor</div>
              <div className="text-[10px] text-[#4b5563]">Powered by Claude</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Empty state */}
            {messages.length === 0 && !activeConversationId && (
              <div className="text-center pt-16 pb-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))',
                }}>
                  <TutorIcon size={40} />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">Hey, I'm Max!</h3>
                <p className="text-sm text-[#4b5563] mb-8 max-w-sm mx-auto">
                  Your AI drum tutor. Ask me anything about drumming — technique, theory, practice tips, or upload a photo for feedback.
                </p>
                <div className="grid grid-cols-2 gap-2.5 max-w-lg mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="text-left text-xs rounded-xl px-3.5 py-2.5 border border-white/[0.04] text-[#6b7280] hover:text-amber-400 hover:border-amber-500/20 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length === 0 && activeConversationId && (
              <div className="text-center pt-16 text-[#374151] text-sm">Start a conversation...</div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.15))',
                  }}>
                    <TutorIcon size={13} />
                  </div>
                )}
                <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'text-white' : 'border border-white/[0.04] text-[#c8d0d8]'
                }`} style={
                  msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }
                    : { background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }
                }>
                  {/* Image attachment */}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Uploaded"
                      className="max-w-[280px] max-h-[200px] rounded-lg mb-2 object-contain"
                    />
                  )}
                  {/* Content */}
                  {msg.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  ) : (
                    msg.content.split('\n').map((line, j) => (
                      <p key={j} className={j > 0 ? 'mt-1.5' : ''}>{line}</p>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.15))',
                }}>
                  <TutorIcon size={13} />
                </div>
                <div className="rounded-2xl px-4 py-3 border border-white/[0.04]" style={{
                  background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
                }}>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Follow-up suggestions */}
            {followups.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 pl-10">
                {followups.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(f)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.04] text-[#6b7280] hover:text-amber-400 hover:border-amber-500/20 transition-all cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)' }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="px-4 lg:px-8 py-4 border-t border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.85) 0%, rgba(10,12,18,0.9) 100%)',
        }}>
          <div className="max-w-3xl mx-auto">
            {/* Image preview */}
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-white/[0.06] object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0c1018] border border-white/[0.1] flex items-center justify-center text-[#6b7280] hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              {/* Image upload button */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-[#4b5563] hover:text-amber-400 hover:bg-white/[0.04] transition-all flex-shrink-0 cursor-pointer"
                title="Upload image (sheet music, grip photo, etc.)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Text input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Max anything about drumming..."
                rows={1}
                disabled={isLoading}
                className="flex-1 rounded-xl px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#374151] resize-none outline-none transition-all disabled:opacity-50 border border-white/[0.06] focus:border-amber-500/40"
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                  background: 'rgba(12,14,20,0.6)',
                }}
              />

              {/* Send button */}
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !imagePreview) || isLoading}
                className="p-2.5 disabled:opacity-20 disabled:cursor-not-allowed text-white rounded-xl transition-all hover:brightness-110 flex-shrink-0 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="text-[10px] text-[#2d3748]">Enter to send · Shift+Enter for new line · Attach images for visual feedback</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tutor icon ────────────────────────────────────────────────────────────────

function TutorIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M10 21h4" />
      <path d="M9 17h6" />
    </svg>
  )
}

// ── Suggestion starters ───────────────────────────────────────────────────────

const SUGGESTIONS = [
  'How do I hold drum sticks correctly?',
  'What is a paradiddle and when do I use it?',
  'How can I improve my timing consistency?',
  'Explain the basic rock beat step by step',
  'What is limb independence and how do I train it?',
  'Create a 15-minute warmup routine for me',
]
