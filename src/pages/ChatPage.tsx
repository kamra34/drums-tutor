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
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm p-8">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-xl font-bold text-white mb-2">AI Tutor</h2>
          <p className="text-[#6b7280] text-sm mb-6">
            Configure your Anthropic API key to chat with your AI drum tutor.
          </p>
          <Link
            to="/settings"
            className="inline-block px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go to Settings →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#1e2433] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <div className="text-white font-semibold">AI Drum Tutor</div>
            <div className="text-xs text-[#4b5563]">Powered by Claude</div>
          </div>
        </div>
        {chatMessages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-[#4b5563] hover:text-[#94a3b8] transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center pt-12">
            <div className="text-4xl mb-3">🥁</div>
            <p className="text-[#94a3b8] mb-2">Your AI drum tutor is ready!</p>
            <p className="text-sm text-[#4b5563] mb-6">Ask anything about drumming, technique, or theory.</p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left text-xs bg-[#0d1117] border border-[#1e2433] hover:border-violet-800 hover:text-violet-300 text-[#6b7280] rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#1a1030] border border-violet-900/50 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
                🤖
              </div>
            )}
            <div
              className={`max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-700 text-white'
                  : 'bg-[#0d1117] border border-[#1e2433] text-[#e2e8f0]'
              }`}
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
            <div className="w-7 h-7 rounded-full bg-[#1a1030] border border-violet-900/50 flex items-center justify-center text-sm mr-2 flex-shrink-0">
              🤖
            </div>
            <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1e2433] px-6 py-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your drum tutor…"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-[#0d1117] border border-[#1e2433] focus:border-violet-700 rounded-xl px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#4b5563] resize-none outline-none transition-colors disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors text-sm font-medium"
          >
            Send
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
