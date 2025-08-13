// src/store.js
import { create } from "zustand";
import axios from "axios";

export const useAppStore = create((set, get) => ({
  // ========================
  // State
  // ========================
  company: null,
  designations: [],
  articleTypes: [],
  branches: [],
  customers: [],
  loading: false,
  error: null,

  // ========================
  // Actions
  // ========================
  
  // Company Details
  fetchCompanyDetails: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/api/company");
      set({ company: res.data.company });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to fetch company" });
    } finally {
      set({ loading: false });
    }
  },

  // Designations
  fetchDesignations: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/api/company/designations");
      set({ designations: res.data.designations });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to fetch designations" });
    } finally {
      set({ loading: false });
    }
  },

  createDesignation: async (designation) => {
    set({ loading: true, error: null });
    try {
      await axios.post("/api/company/designations", { designation });
      await get().fetchDesignations(); // refresh list
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to create designation" });
    } finally {
      set({ loading: false });
    }
  },

  // Branches
  fetchBranches: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/api/company/branches");
      set({ branches: res.data.branches });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to fetch branches" });
    } finally {
      set({ loading: false });
    }
  },

  createBranch: async (branchData) => {
    set({ loading: true, error: null });
    try {
      await axios.post("/api/company/branches", branchData);
      await get().fetchBranches();
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to create branch" });
    } finally {
      set({ loading: false });
    }
  },

  // Customers
  fetchCustomers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/api/customer", { params });
      set({ customers: res.data.customers });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to fetch customers" });
    } finally {
      set({ loading: false });
    }
  },

  createCustomer: async (customerData) => {
    set({ loading: true, error: null });
    try {
      await axios.post("/api/customer", customerData);
      await get().fetchCustomers();
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to create customer" });
    } finally {
      set({ loading: false });
    }
  },

  // Clear Errors
  clearError: () => set({ error: null }),
}));

