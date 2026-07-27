(() => {
  const visual = document.querySelector('[data-work-visual]');
  const steps = [...document.querySelectorAll('[data-work-step]')];

  if (!visual || !steps.length) return;

  const index = visual.querySelector('[data-work-index]');
  const label = visual.querySelector('[data-work-label]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let transitionTimer = 0;
  let transitionId = 0;
  let hoveredStep = null;
  let requestedStep = null;
  let framePending = false;
  let hasEntered = false;

  const commitStep = (step, id) => {
    if (id !== transitionId || step !== requestedStep) return;

    const stage = step.dataset.workStep || '1';
    visual.dataset.stage = stage;
    visual.classList.remove('is-changing');

    if (index) index.textContent = stage.padStart(2, '0');
    if (label) label.textContent = step.dataset.workLabel || '';
  };

  const requestStep = (step, { immediate = false } = {}) => {
    if (!step) return;

    const stage = step.dataset.workStep || '1';
    const alreadySettled =
      requestedStep === step &&
      visual.dataset.stage === stage &&
      !visual.classList.contains('is-changing');

    requestedStep = step;
    steps.forEach(item => item.classList.toggle('is-active', item === step));

    if (alreadySettled) return;

    window.clearTimeout(transitionTimer);
    const id = ++transitionId;

    if (immediate || reduceMotion || visual.dataset.stage === '0') {
      commitStep(step, id);
      return;
    }

    visual.classList.add('is-changing');
    visual.dataset.stage = '0';
    transitionTimer = window.setTimeout(() => commitStep(step, id), 180);
  };

  const closestStepToReadingLine = () => {
    const isMobileStory = window.matchMedia('(max-width: 959px)').matches;
    const visualRect = visual.parentElement.getBoundingClientRect();
    const readingLine = isMobileStory
      ? Math.min(window.innerHeight * .75, visualRect.bottom + 72)
      : window.innerHeight * .5;

    return steps.reduce((closest, step) => {
      const rect = step.getBoundingClientRect();
      const containsLine = rect.top <= readingLine && rect.bottom >= readingLine;
      const distance = containsLine
        ? 0
        : Math.min(Math.abs(rect.top - readingLine), Math.abs(rect.bottom - readingLine));

      return !closest || distance < closest.distance ? { step, distance } : closest;
    }, null)?.step;
  };

  const syncToScroll = () => {
    framePending = false;
    if (hasEntered && !hoveredStep) requestStep(closestStepToReadingLine());
  };

  const scheduleScrollSync = () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(syncToScroll);
  };

  steps.forEach(step => {
    step.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      hasEntered = true;
      hoveredStep = step;
      requestStep(step);
    });

    step.addEventListener('pointerleave', event => {
      if (event.pointerType === 'touch' || hoveredStep !== step) return;
      hoveredStep = null;
      scheduleScrollSync();
    });
  });

  window.addEventListener('scroll', scheduleScrollSync, { passive: true });
  window.addEventListener('resize', scheduleScrollSync);

  const entranceObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;

    hasEntered = true;
    requestStep(closestStepToReadingLine() || steps[0]);
    entranceObserver.disconnect();
  }, {
    rootMargin: '0px 0px -12% 0px',
    threshold: .3
  });

  entranceObserver.observe(visual);
})();
