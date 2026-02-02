import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { listingsService } from '../services/listings.service';
import { useAuth } from '../hooks/useAuth';
import type { Listing } from '../types';

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RecentListingCard({ listing }: { listing: Listing }) {
  const lastCheck = listing.violationChecks?.[0];
  const hasViolations = lastCheck && lastCheck.violationsFound > 0;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
    >
      <div className="flex-1 min-w-0">
        <h4 className="truncate font-medium text-gray-900">{listing.title}</h4>
        <p className="text-sm text-gray-500">{listing.category}</p>
      </div>
      <div className="ml-4 flex items-center gap-2">
        {lastCheck ? (
          hasViolations ? (
            <span className="badge-danger flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lastCheck.violationsFound} issues
            </span>
          ) : (
            <span className="badge-success flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Compliant
            </span>
          )
        ) : (
          <span className="badge-gray">Not checked</span>
        )}
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['listings', 1, 5],
    queryFn: () => listingsService.getListings(1, 5),
  });

  const listings = listingsData?.data || [];
  const totalListings = listingsData?.meta?.total || 0;

  // Calculate stats
  const totalChecks = listings.reduce(
    (acc, l) => acc + (l._count?.violationChecks || 0),
    0
  );
  const listingsWithViolations = listings.filter(
    (l) => l.violationChecks?.[0]?.violationsFound && l.violationChecks[0].violationsFound > 0
  ).length;
  const complianceRate = totalListings > 0
    ? Math.round(((totalListings - listingsWithViolations) / totalListings) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-gray-500">
          Here's an overview of your Etsy listings compliance status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Listings"
          value={totalListings}
          icon={ShoppingBag}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Checks"
          value={totalChecks}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Active Violations"
          value={listingsWithViolations}
          icon={AlertTriangle}
          color="bg-orange-500"
        />
        <StatCard
          title="Compliance Rate"
          value={`${complianceRate}%`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      {/* Recent listings */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Listings
          </h2>
          <Link
            to="/listings/new"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Listing
          </Link>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : listings.length > 0 ? (
            <div className="space-y-3">
              {listings.map((listing) => (
                <RecentListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No listings yet
              </h3>
              <p className="mt-2 text-gray-500">
                Add your first listing to start checking compliance.
              </p>
              <Link to="/listings/new" className="btn-primary mt-4">
                Add Your First Listing
              </Link>
            </div>
          )}
        </div>
        {listings.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-3">
            <Link
              to="/listings"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all listings
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/listings/new"
          className="card p-6 transition-colors hover:border-primary-500"
        >
          <Plus className="h-8 w-8 text-primary-500" />
          <h3 className="mt-4 font-medium text-gray-900">Add New Listing</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a new listing to check for compliance
          </p>
        </Link>
        <Link
          to="/rules"
          className="card p-6 transition-colors hover:border-primary-500"
        >
          <AlertTriangle className="h-8 w-8 text-primary-500" />
          <h3 className="mt-4 font-medium text-gray-900">View Policy Rules</h3>
          <p className="mt-1 text-sm text-gray-500">
            Learn about Etsy's policies and common violations
          </p>
        </Link>
        <Link
          to="/settings"
          className="card p-6 transition-colors hover:border-primary-500"
        >
          <TrendingUp className="h-8 w-8 text-primary-500" />
          <h3 className="mt-4 font-medium text-gray-900">Upgrade Plan</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get more checks and advanced features
          </p>
        </Link>
      </div>
    </div>
  );
}
