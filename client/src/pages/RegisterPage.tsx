import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import type { AuthMutationResponse, ApiErrorResponse } from '@shared/types';

import { useAuth } from '../context/AuthContext';
import { getReturnToParam, safeRedirectPath, validatePassword } from '../lib/auth';
import { ApiError, getErrorMessage, postJson } from '../lib/api';

export function RegisterPage(): React.JSX.Element {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'error' | 'info' | 'success'>('info');
  const passwordValidation = validatePassword(password);
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = safeRedirectPath(getReturnToParam(location.search));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      setMessage('Please complete every field.');
      setMessageTone('error');
      return;
    }

    if (!passwordValidation.valid) {
      setMessage(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      setMessageTone('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageTone('error');
      return;
    }

    if (!acceptedTerms) {
      setMessage('You must agree to the terms before registering.');
      setMessageTone('error');
      return;
    }

    setMessage('Creating your account...');
    setMessageTone('info');

    try {
      await postJson<AuthMutationResponse>('/api/register', {
        email,
        firstName,
        lastName,
        password,
        username
      });

      await refreshAuth();
      setMessage('Account created. Redirecting...');
      setMessageTone('success');

      window.setTimeout(() => {
        navigate(returnTo, { replace: true });
      }, 600);
    } catch (error) {
      const normalizedError =
        error instanceof ApiError ? (error as ApiError<ApiErrorResponse>) : new ApiError('Registration failed.', 500, null);

      setMessage(getErrorMessage(normalizedError.payload, normalizedError.message));
      setMessageTone('error');
    }
  }

  return (
    <main className="auth-page auth-page--register">
      <section className="auth-card auth-card--register">
        <h1>Create Your Account</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="split-fields">
            <label className="field">
              <span>First Name</span>
              <input
                autoComplete="given-name"
                placeholder="First name"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.currentTarget.value)}
              />
            </label>

            <label className="field">
              <span>Last Name</span>
              <input
                autoComplete="family-name"
                placeholder="Last name"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.currentTarget.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Email Address</span>
            <input
              autoComplete="email"
              placeholder="Enter email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </label>

          <label className="field">
            <span>Username</span>
            <input
              autoComplete="username"
              placeholder="Choose a username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.currentTarget.value)}
            />
          </label>

          <p className="auth-hint">
            Your password must include uppercase and lowercase letters, a number, and
            a special character.
          </p>

          <label className="field">
            <span>New Password</span>
            <div className="field__input">
              <input
                autoComplete="new-password"
                placeholder="Enter new password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              <button
                aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                className="field__toggle"
                type="button"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
              >
                <img alt="" src={showPassword ? '/icons/visibility_off.svg' : '/icons/visibility.svg'} />
              </button>
            </div>
          </label>

          <label className="field">
            <span>Confirm Password</span>
            <div className="field__input">
              <input
                autoComplete="new-password"
                placeholder="Confirm your password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.currentTarget.value)}
              />
              <button
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="field__toggle"
                type="button"
                onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
              >
                <img alt="" src={showConfirmPassword ? '/icons/visibility_off.svg' : '/icons/visibility.svg'} />
              </button>
            </div>
          </label>

          <ul className="password-rules">
            {[
              'At least 8 characters',
              'At least one uppercase letter',
              'At least one lowercase letter',
              'At least one number',
              'At least one special character'
            ].map((rule) => (
              <li
                className={passwordValidation.errors.includes(rule) ? 'password-rules__item--invalid' : 'password-rules__item--valid'}
                key={rule}
              >
                {rule}
              </li>
            ))}
          </ul>

          <p className={`form-message form-message--${messageTone}`}>{message}</p>

          <a className="oauth-link" href={`/auth/google?returnTo=${encodeURIComponent(returnTo)}`}>
            <img alt="" src="/images/Google1.png" />
            <span>Continue with Google</span>
          </a>

          <label className="terms-row">
            <input
              checked={acceptedTerms}
              type="checkbox"
              onChange={(event) => setAcceptedTerms(event.currentTarget.checked)}
            />
            <span>
              I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </span>
          </label>

          <div className="auth-form__actions">
            <button className="button button--secondary" type="reset" onClick={() => setMessage('')}>
              Reset
            </button>
            <button className="button" type="submit">
              Register
            </button>
          </div>
        </form>

        <p className="auth-card__switch">
          Already have an account?{' '}
          <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Login here</Link>
        </p>
      </section>
    </main>
  );
}
