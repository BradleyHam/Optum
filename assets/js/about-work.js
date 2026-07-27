(() => {
  const visual = document.querySelector('[data-work-visual]');
  const steps = [...document.querySelectorAll('[data-work-step]')];

  if (!visual || !steps.length) return;

  const index = visual.querySelector('[data-work-index]');
  const label = visual.querySelector('[data-work-label]');
  const mobileCopy = visual.parentElement.querySelector('.work-mobile-copy');
  const mobileIndex = mobileCopy?.querySelector('[data-work-mobile-index]');
  const mobileTitle = mobileCopy?.querySelector('[data-work-mobile-title]');
  const mobileBody = mobileCopy?.querySelector('[data-work-mobile-body]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pinnedMobile = window.matchMedia('(max-width: 699px)');
  const story = visual.closest('.work-layout');
  let transitionTimer = 0;
  let transitionId = 0;
  let hoveredStep = null;
  let requestedStep = null;
  let framePending = false;
  let hasEntered = false;
  let wheelLocked = false;
  let wheelUnlockTimer = 0;

  const commitStep = (step, id) => {
    if (id !== transitionId || step !== requestedStep) return;

    const stage = step.dataset.workStep || '1';
    visual.dataset.stage = stage;
    visual.classList.remove('is-changing');

    if (index) index.textContent = stage.padStart(2, '0');
    if (label) label.textContent = step.dataset.workLabel || '';
    if (mobileIndex) mobileIndex.textContent = stage.padStart(2, '0');
    if (mobileTitle) mobileTitle.textContent = step.querySelector('h3')?.textContent || '';
    if (mobileBody) mobileBody.textContent = step.querySelector('p')?.textContent || '';
    mobileCopy?.classList.remove('is-changing');
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
    mobileCopy?.classList.add('is-changing');
    visual.dataset.stage = '0';
    transitionTimer = window.setTimeout(() => commitStep(step, id), 180);
  };

  const closestStepToReadingLine = () => {
    const isMobileStory = window.matchMedia('(max-width: 959px)').matches;
    const visualRect = visual.parentElement.getBoundingClientRect();
    const readingLine = pinnedMobile.matches
      ? window.innerHeight * .5
      : isMobileStory
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

  const storyIsPinned = () => {
    if (!story || !pinnedMobile.matches) return false;
    const storyRect = story.getBoundingClientRect();
    const visualRect = visual.parentElement.getBoundingClientRect();
    const stickyTop = Number.parseFloat(getComputedStyle(visual.parentElement).top) || 72;
    return visualRect.top <= stickyTop + 2 && storyRect.bottom > window.innerHeight * .62;
  };

  const centreStep = step => {
    const rect = step.getBoundingClientRect();
    const targetTop = window.scrollY + rect.top + (rect.height / 2) - (window.innerHeight / 2);

    hasEntered = true;
    hoveredStep = null;
    requestStep(step);
    window.scrollTo({ top: targetTop, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  window.addEventListener('wheel', event => {
    if (
      !pinnedMobile.matches ||
      event.ctrlKey ||
      Math.abs(event.deltaY) < 6 ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      !storyIsPinned()
    ) return;

    if (wheelLocked) {
      event.preventDefault();
      return;
    }

    const currentStep = requestedStep || closestStepToReadingLine() || steps[0];
    const currentIndex = steps.indexOf(currentStep);
    const nextIndex = currentIndex + (event.deltaY > 0 ? 1 : -1);

    if (nextIndex < 0 || nextIndex >= steps.length) return;

    event.preventDefault();
    wheelLocked = true;
    centreStep(steps[nextIndex]);

    window.clearTimeout(wheelUnlockTimer);
    wheelUnlockTimer = window.setTimeout(() => {
      wheelLocked = false;
    }, 620);
  }, { passive: false });

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
