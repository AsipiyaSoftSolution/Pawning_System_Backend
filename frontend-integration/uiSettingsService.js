// Frontend API service for dashboard card visibility
class UiSettingsService {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
  }

  // Get dashboard card visibility settings
  async getDashboardCardVisibility(branchId) {
    try {
      const response = await fetch(`${this.baseURL}/ui-settings/dashboard-cards/${branchId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch card visibility settings');
      }

      return data;
    } catch (error) {
      console.error('Error fetching dashboard card visibility:', error);
      throw error;
    }
  }

  // Update single dashboard card visibility
  async updateDashboardCardVisibility(branchId, cardData) {
    try {
      const response = await fetch(`${this.baseURL}/ui-settings/dashboard-cards/${branchId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update card visibility');
      }

      return data;
    } catch (error) {
      console.error('Error updating dashboard card visibility:', error);
      throw error;
    }
  }

  // Bulk update dashboard card visibility
  async bulkUpdateDashboardCardVisibility(branchId, cards) {
    try {
      const response = await fetch(`${this.baseURL}/ui-settings/dashboard-cards/${branchId}/bulk`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cards }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to bulk update card visibility');
      }

      return data;
    } catch (error) {
      console.error('Error bulk updating dashboard card visibility:', error);
      throw error;
    }
  }

  // Delete dashboard card visibility setting
  async deleteDashboardCardVisibility(branchId, cardId) {
    try {
      const response = await fetch(`${this.baseURL}/ui-settings/dashboard-cards/${branchId}/${cardId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete card visibility setting');
      }

      return data;
    } catch (error) {
      console.error('Error deleting dashboard card visibility:', error);
      throw error;
    }
  }

  // Reset all dashboard card visibility settings
  async resetDashboardCardVisibility(branchId) {
    try {
      const response = await fetch(`${this.baseURL}/ui-settings/dashboard-cards/${branchId}/reset`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset card visibility settings');
      }

      return data;
    } catch (error) {
      console.error('Error resetting dashboard card visibility:', error);
      throw error;
    }
  }

  // Helper function to convert frontend card visibility state to backend format
  convertCardVisibilityToBackend(cardVisibility, summaryCardVisibility, chartCardVisibility) {
    const cards = [];

    // Table cards
    Object.entries(cardVisibility).forEach(([cardId, isVisible]) => {
      cards.push({
        card_id: cardId,
        card_type: 'table',
        is_visible: isVisible
      });
    });

    // Summary cards
    Object.entries(summaryCardVisibility).forEach(([cardId, isVisible]) => {
      cards.push({
        card_id: cardId,
        card_type: 'summary',
        is_visible: isVisible
      });
    });

    // Chart cards
    Object.entries(chartCardVisibility).forEach(([cardId, isVisible]) => {
      cards.push({
        card_id: cardId,
        card_type: 'chart',
        is_visible: isVisible
      });
    });

    return cards;
  }

  // Helper function to convert backend data to frontend format
  convertBackendToCardVisibility(backendData) {
    const tableCardVisibility = {};
    const summaryCardVisibility = {};
    const chartCardVisibility = {};

    backendData.forEach(item => {
      const { card_id, card_type, is_visible } = item;
      
      switch (card_type) {
        case 'table':
          tableCardVisibility[card_id] = Boolean(is_visible);
          break;
        case 'summary':
          summaryCardVisibility[card_id] = Boolean(is_visible);
          break;
        case 'chart':
          chartCardVisibility[card_id] = Boolean(is_visible);
          break;
        default:
          console.warn(`Unknown card type: ${card_type}`);
      }
    });

    return {
      tableCardVisibility,
      summaryCardVisibility,
      chartCardVisibility
    };
  }
}

export default new UiSettingsService();
