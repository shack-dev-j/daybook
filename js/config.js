/* Daybook config: the fixed vocabulary of the app.
   Every list of choices lives here, so adding a subject or changing the grade bands
   is a one-place edit. See AGENTS.md, "Adding a subject". */
(function (root) {
  'use strict';
  const D = (root.Daybook = root.Daybook || {});

  D.config = {
    /* Written into exports and the data file, so a later version can migrate old data. */
    VERSION: 1,

    /* localStorage keys. `items` is the one that matters; the rest are conveniences. */
    KEYS: {
      items: 'daybook.items',
      backup: 'daybook.items.backup',
      prefs: 'daybook.ui',
      meta: 'daybook.meta'
    },

    /* `id` is stored on items and is also the CSS suffix: dot--cs, fill--cs, ch-cs. */
    SUBJECTS: [
      { id: 'cs', name: 'Computer Science', short: 'CS' },
      { id: 'physics', name: 'Physics', short: 'Physics' },
      { id: 'maths', name: 'Mathematics', short: 'Maths' },
      { id: 'cyber', name: 'Cybersecurity', short: 'Cyber' },
      { id: 'other', name: 'Other', short: 'Other' }
    ],

    /* `tag` is the CSS suffix: tag--hw, ev--hw, wk--hw. `rank` orders the Due today list. */
    TYPES: [
      { id: 'homework', name: 'Homework', plural: 'homework', icon: 'book-open', tag: 'hw', rank: 1 },
      { id: 'assignment', name: 'Assignment', plural: 'assignments', icon: 'file-text', tag: 'assign', rank: 0 },
      { id: 'project', name: 'Project', plural: 'projects', icon: 'square-kanban', tag: 'project', rank: 2 }
    ],

    /* Homework and assignments move through these three. */
    STATUSES: [
      { id: 'todo', name: 'To do', icon: 'circle', tag: 'todo' },
      { id: 'progress', name: 'In progress', icon: 'circle-dot', tag: 'progress' },
      { id: 'done', name: 'Done', icon: 'check', tag: 'done' }
    ],

    /* Projects move across the board through these four. */
    PROJECT_STATUSES: [
      { id: 'idea', name: 'Idea', icon: 'circle', tag: 'todo' },
      { id: 'building', name: 'Building', icon: 'circle-dot', tag: 'progress' },
      { id: 'testing', name: 'Testing', icon: 'circle-dot', tag: 'progress' },
      { id: 'done', name: 'Done', icon: 'check', tag: 'done' }
    ],

    PRIORITIES: [
      { id: 'low', name: 'Low', icon: 'signal-low', rank: 2 },
      { id: 'med', name: 'Med', icon: 'signal-medium', rank: 1 },
      { id: 'high', name: 'High', icon: 'signal-high', rank: 0 }
    ],

    /* A rough letter from a percentage: [minimum %, letter], highest first.
       These are the Cambridge percentage-uniform-mark bands for AS Level (a to e).
       A raw mark is not a uniform mark, so treat the letter as a guide only. */
    GRADE_BANDS: [[80, 'A'], [70, 'B'], [60, 'C'], [50, 'D'], [40, 'E'], [0, 'U']],

    /* Limits applied whenever data is loaded or imported, so one bad file cannot break the app. */
    LIMITS: { items: 5000, title: 200, notes: 5000, step: 300, steps: 100, links: 30, url: 2000, label: 200 }
  };
})(typeof window !== 'undefined' ? window : globalThis);
