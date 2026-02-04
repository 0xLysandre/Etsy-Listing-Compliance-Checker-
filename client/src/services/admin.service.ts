import { api } from './api';
import type { ApiResponse, PolicyRule } from '../types';

export interface PolicyRuleInput {
  category: string;
  ruleName: string;
  ruleText: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  keywords: string[];
  isActive?: boolean;
}

export interface PolicyRulesResponse {
  data: PolicyRule[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    categories: string[];
    severityCounts: {
      CRITICAL: number;
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    };
  };
}

export interface PolicyRuleStats {
  total: number;
  active: number;
  inactive: number;
  bySeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  byCategory: Record<string, number>;
  totalKeywords: number;
}

export interface PolicyRulesQuery {
  page?: number;
  limit?: number;
  category?: string;
  severity?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: 'category' | 'severity' | 'ruleName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const adminService = {
  // Get all policy rules with filtering
  async getPolicyRules(query: PolicyRulesQuery = {}): Promise<PolicyRulesResponse> {
    const params = new URLSearchParams();

    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.category) params.append('category', query.category);
    if (query.severity) params.append('severity', query.severity);
    if (query.isActive !== undefined) params.append('isActive', query.isActive.toString());
    if (query.search) params.append('search', query.search);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await api.get<ApiResponse<PolicyRule[]> & { meta: PolicyRulesResponse['meta'] }>(
      `/admin/policy-rules?${params.toString()}`
    );

    return {
      data: response.data.data!,
      meta: response.data.meta!,
    };
  },

  // Get single policy rule
  async getPolicyRule(id: string): Promise<PolicyRule> {
    const response = await api.get<ApiResponse<PolicyRule>>(`/admin/policy-rules/${id}`);
    return response.data.data!;
  },

  // Get policy rule statistics
  async getPolicyRuleStats(): Promise<PolicyRuleStats> {
    const response = await api.get<ApiResponse<PolicyRuleStats>>('/admin/policy-rules/stats');
    return response.data.data!;
  },

  // Create new policy rule
  async createPolicyRule(data: PolicyRuleInput): Promise<PolicyRule> {
    const response = await api.post<ApiResponse<PolicyRule>>('/admin/policy-rules', data);
    return response.data.data!;
  },

  // Update policy rule
  async updatePolicyRule(id: string, data: Partial<PolicyRuleInput>): Promise<PolicyRule> {
    const response = await api.put<ApiResponse<PolicyRule>>(`/admin/policy-rules/${id}`, data);
    return response.data.data!;
  },

  // Toggle policy rule status
  async togglePolicyRuleStatus(id: string): Promise<PolicyRule> {
    const response = await api.patch<ApiResponse<PolicyRule>>(`/admin/policy-rules/${id}/toggle`);
    return response.data.data!;
  },

  // Delete policy rule
  async deletePolicyRule(id: string): Promise<void> {
    await api.delete(`/admin/policy-rules/${id}`);
  },

  // Bulk update policy rules
  async bulkUpdatePolicyRules(ids: string[], isActive: boolean): Promise<void> {
    await api.post('/admin/policy-rules/bulk-update', { ids, isActive });
  },
};
