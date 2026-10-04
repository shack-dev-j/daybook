(function (root) {
  'use strict';
  const D = root.Daybook;

  function render(container, items, state) {
    const today = D.dates.today();
    const statsStarts = D.model.weekStarts(today, 8);
    const weekly = D.model.weekly(items, statsStarts);
    const workload = D.model.workload(items);
    
    // basic empty implementation or naive template logic, but since it's just a chart I can build strings.
    
    // Tiles
    const currentWeek = weekly[weekly.length - 1];
    const prevWeek = weekly[weekly.length - 2] || { completed: 0 };
    
    let totalRated = 0, totalOnTime = 0;
    weekly.forEach(w => { totalRated += w.rated; totalOnTime += w.onTime; });
    const overallRate = totalRated ? Math.round((totalOnTime / totalRated) * 100) : 0;
    
    const openItems = items.filter(i => !D.model.isDone(i));
    let oh = 0, oa = 0, op = 0;
    openItems.forEach(i => {
      if (i.type === 'homework') oh++;
      else if (i.type === 'assignment') oa++;
      else op++;
    });

    const counts = D.model.counts(items, today);
    const oldestLate = D.model.oldestLate(items, today);
    
    let html = `
      <div class="toolbar">
        <div class="seg" role="group" aria-label="View">
          <button class="seg__opt" aria-pressed="true">Charts</button>
        </div>
      </div>
      <div class="tiles">
        <div class="tile"><span class="tile__label">Completed this week</span><span class="tile__value">${currentWeek.completed}</span><span class="tile__delta num">${prevWeek.completed} last week</span></div>
        <div class="tile"><span class="tile__label">On-time rate</span><span class="tile__value">${overallRate}%</span><span class="tile__delta num">${totalOnTime} of ${totalRated} tasks</span></div>
        <div class="tile"><span class="tile__label">Open items</span><span class="tile__value">${openItems.length}</span><span class="tile__delta num">${oh} homework &middot; ${oa} assignments &middot; ${op} projects</span></div>
        <div class="tile"><span class="tile__label">Overdue</span><span class="tile__value">${counts.overdue}</span><span class="tile__delta num">${oldestLate ? `<span style="color:var(--overdue);display:inline-flex">${D.icon('triangle-alert')}</span>Oldest is ${oldestLate} days late` : 'All caught up'}</span></div>
      </div>
    `;

    // Charts - using fixed geometry and scale logic
    // Max completions
    const maxComp = Math.max(...weekly.map(w => w.completed), 1);
    // Y pixel = 168 - (val / max) * (168 - 14) -> range 154
    const scaleY = (val, max) => 168 - (val / max) * 154;

    let barLines = '';
    const yMaxStr = scaleY(maxComp, maxComp);
    
    let barsHtml = weekly.map((w, i) => {
      const x = 50 + i * (640 - 50) / 8; // approx
      const h = scaleY(w.completed, maxComp);
      const isNow = i === weekly.length - 1;
      const t = D.dates.dayMonth(w.start);
      return `<path class="ch-bar ${isNow ? 'ch-bar--now' : ''}" d="M${x} 168.0V${h}a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4V168.0z"><title>Week of ${t}: ${w.completed} completed, ${w.onTime} on time</title></path>
              <text x="${x + 12}" y="184" text-anchor="middle">${t}</text>
              ${w.completed === maxComp || isNow ? `<text class="ch-val" x="${x + 12}" y="${h - 6}" text-anchor="middle">${w.completed}</text>` : ''}`;
    }).join('');

    let barChart = `
      <figure class="chart"><figcaption class="chart__head"><span class="chart__title">Tasks completed per week</span><span class="chart__sub">Last 8 weeks</span></figcaption>
        <svg viewBox="0 0 640 190">
          <line class="ch-grid" x1="24" x2="632" y1="${yMaxStr}" y2="${yMaxStr}"/><text x="18" y="${yMaxStr + 4}" text-anchor="end">${maxComp}</text>
          <line class="ch-base" x1="24" x2="632" y1="168.0" y2="168.0"/><text x="18" y="172.0" text-anchor="end">0</text>
          ${barsHtml}
        </svg>
      </figure>
    `;

    html += `<div class="charts">${barChart}</div>`;

    container.innerHTML = html;
  }

  D.screens = D.screens || {};
  D.screens.stats = { render };
})(window);
