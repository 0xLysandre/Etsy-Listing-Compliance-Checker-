import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';

export default function VerifyEmail() {
  const { verifyEmail, resendVerification, user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
      } catch (error) {
        setStatus('error');
        setErrorMessage(getErrorMessage(error));
      }
    };

    verify();
  }, [token, verifyEmail]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerification();
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-lg text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Verifying your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-lg text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Email verified!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your email has been successfully verified. You now have full access
              to all features.
            </p>
            <Link to="/dashboard" className="btn-primary mt-6 block w-full text-center">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-lg text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Verification failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {errorMessage || 'This verification link is invalid or has expired.'}
            </p>
            <div className="mt-6 space-y-3">
              {user && (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="btn-primary w-full"
                >
                  {isResending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
              <Link to="/dashboard" className="btn-secondary block w-full text-center">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No token - show instructions
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <Mail className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {user ? (
              <>
                We sent a verification link to <strong>{user.email}</strong>. Click
                the link in the email to verify your account.
              </>
            ) : (
              'Please check your email for a verification link.'
            )}
          </p>
          <div className="mt-6 space-y-3">
            {user && !user.emailVerified && (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="btn-primary w-full"
              >
                {isResending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
            <Link to="/dashboard" className="btn-secondary block w-full text-center">
              Go to Dashboard
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or request a new link.
          </p>
        </div>
      </div>
    </div>
  );
}
