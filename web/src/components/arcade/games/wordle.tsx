'use client';

import { useEffect, useRef, useState } from 'react';
import { useHighScore } from '@/components/arcade/use-high-score';

const WORDS = [
  'ABOUT', 'ABOVE', 'ACTOR', 'ADAPT', 'ADMIN', 'AFTER', 'AGAIN', 'AGENT', 'AGREE', 'AHEAD',
  'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIVE', 'ALLOW', 'ALONE', 'ALONG', 'ALPHA',
  'ALTER', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA', 'ARGUE',
  'ARISE', 'ARMOR', 'ARRAY', 'ARROW', 'ASIDE', 'ASSET', 'AUDIO', 'AUDIT', 'AVOID', 'AWAKE',
  'AWARD', 'AWARE', 'BADGE', 'BAKER', 'BASIC', 'BASIS', 'BEACH', 'BEARD', 'BEAST', 'BEGIN',
  'BEING', 'BELOW', 'BENCH', 'BIRTH', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLAZE',
  'BLEND', 'BLESS', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST', 'BOOTH', 'BOUND', 'BRAIN',
  'BRAND', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING', 'BRISK',
  'BROAD', 'BROKE', 'BROOK', 'BUILD', 'BUILT', 'BUNCH', 'BURST', 'CABLE', 'CACHE', 'CADET',
  'CAMEL', 'CANAL', 'CANDY', 'CANOE', 'CARGO', 'CAROL', 'CARRY', 'CATCH', 'CAUSE', 'CEASE',
  'CEDAR', 'CHAIN', 'CHAIR', 'CHAOS', 'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST',
  'CHIEF', 'CHILD', 'CHILL', 'CHIME', 'CHOIR', 'CHORD', 'CHUNK', 'CIVIC', 'CIVIL', 'CLAIM',
  'CLAMP', 'CLASS', 'CLEAN', 'CLEAR', 'CLERK', 'CLICK', 'CLIFF', 'CLIMB', 'CLOCK', 'CLOSE',
  'CLOTH', 'CLOUD', 'CLOWN', 'COACH', 'COAST', 'COBRA', 'COLOR', 'COMET', 'COMIC', 'CORAL',
  'COUCH', 'COUGH', 'COUNT', 'COVER', 'CRACK', 'CRAFT', 'CRANE', 'CRASH', 'CRATE', 'CRAWL',
  'CRAZY', 'CREST', 'CRISP', 'CROSS', 'CROWD', 'CROWN', 'CRUDE', 'CRUSH', 'CRYPT', 'CURVE',
  'CYCLE', 'DAILY', 'DAIRY', 'DAISY', 'DANCE', 'DECAY', 'DECOR', 'DELAY', 'DELTA', 'DENSE',
  'DEPOT', 'DEPTH', 'DERBY', 'DESIGN', 'DIARY', 'DIGIT', 'DINER', 'DIRTY', 'DISCO', 'DITCH',
  'DIVER', 'DIZZY', 'DODGE', 'DOING', 'DONOR', 'DOUBT', 'DOZEN', 'DRAFT', 'DRAIN', 'DRAMA',
  'DRANK', 'DRAWN', 'DREAM', 'DRESS', 'DRILL', 'DRINK', 'DRIVE', 'DRONE', 'DROVE', 'DRUNK',
  'EAGER', 'EAGLE', 'EARLY', 'EARTH', 'EASEL', 'EBONY', 'EDICT', 'EDIFY', 'EIGHT', 'EJECT',
  'ELBOW', 'ELDER', 'ELECT', 'ELITE', 'EMPTY', 'ENACT', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY',
  'ENVOY', 'EQUAL', 'ERASE', 'ERROR', 'ERUPT', 'ESSAY', 'ETHIC', 'EVENT', 'EVERY', 'EVICT',
  'EVOKE', 'EXACT', 'EXALT', 'EXCEL', 'EXERT', 'EXILE', 'EXIST', 'EXTRA', 'FABLE', 'FACET',
  'FAINT', 'FAIRY', 'FAITH', 'FALSE', 'FANCY', 'FATAL', 'FAULT', 'FAVOR', 'FEAST', 'FENCE',
  'FERAL', 'FERRY', 'FETCH', 'FEVER', 'FIBER', 'FIELD', 'FIERY', 'FIFTH', 'FIFTY', 'FIGHT',
  'FINAL', 'FIRST', 'FIXED', 'FLAME', 'FLASH', 'FLEET', 'FLESH', 'FLICK', 'FLING', 'FLINT',
  'FLOAT', 'FLOCK', 'FLOOD', 'FLOOR', 'FLOUR', 'FLUID', 'FLUSH', 'FOCAL', 'FOCUS', 'FORCE',
  'FORGE', 'FORUM', 'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH', 'FRONT', 'FROST', 'FRUIT',
  'FULLY', 'FUNNY', 'GAUGE', 'GEAR', 'GHOST', 'GIANT', 'GIVEN', 'GLASS', 'GLAZE', 'GLOBE',
  'GLORY', 'GLOSS', 'GLOVE', 'GOING', 'GRACE', 'GRADE', 'GRAIN', 'GRAND', 'GRAPH', 'GRASP',
  'GRASS', 'GRAVE', 'GREAT', 'GREED', 'GREEN', 'GREET', 'GRIEF', 'GRIND', 'GROUP', 'GROVE',
  'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'GUILD', 'HABIT', 'HAPPY', 'HARSH', 'HASTE',
  'HATCH', 'HAUNT', 'HAVEN', 'HEADY', 'HEART', 'HEAVY', 'HELIX', 'HELLO', 'HENGE', 'HERO',
  'HIDDEN', 'HINGE', 'HONOR', 'HORSE', 'HOTEL', 'HOUSE', 'HOVER', 'HUMAN', 'HUMOR', 'HUNGRY',
  'HUNTER', 'HURRY', 'ICING', 'IDEAL', 'IMAGE', 'IMPLY', 'INDEX', 'INNER', 'INPUT', 'IRONY',
  'ISSUE', 'IVORY', 'JELLY', 'JEWEL', 'JOINT', 'JOKER', 'JUDGE', 'JUICE', 'JUICY', 'JUMBO',
  'JUNIOR', 'KAYAK', 'KEEN', 'KELP', 'KNACK', 'KNIFE', 'KNOCK', 'KNOWN', 'LABEL', 'LADDER',
  'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEADER', 'LEAFY', 'LEARN', 'LEASE', 'LEAST',
  'LEAVE', 'LEGAL', 'LEMON', 'LEVEL', 'LEVER', 'LIGHT', 'LIMIT', 'LINEN', 'LIPID', 'LIVER',
  'LIVID', 'LLAMA', 'LOBBY', 'LOCAL', 'LOGIC', 'LOOSE', 'LOTUS', 'LOVER', 'LOWER', 'LOYAL',
  'LUCKY', 'LUNAR', 'LUNCH', 'LYRIC', 'MAGIC', 'MAGMA', 'MAJOR', 'MAKER', 'MANGO', 'MANOR',
  'MAPLE', 'MARCH', 'MARIO', 'MARKET', 'MARSH', 'MASON', 'MATCH', 'MAYOR', 'MEADOW', 'MEDAL',
  'MEDIA', 'MEDIC', 'MELON', 'MERCY', 'MERGE', 'MERIT', 'MERRY', 'METAL', 'METRO', 'MICRO',
  'MIDST', 'MIGHT', 'MIMIC', 'MINOR', 'MINUS', 'MIRTH', 'MIXER', 'MODEL', 'MODEM', 'MONEY',
  'MONTH', 'MORAL', 'MOTOR', 'MOTTO', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NAIVE',
  'NAKED', 'NAMED', 'NANNY', 'NAPPY', 'NARROW', 'NASTY', 'NAVAL', 'NEEDY', 'NEIGH', 'NERVE',
  'NEVER', 'NEWLY', 'NIGHT', 'NINJA', 'NITRO', 'NOBLE', 'NOISE', 'NORTH', 'NOTCH', 'NOVEL',
  'NURSE', 'NYLON', 'OASIS', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'OLIVE', 'ONION', 'OPERA',
  'ORBIT', 'ORDER', 'ORGAN', 'OTHER', 'OTTER', 'OUTER', 'OWNED', 'OWNER', 'OXIDE', 'OZONE',
  'PADDLE', 'PAINT', 'PANEL', 'PANIC', 'PAPER', 'PARKS', 'PARTY', 'PASTA', 'PASTE', 'PATCH',
  'PATIO', 'PAUSE', 'PEACE', 'PEACH', 'PEARL', 'PEDAL', 'PENNY', 'PERCH', 'PERIL', 'PESTO',
  'PETAL', 'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PINCH', 'PINK', 'PIVOT',
  'PIXEL', 'PIZZA', 'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'PLAZA', 'PLEAD', 'PLUCK',
  'PLUMP', 'PLUSH', 'POINT', 'POLAR', 'POLLY', 'PONTOON', 'POPPY', 'PORCH', 'PORTAL', 'POSER',
  'POUCH', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRISM',
  'PRIZE', 'PROBE', 'PROOF', 'PROSE', 'PROUD', 'PROVE', 'PULSE', 'PUMPKIN', 'PUNCH', 'PUPIL',
  'PUPPY', 'PURSE', 'PUSH', 'PUZZLE', 'PYTHON', 'QUEEN', 'QUEST', 'QUICK', 'QUIET', 'QUILT',
  'QUITE', 'QUOTA', 'QUOTE', 'RADAR', 'RADIO', 'RAINY', 'RAISE', 'RALLY', 'RANCH', 'RANGE',
  'RAPID', 'RATIO', 'RAVEN', 'REACH', 'REACT', 'READY', 'REALM', 'REBEL', 'REEDY', 'REFER',
  'REIGN', 'RELAX', 'RELAY', 'RELIC', 'REMOTE', 'RENEW', 'REPAY', 'REPLY', 'RIDGE', 'RIFLE',
  'RIGHT', 'RIGID', 'RINSE', 'RISKY', 'RIVAL', 'RIVER', 'ROBIN', 'ROBOT', 'ROCKY', 'ROGER',
  'ROGUE', 'ROUND', 'ROUTE', 'ROVER', 'ROYAL', 'RUGBY', 'RULER', 'RUMOR', 'RURAL', 'SADDLE',
  'SAINT', 'SALAD', 'SALON', 'SALSA', 'SALTY', 'SANDY', 'SATIN', 'SAUCE', 'SCALE', 'SCARF',
  'SCENE', 'SCENT', 'SCOPE', 'SCORE', 'SCORN', 'SCOUT', 'SCRAP', 'SCREW', 'SEAWEED', 'SEEDY',
  'SENSE', 'SERVE', 'SETUP', 'SEVEN', 'SHADE', 'SHAFT', 'SHAKE', 'SHALL', 'SHAME', 'SHAPE',
  'SHARE', 'SHARK', 'SHARP', 'SHAWL', 'SHEEP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE',
  'SHINY', 'SHIRT', 'SHOCK', 'SHORE', 'SHORT', 'SHOUT', 'SHOVE', 'SHRUB', 'SIGHT', 'SILKY',
  'SILLY', 'SINCE', 'SIREN', 'SIXTH', 'SIZED', 'SKATE', 'SKETCH', 'SKILL', 'SKIRT', 'SKULL',
  'SLATE', 'SLEEP', 'SLEET', 'SLICE', 'SLIDE', 'SLING', 'SLOPE', 'SMALL', 'SMART', 'SMILE',
  'SMOKE', 'SNACK', 'SNAKE', 'SNEAK', 'SNOWY', 'SOBER', 'SOLAR', 'SOLID', 'SOLVE', 'SONAR',
  'SONIC', 'SOUND', 'SOUTH', 'SPACE', 'SPADE', 'SPARE', 'SPARK', 'SPEAK', 'SPEED', 'SPELL',
  'SPEND', 'SPICE', 'SPICY', 'SPIKE', 'SPINE', 'SPLIT', 'SPOKE', 'SPORT', 'SPRAY', 'SQUAD',
  'SQUARE', 'STAFF', 'STAGE', 'STAIN', 'STAIR', 'STAKE', 'STALE', 'STAMP', 'STAND', 'STARE',
  'START', 'STATE', 'STAY', 'STEADY', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STEM', 'STERN',
  'STICK', 'STILL', 'STING', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STOVE',
  'STRAW', 'STREAM', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUNNY',
  'SUPER', 'SURGE', 'SWAMP', 'SWARM', 'SWEAT', 'SWEEP', 'SWEET', 'SWIFT', 'SWING', 'SWORD',
  'SYRUP', 'TABLE', 'TAKEN', 'TALENT', 'TANGER', 'TAPER', 'TARGET', 'TASTE', 'TASTY', 'TEACH',
  'TEAM', 'TEETH', 'TEMPO', 'TENET', 'TENT', 'TERRA', 'THANK', 'THEME', 'THICK', 'THIEF',
  'THING', 'THINK', 'THIRD', 'THORN', 'THOSE', 'THREE', 'THREW', 'THUMB', 'THUNDER', 'TICKET',
  'TIDAL', 'TIGER', 'TIGHT', 'TIMER', 'TINY', 'TITLE', 'TOAST', 'TODAY', 'TOKEN', 'TOOTH',
  'TOPIC', 'TORCH', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TOXIC', 'TRACE', 'TRACK', 'TRADE',
  'TRAIL', 'TRAIN', 'TRAIT', 'TRASH', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED',
  'TRIO', 'TROOP', 'TROUT', 'TRUCK', 'TRULY', 'TRUMP', 'TRUNK', 'TRUST', 'TRUTH', 'TULIP',
  'TUMOR', 'TUNER', 'TUTOR', 'TWICE', 'TWIN', 'TWIST', 'TYPIC', 'ULTRA', 'UNCLE', 'UNDER',
  'UNFIT', 'UNION', 'UNITE', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL',
  'UTILE', 'VAGUE', 'VALID', 'VALOR', 'VALUE', 'VAPOR', 'VAULT', 'VEILED', 'VENOM', 'VENT',
  'VENUE', 'VERB', 'VERSE', 'VERSO', 'VIDEO', 'VIGOR', 'VILLA', 'VINYL', 'VIOLA', 'VIRAL',
  'VIRUS', 'VISIT', 'VISTA', 'VITAL', 'VIVID', 'VOCAL', 'VODKA', 'VOICE', 'VOLUME', 'VOTER',
  'VOWEL', 'WAGER', 'WAGON', 'WAIST', 'WAKE', 'WALTZ', 'WARMTH', 'WATER', 'WEARY', 'WEAVE',
  'WEIRD', 'WHALE', 'WHEAT', 'WHEEL', 'WHILE', 'WHITE', 'WHOLE', 'WIDTH', 'WIELD', 'WINCH',
  'WINDY', 'WITCH', 'WOKEN', 'WOMAN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD',
  'WOUND', 'WRATH', 'WRECK', 'WRITE', 'WRONG', 'XENON', 'YACHT', 'YEAST', 'YIELD', 'YOUNG',
  'YOUTH', 'ZEBRA', 'ZESTY', 'ZIGZAG', 'ZIPPER', 'ZONAL', 'ZOOM',
];

function hashWord(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return WORDS[h % WORDS.length];
}

type CellState = '' | 'correct' | 'present' | 'absent';

export default function Wordle() {
  const [mode, setMode] = useState<'daily' | 'free'>('daily');
  const [answer, setAnswer] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState<'play' | 'win' | 'lose'>('play');
  const [shake, setShake] = useState(false);
  const [streak, setStreak] = useState(0);
  const { best, submit } = useHighScore('wordle');
  const statusRef = useRef(status);
  statusRef.current = status;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const newGame = () => {
    const m = modeRef.current;
    const word = m === 'daily' ? hashWord(new Date().toISOString().slice(0, 10)) : WORDS[Math.floor(Math.random() * WORDS.length)];
    setAnswer(word);
    setGuesses([]);
    setCurrent('');
    setStatus('play');
    setStreak(0);
  };

  useEffect(() => {
    newGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const evalGuess = (guess: string): CellState[] => {
    const result: CellState[] = Array(5).fill('absent');
    const letters = answer.split('');
    guess.split('').forEach((ch, i) => {
      if (ch === answer[i]) {
        result[i] = 'correct';
        letters[i] = '';
      }
    });
    guess.split('').forEach((ch, i) => {
      if (result[i] !== 'correct') {
        const idx = letters.indexOf(ch);
        if (idx >= 0) {
          result[i] = 'present';
          letters[idx] = '';
        }
      }
    });
    return result;
  };

  const submitGuess = () => {
    if (statusRef.current !== 'play' || current.length !== 5) return;
    const word = current.toUpperCase();
    if (!WORDS.includes(word)) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    const next = [...guesses, word];
    setGuesses(next);
    setCurrent('');
    if (word === answer) {
      setStatus('win');
      const s = streak + 1;
      setStreak(s);
      submit(s);
    } else if (next.length === 6) {
      setStatus('lose');
      submit(0);
    }
  };

  const keyStates = (): Record<string, CellState> => {
    const map: Record<string, CellState> = {};
    guesses.forEach((g) => {
      evalGuess(g).forEach((state, i) => {
        const ch = g[i];
        if (!map[ch] || state === 'correct' || (state === 'present' && map[ch] !== 'correct')) {
          map[ch] = state;
        }
      });
    });
    return map;
  };

  const handleKey = (key: string) => {
    if (statusRef.current !== 'play') return;
    if (key === 'ENTER') submitGuess();
    else if (key === 'BACK') setCurrent((c) => c.slice(0, -1));
    else if (/^[A-Z]$/.test(key) && current.length < 5) setCurrent((c) => c + key);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleKey('ENTER');
      else if (e.key === 'Backspace') handleKey('BACK');
      else handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, guesses, status, streak]);

  const rows = 6;
  const keyboardRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  const cellColor = (state: CellState) =>
    state === 'correct' ? 'bg-emerald-500/80 border-emerald-400' :
    state === 'present' ? 'bg-amber-500/80 border-amber-400' :
    state === 'absent' ? 'bg-white/5 border-border/40' : 'bg-card border-border/60';

  return (
    <div className="flex w-full max-w-[400px] flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between gap-2 text-sm">
        <div className="flex rounded-full border border-border/60 p-0.5">
          {(['daily', 'free'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); newGame(); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                mode === m ? 'bg-primary text-white' : 'text-muted-foreground'
              }`}
            >
              {m === 'daily' ? 'Daily' : 'Free'}
            </button>
          ))}
        </div>
        <span className="text-muted-foreground">
          Streak <b className="ml-1 text-yellow-400">{best}</b>
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {Array.from({ length: rows }).map((_, ri) => {
          const guess = guesses[ri];
          const filled = ri === guesses.length ? current : guess || '';
          const states = guess ? evalGuess(guess) : null;
          return (
            <div
              key={ri}
              className={`flex gap-1.5 ${ri === guesses.length && shake ? 'animate-shake' : ''}`}
              style={ri === guesses.length && shake ? { animation: 'shake 0.4s ease-in-out' } : undefined}
            >
              {Array.from({ length: 5 }).map((_, ci) => (
                <div
                  key={ci}
                  className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl font-black transition ${
                    states ? cellColor(states[ci]) : cellColor('')
                  }`}
                  style={{
                    animation: states?.[ci] === 'correct'
                      ? 'wordle-pop 0.4s ease'
                      : undefined,
                  }}
                >
                  {filled[ci] || ''}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1">
        {keyboardRows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {ri === 2 && (
              <button
                onClick={() => handleKey('ENTER')}
                className="h-10 rounded-md bg-card px-1.5 text-[10px] font-bold text-muted-foreground"
              >
                ENTER
              </button>
            )}
            {row.split('').map((ch) => {
              const ks = keyStates();
              const state = ks[ch];
              return (
                <button
                  key={ch}
                  onClick={() => handleKey(ch)}
                  className={`h-10 w-8 rounded-md text-sm font-bold transition ${
                    state === 'correct' ? 'bg-emerald-500/80 text-white' :
                    state === 'present' ? 'bg-amber-500/80 text-white' :
                    state === 'absent' ? 'bg-white/5 text-muted-foreground' :
                    'bg-card text-foreground'
                  }`}
                >
                  {ch}
                </button>
              );
            })}
            {ri === 2 && (
              <button
                onClick={() => handleKey('BACK')}
                className="h-10 rounded-md bg-card px-1.5 text-[10px] font-bold text-muted-foreground"
              >
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>

      {status !== 'play' && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4">
          <p className={`text-lg font-bold ${status === 'win' ? 'text-primary' : 'text-red-400'}`}>
            {status === 'win' ? `Solved in ${guesses.length}/6!` : 'Out of guesses'}
          </p>
          <p className="text-sm text-muted-foreground">The word was {answer}</p>
          <button
            onClick={newGame}
            className="rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white"
          >
            {mode === 'daily' ? 'New word' : 'New game'}
          </button>
        </div>
      )}
    </div>
  );
}