import { useEffect, useRef, useState } from 'react'
import FutureSelf from './FutureSelf.jsx'
import { startVoiceSession } from '../lib/realtime.js'
import { buildInstructions, voiceTools } from '../lib/persona.js'

const KEY_STORE = 'ds_oai_key'

export function getStoredKey() {
  // allow #k=sk-... for quick team demos (fragment never hits any server)
  const m = window.location.hash.match(/[#&]k=([^&]+)/)
  if (m) {
    localStorage.setItem(KEY_STORE, decodeURIComponent(m[1]))
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  return localStorage.getItem(KEY_STORE) || ''
}

const STATUS_LABEL = {
  mic: 'Allow microphone…',
  connecting: 'Waking up your future self…',
  listening: 'Listening',
  speaking: 'Speaking',
}

export default function VoiceCall({ progress, riskProfile, toolHandler, onClose }) {
  const [key, setKey] = useState(getStoredKey)
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [muted, setMuted] = useState(false)
  const [caption, setCaption] = useState('')
  const [userLine, setUserLine] = useState('')
  const [typed, setTyped] = useState('')
  const [level, setLevel] = useState(0)
  const sessionRef = useRef(null)
  const captionRef = useRef('')
  const levelRef = useRef(0)

  // throttle level → state so the SVG re-renders at a sane rate
  useEffect(() => {
    const id = setInterval(() => setLevel(levelRef.current), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!key) return
    let cancelled = false
    ;(async () => {
      const session = await startVoiceSession({
        apiKey: key,
        instructions: buildInstructions(riskProfile),
        tools: voiceTools,
        toolHandler,
        onStatus: (s) => !cancelled && setStatus(s),
        onLevel: (v) => { levelRef.current = v },
        onCaption: (text, isFinal) => {
          if (cancelled) return
          if (isFinal) { captionRef.current = '' ; setCaption(text) }
          else { captionRef.current += text; setCaption(captionRef.current) }
        },
        onUserCaption: (t) => !cancelled && setUserLine(t?.trim() || ''),
        onError: (why) => {
          if (cancelled) return
          if (why === 'bad-key') { localStorage.removeItem(KEY_STORE); setKey(''); setError(null) }
          else setError(why)
        },
      })
      if (cancelled) session?.stop()
      else sessionRef.current = session
    })()
    return () => { cancelled = true; sessionRef.current?.stop(); sessionRef.current = null }
  }, [key, riskProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  const end = () => { sessionRef.current?.stop(); onClose() }

  if (!key) {
    return (
      <div className="voice-overlay">
        <button className="v-close" onClick={onClose}>✕</button>
        <div className="v-keysheet">
          <div className="v-keyhead">🎙 Enable live voice</div>
          <p>
            The live call runs on OpenAI's <b>gpt-realtime</b> speech-to-speech model.
            Paste a demo API key — it is stored <b>only in this browser</b> (localStorage),
            never in our code or servers.
          </p>
          <input
            type="password" placeholder="sk-…" value={draft} autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && draft.startsWith('sk-')) { localStorage.setItem(KEY_STORE, draft.trim()); setKey(draft.trim()) } }}
          />
          <button
            className="btn primary" disabled={!draft.startsWith('sk-')}
            onClick={() => { localStorage.setItem(KEY_STORE, draft.trim()); setKey(draft.trim()) }}
          >
            Start the call
          </button>
          <p className="v-finenote">In production this is the bank's own hosted model — no keys, no third parties.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="voice-overlay">
      <button className="v-close" onClick={end}>✕</button>

      <div className="v-stage">
        <div className="v-halo" style={{ boxShadow: `0 0 0 ${6 + level * 26}px rgba(240,130,30,${0.12 + level * 0.25}), 0 18px 50px rgba(0,0,0,0.45)` }}>
          <FutureSelf age={60} prosperity={progress} talk={status === 'speaking' ? level : 0} />
        </div>
        <div className="v-name">Rohan, 60 · live</div>
        <div className={`v-status ${status}`}>
          {error ? 'Connection lost — tap ✕ and retry' : (STATUS_LABEL[status] || '…')}
        </div>
      </div>

      <div className="v-captions">
        {userLine && <div className="v-user">"{userLine}"</div>}
        <div className="v-bot">{caption || 'Say hello — or ask "what if I invest twenty thousand a month?"'}</div>
      </div>

      <form
        className="v-typebar"
        onSubmit={(e) => {
          e.preventDefault()
          const text = typed.trim()
          if (!text) return
          setUserLine(text)
          sessionRef.current?.sendText(text)
          setTyped('')
        }}
      >
        <input
          value={typed} onChange={(e) => setTyped(e.target.value)}
          placeholder="…or type instead of talking" aria-label="Type a message"
        />
        <button type="submit" disabled={!typed.trim()}>↑</button>
      </form>

      <div className="v-controls">
        <button
          className={`v-btn ${muted ? 'warn' : ''}`}
          onClick={() => { const m = !muted; setMuted(m); sessionRef.current?.setMuted(m) }}
        >
          {muted ? '🔇 Unmute' : '🎙 Mute'}
        </button>
        <button className="v-btn end" onClick={end}>End call</button>
      </div>
      <div className="v-finenote">
        Live speech-to-speech · gpt-realtime · advice is AI-generated, logged &amp; suitability-checked
      </div>
    </div>
  )
}
