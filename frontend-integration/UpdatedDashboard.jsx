import { useState, useEffect } from "react";
import TableCard from "../components/TableCard";
import Card from "../components/Card";
import ChartCard from "../components/ChartCard";
import DashboardSidebar from "../components/DashboardSidebar";
import uiSettingsService from "../services/uiSettingsService"; // Adjust import path as needed

import {
  duePaymentsData,
  overDuePaymentsData,
  recentPaymentsData,
  pendingApprovalsData,
  completedTransactionsData,
  customerFeedbackData,
  loanRequestsData,
  inventoryChecksData,
  employeePerformanceData,
  riskAssessmentData,
  totalRevenueData,
  activeLoansData,
  customerStatsData,
  inventorySummaryData,
  loanPerformanceData,
  collectionStatsData,
  branchPerformanceData,
  itemCategoriesData,
  employeeStatsData,
  riskAssessmentsData,
  revenueTrendsData,
  loanDistributionData,
  monthlyPaymentsData,
  customerGrowthData,
  loanStatusData,
  collectionEfficiencyData,
  itemValueDistributionData,
  branchComparisonData,
  riskDistributionData,
  monthlyTargetsData,
} from "../utils/dashboard.data";

function Dashboard() {
  // You need to get these from your authentication context or props
  const [currentBranchId, setCurrentBranchId] = useState(1); // Replace with actual branch ID
  const [isLoading, setIsLoading] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Generate more table data
  const generateTableData = (baseData, count) => {
    const result = [];
    for (let i = 0; i < count; i++) {
      const item = baseData[i % baseData.length];
      result.push({
        ...item,
        customerName: item.customerName,
        totalInvoiceAmount: (
          parseFloat(item.totalInvoiceAmount.replace(/,/g, "")) +
          i * 100
        ).toFixed(2),
        loanId: `${item.loanId}-${i}`,
      });
    }
    return result;
  };

  const TableCardData = [
    {
      id: "due-payments",
      title: "Due Payments",
      entries: generateTableData(duePaymentsData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
    {
      id: "overdue-payments",
      title: "Overdue Payments",
      entries: generateTableData(overDuePaymentsData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
    {
      id: "recent-transactions",
      title: "Recent Transactions",
      entries: generateTableData(recentPaymentsData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
    {
      id: "pending-approvals",
      title: "Pending Approvals",
      entries: generateTableData(pendingApprovalsData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
    {
      id: "completed-transactions",
      title: "Completed Transactions",
      entries: generateTableData(completedTransactionsData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
    {
      id: "customer-feedback",
      title: "Customer Feedback",
      entries: generateTableData(customerFeedbackData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
    {
      id: "loan-requests",
      title: "Loan Requests",
      entries: generateTableData(loanRequestsData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
    {
      id: "inventory-checks",
      title: "Inventory Checks",
      entries: generateTableData(inventoryChecksData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
    {
      id: "employee-performance",
      title: "Employee Performance",
      entries: generateTableData(employeePerformanceData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
    {
      id: "risk-assessment",
      title: "Risk Assessment",
      entries: generateTableData(riskAssessmentData, 10),
      currentRange: "1-10",
      totalEntries: 10,
    },
  ];

  const CardData = [
    {
      id: "total-revenue",
      title: "Total Revenue",
      items: totalRevenueData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "active-loans",
      title: "Active Loans",
      items: activeLoansData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "customer-stats",
      title: "Customer Statistics",
      items: customerStatsData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "inventory-summary",
      title: "Inventory Summary",
      items: inventorySummaryData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "loan-performance",
      title: "Loan Performance",
      items: loanPerformanceData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "collection-stats",
      title: "Collection Stats",
      items: collectionStatsData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "branch-performance",
      title: "Branch Performance",
      items: branchPerformanceData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "item-categories",
      title: "Item Categories",
      items: itemCategoriesData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "employee-stats",
      title: "Employee Stats",
      items: employeeStatsData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "risk-assessment-summary",
      title: "Risk Assessment",
      items: riskAssessmentsData,
      entriesPerPage: 3,
      currentRange: "1-3",
      totalEntries: 3,
    },
  ];

  const ChartCardData = [
    {
      id: "revenue-trends",
      title: "Revenue Trends",
      data: revenueTrendsData,
      currentRange: "1-6",
      totalEntries: 6,
    },
    {
      id: "loan-distribution",
      title: "Loan Distribution",
      data: loanDistributionData,
      currentRange: "1-5",
      totalEntries: 5,
    },
    {
      id: "monthly-payments",
      title: "Monthly Payments",
      data: monthlyPaymentsData,
      currentRange: "1-4",
      totalEntries: 4,
    },
    {
      id: "customer-growth",
      title: "Customer Growth",
      data: customerGrowthData,
      currentRange: "1-4",
      totalEntries: 4,
    },
    {
      id: "loan-status",
      title: "Loan Status",
      data: loanStatusData,
      currentRange: "1-4",
      totalEntries: 4,
    },
    {
      id: "collection-efficiency",
      title: "Collection Efficiency",
      data: collectionEfficiencyData,
      currentRange: "1-4",
      totalEntries: 4,
    },
    {
      id: "item-value-distribution",
      title: "Item Value Distribution",
      data: itemValueDistributionData,
      currentRange: "1-5",
      totalEntries: 5,
    },
    {
      id: "branch-comparison",
      title: "Branch Comparison",
      data: branchComparisonData,
      currentRange: "1-4",
      totalEntries: 4,
    },
    {
      id: "risk-distribution",
      title: "Risk Distribution",
      data: riskDistributionData,
      currentRange: "1-3",
      totalEntries: 3,
    },
    {
      id: "monthly-targets",
      title: "Monthly Targets",
      data: monthlyTargetsData,
      currentRange: "1-6",
      totalEntries: 6,
    },
  ];

  // State for sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved ? JSON.parse(saved) : true;
  });

  // State for card visibility - Initialize with default values
  const [cardVisibility, setCardVisibility] = useState(() => {
    const initialState = {};
    TableCardData.forEach((card) => {
      initialState[card.id] = true;
    });
    return initialState;
  });

  const [summaryCardVisibility, setSummaryCardVisibility] = useState(() => {
    const initialState = {};
    CardData.forEach((card) => {
      initialState[card.id] = true;
    });
    return initialState;
  });

  const [chartCardVisibility, setChartCardVisibility] = useState(() => {
    const initialState = {};
    ChartCardData.forEach((card) => {
      initialState[card.id] = true;
    });
    return initialState;
  });

  // State for card styles - Load from localStorage
  const [cardStyles, setCardStyles] = useState(() => {
    const saved = localStorage.getItem("cardStyles");
    if (saved) {
      return JSON.parse(saved);
    }
    const initialState = {};
    [...CardData, ...TableCardData, ...ChartCardData].forEach((card) => {
      initialState[card.id] = {
        bgColor: "#ffffff",
        fontColor: "#000000",
        cardType: card.items ? "summary" : card.entries ? "table" : "chart",
      };
    });
    return initialState;
  });

  // State for drag and drop
  const [cardOrder, setCardOrder] = useState(() => {
    const saved = localStorage.getItem("cardOrder");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      summary: CardData.map((card) => card.id),
      table: TableCardData.map((card) => card.id),
      chart: ChartCardData.map((card) => card.id),
    };
  });

  // State for dragging
  const [dragging, setDragging] = useState(null);

  // Load card visibility from backend on component mount
  useEffect(() => {
    loadCardVisibilityFromBackend();
  }, [currentBranchId]);

  // Load card visibility from backend
  const loadCardVisibilityFromBackend = async () => {
    if (!currentBranchId) return;
    
    setIsLoading(true);
    try {
      const response = await uiSettingsService.getDashboardCardVisibility(currentBranchId);
      if (response.data && response.data.length > 0) {
        const { tableCardVisibility, summaryCardVisibility: backendSummaryVisibility, chartCardVisibility: backendChartVisibility } = 
          uiSettingsService.convertBackendToCardVisibility(response.data);
        
        // Merge with default states to ensure all cards have visibility settings
        setCardVisibility(prev => ({ ...prev, ...tableCardVisibility }));
        setSummaryCardVisibility(prev => ({ ...prev, ...backendSummaryVisibility }));
        setChartCardVisibility(prev => ({ ...prev, ...backendChartVisibility }));
      }
    } catch (error) {
      console.error('Error loading card visibility from backend:', error);
      // Fallback to localStorage if backend fails
      const savedTable = localStorage.getItem("tableCardVisibility");
      const savedSummary = localStorage.getItem("summaryCardVisibility");
      const savedChart = localStorage.getItem("chartCardVisibility");
      
      if (savedTable) setCardVisibility(JSON.parse(savedTable));
      if (savedSummary) setSummaryCardVisibility(JSON.parse(savedSummary));
      if (savedChart) setChartCardVisibility(JSON.parse(savedChart));
    } finally {
      setIsLoading(false);
    }
  };

  // Save card visibility to backend with debouncing
  const saveCardVisibilityToBackend = async (tableVis, summaryVis, chartVis) => {
    if (!currentBranchId) return;

    try {
      const cards = uiSettingsService.convertCardVisibilityToBackend(tableVis, summaryVis, chartVis);
      await uiSettingsService.bulkUpdateDashboardCardVisibility(currentBranchId, cards);
      console.log('Card visibility saved to backend successfully');
    } catch (error) {
      console.error('Error saving card visibility to backend:', error);
      // Continue to save to localStorage as fallback
    }
  };

  // Debounced save function
  const debouncedSave = (tableVis, summaryVis, chartVis) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      saveCardVisibilityToBackend(tableVis, summaryVis, chartVis);
    }, 1000); // Save after 1 second of no changes

    setSaveTimeout(timeout);
  };

  // Save to localStorage and backend whenever states change
  useEffect(() => {
    localStorage.setItem("cardStyles", JSON.stringify(cardStyles));
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
    localStorage.setItem("tableCardVisibility", JSON.stringify(cardVisibility));
    localStorage.setItem("summaryCardVisibility", JSON.stringify(summaryCardVisibility));
    localStorage.setItem("chartCardVisibility", JSON.stringify(chartCardVisibility));
    localStorage.setItem("cardOrder", JSON.stringify(cardOrder));

    // Save to backend (debounced)
    debouncedSave(cardVisibility, summaryCardVisibility, chartCardVisibility);
  }, [
    isSidebarOpen,
    cardVisibility,
    summaryCardVisibility,
    chartCardVisibility,
    cardStyles,
    cardOrder,
  ]);

  // Toggle functions
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCardVisibility = (cardId) => {
    setCardVisibility((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const toggleSummaryCardVisibility = (cardId) => {
    setSummaryCardVisibility((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const toggleChartCardVisibility = (cardId) => {
    setChartCardVisibility((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const toggleAllCards = (show) => {
    const newState = {};
    TableCardData.forEach((card) => {
      newState[card.id] = show;
    });
    setCardVisibility(newState);
  };

  const toggleAllSummaryCards = (show) => {
    const newState = {};
    CardData.forEach((card) => {
      newState[card.id] = show;
    });
    setSummaryCardVisibility(newState);
  };

  const toggleAllChartCards = (show) => {
    const newState = {};
    ChartCardData.forEach((card) => {
      newState[card.id] = show;
    });
    setChartCardVisibility(newState);
  };

  // Style update function
  const updateCardStyle = (cardId, newStyles) => {
    setCardStyles((prev) => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        ...newStyles,
      },
    }));
  };

  // Drag and drop functions
  const handleDragStart = (e, cardId, cardType) => {
    e.dataTransfer.setData("cardId", cardId);
    e.dataTransfer.setData("cardType", cardType);
    setDragging(cardId);
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDragging(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetCardId, cardType) => {
    e.preventDefault();
    const sourceCardId = e.dataTransfer.getData("cardId");
    const sourceCardType = e.dataTransfer.getData("cardType");

    if (sourceCardId !== targetCardId && sourceCardType === cardType) {
      const newOrder = [...cardOrder[cardType]];
      const sourceIndex = newOrder.indexOf(sourceCardId);
      const targetIndex = newOrder.indexOf(targetCardId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, sourceCardId);

        setCardOrder((prev) => ({
          ...prev,
          [cardType]: newOrder,
        }));
      }
    }
  };

  // Get ordered cards based on cardOrder state
  const getOrderedCards = (cards, type) => {
    return cardOrder[type]
      .map((id) => cards.find((card) => card.id === id))
      .filter((card) => card !== undefined);
  };

  // Count visible cards
  const visibleTableCount = Object.values(cardVisibility).filter(Boolean).length;
  const visibleSummaryCount = Object.values(summaryCardVisibility).filter(Boolean).length;
  const visibleChartCount = Object.values(chartCardVisibility).filter(Boolean).length;
  const totalVisibleCards = visibleTableCount + visibleSummaryCount + visibleChartCount;

  // Get visible and ordered cards
  const visibleTableCards = getOrderedCards(TableCardData, "table").filter(
    (card) => cardVisibility[card.id]
  );
  const visibleSummaryCards = getOrderedCards(CardData, "summary").filter(
    (card) => summaryCardVisibility[card.id]
  );
  const visibleChartCards = getOrderedCards(ChartCardData, "chart").filter(
    (card) => chartCardVisibility[card.id]
  );

  // Group cards into pairs for layout
  const tableCardPairs = [];
  for (let i = 0; i < visibleTableCards.length; i += 2) {
    tableCardPairs.push(visibleTableCards.slice(i, i + 2));
  }

  const chartCardPairs = [];
  for (let i = 0; i < visibleChartCards.length; i += 2) {
    chartCardPairs.push(visibleChartCards.slice(i, i + 2));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Sidebar Component */}
      <DashboardSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        cardVisibility={cardVisibility}
        toggleCardVisibility={toggleCardVisibility}
        summaryCardVisibility={summaryCardVisibility}
        toggleSummaryCardVisibility={toggleSummaryCardVisibility}
        chartCardVisibility={chartCardVisibility}
        toggleChartCardVisibility={toggleChartCardVisibility}
        toggleAllCards={toggleAllCards}
        toggleAllSummaryCards={toggleAllSummaryCards}
        toggleAllChartCards={toggleAllChartCards}
        TableCardData={TableCardData}
        CardData={CardData}
        ChartCardData={ChartCardData}
        visibleTableCount={visibleTableCount}
        visibleSummaryCount={visibleSummaryCount}
        visibleChartCount={visibleChartCount}
        totalVisibleCards={totalVisibleCards}
        cardStyles={cardStyles}
        updateCardStyle={updateCardStyle}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 overflow-hidden">
        <div className="max-w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h2>
              <p className="text-gray-600 text-sm">
                Manage your pawning system overview
              </p>
              {saveTimeout && (
                <p className="text-xs text-blue-500 mt-1">
                  Saving settings...
                </p>
              )}
            </div>

            {/* Header Stats and Mobile Toggle */}
            <div className="flex items-center gap-4">
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <div className="text-xs text-gray-500">Active Cards</div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {totalVisibleCards}
                </div>
              </div>

              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <div className="text-xs text-gray-500">Branch</div>
                <div className="text-sm font-semibold text-gray-700">
                  {currentBranchId}
                </div>
              </div>

              {/* Mobile Sidebar Toggle */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-3 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Cards Display Section */}
          <div className="space-y-8">
            {/* Summary Cards Grid - 4 cards per row */}
            {visibleSummaryCount > 0 && (
              <div className="animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visibleSummaryCards.map((data) => (
                    <div
                      key={data.id}
                      className={`transform hover:scale-105 transition-all duration-300 ${
                        dragging === data.id ? "opacity-50" : "opacity-100"
                      }`}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, data.id, "summary")
                      }
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, data.id, "summary")}
                    >
                      <Card
                        title={data.title}
                        items={data.items}
                        entriesPerPage={data.entriesPerPage}
                        currentRange={data.currentRange}
                        totalEntries={data.totalEntries}
                        style={cardStyles[data.id]}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Table Cards Section - 2 cards per row */}
            {visibleTableCount > 0 && (
              <div className="animate-in fade-in duration-500">
                <div className="space-y-6">
                  {tableCardPairs.map((cardPair, pairIndex) => (
                    <div
                      key={`table-pair-${pairIndex}`}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      {cardPair.map((data) => (
                        <div
                          key={data.id}
                          className={`transform hover:scale-[1.02] transition-all duration-300 ${
                            dragging === data.id ? "opacity-50" : "opacity-100"
                          }`}
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, data.id, "table")
                          }
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, data.id, "table")}
                        >
                          <TableCard
                            title={data.title}
                            entries={data.entries}
                            currentRange={data.currentRange}
                            totalEntries={data.totalEntries}
                            style={cardStyles[data.id]}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart Cards Grid - 2 cards per row */}
            {visibleChartCount > 0 && (
              <div className="animate-in fade-in duration-500">
                <div className="space-y-6">
                  {chartCardPairs.map((cardPair, pairIndex) => (
                    <div
                      key={`chart-pair-${pairIndex}`}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      {cardPair.map((data) => (
                        <div
                          key={data.id}
                          className={`transform hover:scale-[1.02] transition-all duration-300 ${
                            dragging === data.id ? "opacity-50" : "opacity-100"
                          }`}
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, data.id, "chart")
                          }
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, data.id, "chart")}
                        >
                          <ChartCard
                            title={data.title}
                            chartType={data.chartType}
                            data={data.data}
                            currentRange={data.currentRange}
                            totalEntries={data.totalEntries}
                            style={cardStyles[data.id]}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Cards Message */}
            {totalVisibleCards === 0 && (
              <div className="text-center py-16 animate-in fade-in duration-500">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-xl max-w-2xl mx-auto">
                  <div className="text-gray-400 mb-6">
                    <div className="relative">
                      <svg
                        className="mx-auto w-24 h-24 opacity-60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-sm">✨</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-3">
                    Welcome to Your Dashboard!
                  </h3>
                  <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                    Use the sidebar to enable cards and customize your dashboard
                    view.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
