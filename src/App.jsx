import { useEffect, useRef, useState } from 'react'
import Onboarding from './screens/Onboarding.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Planner from './screens/Planner.jsx'
import Advisor from './screens/Advisor.jsx'

const TABS = [
  { id: 'home', label: 'Insights', icon: '◔' },
  { id: 'future', label: 'Future Self', icon: '✦' },
  { id: 'ask', label: 'Ask Sarthi', icon: '✉' },
]

export default function App() {
  const [phase, setPhase] = useState('onboarding') // onboarding | app
  const [tab, setTab] = useState('home')
  const [riskProfile, setRiskProfile] = useState('Balanced')
  const [voiceOn, setVoiceOn] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const speak = (text) => {
    if (!voiceOn || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text.replace(/₹/g, ' rupees '))
    u.rate = 1.02
    u.pitch = 0.95
    const voices = window.speechSynthesis.getVoices()
    u.voice = voices.find((v) => v.lang === 'en-IN') ?? voices.find((v) => v.lang.startsWith('en')) ?? null
    window.speechSynthesis.speak(u)
  }

  const showToast = (html) => {
    clearTimeout(toastTimer.current)
    setToast(html)
    toastTimer.current = setTimeout(() => setToast(null), 4200)
  }

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  return (
    <div className="stage">
      <div className="stage-copy">
        <span className="kicker">IDBI Innovate 2026 · Team Atomic</span>
        <h1>Dhan Sarthi — advice from the one advisor you'll always trust: <em>future you</em>.</h1>
        <p>
          An AI wealth advisor inside IDBI GO Mobile+, embodied as your age-progressed
          future self. Try the demo: complete the 30-second onboarding, then drag the SIP
          slider and watch your future change.
        </p>
        <div className="pillars">
          <div className="pillar"><span className="dot" /><span><b>Behaviour-led:</b> reads consented transaction &amp; Account Aggregator data to find money you won't miss.</span></div>
          <div className="pillar"><span className="dot" /><span><b>Science-backed:</b> age-progressed future selves roughly doubled savings allocations (Hershfield et al., JMR 2011).</span></div>
          <div className="pillar"><span className="dot" /><span><b>Compliance-native:</b> SEBI suitability, AI-use disclosure and audit trail built into every recommendation.</span></div>
        </div>
      </div>

      <div className="phone">
        <div className="screen">
          <div className="appbar">
            <div className="bank-mark">DS</div>
            <div className="titles">
              <div className="t1">Dhan Sarthi</div>
              <div className="t2">inside IDBI GO Mobile+ · Rohan</div>
            </div>
            <div className="spacer" />
            <button className={`voice-toggle ${voiceOn ? 'on' : ''}`} onClick={() => setVoiceOn(!voiceOn)}>
              {voiceOn ? '🔊 Voice on' : '🔇 Voice'}
            </button>
          </div>

          {phase === 'onboarding' ? (
            <Onboarding
              speak={speak}
              onDone={(profile) => { setRiskProfile(profile); setPhase('app'); setTab('home') }}
            />
          ) : (
            <>
              {tab === 'home' && <Dashboard onToast={showToast} goPlan={() => setTab('future')} />}
              {tab === 'future' && <Planner riskProfile={riskProfile} onToast={showToast} />}
              {tab === 'ask' && <Advisor speak={speak} onToast={showToast} />}
              <div className="tabbar">
                {TABS.map((t) => (
                  <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                    <span className="ticon">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {toast && <div className="toast" dangerouslySetInnerHTML={{ __html: toast }} />}
        </div>
      </div>
    </div>
  )
}
