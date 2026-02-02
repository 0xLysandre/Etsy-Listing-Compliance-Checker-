import { useState } from 'react';
import { User, CreditCard, Bell, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import type { SubscriptionTier } from '../types';
import clsx from 'clsx';

const plans: {
  tier: SubscriptionTier;
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    tier: 'FREE',
    name: 'Free',
    price: '$0',
    features: [
      '5 listings',
      '10 checks per month',
      'Basic compliance checking',
      'Email support',
    ],
  },
  {
    tier: 'BASIC',
    name: 'Basic',
    price: '$9',
    features: [
      '50 listings',
      '100 checks per month',
      'Detailed violation reports',
      'Priority email support',
    ],
  },
  {
    tier: 'PRO',
    name: 'Pro',
    price: '$29',
    popular: true,
    features: [
      '500 listings',
      '1,000 checks per month',
      'Bulk compliance checking',
      'API access',
      'Priority support',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: '$99',
    features: [
      'Unlimited listings',
      'Unlimited checks',
      'Custom policy rules',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'notifications'>('account');

  const handleUpgrade = (tier: SubscriptionTier) => {
    // In a real app, this would redirect to Stripe checkout
    toast.success(`Upgrade to ${tier} coming soon!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and subscription</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={clsx(
                'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            <form className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  defaultValue={user?.email}
                  className="input"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  Contact support to change your email address
                </p>
              </div>
              <div>
                <label htmlFor="currentPassword" className="label">
                  Current password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  className="input"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="label">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="input"
                  placeholder="Enter new password"
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  toast.success('Password update coming soon!');
                }}
              >
                Update Password
              </button>
            </form>
          </div>

          <div className="card p-6 border-red-200">
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
            <p className="mt-2 text-sm text-gray-500">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <button
              className="btn-danger mt-4"
              onClick={() => toast.error('Account deletion coming soon!')}
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current plan */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {user?.subscriptionTier || 'FREE'} Plan
                </p>
                <p className="text-sm text-gray-500">
                  Status: {user?.subscriptionStatus || 'ACTIVE'}
                </p>
              </div>
            </div>
          </div>

          {/* Plans */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Available Plans
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.tier}
                  className={clsx(
                    'card p-6 relative',
                    plan.popular && 'border-primary-500 border-2'
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-primary-500 text-white">
                      Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={user?.subscriptionTier === plan.tier}
                    className={clsx(
                      'mt-6 w-full',
                      user?.subscriptionTier === plan.tier
                        ? 'btn-secondary'
                        : plan.popular
                          ? 'btn-primary'
                          : 'btn-secondary'
                    )}
                  >
                    {user?.subscriptionTier === plan.tier
                      ? 'Current Plan'
                      : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Notification Preferences
          </h2>
          <div className="mt-6 space-y-4">
            {[
              {
                id: 'email_checks',
                label: 'Compliance check results',
                description: 'Get notified when a compliance check is completed',
              },
              {
                id: 'email_violations',
                label: 'New violations detected',
                description:
                  'Receive alerts when new policy violations are found',
              },
              {
                id: 'email_updates',
                label: 'Product updates',
                description: 'Stay informed about new features and improvements',
              },
              {
                id: 'email_tips',
                label: 'Tips and best practices',
                description:
                  'Receive helpful tips for maintaining policy compliance',
              },
            ].map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{notification.label}</p>
                  <p className="text-sm text-gray-500">
                    {notification.description}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300"></div>
                </label>
              </div>
            ))}
          </div>
          <button
            className="btn-primary mt-6"
            onClick={() => toast.success('Preferences saved!')}
          >
            Save Preferences
          </button>
        </div>
      )}
    </div>
  );
}
