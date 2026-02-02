import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import type { PolicyRule, Severity, ApiResponse } from '../types';
import clsx from 'clsx';

const severityConfig: Record<
  Severity,
  { bg: string; text: string; label: string; order: number }
> = {
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical', order: 0 },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High', order: 1 },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium', order: 2 },
  LOW: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Low', order: 3 },
};

const categoryLabels: Record<string, string> = {
  prohibited_items: 'Prohibited Items',
  intellectual_property: 'Intellectual Property',
  listing_requirements: 'Listing Requirements',
  safety: 'Safety & Compliance',
  prohibited_services: 'Prohibited Services',
};

interface RulesResponse {
  rules: PolicyRule[];
  grouped: Record<string, PolicyRule[]>;
  total: number;
}

export default function PolicyRules() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'ALL'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RulesResponse>>('/rules');
      return response.data.data!;
    },
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const filteredGrouped = data?.grouped
    ? Object.entries(data.grouped).reduce(
        (acc, [category, rules]) => {
          const filtered =
            selectedSeverity === 'ALL'
              ? rules
              : rules.filter((r) => r.severity === selectedSeverity);
          if (filtered.length > 0) {
            acc[category] = filtered;
          }
          return acc;
        },
        {} as Record<string, PolicyRule[]>
      )
    : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Policy Rules</h1>
        <p className="text-gray-500">
          Learn about Etsy's policies and what triggers compliance violations
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Filter by severity:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSeverity('ALL')}
            className={clsx(
              'badge',
              selectedSeverity === 'ALL'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            All
          </button>
          {Object.entries(severityConfig)
            .sort((a, b) => a[1].order - b[1].order)
            .map(([severity, config]) => (
              <button
                key={severity}
                onClick={() => setSelectedSeverity(severity as Severity)}
                className={clsx(
                  'badge',
                  selectedSeverity === severity
                    ? `${config.bg} ${config.text}`
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {config.label}
              </button>
            ))}
        </div>
      </div>

      {/* Rules list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : Object.keys(filteredGrouped).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(filteredGrouped).map(([category, rules]) => (
            <div key={category} className="card overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                    <Shield className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {categoryLabels[category] || category}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {rules.length} rule{rules.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {expandedCategories.includes(category) ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {expandedCategories.includes(category) && (
                <div className="border-t border-gray-200 divide-y divide-gray-100">
                  {rules
                    .sort(
                      (a, b) =>
                        severityConfig[a.severity].order -
                        severityConfig[b.severity].order
                    )
                    .map((rule) => (
                      <div key={rule.id} className="p-4 pl-16">
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={clsx(
                              'h-5 w-5 flex-shrink-0 mt-0.5',
                              severityConfig[rule.severity].text
                            )}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">
                                {rule.ruleName}
                              </h4>
                              <span
                                className={clsx(
                                  'badge',
                                  severityConfig[rule.severity].bg,
                                  severityConfig[rule.severity].text
                                )}
                              >
                                {severityConfig[rule.severity].label}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {rule.ruleText}
                            </p>
                            {rule.keywords.length > 0 && (
                              <div className="mt-3">
                                <span className="text-xs font-medium text-gray-500">
                                  Trigger keywords:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {rule.keywords.slice(0, 10).map((keyword, i) => (
                                    <code
                                      key={i}
                                      className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700"
                                    >
                                      {keyword}
                                    </code>
                                  ))}
                                  {rule.keywords.length > 10 && (
                                    <span className="text-xs text-gray-500">
                                      +{rule.keywords.length - 10} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No rules found
          </h3>
          <p className="mt-2 text-gray-500">
            Try adjusting your filter settings
          </p>
        </div>
      )}

      {/* Info box */}
      <div className="card bg-blue-50 border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900">
          About Policy Compliance
        </h3>
        <p className="mt-2 text-sm text-blue-800">
          These rules are based on Etsy's published seller policies. While we
          strive to keep them up-to-date, always refer to Etsy's official
          policies for the most accurate information. Our compliance checker
          helps identify potential issues but is not a guarantee of compliance.
        </p>
      </div>
    </div>
  );
}
