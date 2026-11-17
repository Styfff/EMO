// The single timeline (seconds). Picture, events, score and checks read this file.
// 120 BPM, 4/4: one beat = 0.5 s = one beat of the foliot; one bar = 2 s.
export const BPM = 120, BEAT = .5, BAR = 2;
export const DUR = 50;

export const T = {
  build: 6.0,        // first part lands on the drum's arbor
  lastLand: 15.0,    // the foliot lands, last
  wake: 15.6,        // the foliot starts to swing, silently
  run: 16.0,         // first tick
  breathe: 28.0,     // music drops out, ticks only
  open: 30.0,        // exploded view while running
  settle: 42.0,      // camera settles on the schematic's viewpoint
  resolve: 48.0,     // final chord
};

// every part: its assembly offset (where it waits before landing, and how far it lifts when the machine opens),
// its landing time during the build, and its lift time at T.open (top first, 0.18 s apart)
// z = arbor axis (front of the clock), y = up
export const PARTS = {
  drum:    { off: [0, 0, 70],    land: 6.0,  lift: 31.62 },
  wheelD:  { off: [0, 0, 32],    land: 7.0,  lift: 31.80 },
  plate:   { off: [0, 0, -80],   land: 7.5,  lift: 32.34 },
  pin1:    { off: [0, 0, -14],   land: 8.0,  lift: 31.98 },
  wheelE:  { off: [0, 0, -34],   land: 8.5,  lift: 32.16 },
  bridge:  { off: [0, 0, 112],   land: 9.0,  lift: 31.44 },
  dial:    { off: [0, 0, 150],   land: 9.5,  lift: 31.26 },
  hand:    { off: [0, 0, 186],   land: 10.0, lift: 31.08 },
  pin2:    { off: [0, 0, -56],   land: 11.0, lift: 32.52 },
  crown:   { off: [0, 28, 6],    land: 11.5, lift: 30.72 },
  cock:    { off: [0, -16, 0],   land: 12.5, lift: 30.90 },
  verge:   { off: [0, 52, 22],   land: 13.0, lift: 30.54 },
  potence: { off: [0, 74, 0],    land: 14.0, lift: 30.18 },
  foliot:  { off: [0, 94, 22],   land: 15.0, lift: 30.36 },
};
export const LANDDUR = 1.0, LIFTDUR = 1.6;

// the escapement: beat phase φ; a tick (drop of a tooth onto a pallet) at every φ = n + DROP
export const DROP = .35;
export const RATE = 2;                 // beats per second while running
export const RAMP = .4;                // the foliot spins up over 0.4 s before the first tick

// camera keys: [t, eye x,y,z, target x,y,z, fov]; interpolated monotone per component
export const CAM = [
  [0.0,  150, -204, 160,     19, -160, 28,   30],
  [2.5,  -40, -216, 220,     19, -158, 28,   30],
  [5.0, -150, -192, 175,     20, -112, 28,   31],
  [6.5, -300, -110, 250,     20,  -40, 60,   31],
  [8.5, -380,  -20, 330,     30,   10, 60,   31],
  [10.5,-400,   70, 360,     40,   50, 40,   31],
  [12.5,-330,  170, 330,     45,  120, 10,   31],
  [15.0,-240,  270, 330,     45,  165, 10,   31],
  [16.0,-225,  268, 315,     45,  163, 10,   31],
  [18.0, 170,  148,  92,     33,  158,  6,   30],
  [21.0, 150,  128,  30,     33,  138,  2,   30],
  [24.0, 215,   40,  70,     40,   40,-15,   30],
  [27.0,  60,   10, 330,      4,    6, 40,   30],
];
// the orbit while the machine opens: [t, azimuth°, elevation°, distance, target x,y,z, fov]
export const ORBIT = [
  [29.5,  -16, 11, 800,  40,  40, 40, 30],
  [33.0,  -50, 12, 860,  40, 115, 60, 30],
  [37.0, -120, 13, 880,  40, 125, 60, 30],
  [41.0, -200, 14, 880,  40, 125, 60, 30],
  [45.0, -290, 16, 860,  40, 125, 60, 30],
  [48.0, -325, 17, 840,  40, 122, 60, 30],
  [50.0, -332, 17, 828,  40, 122, 60, 30],
];
export const ORBIT_FROM = 29.5;
