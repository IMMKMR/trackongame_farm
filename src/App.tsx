import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ───
type Phase = 'story' | 'tutorial' | 'planting' | 'growing' | 'fastforward' | 'harvest' | 'scoreboard'

// ─── Constants ───
const PRODUCTS = [
  { name: 'Trackon Gold', color: '#fbbf24', icon: '✨', waste: 0.05 },
  { name: 'NPK 19:19:19', color: '#60a5fa', icon: '🧪', waste: 0.6 },
  { name: 'Micronutrient', color: '#a78bfa', icon: '⚗️', waste: 0.7 },
  { name: 'Growth Boost', color: '#fb923c', icon: '🌱', waste: 0.5 },
  { name: 'Zinc Sulphate', color: '#34d399', icon: '💊', waste: 0.8 },
  { name: 'Boron Spray', color: '#f472b6', icon: '🫧', waste: 0.7 },
  { name: 'Urea 46%', color: '#facc15', icon: '🏺', waste: 0.55 },
]

const STORY_DIALOGUE = [
  {
    speaker: 'pappu',
    name: 'Pappu',
    text: "Yaar, my crops keep wilting! I've tried NPK, Zinc, Urea — nothing works consistently!",
    emotion: 'confused',
  },
  {
    speaker: 'raju',
    name: 'Raju',
    text: "That's your problem — you keep switching! I use only ONE product: Trackon Gold.",
    emotion: 'confident',
  },
  {
    speaker: 'pappu',
    name: 'Pappu',
    text: "One product? But how can one thing do everything?",
    emotion: 'surprised',
  },
  {
    speaker: 'raju',
    name: 'Raju',
    text: "Trackon Gold has the perfect balance of all nutrients. No guessing, no waste!",
    emotion: 'proud',
  },
  {
    speaker: 'pappu',
    name: 'Pappu',
    text: "Hmm... but my dealer recommends different things every week...",
    emotion: 'thinking',
  },
  {
    speaker: 'raju',
    name: 'Raju',
    text: "Let me prove it — let's farm side by side this season. You'll see the difference at harvest!",
    emotion: 'challenge',
  },
]

const TUTORIAL_STEPS = [
  {
    text: "Welcome to the Farming Challenge! You're Pappu — the farmer who tries many products.",
    sub: "Raju plays on the top half — using only Trackon Gold.",
    emoji: '🧑‍🌾',
  },
  {
    text: "Your farm is the BOTTOM half. Tap your crops to apply the selected product!",
    sub: "Switch products using the tray below.",
    emoji: '👇',
  },
  {
    text: "Watch Raju in the TOP half — he uses only ONE product: Trackon Gold. No guessing!",
    sub: "Will you beat him?",
    emoji: '🧔',
  },
  {
    text: "Both farms start IDENTICAL — same soil, seed, weather, and irrigation. Only nutrition differs!",
    sub: "The best strategy wins at harvest. Ready?",
    emoji: '🌾',
  },
]

const HINT_MESSAGES = [
  { text: "Trackon Gold is working its magic up top! 🌟", trigger: 4 },
  { text: "Raju never switches products. One perfect solution!", trigger: 8 },
  { text: "Your crops look uneven. Maybe stick to one good product?", trigger: 12 },
]

const CROP_COUNT = 9

const CROP_STAGES = {
  wheat: {
    seed: `${import.meta.env.BASE_URL}assets/crops/wheat/1 - Wheat Seed.png`,
    sprout: `${import.meta.env.BASE_URL}assets/crops/wheat/2 - Wheat Sprout.png`,
    mid: `${import.meta.env.BASE_URL}assets/crops/wheat/3 - Wheat Mid.png`,
    full: `${import.meta.env.BASE_URL}assets/crops/wheat/4 - Wheat Full.png`,
    wilt: `${import.meta.env.BASE_URL}assets/crops/wheat/5 - Wheat Wilt.png`,
  },
  pumpkin: {
    seed: `${import.meta.env.BASE_URL}assets/crops/pumpkin/1 - Pumpkin Seed.png`,
    sprout: `${import.meta.env.BASE_URL}assets/crops/pumpkin/2 - Pumpkin Sprout.png`,
    mid: `${import.meta.env.BASE_URL}assets/crops/pumpkin/3 - Pumpkin Mid.png`,
    full: `${import.meta.env.BASE_URL}assets/crops/pumpkin/4 - Pumpkin Full.png`,
    wilt: `${import.meta.env.BASE_URL}assets/crops/pumpkin/5 - Pumpkin Wilt.png`,
  },
}

const TILE_ASSETS = {
  cloud: `${import.meta.env.BASE_URL}assets/tiles/cloud.png`,
  cloudBig: `${import.meta.env.BASE_URL}assets/tiles/cloud big.png`,
  smallClouds: `${import.meta.env.BASE_URL}assets/tiles/small clouds.png`,
  grass: `${import.meta.env.BASE_URL}assets/tiles/grass tile.png`,
  grassH: `${import.meta.env.BASE_URL}assets/tiles/grass  - horizontal.png`,
  ground: `${import.meta.env.BASE_URL}assets/tiles/ground .png`,
  groundH: `${import.meta.env.BASE_URL}assets/tiles/ground  - horizontal.png`,
  terrain: `${import.meta.env.BASE_URL}assets/tiles/Terrain tile.png`,
}

// ─── Helper: get crop image for bot (always healthy) ───
function getBotCropImage(phase: Phase, index: number) {
  const cropType = index % 2 === 0 ? 'wheat' : 'pumpkin'
  const stages = CROP_STAGES[cropType]
  if (phase === 'harvest' || phase === 'scoreboard') return stages.full
  if (phase === 'fastforward') return stages.mid
  if (phase === 'growing') return stages.sprout
  if (phase === 'planting') return stages.seed
  return stages.seed
}

// ─── Helper: get crop image for player (health-based) ───
function getPlayerCropImage(phase: Phase, health: number, index: number) {
  const cropType = index % 2 === 0 ? 'pumpkin' : 'wheat'
  const stages = CROP_STAGES[cropType]
  if (phase === 'harvest' || phase === 'scoreboard') {
    return health > 50 ? stages.full : stages.wilt
  }
  if (phase === 'fastforward') return health > 40 ? stages.mid : stages.sprout
  if (phase === 'growing') return stages.sprout
  if (phase === 'planting') return stages.seed
  return stages.seed
}

// ═══════════════════════════════════════════════════
// ═══  STORY DIALOGUE COMPONENT  ═══
// ═══════════════════════════════════════════════════
function StoryDialogue({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [textVisible, setTextVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTextVisible(true), 300)
    return () => clearTimeout(t)
  }, [currentSlide])

  const handleNext = () => {
    if (currentSlide >= STORY_DIALOGUE.length - 1) {
      onComplete()
    } else {
      setTextVisible(false)
      setTimeout(() => setCurrentSlide(s => s + 1), 200)
    }
  }

  const slide = STORY_DIALOGUE[Math.min(currentSlide, STORY_DIALOGUE.length - 1)]
  const isRaju = slide.speaker === 'raju'

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 40%, #4ade80 100%)',
      overflow: 'hidden',
    }}>
      {/* Animated background elements */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {/* Ground gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(22,60,20,0.4) 50%, rgba(15,40,12,0.8) 100%)',
        }} />
        {/* Grass tiles at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 30,
          display: 'flex', overflow: 'hidden',
        }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <img key={i} src={TILE_ASSETS.grass} alt=""
              style={{ width: 24, height: 24, imageRendering: 'pixelated', opacity: 0.6 }}
            />
          ))}
        </div>
      </div>

      {/* Title header */}
      <div style={{
        textAlign: 'center', paddingTop: 16, paddingBottom: 8, position: 'relative', zIndex: 2,
        animation: 'fadeInDown 0.6s ease both',
      }}>
        <div style={{
          fontSize: 12, fontFamily: 'Fredoka', color: 'rgba(74,222,128,0.5)',
          letterSpacing: 4, marginBottom: 3,
        }}>
          THE STORY
        </div>
        <div style={{
          fontSize: 18, fontFamily: 'Fredoka', fontWeight: 900,
          background: 'linear-gradient(135deg, #4ade80, #fbbf24)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          TWO FARMERS
        </div>
      </div>

      {/* Progress dots */}
      <div style={{
        display: 'flex', gap: 4, justifyContent: 'center', padding: '4px 0',
        position: 'relative', zIndex: 2,
      }}>
        {STORY_DIALOGUE.map((_, i) => (
          <div key={i} style={{
            width: i === currentSlide ? 18 : 6, height: 4, borderRadius: 3,
            background: i <= currentSlide
              ? 'linear-gradient(90deg, #4ade80, #fbbf24)'
              : 'rgba(255,255,255,0.12)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>

      {/* Characters area — full-body farmer illustrations */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        gap: 16, padding: '0 8px 40px', position: 'relative', zIndex: 2,
        minHeight: 0,
      }}>
        {/* Pappu (left) — Confused Farmer */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          opacity: slide.speaker === 'pappu' ? 1 : 0.45,
          transform: slide.speaker === 'pappu' ? 'scale(1.05)' : 'scale(0.88)',
          transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          filter: slide.speaker === 'pappu' ? 'drop-shadow(0 0 12px rgba(249,115,22,0.5))' : 'grayscale(0.4) brightness(0.7)',
          flex: '0 0 auto',
        }}>
          {/* Farmer illustration */}
          <div style={{
            width: '40vw', maxWidth: 140, height: '35vh', maxHeight: 280, minHeight: 180,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            animation: slide.speaker === 'pappu' ? 'characterIdle 2.5s ease-in-out infinite' : 'none',
            position: 'relative',
          }}>
            <img src={`${import.meta.env.BASE_URL}assets/characters/farmer-pappu.png`} alt="Pappu"
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                objectPosition: 'bottom center',
              }}
            />
          </div>
          {/* Name plate */}
          <div style={{
            background: slide.speaker === 'pappu'
              ? 'rgba(255,255,255,0.95)'
              : 'rgba(255,255,255,0.5)',
            border: `2px solid ${slide.speaker === 'pappu' ? '#f97316' : 'rgba(255,255,255,0.3)'}`,
            borderRadius: 8, padding: '4px 10px', textAlign: 'center',
            transition: 'all 0.4s ease',
            boxShadow: slide.speaker === 'pappu' ? '0 4px 12px rgba(249,115,22,0.15)' : 'none',
          }}>
            <div style={{
              fontSize: 14, fontFamily: 'Fredoka', fontWeight: 700, letterSpacing: 1.5,
              color: slide.speaker === 'pappu' ? '#c2410c' : '#64748b',
              transition: 'color 0.3s',
            }}>
              PAPPU
            </div>
            <div style={{
              fontSize: 10, color: '#475569', fontFamily: 'Nunito',
              lineHeight: 1.3, marginTop: 1,
            }}>
              Confused · Many Products
            </div>
          </div>
        </div>

        {/* VS badge */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
        }}>
          <div style={{
            background: '#ffffff', border: 'none',
            borderRadius: 20, padding: '4px 14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          }}>
            <span style={{
              fontSize: 16, fontFamily: 'Fredoka', fontWeight: 900,
              color: '#334155', letterSpacing: 3,
            }}>
              VS
            </span>
          </div>
        </div>

        {/* Raju (right) — Smart Farmer */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          opacity: slide.speaker === 'raju' ? 1 : 0.45,
          transform: slide.speaker === 'raju' ? 'scale(1.05)' : 'scale(0.88)',
          transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          filter: slide.speaker === 'raju' ? 'drop-shadow(0 0 12px rgba(34,197,94,0.5))' : 'grayscale(0.4) brightness(0.7)',
          flex: '0 0 auto',
        }}>
          {/* Farmer illustration */}
          <div style={{
            width: '40vw', maxWidth: 140, height: '35vh', maxHeight: 280, minHeight: 180,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            animation: slide.speaker === 'raju' ? 'characterIdle 2.5s ease-in-out infinite' : 'none',
            position: 'relative',
          }}>
            <img src={`${import.meta.env.BASE_URL}assets/characters/farmer-raju.png`} alt="Raju"
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                objectPosition: 'bottom center',
              }}
            />
          </div>
          {/* Name plate */}
          <div style={{
            background: slide.speaker === 'raju'
              ? 'rgba(255,255,255,0.95)'
              : 'rgba(255,255,255,0.5)',
            border: `2px solid ${slide.speaker === 'raju' ? '#22c55e' : 'rgba(255,255,255,0.3)'}`,
            borderRadius: 8, padding: '4px 10px', textAlign: 'center',
            transition: 'all 0.4s ease',
            boxShadow: slide.speaker === 'raju' ? '0 4px 12px rgba(34,197,94,0.15)' : 'none',
          }}>
            <div style={{
              fontSize: 14, fontFamily: 'Fredoka', fontWeight: 700, letterSpacing: 1.5,
              color: slide.speaker === 'raju' ? '#15803d' : '#64748b',
              transition: 'color 0.3s',
            }}>
              RAJU
            </div>
            <div style={{
              fontSize: 10, color: '#475569', fontFamily: 'Nunito',
              lineHeight: 1.3, marginTop: 1,
            }}>
              Smart · Trackon Gold
            </div>
          </div>
        </div>
      </div>

      {/* Speech bubble */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '0 12px 12px',
      }}>
        <div style={{
          background: isRaju
            ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,255,240,0.95))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,245,235,0.95))',
          border: `1px solid ${isRaju ? 'rgba(74,222,128,0.4)' : 'rgba(249,115,22,0.4)'}`,
          borderRadius: 16, padding: 14,
          backdropFilter: 'blur(10px)',
          boxShadow: isRaju
            ? '0 0 30px rgba(74,222,128,0.12)'
            : '0 0 30px rgba(249,115,22,0.12)',
          animation: textVisible ? 'bubblePop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: -8,
            left: isRaju ? 'auto' : '25%',
            right: isRaju ? '25%' : 'auto',
            width: 0, height: 0,
            borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
            borderBottom: `8px solid ${isRaju ? 'rgba(74,222,128,0.4)' : 'rgba(249,115,22,0.4)'}`,
          }} />

          {/* Speaker name */}
          <div style={{
            fontSize: 14, fontFamily: 'Fredoka', fontWeight: 700,
            color: isRaju ? '#4ade80' : '#fb923c',
            letterSpacing: 2, marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isRaju ? '#22c55e' : '#f97316',
              boxShadow: `0 0 6px ${isRaju ? '#22c55e' : '#f97316'}`,
            }} />
            {slide.name}
            {isRaju && (
              <span style={{
                fontSize: 10, background: 'rgba(34,197,94,0.2)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 3, padding: '1px 4px', color: '#4ade80',
              }}>
                TRACKON GOLD
              </span>
            )}
          </div>

          {/* Dialogue text */}
          <div style={{
            fontSize: 16, color: '#1e293b', fontFamily: 'Nunito',
            lineHeight: 1.6, marginBottom: 12,
            opacity: textVisible ? 1 : 0,
            transition: 'opacity 0.3s ease 0.2s',
          }}>
            "{slide.text}"
          </div>

          {/* Products being juggled (for Pappu) */}
          {!isRaju && currentSlide === 0 && (
            <div style={{
              display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap',
            }}>
              {PRODUCTS.slice(0, 4).map((p, i) => (
                <div key={i} style={{
                  fontSize: 11, padding: '2px 6px',
                  background: `${p.color}15`,
                  border: `1px solid ${p.color}40`,
                  borderRadius: 4, color: p.color,
                  fontFamily: 'Nunito',
                  animation: `fadeIn 0.3s ease ${0.5 + i * 0.1}s both`,
                }}>
                  {p.icon} {p.name}
                </div>
              ))}
            </div>
          )}

          {/* Trackon Gold badge (for Raju) */}
          {isRaju && currentSlide === 1 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'linear-gradient(90deg, rgba(251,191,36,0.15), rgba(34,197,94,0.15))',
              border: '1px solid rgba(251,191,36,0.35)',
              borderRadius: 8, padding: '4px 10px', marginBottom: 10,
              animation: 'scaleIn 0.5s ease 0.5s both',
            }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <span style={{
                fontSize: 14, fontFamily: 'Fredoka', fontWeight: 700,
                background: 'linear-gradient(90deg, #fbbf24, #4ade80)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                TRACKON GOLD
              </span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onComplete} style={{
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, cursor: 'pointer',
              fontFamily: 'Nunito', fontSize: 14, color: '#475569',
              transition: 'all 0.25s',
            }}>
              Skip Story
            </button>
            <button onClick={handleNext} style={{
              flex: 1, padding: '9px 0',
              background: currentSlide === STORY_DIALOGUE.length - 1
                ? 'linear-gradient(90deg, #15803d, #22c55e)'
                : isRaju
                  ? 'linear-gradient(90deg, #15803d, #22c55e)'
                  : 'linear-gradient(90deg, #c2410c, #f97316)',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'Fredoka', fontSize: 14, fontWeight: 700,
              color: '#ffffff', letterSpacing: 2,
              boxShadow: currentSlide === STORY_DIALOGUE.length - 1
                ? '0 4px 18px rgba(34,197,94,0.4)'
                : '0 4px 14px rgba(0,0,0,0.3)',
              transition: 'all 0.25s',
            }}>
              {currentSlide === STORY_DIALOGUE.length - 1 ? '🎮 START CHALLENGE' : 'NEXT →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  CLOUD COMPONENT (Sprite-based)  ═══
// ═══════════════════════════════════════════════════
function CloudSprite({ top, duration, delay, opacity, size }: {
  top: string; duration: string; delay: string; opacity: number; size: 'small' | 'medium' | 'big'
}) {
  const src = size === 'big' ? TILE_ASSETS.cloudBig
    : size === 'small' ? TILE_ASSETS.smallClouds
    : TILE_ASSETS.cloud

  const widths = { small: 20, medium: 32, big: 48 }

  return (
    <div style={{
      position: 'absolute', top, left: -60,
      animationName: 'cloudDrift', animationDuration: duration,
      animationDelay: delay, animationTimingFunction: 'linear', animationIterationCount: 'infinite',
      opacity, pointerEvents: 'none',
    }}>
      <img src={src} alt="" style={{
        width: widths[size], height: 'auto',
        imageRendering: 'pixelated', filter: 'brightness(1.3)',
      }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  SKY BACKGROUND  ═══
// ═══════════════════════════════════════════════════
function SkyBackground({ fast, side }: { fast: boolean; side: 'bot' | 'player' }) {
  const isBot = side === 'bot'
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: isBot
        ? 'linear-gradient(180deg, #38bdf8 0%, #7dd3fc 60%, #4ade80 100%)'
        : 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 60%, #86efac 100%)',
      overflow: 'hidden',
    }}>
      {/* Sun */}
      <div style={{
        position: 'absolute', width: 28, height: 28, borderRadius: '50%',
        background: 'radial-gradient(circle, #fde68a 30%, rgba(253,230,138,0.3) 60%, transparent 75%)',
        top: '15%', left: '70%',
        animation: 'sunPulse 3s ease-in-out infinite',
      }} />
      {/* Clouds */}
      <CloudSprite top="8%" duration={fast ? '1s' : '12s'} delay="0s" opacity={0.7} size="big" />
      <CloudSprite top="18%" duration={fast ? '1.3s' : '16s'} delay="2s" opacity={0.5} size="medium" />
      <CloudSprite top="25%" duration={fast ? '0.8s' : '10s'} delay="4s" opacity={0.35} size="small" />
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  SPRAY EFFECT  ═══
// ═══════════════════════════════════════════════════
function SprayEffect({ x, y, color, id, text }: { x: number; y: number; color: string; id: number, text?: string }) {
  return (
    <div key={id} style={{
      position: 'absolute', left: x - 20, top: y - 20,
      width: 40, height: 40, borderRadius: '50%',
      background: `radial-gradient(circle, ${color}88, ${color}33 50%, transparent 75%)`,
      pointerEvents: 'none',
      animationName: 'sprayPop', animationDuration: '0.6s',
      animationFillMode: 'forwards', animationTimingFunction: 'ease-out',
      zIndex: 25,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        💧
      </div>
      {text && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          fontSize: 12, fontFamily: 'Fredoka', fontWeight: 800, color: color,
          textShadow: '0 2px 4px rgba(0,0,0,0.9)', whiteSpace: 'nowrap',
          animation: 'fadeInUp 0.6s ease both',
        }}>
          {text}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  BOT CROP (Sprite-based)  ═══
// ═══════════════════════════════════════════════════
function BotCrop({ phase, index }: { phase: Phase; index: number }) {
  const imgSrc = getBotCropImage(phase, index)
  const grown = phase === 'harvest' || phase === 'scoreboard'
  const growing = phase === 'growing' || phase === 'fastforward'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-end', height: 72, position: 'relative',
    }}>
      <img src={imgSrc} alt="crop"
        style={{
          width: grown ? 28 : growing ? 20 : 14,
          height: 'auto',
          imageRendering: 'pixelated',
          transition: 'all 0.8s ease',
          transitionDelay: `${index * 60}ms`,
          animation: grown ? 'cropSway 2.5s ease-in-out infinite' : 'none',
          animationDelay: `${index * 150}ms`,
          filter: grown ? 'drop-shadow(0 0 4px rgba(74,222,128,0.5))' : 'none',
        }}
      />
      {/* Soil dot */}
      <div style={{
        width: 10, height: 4,
        background: 'linear-gradient(to right, rgba(22,101,52,0.5), rgba(22,101,52,0.8), rgba(22,101,52,0.5))',
        borderRadius: '50%', marginTop: -1,
      }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  PLAYER CROP (Sprite-based)  ═══
// ═══════════════════════════════════════════════════
function PlayerCrop({ phase, health, index, taps }: { phase: Phase; health: number; index: number; taps: number }) {
  const imgSrc = getPlayerCropImage(phase, health, index)
  const grown = phase === 'harvest' || phase === 'scoreboard'
  const growing = phase === 'growing' || phase === 'fastforward'
  
  const needsIndicator = phase === 'growing' && taps < 3
  const isOverfed = phase === 'growing' && taps > 3
  const isPerfect = phase === 'growing' && taps === 3

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-end', height: 72, position: 'relative',
    }}>
      <img src={imgSrc} alt="crop"
        style={{
          width: grown ? 24 : growing ? 18 : 14,
          height: 'auto',
          imageRendering: 'pixelated',
          transition: 'all 0.9s ease',
          transitionDelay: `${index * 70}ms`,
          opacity: grown && health < 40 ? 0.6 : 1,
          filter: health > 60 ? 'none' : health > 30 ? 'hue-rotate(30deg)' : 'hue-rotate(60deg) saturate(0.6)',
          animation: grown && health > 60 ? 'cropSway 3s ease-in-out infinite' : 'none',
          animationDelay: `${index * 200}ms`,
        }}
      />

      {/* Needs Nutrients Indicator */}
      {(needsIndicator || isOverfed || isPerfect) && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: isPerfect ? 'none' : 'trophyBounce 1.5s ease-in-out infinite',
            animationDelay: `${index * 150}ms`,
          }}>
            <div style={{
              fontSize: 10, fontFamily: 'Fredoka', fontWeight: 800, 
              color: isOverfed ? '#ef4444' : (isPerfect ? '#22c55e' : '#fb923c'),
              background: 'rgba(0,0,0,0.7)', padding: '2px 4px', borderRadius: 4,
              border: `1px solid ${isOverfed ? '#ef444488' : (isPerfect ? '#22c55e88' : '#fb923c88')}`,
              whiteSpace: 'nowrap', marginBottom: 1, textShadow: '0 1px 2px #000',
              textAlign: 'center', lineHeight: 1.2,
            }}>
              {isOverfed ? 'OVERFED ⚠️' : (isPerfect ? 'PERFECT ✨' : (
                <>
                  <div style={{ opacity: 0.8 }}>({taps}/3)</div>
                  <div>FEED</div>
                </>
              ))}
            </div>
            {!isPerfect && <div style={{ fontSize: 14 }}>👇</div>}
          </div>
        </div>
      )}

      {/* Soil dot */}
      <div style={{
        width: 8, height: 3,
        background: 'linear-gradient(to right, rgba(61,43,30,0.4), rgba(61,43,30,0.7), rgba(61,43,30,0.4))',
        borderRadius: '50%', marginTop: -1,
      }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  HUD LABEL  ═══
// ═══════════════════════════════════════════════════
function HUDLabel({ label, side }: { label: string; side: 'bot' | 'player' }) {
  const isBot = side === 'bot'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: isBot ? 'rgba(15,40,20,0.8)' : 'rgba(40,25,10,0.8)',
      border: `1px solid ${isBot ? 'rgba(34,197,94,0.45)' : 'rgba(249,115,22,0.45)'}`,
      borderRadius: 6, padding: '3px 8px',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: isBot ? '#22c55e' : '#f97316',
        boxShadow: `0 0 6px ${isBot ? '#22c55e' : '#f97316'}`,
      }} />
      <span style={{
        fontSize: 14, fontFamily: 'Fredoka', fontWeight: 600,
        color: isBot ? '#4ade80' : '#fb923c', letterSpacing: 1.5,
      }}>
        {label}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  STAT BAR  ═══
// ═══════════════════════════════════════════════════
function StatBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(value), delay); return () => clearTimeout(t) }, [value, delay])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'Nunito' }}>{label}</span>
        <span style={{ fontSize: 12, color, fontFamily: 'Fredoka', fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${w}%`,
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 8px ${color}44`,
        }} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  TUTORIAL OVERLAY  ═══
// ═══════════════════════════════════════════════════
function FarmerTutorial({
  step, total, onNext, onSkip, hint,
}: {
  step: number; total: number; onNext: () => void; onSkip: () => void; hint?: string
}) {
  const data = hint ? { text: hint, sub: 'Keep going!', emoji: '🧑‍🌾' } : TUTORIAL_STEPS[step]
  if (!data) return null

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
      paddingBottom: 16,
    }}>
      {/* Farmer character */}
      <div style={{
        animationName: 'farmerBounce', animationDuration: '0.5s',
        animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: '45vw', maxWidth: 140, height: '40vh', maxHeight: 280, minHeight: 180,
        }}>
          {/* Farmer illustration */}
          <img src={`${import.meta.env.BASE_URL}assets/characters/farmer-pappu.png`} alt="Farmer"
            style={{
              width: '100%', height: '100%', objectFit: 'contain',
              objectPosition: 'bottom center',
              filter: 'drop-shadow(0 0 15px rgba(249,115,22,0.4))'
            }}
          />
          {/* Emoji Badge */}
          <div style={{
            position: 'absolute', top: 10, right: -15,
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #fde68a, #fbbf24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, border: '2px solid #f59e0b',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            animation: 'bubblePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both 0.3s',
          }}>
            {data.emoji}
          </div>
        </div>
      </div>

      {/* Speech bubble */}
      <div style={{
        width: '90%', marginTop: 10,
        background: 'linear-gradient(135deg, #ffffff, #f0fdf4)',
        border: '1px solid rgba(74,222,128,0.45)',
        borderRadius: 16, padding: 14,
        boxShadow: '0 0 35px rgba(74,222,128,0.12)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeInUp 0.4s ease both 0.2s',
        position: 'relative',
      }}>
        {/* Bubble arrow */}
        <div style={{
          position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
          borderBottom: '9px solid rgba(74,222,128,0.45)',
        }} />

        {!hint && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= step
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        )}

        <div style={{
          fontSize: 16, color: '#1e293b', fontFamily: 'Nunito',
          lineHeight: 1.6, marginBottom: 6,
        }}>
          {data.text}
        </div>
        <div style={{
          fontSize: 14, color: '#475569', fontFamily: 'Nunito',
          marginBottom: 12,
        }}>
          {data.sub}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {hint ? (
            <button onClick={onSkip} style={{
              flex: 1, padding: '9px 0',
              background: 'linear-gradient(90deg, #15803d, #22c55e)',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'Fredoka', fontSize: 14, fontWeight: 700,
              color: '#ffffff', letterSpacing: 2,
              boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
            }}>
              GOT IT!
            </button>
          ) : (
            <>
              <button onClick={onSkip} style={{
                padding: '8px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10, cursor: 'pointer',
                fontFamily: 'Nunito', fontSize: 14, color: '#475569',
              }}>
                Skip
              </button>
              <button onClick={onNext} style={{
                flex: 1, padding: '9px 0',
                background: step === total - 1
                  ? 'linear-gradient(90deg, #15803d, #22c55e)'
                  : 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'Fredoka', fontSize: 14, fontWeight: 700,
                color: '#ffffff', letterSpacing: 2,
                boxShadow: step === total - 1
                  ? '0 4px 18px rgba(34,197,94,0.4)'
                  : '0 4px 16px rgba(59,130,246,0.3)',
              }}>
                {step === total - 1 ? '🌱 START GAME' : 'NEXT →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  SCOREBOARD  ═══
// ═══════════════════════════════════════════════════
function Scoreboard({ visible, playerHealth, trackonUsed, otherUsed }: { visible: boolean; playerHealth: number[], trackonUsed: boolean, otherUsed: boolean }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (visible) { const t = setTimeout(() => setShow(true), 400); return () => clearTimeout(t) }
  }, [visible])
  if (!visible) return null

  const avgHealth = Math.round(playerHealth.reduce((a, b) => a + b, 0) / playerHealth.length)
  let playerYield = Math.max(10, Math.round(avgHealth * 0.96))
  
  // Strict penalty if they mixed products
  if (trackonUsed && otherUsed) {
    playerYield = Math.min(89, playerYield)
  }

  const isWinner = playerYield >= 94
  const isTie = playerYield === 94

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: '92%',
        background: 'linear-gradient(135deg, rgba(8,20,8,0.98), rgba(15,28,15,0.98))',
        border: '1px solid rgba(74,222,128,0.35)',
        borderRadius: 20, padding: 16,
        boxShadow: '0 0 60px rgba(74,222,128,0.15), 0 30px 80px rgba(0,0,0,0.8)',
        animationName: show ? 'scoreboardSlide' : 'none',
        animationDuration: '0.6s', animationFillMode: 'both',
        animationTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{
            fontSize: 14, fontFamily: 'Fredoka', color: '#475569',
            letterSpacing: 3, marginBottom: 4,
          }}>
            HARVEST RESULTS
          </div>
          <div style={{
            fontSize: 22, fontFamily: 'Fredoka', fontWeight: 900, letterSpacing: 1,
            background: 'linear-gradient(90deg, #fbbf24, #fde68a, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            SEASON COMPLETE
          </div>
        </div>

        {/* Bot winner card */}
        <div style={{
          background: (!isWinner || isTie) ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${(!isWinner || isTie) ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)'}`,
          borderRadius: 14, padding: 12, marginBottom: 10,
          opacity: isWinner && !isTie ? 0.7 : 1,
          animation: (!isWinner || isTie) ? 'winnerGlow 2s ease-in-out infinite' : 'none',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {(!isWinner || isTie) ? (
                <span style={{
                  fontSize: 30,
                  animation: 'trophyBounce 1.5s ease-in-out infinite',
                  display: 'inline-block',
                }}>🏆</span>
              ) : (
                <span style={{ fontSize: 26 }}>🥀</span>
              )}
              <div>
                <div style={{
                  fontSize: 16, color: (!isWinner || isTie) ? '#4ade80' : '#f87171', fontFamily: 'Fredoka',
                  letterSpacing: 1, fontWeight: 700,
                }}>
                  RAJU · TRACKON GOLD
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 26, fontFamily: 'Fredoka', fontWeight: 900, color: '#4ade80',
              }}>
                94%
              </div>
              <div style={{ fontSize: 12, color: 'rgba(74,222,128,0.5)', fontFamily: 'Nunito' }}>
                yield score
              </div>
            </div>
          </div>
          <StatBar label="Crop Yield" value={94} color="#22c55e" delay={600} />
          <div style={{ marginTop: 5 }}><StatBar label="Soil Health" value={88} color="#4ade80" delay={800} /></div>
          <div style={{ marginTop: 5 }}><StatBar label="Grain Quality" value={91} color="#a3e635" delay={1000} /></div>
        </div>

        {/* Player card */}
        <div style={{
          background: isWinner ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.06)',
          border: `1px solid ${isWinner ? 'rgba(34,197,94,0.45)' : 'rgba(249,115,22,0.3)'}`,
          borderRadius: 14, padding: 12, marginBottom: 12,
          animation: isWinner ? 'winnerGlow 2s ease-in-out infinite' : 'none',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isWinner && (
                <span style={{
                  fontSize: 30,
                  animation: 'trophyBounce 1.5s ease-in-out infinite',
                  display: 'inline-block',
                }}>🏆</span>
              )}
              {!isWinner && <span style={{ fontSize: 26 }}>🌾</span>}
              <div>
                <div style={{
                  fontSize: 16, color: isWinner ? '#4ade80' : '#fb923c', fontFamily: 'Fredoka', letterSpacing: 1, fontWeight: 700,
                }}>
                  PAPPU · {trackonUsed && !otherUsed ? 'TRACKON ONLY' : 'MULTI-PRODUCT'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 26, fontFamily: 'Fredoka', fontWeight: 900, color: isWinner ? '#4ade80' : '#f97316',
              }}>
                {playerYield}%
              </div>
              <div style={{ fontSize: 12, color: isWinner ? 'rgba(74,222,128,0.5)' : 'rgba(249,115,22,0.5)', fontFamily: 'Nunito' }}>
                yield score
              </div>
            </div>
          </div>
          <StatBar label="Crop Yield" value={playerYield} color={isWinner ? "#22c55e" : "#f97316"} delay={700} />
          <div style={{ marginTop: 5 }}>
            <StatBar label="Soil Health" value={Math.max(20, playerYield - 8)} color={isWinner ? "#4ade80" : "#fb923c"} delay={900} />
          </div>
          <div style={{ marginTop: 5 }}>
            <StatBar label="Grain Quality" value={Math.max(22, playerYield - 5)} color={isWinner ? "#a3e635" : "#fbbf24"} delay={1100} />
          </div>
        </div>

        {/* Lesson */}
        <div style={{
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 10, padding: '8px 12px', marginBottom: 12,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <div>
            <div style={{
              fontSize: 12, color: '#fbbf24', fontFamily: 'Fredoka', letterSpacing: 1,
            }}>
              THE LESSON
            </div>
            <div style={{
              fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito',
              marginTop: 2, lineHeight: 1.5,
            }}>
              One optimised solution beats many guesses. Trackon Gold wins every season.
            </div>
          </div>
        </div>

        {/* Play Again */}
        <button onClick={() => window.location.reload()} style={{
          width: '100%', padding: '11px 0',
          background: 'linear-gradient(90deg, #15803d, #22c55e)',
          border: 'none', borderRadius: 10, cursor: 'pointer',
          fontFamily: 'Fredoka', fontSize: 16, fontWeight: 700,
          color: '#ffffff', letterSpacing: 2,
          boxShadow: '0 4px 22px rgba(34,197,94,0.4)',
          transition: 'all 0.25s',
        }}>
          🔄 PLAY AGAIN
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ═══  MAIN APP  ═══
// ═══════════════════════════════════════════════════
export default function App() {
  const [phase, setPhase] = useState<Phase>('story')
  const [tutorialStep, setTutorialStep] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState(0)
  const [sprays, setSprays] = useState<{ x: number; y: number; color: string; id: number; text?: string }[]>([])
  const [playerHealth, setPlayerHealth] = useState<number[]>(Array(CROP_COUNT).fill(10))
  const [cropTaps, setCropTaps] = useState<number[]>(Array(CROP_COUNT).fill(0))
  const [tapCount, setTapCount] = useState(0)
  const [trackonUsed, setTrackonUsed] = useState(false)
  const [otherUsed, setOtherUsed] = useState(false)
  const [ffVisible, setFfVisible] = useState(false)
  const [showRain, setShowRain] = useState(false)
  const [botPulse, setBotPulse] = useState(false)
  const sprayId = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const hintRef = useRef(0)
  const hintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addTimer = (fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay)
    timers.current.push(t)
  }

  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const triggerFastForward = useCallback(() => {
    if (phase !== 'growing') return
    setPhase('fastforward')
    setFfVisible(true)
    addTimer(() => setFfVisible(false), 3000)
    addTimer(() => setPhase('harvest'), 3200)
    addTimer(() => setPhase('scoreboard'), 5000)
  }, [phase])

  const startGame = useCallback(() => {
    setPhase('planting')
    addTimer(() => setPhase('growing'), 1000)
    addTimer(() => { setShowRain(true) }, 2200)
    addTimer(() => setShowRain(false), 4500)
    // The rest of the sequence is now triggered manually by the user via triggerFastForward()
  }, [])

  // Hint system during growing
  useEffect(() => {
    if (phase !== 'growing') return
    hintTimerRef.current = setInterval(() => {
      hintRef.current += 1
      const h = HINT_MESSAGES.find(m => m.trigger === hintRef.current)
      if (h) setHint(h.text)
    }, 1500)
    return () => { if (hintTimerRef.current) clearInterval(hintTimerRef.current) }
  }, [phase])

  // BOT auto-pulse
  useEffect(() => {
    if (phase !== 'growing' && phase !== 'fastforward') return
    const interval = setInterval(() => setBotPulse(p => !p), 1200)
    return () => clearInterval(interval)
  }, [phase])

  const handlePlayerTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'growing') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const product = PRODUCTS[selectedProduct]
    const id = sprayId.current++
    const text = product.name === 'Trackon Gold' ? '✨ BEST HARVEST!' : (product.waste > 0.3 ? '⚠️' : '+ GROWTH')
    
    if (product.name === 'Trackon Gold') {
      setTrackonUsed(true)
    } else {
      setOtherUsed(true)
    }

    setSprays(prev => [...prev, { x, y, color: product.color, id, text }])
    setTimeout(() => setSprays(prev => prev.filter(s => s.id !== id)), 600)

    // Update crop health near tap
    const cropIndex = Math.min(CROP_COUNT - 1, Math.floor((x / rect.width) * CROP_COUNT))
    
    setCropTaps(prev => {
      const next = [...prev]
      next[cropIndex] += 1
      return next
    })

    setPlayerHealth(prev => {
      const next = [...prev]
      const currentTaps = cropTaps[cropIndex]
      const gain = Math.round((1 - product.waste) * 30)

      for (let i = Math.max(0, cropIndex - 1); i <= Math.min(CROP_COUNT - 1, cropIndex + 1); i++) {
        let current = next[i]
        let amount = gain * (i === cropIndex ? 1 : 0.2)
        
        if (i === cropIndex) {
          if (product.waste > 0.3 && currentTaps >= 2) {
             amount = -15
          } else if (currentTaps >= 3) {
             amount = -20
          }
        }
        
        next[i] = Math.min(100, Math.max(0, current + amount))
      }
      return next
    })
    setTapCount(t => t + 1)
  }

  const handleTutorialNext = () => {
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
      startGame()
    } else {
      setTutorialStep(s => s + 1)
    }
  }

  const isPlaying = phase === 'growing' || phase === 'fastforward'
  const ff = phase === 'fastforward'

  return (
    <div style={{
      height: '100dvh', width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center',
      background: 'linear-gradient(180deg, #f0fdf4, #bbf7d0)',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        width: '100%', maxWidth: 500, height: '100%',
        position: 'relative',
        borderLeft: '2px solid #86efac',
        borderRight: '2px solid #86efac',
        boxShadow: '0 0 30px rgba(0,0,0,0.05)',
        background: '#ffffff',
      }}>

        {/* Title (Floating over game or fixed at top) */}
        <div style={{ 
          textAlign: 'center', padding: '12px 0 8px', zIndex: 10,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
        }}>
          <div style={{
            fontSize: 14, fontFamily: 'Fredoka', color: '#15803d',
            letterSpacing: 5, marginBottom: 4,
          }}>
            INTERACTIVE FARM CHALLENGE
          </div>
          <h1 style={{
            fontSize: 24, fontFamily: 'Fredoka', fontWeight: 900, margin: 0, letterSpacing: 1,
            color: '#eab308',
            textShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}>
            TRACKON GOLD
          </h1>
        </div>

        {/* Game Area (formerly phone frame) */}
        <div style={{
          flex: 1, width: '100%',
          background: '#070d07',
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>

            {/* ── STORY PHASE ── */}
            {phase === 'story' && (
              <StoryDialogue onComplete={() => setPhase('tutorial')} />
            )}

            {/* ── TOP HALF – BOT ── */}
            {phase !== 'story' && (
              <div style={{
                flex: 1, position: 'relative', overflow: 'hidden',
                borderBottom: '2px solid rgba(255,255,255,0.06)',
              }}>
                <SkyBackground fast={ff} side="bot" />

                {/* Grass ground */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
                  overflow: 'hidden', display: 'flex', alignItems: 'flex-end',
                }}>
                  {/* Grass tiles */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    display: 'flex', height: 14,
                  }}>
                    {Array.from({ length: 50 }).map((_, i) => (
                      <img key={i} src={TILE_ASSETS.grass} alt=""
                        style={{ width: 16, height: 14, imageRendering: 'pixelated' }}
                      />
                    ))}
                  </div>
                  {/* Ground */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 16,
                    background: phase === 'tutorial' ? '#3d2b1e' : '#1a4a10',
                    transition: 'background 2s ease',
                  }}>
                    {(phase === 'harvest' || phase === 'scoreboard') && [20, 40, 60, 80].map(l => (
                      <div key={l} style={{
                        position: 'absolute', left: `${l}%`, top: '30%',
                        width: 4, height: 4, borderRadius: '50%',
                        background: '#4ade80', boxShadow: '0 0 6px #4ade80',
                        animation: 'pulse-ring 1.5s ease-out infinite',
                        animationDelay: `${l * 10}ms`,
                      }} />
                    ))}
                  </div>
                </div>

                {/* Bot crops */}
                <div style={{
                  position: 'absolute', bottom: 18, left: 0, right: 0,
                  display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
                  padding: '0 8px',
                }}>
                  {Array.from({ length: CROP_COUNT }).map((_, i) => (
                    <BotCrop key={i} phase={phase} index={i} />
                  ))}
                </div>

                {/* Bot HUD */}
                <div style={{
                  position: 'absolute', top: 14, left: 8, right: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10,
                }}>
                  <HUDLabel label="RAJU" side="bot" />
                  <div style={{
                    background: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '3px 8px',
                    border: '1px solid rgba(251,191,36,0.35)',
                    display: 'flex', alignItems: 'center', gap: 4,
                    backdropFilter: 'blur(4px)',
                  }}>
                    <span style={{ fontSize: 14 }}>✨</span>
                    <span style={{
                      fontSize: 11, fontFamily: 'Fredoka', fontWeight: 600,
                      color: '#fbbf24', letterSpacing: 1,
                    }}>
                      TRACKON GOLD
                    </span>
                  </div>
                </div>

                {/* Bot status pulse */}
                {isPlaying && (
                  <div style={{
                    position: 'absolute', bottom: 32, right: 8,
                    background: botPulse ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.08)',
                    border: `1px solid rgba(34,197,94,${botPulse ? '0.7' : '0.25'})`,
                    borderRadius: 6, padding: '3px 6px',
                    transition: 'all 0.4s ease',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <div style={{
                      fontSize: 11, fontFamily: 'Fredoka', color: '#4ade80', letterSpacing: 0.5,
                    }}>
                      {botPulse ? '✓ APPLYING' : '✓ OPTIMAL'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── BOTTOM HALF – PLAYER ── */}
            {phase !== 'story' && (
              <div
                style={{
                  flex: 1, position: 'relative', overflow: 'hidden',
                  cursor: phase === 'growing' ? 'crosshair' : 'default',
                }}
                onPointerDown={handlePlayerTap}
              >
                <SkyBackground fast={ff} side="player" />

                {/* Rain */}
                {showRain && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={i} style={{
                        position: 'absolute', left: `${5 + i * 7}%`, top: 0,
                        width: 1.5, height: 10, background: 'rgba(147,197,253,0.55)',
                        borderRadius: 2,
                        animationName: 'rainDrop',
                        animationDuration: `${0.4 + (i % 3) * 0.12}s`,
                        animationDelay: `${(i * 0.05) % 0.35}s`,
                        animationTimingFunction: 'linear', animationIterationCount: 'infinite',
                      }} />
                    ))}
                  </div>
                )}

                {/* Ground */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 18,
                    background: phase === 'tutorial' ? '#3d2b1e' : '#3a2e18',
                    transition: 'background 2s ease',
                    borderTop: '1px solid rgba(249,115,22,0.1)',
                  }}>
                    {/* Ground texture tiles */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      display: 'flex', height: 10, opacity: 0.4,
                    }}>
                      {Array.from({ length: 50 }).map((_, i) => (
                        <img key={i} src={TILE_ASSETS.ground} alt=""
                          style={{ width: 16, height: 10, imageRendering: 'pixelated' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Player crops */}
                <div style={{
                  position: 'absolute', bottom: 18, left: 0, right: 0,
                  display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
                  padding: '0 8px',
                }}>
                  {Array.from({ length: CROP_COUNT }).map((_, i) => (
                    <PlayerCrop key={i} phase={phase} health={playerHealth[i]} index={i} taps={cropTaps[i]} />
                  ))}
                </div>

                {/* Spray effects */}
                {sprays.map(s => <SprayEffect key={s.id} {...s} />)}

                {/* Player HUD */}
                <div style={{
                  position: 'absolute', top: 6, left: 8, right: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10,
                }}>
                  <HUDLabel label="PAPPU · YOU" side="player" />
                  {phase === 'growing' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '3px 8px',
                        border: `1px solid ${PRODUCTS[selectedProduct].color}44`,
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        <span style={{ fontSize: 14 }}>{PRODUCTS[selectedProduct].icon}</span>
                        <span style={{
                          fontSize: 11, fontFamily: 'Fredoka',
                          color: PRODUCTS[selectedProduct].color,
                        }}>
                          {PRODUCTS[selectedProduct].name.slice(0, 12)}
                        </span>
                      </div>
                      {PRODUCTS[selectedProduct].name === 'Trackon Gold' && (
                        <div style={{
                          fontSize: 10, color: '#fbbf24', fontFamily: 'Fredoka', background: 'rgba(0,0,0,0.6)',
                          padding: '2px 4px', borderRadius: 4, border: '1px solid rgba(251,191,36,0.3)',
                          animation: 'fadeInUp 0.3s ease both', textShadow: '0 1px 2px #000',
                        }}>
                          TIP: 3 SPRAYS PER CROP
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tap prompt */}
                {phase === 'growing' && tapCount === 0 && (
                  <div style={{
                    position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
                    textAlign: 'center', pointerEvents: 'none',
                    animation: 'fadeInUp 0.5s ease both',
                  }}>
                    <div style={{
                      fontSize: 26,
                      animation: 'trophyBounce 0.8s ease-in-out infinite',
                    }}>
                      👇
                    </div>
                    <div style={{
                      fontSize: 12, color: '#64748b', fontFamily: 'Fredoka',
                      letterSpacing: 1.5, marginTop: 4,
                    }}>
                      TAP TO APPLY
                    </div>
                  </div>
                )}

                {/* Tap counter */}
                {tapCount > 0 && phase === 'growing' && (
                  <div style={{
                    position: 'absolute', bottom: 32, left: 8,
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6, padding: '3px 6px',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <span style={{
                      fontSize: 11, fontFamily: 'Fredoka', color: '#475569',
                    }}>
                      APPS: {tapCount}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Center VS divider or Harvest Button */}
            {phase !== 'story' && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 15,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                {phase === 'growing' && cropTaps.every(t => t >= 3) ? (
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      position: 'absolute', top: -35,
                      background: '#eab308', padding: '4px 10px', borderRadius: 8,
                      fontSize: 12, fontFamily: 'Fredoka', fontWeight: 800, color: '#ffffff',
                      whiteSpace: 'nowrap', animation: 'farmerBounce 1s infinite',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    }}>
                      READY TO HARVEST!
                      <div style={{
                        position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                        width: 8, height: 8, background: '#eab308'
                      }} />
                    </div>
                    <button onClick={triggerFastForward} style={{
                      background: 'linear-gradient(90deg, #15803d, #22c55e)',
                      border: 'none', borderRadius: 24, padding: '8px 24px',
                      cursor: 'pointer', boxShadow: '0 6px 20px rgba(34,197,94,0.4)',
                      display: 'flex', alignItems: 'center', gap: 8,
                      animation: 'pulseButton 1.5s infinite',
                    }}>
                      <span style={{ fontSize: 16 }}>🌾</span>
                      <span style={{ fontSize: 16, fontFamily: 'Fredoka', fontWeight: 800, color: '#ffffff', letterSpacing: 1 }}>
                        HARVEST
                      </span>
                    </button>
                  </div>
                ) : (
                  <div style={{
                    background: '#ffffff', border: 'none',
                    borderRadius: 20, padding: '4px 14px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  }}>
                    <span style={{
                      fontSize: 16, fontFamily: 'Fredoka', fontWeight: 900,
                      color: '#334155', letterSpacing: 3,
                    }}>
                      VS
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Fast forward overlay */}
            {ffVisible && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 30,
                background: 'rgba(0,0,0,0.82)',
                border: '1px solid rgba(251,191,36,0.5)',
                borderRadius: 12, padding: '8px 16px',
                animationName: 'fastForwardPulse',
                animationDuration: '0.35s', animationIterationCount: 'infinite',
                backdropFilter: 'blur(6px)',
              }}>
                <div style={{
                  fontSize: 18, fontFamily: 'Fredoka', fontWeight: 900,
                  color: '#fbbf24', letterSpacing: 2,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  ⏩ ×120
                </div>
                <div style={{
                  fontSize: 12, color: '#64748b', fontFamily: 'Nunito',
                  textAlign: 'center', marginTop: 2, letterSpacing: 1.5,
                }}>
                  FAST FORWARD
                </div>
              </div>
            )}

            {/* Tutorial overlay */}
            {phase === 'tutorial' && !hint && (
              <FarmerTutorial
                step={tutorialStep}
                total={TUTORIAL_STEPS.length}
                onNext={handleTutorialNext}
                onSkip={startGame}
              />
            )}

            {/* Hint overlay */}
            {hint && (
              <FarmerTutorial
                step={0} total={1}
                onNext={() => setHint(null)}
                onSkip={() => setHint(null)}
                hint={hint}
              />
            )}

            {/* Scoreboard */}
            <Scoreboard visible={phase === 'scoreboard'} playerHealth={playerHealth} trackonUsed={trackonUsed} otherUsed={otherUsed} />
          </div>
        </div>

        {/* Product tray */}
        {phase === 'growing' && (
          <div style={{
            width: '100%',
            background: 'rgba(255,255,255,0.95)',
            borderTop: '1px solid rgba(74,222,128,0.18)',
            padding: '16px 0',
            backdropFilter: 'blur(10px)',
            animation: 'fadeInUp 0.4s ease both',
            zIndex: 20,
          }}>
            <div style={{
              fontSize: 12, fontFamily: 'Fredoka', color: '#64748b',
              letterSpacing: 2, textAlign: 'center', marginBottom: 12,
            }}>
              SELECT PRODUCT · TAP FARM TO APPLY
            </div>
            
            {/* Snapchat style filter selector */}
            <div style={{ 
              display: 'flex', 
              gap: 16, 
              overflowX: 'auto', 
              padding: '10px 0',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              alignItems: 'center',
            }}>
              {/* Spacers to allow centering of first/last items */}
              <div style={{ flex: '0 0 auto', width: 'calc(50% - 40px)' }} />
              {PRODUCTS.map((p, i) => (
                <button key={i} onClick={() => setSelectedProduct(i)} style={{
                  flex: '0 0 auto',
                  scrollSnapAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  width: selectedProduct === i ? 64 : 52, 
                  height: selectedProduct === i ? 64 : 52,
                  borderRadius: '50%',
                  background: selectedProduct === i ? `${p.color}25` : 'rgba(0,0,0,0.03)',
                  border: `2px solid ${selectedProduct === i ? p.color : 'rgba(0,0,0,0.1)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  position: 'relative',
                }}>
                  <span style={{ fontSize: selectedProduct === i ? 28 : 22, transition: 'all 0.3s' }}>{p.icon}</span>
                </button>
              ))}
              <div style={{ flex: '0 0 auto', width: 'calc(50% - 40px)' }} />
            </div>
            
            {/* Selected Product Name */}
            <div style={{
              textAlign: 'center', 
              marginTop: 4,
              minHeight: 18,
            }}>
              <span style={{
                fontSize: 18,
                fontFamily: 'Fredoka',
                fontWeight: 700,
                color: PRODUCTS[selectedProduct].color,
                letterSpacing: 1,
                animation: 'fadeIn 0.3s ease',
              }}>
                {PRODUCTS[selectedProduct].name.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Phase progress dots */}
        {phase !== 'story' && phase !== 'tutorial' && phase !== 'scoreboard' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
            {(['planting', 'growing', 'fastforward', 'harvest'] as Phase[]).map((p) => {
              const order = ['planting', 'growing', 'fastforward', 'harvest']
              const current = order.indexOf(phase)
              const thisIdx = order.indexOf(p)
              return (
                <div key={p} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: thisIdx === current
                      ? 'linear-gradient(135deg, #22c55e, #4ade80)'
                      : thisIdx < current
                        ? 'rgba(34,197,94,0.4)'
                        : 'rgba(255,255,255,0.1)',
                    boxShadow: thisIdx === current ? '0 0 10px #22c55e' : 'none',
                    transition: 'all 0.3s ease',
                  }} />
                  <span style={{
                    fontSize: 10, fontFamily: 'Fredoka',
                    color: thisIdx === current ? 'rgba(74,222,128,0.7)' : 'rgba(255,255,255,0.3)',
                    letterSpacing: 0.5,
                  }}>
                    {p.slice(0, 4).toUpperCase()}
                  </span>
                </div>
              )
            })}
          </div>
        )}


      </div>
    </div>
  )
}
