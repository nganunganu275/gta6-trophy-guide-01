// Vice Ledger — the roadmap to the platinum and the missables, built from the
// official descriptions and PowerPyx's three-step roadmap (difficulty 4/10,
// about 200 hours, one playthrough, no online trophies). Trophy ids refer to
// app/data/trophies.json. Every stage lists its trophies in roadmap order.

export const KIND_LABELS = {
  completion: 'Completion',
  story: 'Story',
  activities: 'Activities',
  side: 'Side missions',
  collectibles: 'Collectibles',
  misc: 'Misc',
  robberies: 'Robberies',
  exploration: 'Exploration',
  combat: 'Combat',
  money: 'Money',
};

export const KIND_ORDER = [
  'story',
  'side',
  'collectibles',
  'activities',
  'robberies',
  'combat',
  'exploration',
  'money',
  'misc',
  'completion',
];

export const ROADMAP = [
  {
    stage: 1,
    title: 'Play the story',
    hours: '60–80 hours',
    blurb:
      'Finish all five chapters and enjoy the game. The 100% checklist is not viewable until after the story, but any progress you make during it already counts — so scan new vehicles with the WAiNK app and study new animals with the binoculars as you travel. Do the optional missions as they appear: they introduce robberies, fishing, hunting and the other activities. There are no mission gold medals and no mission replay, so keep a save at the start and end of each chapter. One thing to do on purpose: the Chapter 1 meditation at Jason\u2019s house (see Missables).',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 28],
  },
  {
    stage: 2,
    title: 'The 100% checklist and the challenges',
    hours: 'About 100 hours',
    blurb:
      'After the story you are returned to the open world and the checklist unlocks under Progress > Stats > 100% Completion. It is forgiving — closer to 60% true completion: most side quests are not required, and of the required collectibles you typically need only 70–80% (any 200 of 277 base-model vehicles scanned, any 100 of 255 animals studied, any 70 of the 80 challenges). The only tasks that need everything are robberies, underwater discoveries, shooting ranges, drone races and Bret\u2019s quests. Nothing on the checklist is missable.',
    ids: [14, 15, 17, 18, 19, 30, 31, 32, 35, 40, 41, 42, 43, 52],
  },
  {
    stage: 3,
    title: 'Strangers & Freaks and cleanup',
    hours: 'About 10 hours',
    blurb:
      'Most trophies should already be yours after the checklist. What is usually left: the 8 Strangers & Freaks strands (they are not needed for 100%), the side-character final missions, and the miscellaneous trophies below. Every trophy-related quest giver is still around after the story, so sweep whatever is left — then the platinum pops.',
    ids: [16, 20, 21, 22, 23, 24, 25, 26, 27, 29, 33, 34, 36, 37, 38, 39, 44, 45, 46, 47, 48, 49, 50, 51, 53, 54, 55, 1],
  },
];

/** Flat roadmap order (stage 1, then 2, then 3) for the "Next up" planner. */
export function roadmapOrder() {
  return ROADMAP.flatMap((stage) => stage.ids);
}

/** Notes shown on the Missables view, each with its source named. */
export const MISSABLE_NOTES = [
  {
    title: 'No mission replay — keep chapter saves',
    body: 'There is still free-roam after the story, but missions cannot be replayed. PowerPyx recommends keeping a save at the start and end of each chapter (10 saves) and rotating the remaining 5 slots for free-roam cleanup.',
    source: 'PowerPyx — GTA 6 Trophy Guide & Roadmap',
  },
  {
    title: 'Cheats disable trophies and saving',
    body: 'Leave cheats off for a trophy run. PowerPyx and GTABase both report that using cheats disables trophies and saving the game.',
    source: 'PowerPyx — GTA 6 Trophy Guide & Roadmap',
  },
  {
    title: 'The Irredeemable profile is permanent',
    body: 'Your criminal profile only affects how police treat you, and every trophy can be earned with any profile — but the Irredeemable profile, earned through excessive violence, cannot be undone, and cops will be far more aggressive. Avoid it.',
    source: 'PowerPyx — GTA 6 Trophy Guide & Roadmap',
  },
];
