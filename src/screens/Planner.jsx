import FutureSelf from '../components/FutureSelf.jsx'
import { persona, riskProfiles, sipFutureValue, corpusNeeded, spendTotal, formatINR } from '../data.js'

const captions = [
  { at: 0.0, text: (c) => <>At this pace, future-you retires on <b>{c}</b> — family support and a strict budget will be part of the plan. We can do better.</> },
  { at: 0.35, text: (c) => <>Getting there. <b>{c}</b> keeps the lights on, but travel and emergencies will pinch. A little more today changes this picture.</> },
  { at: 0.7, text: (c) => <>This is comfort. <b>{c}</b> covers your inflated living costs with room for family and the occasional holiday.</> },
  { at: 1.0, text: (c) => <>Freedom. <b>{c}</b> means work becomes a choice at 60 — and future-you is officially proud of you.</> },
]

export default function Planner({ riskProfile, sip, setSip, onToast }) {
  const years = persona.retireAt - persona.age
  const { rate, mix } = riskProfiles[riskProfile]
  const corpus = sipFutureValue(sip, years, rate)
  const needed = corpusNeeded(spendTotal, years)
  const progress = Math.min(1, corpus / needed)
  const caption = [...captions].reverse().find((c) => progress >= c.at) ?? captions[0]
  const pct = ((sip - 1000) / (40000 - 1000)) * 100

  return (
    <div className="body">
      <div className="fs-stagebox">
        <FutureSelf age={persona.retireAt} prosperity={progress} />
        <span className="fs-age">You, at {persona.retireAt}</span>
        <div className="fs-caption">{caption.text(formatINR(corpus))}</div>
      </div>

      <div className="slider-card">
        <div className="slider-head">
          <span className="lab">Monthly SIP</span>
          <span className="amt">₹{sip.toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range" min="1000" max="40000" step="500" value={sip}
          style={{ '--pct': `${pct}%` }}
          onChange={(e) => setSip(+e.target.value)}
          aria-label="Monthly SIP amount"
        />
        <div className="slider-scale"><span>₹1,000</span><span>₹40,000</span></div>
      </div>

      <div className="proj">
        <div className="stat">
          <div className="k">Corpus at {persona.retireAt} ({riskProfile.toLowerCase()} mix)</div>
          <div className="v">{formatINR(corpus)}</div>
        </div>
        <div className="stat">
          <div className="k">Goal coverage</div>
          <div className={`v ${progress >= 0.7 ? 'good' : ''}`}>{Math.round(progress * 100)}%</div>
        </div>
      </div>

      <details className="card why">
        <summary>Why this advice? (explainable & audited)</summary>
        <p>
          You told me a ₹20,000 notional loss wouldn't make you sell — and your goal is {years} years away.
          That makes you a <b>{riskProfile}</b> investor, so I project a {mix} earning ~{Math.round(rate * 100)}%
          annually. Your target of {formatINR(needed)} is today's spending inflated at 6% to age {persona.retireAt},
          drawn down at a safe 4%/year. Every input, and this explanation, is stored for audit.
        </p>
        <div className="basis">
          <span className="pill brand">SEBI suitability ✓</span>
          <span className="pill brand">AI-use disclosed ✓</span>
          <span className="pill accent">Reviewed model v2.1</span>
        </div>
      </details>

      <button
        className="btn primary"
        onClick={() => onToast(`✓ SIP mandate of <b>₹${sip.toLocaleString('en-IN')}/month</b> prepared. Review the fund split and e-sign in IDBI GO Mobile+ — nothing is invested without your explicit confirmation.`)}
      >
        Start this SIP with one tap
      </button>
      <div className="disclaimer">
        Projections assume constant returns and are illustrative, not guaranteed.
        Mutual fund investments are subject to market risks. Advice audit-logged per SEBI (IA) Regulations.
      </div>
    </div>
  )
}
