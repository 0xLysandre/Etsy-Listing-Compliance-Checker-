import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Trash2,
  Eye,
  PlayCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { listingsService } from '../services/listings.service';
import { checksService } from '../services/checks.service';
import { getErrorMessage } from '../services/api';
import type { Listing } from '../types';

export default function Listings() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['listings', page, 10],
    queryFn: () => listingsService.getListings(page, 10),
  });

  const deleteMutation = useMutation({
    mutationFn: listingsService.deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing deleted');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const checkMutation = useMutation({
    mutationFn: checksService.runCheck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Compliance check completed');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const listings = data?.data || [];
  const meta = data?.meta;

  const filteredListings = listings.filter((listing) =>
    listing.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRunCheck = (id: string) => {
    checkMutation.mutate(id);
  };

  const getStatusBadge = (listing: Listing) => {
    const lastCheck = listing.violationChecks?.[0];
    if (!lastCheck) {
      return <span className="badge-gray">Not checked</span>;
    }
    if (lastCheck.violationsFound > 0) {
      return (
        <span className="badge-danger flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {lastCheck.violationsFound} issues
        </span>
      );
    }
    return (
      <span className="badge-success flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Compliant
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-gray-500">
            Manage and check your Etsy product listings
          </p>
        </div>
        <Link to="/listings/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Listing
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Listings table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Checks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        to={`/listings/${listing.id}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {listing.title.length > 40
                          ? `${listing.title.substring(0, 40)}...`
                          : listing.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {listing.category}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      ${Number(listing.price).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(listing)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {listing._count?.violationChecks || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === listing.id ? null : listing.id
                            )
                          }
                          className="rounded p-1 hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>
                        {activeMenu === listing.id && (
                          <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            <Link
                              to={`/listings/${listing.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                            <button
                              onClick={() => {
                                handleRunCheck(listing.id);
                                setActiveMenu(null);
                              }}
                              disabled={checkMutation.isPending}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <PlayCircle className="h-4 w-4" />
                              Run Check
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(listing.id);
                                setActiveMenu(null);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-300">
              <Search className="h-12 w-12" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No listings found
            </h3>
            <p className="mt-2 text-gray-500">
              {search
                ? 'Try a different search term'
                : 'Add your first listing to get started'}
            </p>
            {!search && (
              <Link to="/listings/new" className="btn-primary mt-4">
                Add Your First Listing
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 10 + 1} to{' '}
            {Math.min(page * 10, meta.total)} of {meta.total} listings
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.totalPages}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
