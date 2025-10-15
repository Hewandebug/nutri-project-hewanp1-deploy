const views = Array.from(document.querySelectorAll('[data-view]'));
const showView = (name) => {
  views.forEach((view) => {
    view.classList.toggle('hidden', view.dataset.view !== name);
  });
};

const signupForm = document.getElementById('signup-form');
const signupError = document.querySelector('[data-signup-error]');
const questionnaireForm = document.getElementById('questionnaire-form');
const questionnaireError = document.querySelector('[data-questionnaire-error]');
const progressBar = document.querySelector('[data-progress-bar]');
const userEmailLabel = document.querySelector('[data-user-email]');
const summaryContainer = document.querySelector('[data-summary]');
const steps = Array.from(questionnaireForm.querySelectorAll('[data-step]'));
const backButton = questionnaireForm.querySelector('[data-action="back"]');
const nextButton = questionnaireForm.querySelector('[data-action="next"]');
const startOverButton = document.querySelector('[data-action="start-over"]');

const state = {
  userId: null,
  stepIndex: 0,
  loading: false,
  profile: null,
  email: '',
};

const setSignupError = (message) => {
  if (!signupError) return;
  if (message) {
    signupError.textContent = message;
    signupError.hidden = false;
  } else {
    signupError.textContent = '';
    signupError.hidden = true;
  }
};

const setQuestionnaireError = (message) => {
  if (!questionnaireError) return;
  if (message) {
    questionnaireError.textContent = message;
    questionnaireError.hidden = false;
  } else {
    questionnaireError.textContent = '';
    questionnaireError.hidden = true;
  }
};

const updateStepVisibility = () => {
  steps.forEach((step, index) => {
    step.classList.toggle('hidden', index !== state.stepIndex);
  });
  const progress = (state.stepIndex / (steps.length - 1)) * 100;
  progressBar.style.width = `${Number.isFinite(progress) ? progress : 0}%`;
  backButton.disabled = state.stepIndex === 0 || state.loading;
  nextButton.textContent = state.stepIndex === steps.length - 1 ? 'Complete setup' : 'Next';
  nextButton.disabled = state.loading;
};

const validateSignup = (form) => {
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirm = form.confirm.value;

  if (!email || !password || !confirm) {
    return 'Please fill in all fields.';
  }

  if (!email.endsWith('@college.harvard.edu')) {
    return 'Use your Harvard College email (@college.harvard.edu).';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  if (password !== confirm) {
    return 'Passwords do not match.';
  }

  return null;
};

const validateCurrentStep = () => {
  const formData = new FormData(questionnaireForm);
  if (state.stepIndex === 0) {
    if (!formData.get('name')?.trim() || !formData.get('gender')) {
      return 'Please provide your name and gender.';
    }
  } else if (state.stepIndex === 1) {
    if (!formData.get('sportType') || !formData.get('trainingFrequency')) {
      return 'Tell us about your sport and training cadence.';
    }
  } else if (state.stepIndex === 2) {
    if (!formData.get('dietGoal')) {
      return 'Choose the nutrition focus that best fits you.';
    }
  }
  return null;
};

const renderSummary = (user) => {
  const profile = user?.profile || state.profile;
  const email = user?.email || state.email;

  if (!profile) {
    summaryContainer.innerHTML = `
      <p class="summary__lead">
        We could not load your profile details, but your account is ready.
        You can close this tab and start fueling with CrimsonFuel anytime.
      </p>
    `;
    return;
  }

  const entries = [
    ['Athlete', profile.name || 'Not provided'],
    ['Email', email || 'Not provided'],
    ['Gender', profile.gender || 'Not provided'],
    ['Sport', profile.sportType || 'Not provided'],
    ['Training frequency', profile.trainingFrequency || 'Not provided'],
    ['Primary goal', profile.dietGoal || 'Not provided'],
    [
      'Completed at',
      profile.completedAt
        ? new Date(profile.completedAt).toLocaleString()
        : 'Just now',
    ],
  ];

  const list = entries
    .map(
      ([label, value]) => `
        <div>
          <dt>${label}</dt>
          <dd>${value}</dd>
        </div>
      `,
    )
    .join('');

  summaryContainer.innerHTML = `
    <p class="summary__lead">
      Great work! Here's a snapshot of the information we'll use to fine-tune
      your nutrition plan.
    </p>
    <dl>${list}</dl>
  `;
};

const submitOnboarding = async () => {
  const error = validateCurrentStep();
  if (error) {
    setQuestionnaireError(error);
    return;
  }

  const formData = new FormData(questionnaireForm);
  const payload = {
    userId: state.userId,
    name: formData.get('name')?.trim(),
    gender: formData.get('gender'),
    sportType: formData.get('sportType'),
    trainingFrequency: formData.get('trainingFrequency'),
    dietGoal: formData.get('dietGoal'),
  };

  if (!payload.userId) {
    setQuestionnaireError('We lost track of your session. Please start over.');
    return;
  }

  state.loading = true;
  updateStepVisibility();
  setQuestionnaireError(null);

  try {
    const response = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error((await response.json()).message || 'Request failed');
    }

    const data = await response.json();
    state.profile = data.user?.profile ?? null;

    showView('confirmation');
    renderSummary(data.user);
  } catch (err) {
    const message = err?.message || 'Something went wrong. Please try again.';
    setQuestionnaireError(message);
  } finally {
    state.loading = false;
    updateStepVisibility();
  }
};

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setSignupError(null);

  const error = validateSignup(signupForm);
  if (error) {
    setSignupError(error);
    return;
  }

  const form = new FormData(signupForm);
  const payload = {
    email: form.get('email').trim(),
    password: form.get('password'),
  };

  state.loading = true;
  signupForm.querySelector('button[type="submit"]').disabled = true;

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body.success) {
      throw new Error(body.message || 'Unable to create account.');
    }

    state.userId = body.userId;
    state.email = payload.email;
    userEmailLabel.textContent = payload.email;
    questionnaireForm.reset();
    state.stepIndex = 0;
    setQuestionnaireError(null);
    updateStepVisibility();
    showView('questionnaire');
  } catch (err) {
    setSignupError(err?.message || 'Something went wrong. Please try again.');
  } finally {
    state.loading = false;
    signupForm.querySelector('button[type="submit"]').disabled = false;
  }
});

backButton?.addEventListener('click', () => {
  if (state.stepIndex === 0 || state.loading) return;
  state.stepIndex -= 1;
  setQuestionnaireError(null);
  updateStepVisibility();
});

nextButton?.addEventListener('click', () => {
  if (state.loading) return;

  if (state.stepIndex === steps.length - 1) {
    submitOnboarding();
    return;
  }

  const error = validateCurrentStep();
  if (error) {
    setQuestionnaireError(error);
    return;
  }

  state.stepIndex += 1;
  setQuestionnaireError(null);
  updateStepVisibility();
});

startOverButton?.addEventListener('click', () => {
  state.userId = null;
  state.stepIndex = 0;
  state.profile = null;
  state.email = '';
  signupForm.reset();
  questionnaireForm.reset();
  summaryContainer.innerHTML =
    '<p class="summary__lead">Hang tight while we load your personalized plan...</p>';
  setSignupError(null);
  setQuestionnaireError(null);
  showView('signup');
  updateStepVisibility();
});

updateStepVisibility();
