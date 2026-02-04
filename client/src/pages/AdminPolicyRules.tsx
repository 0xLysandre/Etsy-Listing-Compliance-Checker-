import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, type PolicyRuleInput, type PolicyRulesQuery } from '../services/admin.service';
import type { PolicyRule, Severity } from '../types';
import { getErrorMessage } from '../services/api';

const severityColors: Record<Severity, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-blue-100 text-blue-800 border-blue-200',
};

const severityIcons: Record<Severity, React.ReactNode> = {
  CRITICAL: <AlertTriangle className="h-4 w-4" />,
  HIGH: <AlertCircle className="h-4 w-4" />,
  MEDIUM: <AlertCircle className="h-4 w-4" />,
  LOW: <Info className="h-4 w-4" />,
};

export default function AdminPolicyRules() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    categories: string[];
    severityCounts: Record<Severity, number>;
  } | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || '');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('isActive') || '');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PolicyRule | null>(null);
  const [formData, setFormData] = useState<PolicyRuleInput>({
    category: '',
    ruleName: '',
    ruleText: '',
    severity: 'MEDIUM',
    keywords: [],
    isActive: true,
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Fetch rules
  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const query: PolicyRulesQuery = {
        page: currentPage,
        limit: 20,
      };

      if (search) query.search = search;
      if (categoryFilter) query.category = categoryFilter;
      if (severityFilter) query.severity = severityFilter;
      if (activeFilter) query.isActive = activeFilter === 'true';

      const response = await adminService.getPolicyRules(query);
      setRules(response.data);
      setMeta(response.meta as typeof meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [currentPage, categoryFilter, severityFilter, activeFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchParams.get('search')) {
        const params = new URLSearchParams(searchParams);
        if (search) {
          params.set('search', search);
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        setSearchParams(params);
        fetchRules();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Update URL params when filters change
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  // Pagination
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  // Open modal for creating/editing
  const openModal = (rule?: PolicyRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        category: rule.category,
        ruleName: rule.ruleName,
        ruleText: rule.ruleText,
        severity: rule.severity,
        keywords: rule.keywords,
        isActive: rule.isActive,
      });
    } else {
      setEditingRule(null);
      setFormData({
        category: '',
        ruleName: '',
        ruleText: '',
        severity: 'MEDIUM',
        keywords: [],
        isActive: true,
      });
    }
    setKeywordInput('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  // Add keyword
  const addKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData({ ...formData, keywords: [...formData.keywords, keyword] });
    }
    setKeywordInput('');
  };

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  // Save rule
  const handleSave = async () => {
    if (!formData.category || !formData.ruleName || !formData.ruleText) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingRule) {
        await adminService.updatePolicyRule(editingRule.id, formData);
        toast.success('Policy rule updated');
      } else {
        await adminService.createPolicyRule(formData);
        toast.success('Policy rule created');
      }
      closeModal();
      fetchRules();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (rule: PolicyRule) => {
    try {
      await adminService.togglePolicyRuleStatus(rule.id);
      toast.success(`Rule ${rule.isActive ? 'disabled' : 'enabled'}`);
      fetchRules();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Delete rule
  const handleDelete = async (id: string) => {
    try {
      await adminService.deletePolicyRule(id);
      toast.success('Policy rule deleted');
      setDeleteConfirm(null);
      fetchRules();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policy Rules Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage compliance rules used to check listings
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {/* Stats */}
      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{meta.total}</div>
            <div className="text-sm text-gray-500">Total Rules</div>
          </div>
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((sev) => (
            <div key={sev} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className={`text-2xl font-bold ${severityColors[sev].split(' ')[1]}`}>
                {meta.severityCounts[sev]}
              </div>
              <div className="text-sm text-gray-500">{sev}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search rules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              updateFilter('category', e.target.value);
            }}
            className="input w-auto"
          >
            <option value="">All Categories</option>
            {meta?.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              updateFilter('severity', e.target.value);
            }}
            className="input w-auto"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Active filter */}
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              updateFilter('isActive', e.target.value);
            }}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={fetchRules}
            className="btn-secondary flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keywords
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No rules found
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className={!rule.isActive ? 'bg-gray-50 opacity-60' : ''}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{rule.ruleName}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{rule.ruleText}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {rule.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          severityColors[rule.severity]
                        }`}
                      >
                        {severityIcons[rule.severity]}
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {rule.keywords.slice(0, 3).map((kw) => (
                          <span
                            key={kw}
                            className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {kw}
                          </span>
                        ))}
                        {rule.keywords.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{rule.keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(rule)}
                        className={`flex items-center gap-1 text-sm ${
                          rule.isActive ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {rule.isActive ? (
                          <>
                            <ToggleRight className="h-5 w-5" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(rule)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {deleteConfirm === rule.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(rule.id)}
                              className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs px-2 py-1 bg-gray-200 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(rule.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * meta.limit + 1} to{' '}
              {Math.min(currentPage * meta.limit, meta.total)} of {meta.total} rules
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary p-2 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {meta.totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === meta.totalPages}
                className="btn-secondary p-2 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRule ? 'Edit Policy Rule' : 'Create Policy Rule'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="label">Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                    placeholder="e.g., prohibited_items, safety, listing_quality"
                  />
                </div>

                {/* Rule Name */}
                <div>
                  <label className="label">Rule Name *</label>
                  <input
                    type="text"
                    value={formData.ruleName}
                    onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                    className="input"
                    placeholder="e.g., Trademarked Brand Names"
                  />
                </div>

                {/* Rule Text */}
                <div>
                  <label className="label">Rule Description *</label>
                  <textarea
                    value={formData.ruleText}
                    onChange={(e) => setFormData({ ...formData, ruleText: e.target.value })}
                    className="input min-h-24"
                    placeholder="Describe what this rule checks for..."
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="label">Severity *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value as Severity })
                    }
                    className="input"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                {/* Keywords */}
                <div>
                  <label className="label">Keywords</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      className="input flex-1"
                      placeholder="Add keyword and press Enter"
                    />
                    <button type="button" onClick={addKeyword} className="btn-secondary">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Rule is active
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
