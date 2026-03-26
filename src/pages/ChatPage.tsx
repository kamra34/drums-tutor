import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAiStore } from '../stores/useAiStore'
import { useUserStore } from '../stores/useUserStore'
import { aiService } from '../services/aiService'
import { ChatMessage } from '../types/ai'

export default function ChatPage() {
  const { apiKey, isConfigured, chatMessages, addChatMessage, setLoading, isLoading, clearChat } =
    useAiStore()
  const { progress } = useUserStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() }
    addChatMessage(userMsg)
    setInput('')
    setLoading(true)

    try {
      aiService.setApiKey(apiKey)
      const avgSkill = Object.values(progress.skillProfile).reduce((a, b) => a + b, 0) / 5
      const reply = await aiService.chat(text, {
        studentLevel: avgSkill >= 75 ? 'advanced' : avgSkill >= 45 ? 'intermediate' : 'beginner',
        currentModule: progress.currentModule,
        chatHistory: chatMessages,
      })
      addChatMessage({ role: 'assistant', content: reply, timestamp: Date.now() })
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#06080d' }}>
        <div
          className="text-center max-w-sm rounded-2xl p-8 border border-white/[0.04]"
          style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.10))' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <path d="M10 21h4" />
              <path d="M9 17h6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">AI Drum Tutor</h2>
          <p className="text-[#6b7280] text-sm mb-6 leading-relaxed">
            Configure your Anthropic API key to chat with your AI drum tutor.
          </p>
          <Link
            to="/settings"
            className="inline-block px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-all hover:brightness-110 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
          >
            Go to Settings
            <svg className="inline-block ml-1.5 -mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#06080d' }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between border-b border-white/[0.04]"
        style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.85) 0%, rgba(10,12,18,0.9) 100%)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.10))' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <path d="M10 21h4" />
              <path d="M9 17h6" />
            </svg>
          </div>
          <div>
            <div className="text-white font-semibold text-sm">AI Drum Tutor</div>
            <div className="text-xs text-[#4b5563]">Powered by Claude</div>
          </div>
        </div>
        {chatMessages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-white/[0.04]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center pt-16 pb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="5" />
                <path d="M7 8H2v2h5" />
                <path d="M17 8h5v2h-5" />
                <path d="M12 13v5" />
                <path d="M9 18h6" />
                <path d="M8 21h8" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Your AI drum tutor is ready!</h3>
            <p className="text-sm text-[#4b5563] mb-8 max-w-xs mx-auto">Ask anything about drumming, technique, or music theory.</p>
            <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left text-xs rounded-xl px-3.5 py-2.5 border border-white/[0.04] text-[#6b7280] hover:text-amber-400 hover:border-amber-500/20 transition-all"
                  style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
                >
                  <svg className="inline-block mr-1.5 -mt-0.5 opacity-40" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.15))' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                  <path d="M10 21h4" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white'
                  : 'border border-white/[0.04] text-[#e2e8f0]'
              }`}
              style={
                msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }
                  : { background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }
              }
            >
              {msg.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.15))' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                <path d="M10 21h4" />
              </svg>
            </div>
            <div
              className="rounded-2xl px-4 py-3 border border-white/[0.04]"
              style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
            >
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-6 py-4 border-t border-white/[0.04]"
        style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.85) 0%, rgba(10,12,18,0.9) 100%)' }}
      >
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your drum tutor..."
            rows={1}
            disabled={isLoading}
            className="flex-1 rounded-xl px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#4b5563] resize-none outline-none transition-all disabled:opacity-50 border border-white/[0.04] focus:border-amber-500/50"
            style={{
              minHeight: '44px',
              maxHeight: '120px',
              background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all text-sm font-medium hover:brightness-110 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22 11 13 2 9z" />
            </svg>
          </button>
        </div>
        <div className="text-xs text-[#374151] mt-2">Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'How do I hold drum sticks correctly?',
  'What is a paradiddle?',
  'How can I improve my timing?',
  'Explain the basic rock beat',
  'What is limb independence?',
  'How often should I practice?',
]
