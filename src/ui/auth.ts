/** Sign-in / sign-up gate. Nothing else in the game renders until this resolves. */

import { backend, BackendError, type Profile } from '../backend';
import { el, qs } from './dom';

type Mode = 'signin' | 'signup';

export function mountAuth(host: HTMLElement, onSignedIn: (profile: Profile) => void): void {
  let mode: Mode = 'signin';
  let busy = false;

  const root = el(`
    <div class="auth">
      <div class="auth__vignette"></div>
      <div class="auth__card">
        <div class="auth__brand">
          <span class="auth__mark" aria-hidden="true"></span>
          <h1 class="auth__title">Creepy Crawlies</h1>
          <p class="auth__tagline">Real insects. Real abilities. Turn-based duels.</p>
        </div>

        <form class="auth__form" novalidate>
          <label class="field" data-only="signup">
            <span class="field__label">Name</span>
            <input class="field__input" name="handle" type="text" autocomplete="nickname"
                   placeholder="What your opponents will see" maxlength="24" />
          </label>

          <label class="field">
            <span class="field__label">Email</span>
            <input class="field__input" name="email" type="email" autocomplete="email"
                   placeholder="you@example.com" required />
          </label>

          <label class="field">
            <span class="field__label">Password</span>
            <input class="field__input" name="password" type="password" placeholder="At least 8 characters" required />
            <span class="field__note" data-only="signup">Stored salted and hashed. Never in the clear.</span>
          </label>

          <p class="auth__error" role="alert" hidden></p>

          <button class="btn btn--primary auth__submit" type="submit"></button>
        </form>

        <p class="auth__switch">
          <span class="auth__switch-text"></span>
          <button class="auth__switch-btn" type="button"></button>
        </p>
      </div>
    </div>
  `);

  const form = qs<HTMLFormElement>(root, '.auth__form');
  const submit = qs<HTMLButtonElement>(root, '.auth__submit');
  const error = qs(root, '.auth__error');
  const switchText = qs(root, '.auth__switch-text');
  const switchBtn = qs<HTMLButtonElement>(root, '.auth__switch-btn');

  function render(): void {
    const signup = mode === 'signup';
    root.classList.toggle('is-signup', signup);
    for (const node of root.querySelectorAll<HTMLElement>('[data-only="signup"]')) {
      node.hidden = !signup;
    }
    qs<HTMLInputElement>(form, 'input[name="handle"]').required = signup;
    submit.textContent = signup ? 'Create account' : 'Enter the clearing';
    switchText.textContent = signup ? 'Already have a colony?' : 'First time here?';
    switchBtn.textContent = signup ? 'Sign in' : 'Create an account';
    error.hidden = true;
  }

  switchBtn.addEventListener('click', () => {
    mode = mode === 'signin' ? 'signup' : 'signin';
    render();
  });

  function fail(message: string): void {
    error.textContent = message;
    error.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;

    const data = new FormData(form);
    const email = String(data.get('email') ?? '');
    const password = String(data.get('password') ?? '');
    const handle = String(data.get('handle') ?? '');

    busy = true;
    submit.disabled = true;
    submit.classList.add('is-busy');
    error.hidden = true;

    try {
      const profile = mode === 'signup'
        ? await backend.signUp(email, password, handle)
        : await backend.signIn(email, password);
      root.classList.add('is-leaving');
      setTimeout(() => {
        root.remove();
        onSignedIn(profile);
      }, 420);
      return;
    } catch (err) {
      fail(err instanceof BackendError ? err.message : 'Something went wrong. Try again.');
    } finally {
      busy = false;
      submit.disabled = false;
      submit.classList.remove('is-busy');
    }
  });

  render();
  host.appendChild(root);
  qs<HTMLInputElement>(form, 'input[name="email"]').focus();
}
