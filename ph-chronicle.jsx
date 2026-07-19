import { useState, useRef, useEffect, useCallback } from 'react';

/* ═══════ PALETTE ═══════ */
const C = {
  bg: '#F5F0E8',
  ink: '#2C2520',
  inkMid: '#5C534A',
  inkLight: '#8A7F73',
  inkFaint: '#C4BAB0',
  gold: '#C9A96E',
  goldDim: '#D4C4A0',
  line: '#9E8B72',
  P: '#4D6356',
  H: '#5D6D7E',
};

/* ═══════ DATA ═══════ */
const EVENTS = [
  { id:'phd', x:1000, dy:-28, year:'Y03', who:'H', title:'PhD defense',
    body:'Hesperon publishes his thesis. The committee votes unanimously; he leaves the room before they finish announcing it.', above:true },
  { id:'field', x:1400, dy:24, year:'Y05', who:'P', title:'first field op',
    body:'Phorion takes his first solo command. Returns with everyone alive. Refuses the medal.', above:false },
  { id:'paper', x:1750, dy:-18, year:'', who:'H', title:'first major paper',
    body:'A monograph on equilibrium, well received in narrow circles. He keeps the only handwritten draft.', above:true },
  { id:'promo', x:2150, dy:26, year:'Y09', who:'P', title:'promotion · operations chief',
    body:'Promoted out of fieldwork. He still goes out anyway, says it is for the data.', above:false },
  { id:'leon', x:2500, dy:-22, year:'', who:'H', title:"Leon's departure",
    body:'A teaching colleague leaves the city. Hesperon starts walking alone in the evenings; learns the route by heart within a month.', above:true },
  { id:'council', x:2850, dy:20, year:'Y11', who:'P', title:'inter-faction council seat',
    body:'Quietly placed on the council. He does not announce it; people find out through the meeting minutes.', above:false },
  { id:'contact', x:3300, dy:0, year:'Y12', who:'×', title:'first contact',
    body:'A conference, a corridor, six steps. Neither will say who noticed first.', above:true, special:true },
  { id:'coffee', x:3650, dy:-16, year:'', who:'×', title:'coffee after panel',
    body:'Two steps shorter, the second time he walks toward him. Phorion notes it and says nothing.', above:true },
  { id:'collab', x:3950, dy:20, year:'', who:'×', title:'first collaboration',
    body:'A clean exchange — favors traded, no debts. Hesperon accepts because the terms are equal. Phorion arranges it that way on purpose.', above:false },
  { id:'war', x:4300, dy:0, year:'Y13', who:'×', title:'war begins',
    body:'The eastern front opens. Both their lives reorder around it within the month.', above:false, special:true },
  { id:'facility', x:4650, dy:-24, year:'Y13.8', who:'H', title:'facility incident',
    body:'Hesperon is injured at an off-site test — hides it. Phorion finds out within twelve minutes and force-evacuates him by night. Calls four people. Saves the data first.', above:true },
  { id:'confirmed', x:5000, dy:16, year:'Y14', who:'×', title:'relationship confirmed',
    body:'In the early light after the rescue, neither of them needs to say it explicitly. He shakes the hand, holds it a fraction longer.', above:false },
  { id:'home', x:5300, dy:-12, year:'', who:'×', title:'shared apartment',
    body:'They move in. Hesperon brings two suitcases and a stack of books. Phorion clears half the closet, anticipates the door frames for the horns.', above:true },
];

const STORIES = [
  { id:'lich', name:'巫妖PARO', color:'#6B9B7F', yR:0.22, seed:1.2, amp:16, w:2.5, desc:'不死的行商与他的暮星，数个世纪的马车、茶杯与公路' },
  { id:'hp',   name:'HP PARO',   color:'#9B6B7F', yR:0.40, seed:3.7, amp:12, w:1.8, desc:'七年的城堡，从分院帽落下的那一刻开始' },
  { id:'main', name:'Chronicle', color:'#8B7355', yR:0.55, seed:0.5, amp:20, w:2.2, desc:'战后重建期——两条路线，分开走，然后汇合', active:true },
  { id:'if',   name:'IF Lines',  color:'#7E7EA8', yR:0.75, seed:5.1, amp:14, w:1.5, desc:'失忆、身体交换、政治联姻、宿敌——所有如果的集合' },
];

const CANVAS_W = 6000;

/* ═══════ PATH UTILS ═══════ */
function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i-1], c = pts[i], mx = (p.x+c.x)/2;
    d += ` C${mx},${p.y} ${mx},${c.y} ${c.x},${c.y}`;
  }
  return d;
}

function makeWave(baseY, width, seed, amp, weight) {
  const pts = [];
  const n = Math.ceil(width / 20);
  for (let i = 0; i <= n; i++) {
    const x = (i/n) * width;
    const y = baseY
      + Math.sin(x*0.004*weight + seed) * amp
      + Math.sin(x*0.0018*weight + seed*2.3) * amp*0.5
      + Math.sin(x*0.0009*weight + seed*0.7) * amp*0.3;
    pts.push({x, y});
  }
  return smooth(pts);
}

/* ═══════ STYLES ═══════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');

  * { margin:0; padding:0; box-sizing:border-box; }

  .root {
    width:100vw; height:100vh; overflow:hidden;
    background: radial-gradient(ellipse at 15% 40%, rgba(201,169,110,0.07), transparent 55%),
                radial-gradient(ellipse at 85% 60%, rgba(93,109,126,0.04), transparent 45%),
                ${C.bg};
    font-family: 'Cormorant Garamond', 'Palatino Linotype', Palatino, Georgia, serif;
    color: ${C.ink};
    user-select: none;
    position: relative;
  }

  .canvas {
    position: absolute;
    top: 0; left: 0;
    height: 100%;
    width: ${CANVAS_W}px;
  }

  .node-label {
    position: absolute;
    transform: translateX(-50%);
    text-align: center;
    width: 155px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .node-label:hover { opacity: 0.6; }

  .overlay {
    position:fixed; inset:0; z-index:100;
    background: rgba(245,240,232,0.93);
    display:flex; align-items:center; justify-content:center;
    animation: fadeIn 0.25s ease;
    cursor: pointer;
  }
  .detail-card {
    max-width: 460px; padding: 48px 40px;
    position: relative;
    animation: scaleUp 0.3s cubic-bezier(0.22,1,0.36,1);
    cursor: default;
  }

  .multi-root {
    width:100vw; height:100vh;
    background: radial-gradient(ellipse at 30% 50%, rgba(201,169,110,0.06), transparent 50%),
                radial-gradient(ellipse at 70% 40%, rgba(93,109,126,0.04), transparent 45%),
                ${C.bg};
    position:relative;
    animation: fadeIn 0.4s ease;
    font-family: 'Cormorant Garamond', Palatino, Georgia, serif;
    color: ${C.ink};
    user-select: none;
  }
  .story-path {
    cursor: pointer;
    transition: opacity 0.3s, filter 0.3s;
  }
  .story-path:hover {
    filter: drop-shadow(0 0 4px currentColor);
  }

  .portrait-root {
    width:100vw; min-height:100vh;
    background: ${C.bg};
    padding: 50px 20px 80px;
    overflow-y: auto;
    font-family: 'Cormorant Garamond', Palatino, Georgia, serif;
    color: ${C.ink};
    position: relative;
    z-index: 1;
  }

  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes scaleUp { from{opacity:0; transform:scale(0.92)} to{opacity:1; transform:scale(1)} }
  @keyframes drawLine { from{stroke-dashoffset:3000} to{stroke-dashoffset:0} }
  @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
`;

/* ═══════ NOISE TEXTURE OVERLAY ═══════ */
function Mist() {
  return (
    <svg width="100%" height="100%" style={{
      position:'fixed', top:0, left:0, pointerEvents:'none', zIndex:0,
      mixBlendMode:'multiply', opacity:0.35,
    }}>
      <defs>
        <filter id="mist">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.008"
            numOctaves={4} seed={3} stitchTiles="stitch" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="grey"/>
          <feComponentTransfer in="grey" result="soft">
            <feFuncA type="linear" slope="0.5" intercept="0"/>
          </feComponentTransfer>
          <feGaussianBlur in="soft" stdDeviation="1.5"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#mist)" fill="#C4BAB0"/>
    </svg>
  );
}

/* ═══════ PORTRAIT VIEW ═══════ */
function Portrait() {
  return (
    <div className="portrait-root">
      <Mist/>
      {/* Wash blobs for portrait */}
      <svg width="100%" height="100%" style={{position:'absolute', top:0, left:0, pointerEvents:'none', zIndex:0}}>
        <defs>
          <filter id="pwash">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={3} seed={5} result="w"/>
            <feDisplacementMap in="SourceGraphic" in2="w" scale={35} xChannelSelector="R" yChannelSelector="G"/>
            <feGaussianBlur stdDeviation={22}/>
          </filter>
          <radialGradient id="pg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.gold} stopOpacity="0.06"/>
            <stop offset="100%" stopColor={C.gold} stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="pg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8A8B82" stopOpacity="0.035"/>
            <stop offset="100%" stopColor="#8A8B82" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="30%" cy="15%" rx="22%" ry="12%" fill="url(#pg2)" filter="url(#pwash)"/>
        <ellipse cx="70%" cy="40%" rx="20%" ry="10%" fill="url(#pg1)" filter="url(#pwash)"/>
        <ellipse cx="25%" cy="65%" rx="18%" ry="14%" fill="url(#pg1)" filter="url(#pwash)"/>
        <ellipse cx="65%" cy="85%" rx="22%" ry="11%" fill="url(#pg2)" filter="url(#pwash)"/>
      </svg>
      <svg viewBox="0 0 300 100" style={{width:'65%', maxWidth:260, margin:'0 auto 28px', display:'block'}}>
        <path d="M0,22 C60,22 100,50 150,50" stroke={C.P} fill="none" strokeWidth={1.3} opacity={0.45}/>
        <path d="M0,78 C60,78 100,50 150,50" stroke={C.H} fill="none" strokeWidth={1.3} opacity={0.45}/>
        <path d="M150,50 L300,50" stroke={C.gold} fill="none" strokeWidth={1.3} opacity={0.6}/>
        <circle cx={150} cy={50} r={2.5} fill={C.gold}/>
      </svg>

      <h1 style={{textAlign:'center', fontSize:24, fontWeight:400, letterSpacing:'0.04em', marginBottom:6}}>
        Phorion × Hesperon
      </h1>
      <p style={{textAlign:'center', fontSize:14, fontStyle:'italic', color:C.inkLight, marginBottom:56, fontWeight:300}}>
        Two paths, separately walked, then converging
      </p>

      <div style={{maxWidth:520, margin:'0 auto', position:'relative', paddingBottom:40}}>
        {/* Center vertical line */}
        <div style={{
          position:'absolute', left:'50%', top:0, bottom:0,
          width:1, transform:'translateX(-0.5px)',
          background:`linear-gradient(to bottom, transparent, ${C.inkFaint} 2%, ${C.inkFaint} 98%, transparent)`,
        }}/>

        {/* P / H column labels */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          marginBottom:32, padding:'0 12px',
        }}>
          <span style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.18em', color:C.P, fontWeight:500, width:'45%', textAlign:'right', paddingRight:24}}>
            phorion
          </span>
          <span style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.18em', color:C.H, fontWeight:500, width:'45%', textAlign:'left', paddingLeft:24}}>
            hesperon
          </span>
        </div>

        {EVENTS.map((e, i) => {
          const dotColor = e.special ? C.gold : C.line;
          const dotSize = e.special ? 7 : 4;
          const isShared = e.who === '×';
          const onLeft = e.who === 'P';

          const dotNode = (
            <div style={{
              width:32, flexShrink:0,
              display:'flex', justifyContent:'center', alignItems:'flex-start',
              paddingTop:5, position:'relative',
            }}>
              <div style={{
                width:dotSize, height:dotSize, borderRadius:'50%',
                background:dotColor, position:'relative', zIndex:2,
              }}/>
              {e.special && (
                <div style={{
                  position:'absolute', top:5 - 3.5,
                  width:14, height:14, borderRadius:'50%',
                  border:`1px solid ${C.gold}`, opacity:0.35,
                  animation:'pulse 3s ease infinite',
                }}/>
              )}
            </div>
          );

          if (isShared) {
            return (
              <div key={e.id} style={{
                position:'relative',
                display:'flex', flexDirection:'column', alignItems:'center',
                minHeight: 70, marginBottom: 28,
                animation: `fadeIn 0.4s ease ${i * 0.04}s both`,
              }}>
                {dotNode}
                <div style={{
                  maxWidth: 380, width:'100%',
                  padding: '8px 24px 0',
                  textAlign: 'center',
                }}>
                  <div style={{display:'flex', justifyContent:'center', gap:8, alignItems:'baseline', marginBottom:2}}>
                    {e.year && (
                      <span style={{fontSize:11, fontStyle:'italic', color:C.inkLight, letterSpacing:'0.05em', fontWeight:300}}>
                        {e.year}
                      </span>
                    )}
                    <span style={{fontSize:8, textTransform:'uppercase', letterSpacing:'0.14em', color:C.inkMid, fontWeight:400}}>
                      ×
                    </span>
                  </div>
                  <div style={{
                    fontSize: e.special ? 17 : 15,
                    fontWeight: e.special ? 500 : 400,
                    marginBottom:4, lineHeight:1.3,
                  }}>
                    {e.title}
                  </div>
                  <div style={{fontSize:13, color:C.inkMid, lineHeight:1.7, fontWeight:300}}>
                    {e.body}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={e.id} style={{
              position:'relative',
              display:'flex',
              alignItems:'flex-start',
              minHeight: 70,
              marginBottom: 28,
              animation: `fadeIn 0.4s ease ${i * 0.04}s both`,
            }}>
              <div style={{
                width:'calc(50% - 16px)', paddingRight:20,
                textAlign:'right',
                opacity: onLeft ? 1 : 0,
                visibility: onLeft ? 'visible' : 'hidden',
              }}>
                <div style={{display:'flex', justifyContent:'flex-end', gap:8, alignItems:'baseline', marginBottom:2}}>
                  {e.year && (
                    <span style={{fontSize:11, fontStyle:'italic', color:C.inkLight, letterSpacing:'0.05em', fontWeight:300}}>
                      {e.year}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: e.special ? 17 : 15,
                  fontWeight: e.special ? 500 : 400,
                  marginBottom:4, lineHeight:1.3,
                }}>
                  {e.title}
                </div>
                <div style={{fontSize:13, color:C.inkMid, lineHeight:1.7, fontWeight:300}}>
                  {e.body}
                </div>
              </div>

              {dotNode}

              <div style={{
                width:'calc(50% - 16px)', paddingLeft:20,
                textAlign:'left',
                opacity: !onLeft ? 1 : 0,
                visibility: !onLeft ? 'visible' : 'hidden',
              }}>
                <div style={{display:'flex', gap:8, alignItems:'baseline', marginBottom:2}}>
                  {e.year && (
                    <span style={{fontSize:11, fontStyle:'italic', color:C.inkLight, letterSpacing:'0.05em', fontWeight:300}}>
                      {e.year}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: e.special ? 17 : 15,
                  fontWeight: e.special ? 500 : 400,
                  marginBottom:4, lineHeight:1.3,
                }}>
                  {e.title}
                </div>
                <div style={{fontSize:13, color:C.inkMid, lineHeight:1.7, fontWeight:300}}>
                  {e.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════ MULTILINE VIEW ═══════ */
function Multiline({ onBack, vw, vh }) {
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({x:0,y:0});

  return (
    <div className="multi-root">
      <Mist/>
      <div onClick={onBack} style={{
        position:'absolute', top:28, left:32, cursor:'pointer',
        fontSize:14, color:C.inkLight, letterSpacing:'0.06em', fontStyle:'italic',
        transition:'color 0.2s', zIndex:10,
      }}
        onMouseEnter={e=>e.target.style.color=C.ink}
        onMouseLeave={e=>e.target.style.color=C.inkLight}
      >
        ← chronicle
      </div>

      <div style={{position:'absolute', top:28, width:'100%', textAlign:'center'}}>
        <span style={{fontSize:13, letterSpacing:'0.15em', textTransform:'uppercase', color:C.inkLight, fontWeight:400}}>
          all storylines
        </span>
      </div>

      <svg width={vw} height={vh} style={{position:'absolute', top:0, left:0}}>
        <defs>
          <filter id="mwash">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={11} result="w"/>
            <feDisplacementMap in="SourceGraphic" in2="w" scale={40} xChannelSelector="R" yChannelSelector="G"/>
            <feGaussianBlur stdDeviation={20}/>
          </filter>
          <radialGradient id="mg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.gold} stopOpacity="0.05"/>
            <stop offset="100%" stopColor={C.gold} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx={vw*0.2} cy={vh*0.3} rx={vw*0.15} ry={vh*0.12} fill="url(#mg1)" filter="url(#mwash)"/>
        <ellipse cx={vw*0.7} cy={vh*0.6} rx={vw*0.18} ry={vh*0.1} fill="url(#mg1)" filter="url(#mwash)"/>
        <ellipse cx={vw*0.45} cy={vh*0.8} rx={vw*0.12} ry={vh*0.08} fill="url(#mg1)" filter="url(#mwash)"/>

        {STORIES.map((s,i) => {
          const y = s.yR * vh;
          const path = makeWave(y, vw, s.seed, s.amp, s.w);
          const isActive = s.active;
          const isHov = hovered?.id === s.id;
          return (
            <g key={s.id}>
              {/* Invisible wide hit target */}
              <path d={path} stroke="transparent" fill="none"
                strokeWidth={28} cursor="pointer"
                onMouseMove={e => { setHovered(s); setTooltipPos({x:e.clientX,y:e.clientY}); }}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {}}
              />
              <path d={path} stroke={s.color} fill="none"
                strokeWidth={isActive ? 6 : 4} opacity={isHov ? 0.2 : 0.08}
                style={{transition:'opacity 0.3s', pointerEvents:'none'}}
              />
              <path d={path} stroke={s.color} fill="none" className="story-path"
                strokeWidth={isActive ? 2.5 : 1.5}
                opacity={isHov ? 1 : isActive ? 0.85 : 0.45}
                strokeDasharray={3000}
                style={{
                  animation: `drawLine 2s ease ${i*0.15}s both`,
                  transition: 'opacity 0.3s',
                  pointerEvents: 'none',
                }}
              />
              <text x={36} y={y - (s.amp + 8)} fill={s.color}
                fontSize={isActive ? 14 : 12} fontStyle="italic"
                opacity={isHov ? 1 : isActive ? 0.7 : 0.4}
                style={{
                  fontFamily:"'Cormorant Garamond', serif",
                  transition:'opacity 0.3s',
                  animation: `fadeIn 0.5s ease ${i*0.15+0.3}s both`,
                }}
              >
                {s.name}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div style={{
          position:'fixed',
          left: tooltipPos.x + 16, top: tooltipPos.y - 12,
          background:'rgba(44,37,32,0.88)', color:'#F5F0E8',
          padding:'8px 14px', borderRadius:4, fontSize:13,
          fontStyle:'italic', pointerEvents:'none',
          animation:'fadeIn 0.15s ease', maxWidth:280,
          lineHeight:1.5, fontWeight:300,
        }}>
          {hovered.desc}
        </div>
      )}
    </div>
  );
}

/* ═══════ DETAIL OVERLAY ═══════ */
function Detail({ event: e, onClose }) {
  if (!e) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="detail-card" onClick={ev => ev.stopPropagation()}>
        <div style={{display:'flex', gap:12, alignItems:'baseline', marginBottom:10}}>
          {e.year && (
            <span style={{fontSize:13, fontStyle:'italic', color:C.inkLight, letterSpacing:'0.06em'}}>{e.year}</span>
          )}
          {e.who !== '×' && (
            <span style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', color:e.who==='P'?C.P:C.H}}>
              {e.who==='P'?'phorion':'hesperon'}
            </span>
          )}
        </div>
        <h2 style={{fontSize:28, fontWeight:400, marginBottom:18, lineHeight:1.2, letterSpacing:'0.02em'}}>
          {e.title}
        </h2>
        <p style={{fontSize:16, lineHeight:1.85, color:C.inkMid, fontWeight:400}}>
          {e.body}
        </p>
        <div onClick={onClose} style={{
          position:'absolute', top:16, right:20,
          cursor:'pointer', fontSize:22, color:C.inkFaint,
          transition:'color 0.2s', lineHeight:1,
        }}
          onMouseEnter={ev=>ev.target.style.color=C.ink}
          onMouseLeave={ev=>ev.target.style.color=C.inkFaint}
        >×</div>
      </div>
    </div>
  );
}

/* ═══════ MAIN ═══════ */
export default function App() {
  const [view, setView] = useState('timeline');
  const [detail, setDetail] = useState(null);
  const [vh, setVh] = useState(600);
  const [vw, setVw] = useState(1200);
  const [portrait, setPortrait] = useState(false);
  const scrollRef = useRef(0);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const dragRef = useRef({ down:false, startX:0, startScroll:0, moved:false });
  const [nearEnd, setNearEnd] = useState(false);

  useEffect(() => {
    const upd = () => {
      setVh(window.innerHeight);
      setVw(window.innerWidth);
      setPortrait(window.innerHeight > window.innerWidth * 1.15);
    };
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  const clamp = useCallback((v) => Math.max(0, Math.min(v, CANVAS_W - vw)), [vw]);

  const applyScroll = useCallback((val) => {
    const v = clamp(val);
    scrollRef.current = v;
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translateX(${-v}px)`;
    }
    setNearEnd(v > CANVAS_W - vw - 300);
    // update progress bar
    const bar = document.getElementById('ph-progress');
    if (bar) bar.style.width = `${(v / Math.max(1, CANVAS_W - vw)) * 100}%`;
  }, [clamp, vw]);

  // Wheel
  useEffect(() => {
    if (view !== 'timeline' || portrait) return;
    const fn = (e) => {
      e.preventDefault();
      applyScroll(scrollRef.current + e.deltaY + e.deltaX);
    };
    window.addEventListener('wheel', fn, { passive: false });
    return () => window.removeEventListener('wheel', fn);
  }, [view, portrait, applyScroll]);

  // Drag
  const onPD = useCallback((e) => {
    if (detail) return;
    dragRef.current = { down:true, startX:e.clientX, startScroll:scrollRef.current, moved:false };
  }, [detail]);

  const onPM = useCallback((e) => {
    if (!dragRef.current.down) return;
    const dx = dragRef.current.startX - e.clientX;
    if (Math.abs(dx) > 3) dragRef.current.moved = true;
    applyScroll(dragRef.current.startScroll + dx);
  }, [applyScroll]);

  const onPU = useCallback(() => {
    dragRef.current.down = false;
  }, []);

  // Touch
  const onTS = useCallback((e) => {
    if (detail) return;
    const t = e.touches[0];
    dragRef.current = { down:true, startX:t.clientX, startScroll:scrollRef.current, moved:false };
  }, [detail]);

  const onTM = useCallback((e) => {
    if (!dragRef.current.down) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = dragRef.current.startX - t.clientX;
    if (Math.abs(dx) > 3) dragRef.current.moved = true;
    applyScroll(dragRef.current.startScroll + dx);
  }, [applyScroll]);

  const onTE = useCallback(() => { dragRef.current.down = false; }, []);

  const CY = vh * 0.48;
  const linePoints = [
    { x: 500, y: CY + 5 },
    ...EVENTS.map(e => ({ x: e.x, y: CY + e.dy })),
    { x: CANVAS_W - 400, y: CY },
  ];
  const linePath = smooth(linePoints);

  if (portrait) return <><style>{CSS}</style><Portrait /></>;

  if (view === 'multiline') return (
    <><style>{CSS}</style><Multiline onBack={() => { setView('timeline'); setTimeout(() => applyScroll(scrollRef.current), 50); }} vw={vw} vh={vh} /></>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="root"
        onPointerDown={onPD}
        onPointerMove={onPM}
        onPointerUp={onPU}
        onPointerLeave={onPU}
        onTouchStart={onTS}
        onTouchMove={onTM}
        onTouchEnd={onTE}
        style={{ cursor: detail ? 'default' : 'grab', touchAction: 'none' }}
      >
        <Mist/>
        <div ref={canvasRef} className="canvas">
          {/* Title */}
          <div style={{
            position:'absolute', left:80, top:'50%', transform:'translateY(-55%)', width:380,
          }}>
            <div style={{fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:C.inkLight, marginBottom:12}}>
              PH · Chronicle
            </div>
            <h1 style={{fontSize:36, fontWeight:300, letterSpacing:'0.03em', lineHeight:1.2, marginBottom:12}}>
              Phorion
            </h1>
            <h1 style={{fontSize:36, fontWeight:300, letterSpacing:'0.03em', lineHeight:1.2, marginBottom:20, paddingLeft:40}}>
              × Hesperon
            </h1>
            <p style={{fontSize:14, fontStyle:'italic', color:C.inkLight, fontWeight:300, lineHeight:1.6}}>
              Two paths, separately walked, then converging
            </p>
            <p style={{fontSize:13, color:C.inkFaint, marginTop:8, fontWeight:300}}>
              两条路线，分开——相遇——并行。
            </p>
            <div style={{marginTop:28, fontSize:12, color:C.inkFaint, letterSpacing:'0.06em'}}>
              drag or scroll →
            </div>
          </div>

          {/* SVG */}
          <svg width={CANVAS_W} height={vh} style={{position:'absolute', top:0, left:0, pointerEvents:'none'}}>
            <defs>
              <filter id="wash">
                <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves={3} seed={7} result="warp"/>
                <feDisplacementMap in="SourceGraphic" in2="warp" scale={45} xChannelSelector="R" yChannelSelector="G"/>
                <feGaussianBlur stdDeviation={18}/>
              </filter>
              <radialGradient id="wg1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={C.gold} stopOpacity="0.07"/>
                <stop offset="70%" stopColor={C.gold} stopOpacity="0.03"/>
                <stop offset="100%" stopColor={C.gold} stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="wg2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8A8B82" stopOpacity="0.04"/>
                <stop offset="60%" stopColor="#8A8B82" stopOpacity="0.018"/>
                <stop offset="100%" stopColor="#8A8B82" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="wg3" cx="40%" cy="60%" r="50%">
                <stop offset="0%" stopColor="#7A7A68" stopOpacity="0.03"/>
                <stop offset="65%" stopColor="#7A7A68" stopOpacity="0.012"/>
                <stop offset="100%" stopColor="#7A7A68" stopOpacity="0"/>
              </radialGradient>
            </defs>

            {/* Wash blobs — irregular watercolor stains */}
            <ellipse cx={800} cy={CY-60} rx={220} ry={140} fill="url(#wg2)" filter="url(#wash)"/>
            <ellipse cx={2000} cy={CY+80} rx={280} ry={120} fill="url(#wg3)" filter="url(#wash)"/>
            <ellipse cx={3300} cy={CY} rx={300} ry={180} fill="url(#wg1)" filter="url(#wash)"/>
            <ellipse cx={4300} cy={CY+40} rx={250} ry={150} fill="url(#wg1)" filter="url(#wash)"/>
            <ellipse cx={5000} cy={CY-30} rx={260} ry={160} fill="url(#wg2)" filter="url(#wash)"/>
            <ellipse cx={1400} cy={CY+120} rx={180} ry={90} fill="url(#wg3)" filter="url(#wash)"/>
            <ellipse cx={3800} cy={CY-90} rx={200} ry={110} fill="url(#wg2)" filter="url(#wash)"/>
            <ellipse cx={5500} cy={CY+60} rx={240} ry={130} fill="url(#wg1)" filter="url(#wash)"/>

            <path d={linePath} stroke={C.gold} fill="none" strokeWidth={8} opacity={0.06}/>
            <path d={linePath} stroke={C.line} fill="none" strokeWidth={1.8} strokeLinecap="round"/>

            {EVENTS.map(e => {
              const ny = CY + e.dy;
              const stemEnd = e.above ? ny - 48 : ny + 48;
              return <line key={`s-${e.id}`} x1={e.x} y1={ny+(e.above?-4:4)} x2={e.x} y2={stemEnd}
                stroke={C.inkFaint} strokeWidth={0.6} opacity={0.5}/>;
            })}

            {EVENTS.map(e => {
              const ny = CY + e.dy;
              const r = e.special ? 5 : 3;
              return (
                <g key={`n-${e.id}`}>
                  {e.special && <circle cx={e.x} cy={ny} r={12} fill="none" stroke={C.gold} strokeWidth={0.5}
                    opacity={0.4} style={{animation:'pulse 3s ease infinite'}}/>}
                  <circle cx={e.x} cy={ny} r={r} fill={e.special?C.gold:C.line} stroke={C.bg} strokeWidth={1.5}/>
                </g>
              );
            })}
          </svg>

          {/* Labels */}
          {EVENTS.map(e => {
            const ny = CY + e.dy;
            const top = e.above ? ny - 95 : ny + 55;
            const whoColor = e.who==='P'?C.P:e.who==='H'?C.H:C.inkMid;
            return (
              <div key={`l-${e.id}`} className="node-label" style={{left:e.x, top}}
                onClick={(ev) => { ev.stopPropagation(); if(!dragRef.current.moved) setDetail(e); }}
              >
                <div style={{display:'flex', justifyContent:'center', gap:8, alignItems:'baseline', marginBottom:3}}>
                  {e.year && <span style={{fontSize:11, fontStyle:'italic', color:C.inkLight, letterSpacing:'0.05em'}}>{e.year}</span>}
                  {e.who !== '×' && (
                    <span style={{fontSize:8, textTransform:'uppercase', letterSpacing:'0.15em', color:whoColor, fontWeight:500}}>
                      {e.who==='P'?'phorion':'hesperon'}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize:e.special?15:13.5, fontWeight:e.special?500:400,
                  color:e.special?C.ink:C.inkMid, lineHeight:1.35, letterSpacing:'0.02em',
                }}>
                  {e.title}
                </div>
              </div>
            );
          })}

          {/* Zoom-out trigger */}
          <div style={{
            position:'absolute', right:80, top:'50%', transform:'translateY(-50%)',
            textAlign:'right', cursor:'pointer',
            opacity:nearEnd?1:0.3, transition:'opacity 0.5s',
          }}
            onClick={(ev) => { ev.stopPropagation(); setView('multiline'); }}
          >
            <div style={{fontSize:12, letterSpacing:'0.12em', color:C.inkLight, fontStyle:'italic', marginBottom:6}}>
              all storylines
            </div>
            <div style={{fontSize:20, color:C.gold, lineHeight:1}}>→</div>
          </div>
        </div>

        <Detail event={detail} onClose={() => setDetail(null)} />

        {/* Progress bar */}
        <div style={{
          position:'absolute', bottom:16, left:'10%', width:'80%', height:1,
          background:C.inkFaint, opacity:0.2, borderRadius:1,
        }}>
          <div id="ph-progress" style={{
            height:'100%', borderRadius:1, background:C.line, opacity:0.6, width:'0%',
          }}/>
        </div>
      </div>
    </>
  );
}
