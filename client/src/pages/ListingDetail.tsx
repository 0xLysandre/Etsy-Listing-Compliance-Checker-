import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  PlayCircle,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { listingsService } from '../services/listings.service';
import { checksService } from '../services/checks.service';
import { getErrorMessage } from '../services/api';
import type { Severity } from '../types';
import clsx from 'clsx';

const severityConfig: Record<
  Severity,
  { bg: string; text: string; label: string }
> = {
  LOW: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Low' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' },
};

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsService.getListing(id!),
    enabled: !!id,
  });

  const checkMutation = useMutation({
    mutationFn: checksService.runCheck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      toast.success('Compliance check completed!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Listing not found</h2>
        <Link to="/listings" className="btn-primary mt-4">
          Back to Listings
        </Link>
      </div>
    );
  }

  const lastCheck = listing.violationChecks?.[0];
  const hasViolations = lastCheck && lastCheck.violationsFound > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <p className="text-gray-500">{listing.category}</p>
          </div>
          <div className="flex gap-3">
            {listing.etsyUrl && (
              <a
                href={listing.etsyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View on Etsy
              </a>
            )}
            <button
              onClick={() => checkMutation.mutate(listing.id)}
              disabled={checkMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              {checkMutation.isPending ? 'Checking...' : 'Run Compliance Check'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status card */}
          <div
            className={clsx(
              'card p-6',
              hasViolations
                ? 'border-l-4 border-l-orange-500'
                : lastCheck
                  ? 'border-l-4 border-l-green-500'
                  : ''
            )}
          >
            <div className="flex items-center gap-4">
              {lastCheck ? (
                hasViolations ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {lastCheck.violationsFound} Potential Issues Found
                      </h3>
                      <p className="text-sm text-gray-500">
                        Review the violations below and make necessary changes
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        No Issues Found
                      </h3>
                      <p className="text-sm text-gray-500">
                        Your listing appears to be compliant with Etsy policies
                      </p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Info className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Not Yet Checked
                    </h3>
                    <p className="text-sm text-gray-500">
                      Run a compliance check to detect potential policy violations
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Violations */}
          {lastCheck && lastCheck.violations && lastCheck.violations.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">
                  Violations Detected
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {lastCheck.violations.map((violation) => (
                  <div key={violation.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={clsx(
                          'flex-shrink-0 rounded-lg p-2',
                          severityConfig[violation.severity].bg
                        )}
                      >
                        <AlertTriangle
                          className={clsx(
                            'h-5 w-5',
                            severityConfig[violation.severity].text
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {violation.policyRule?.ruleName || 'Policy Violation'}
                          </h4>
                          <span
                            className={clsx(
                              'badge',
                              severityConfig[violation.severity].bg,
                              severityConfig[violation.severity].text
                            )}
                          >
                            {severityConfig[violation.severity].label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {violation.violationText}
                        </p>
                        {violation.matchedText && (
                          <p className="mt-2 text-sm">
                            <span className="font-medium text-gray-700">
                              Matched keywords:{' '}
                            </span>
                            <code className="rounded bg-red-50 px-1 text-red-700">
                              {violation.matchedText}
                            </code>
                          </p>
                        )}
                        <div className="mt-3 rounded-lg bg-blue-50 p-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Suggestion: </span>
                            {violation.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            </div>
            <div className="card-body">
              <p className="whitespace-pre-wrap text-gray-700">
                {listing.description}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900">Details</h3>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Price</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  ${Number(listing.price).toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Category</dt>
                <dd className="text-gray-900">{listing.category}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(listing.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900">Tags</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {listing.materials.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900">Materials</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.materials.map((material, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                  >
                    {material}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Check history */}
          {listing.violationChecks && listing.violationChecks.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900">Check History</h3>
              <div className="mt-3 space-y-3">
                {listing.violationChecks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      {new Date(check.checkDate).toLocaleDateString()}
                    </div>
                    {check.violationsFound > 0 ? (
                      <span className="badge-danger">
                        {check.violationsFound} issues
                      </span>
                    ) : (
                      <span className="badge-success">Compliant</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
