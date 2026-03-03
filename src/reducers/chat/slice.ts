import { createAsyncThunk } from '@reduxjs/toolkit';

import { configService, SnowflakeConfig } from '../../services/configService';
import { domoService } from '../../services/domoService';
import {
  RecentQueriesService,
  RecentQuery,
} from '../../services/recentQueriesService';
import { createAppSlice } from '../createAppSlice';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string; // ISO string format
  isError?: boolean;
  isHTML?: boolean;
}

export interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
  sql?: string; // Physical SQL (for execution/rerun)
  logicalSql?: string; // Logical SQL (for display to user)
  queryText?: string; // Store the original question
  analystMessage?: string; // Store the analyst interpretation
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  config: SnowflakeConfig | null;
  isConfigLoaded: boolean;
  isConfigPanelOpen: boolean;
  currentTableData: TableData | null;
  isTableModalOpen: boolean;
  recentQueries: RecentQuery[];
  isLoadingQueries: boolean;
  showQueryResults: boolean; // Toggle between query history and results
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  config: null,
  isConfigLoaded: false,
  isConfigPanelOpen: false,
  currentTableData: null,
  isTableModalOpen: false,
  recentQueries: [],
  isLoadingQueries: false,
  showQueryResults: false,
};

// ID counter to ensure unique message IDs
let messageIdCounter = 0;

// Async thunks
export const loadConfiguration = createAsyncThunk(
  'chat/loadConfiguration',
  async () => {
    await domoService.loadConfiguration();
    const config = domoService.getConfig();
    return config;
  },
);

export const saveConfiguration = createAsyncThunk(
  'chat/saveConfiguration',
  async (config: SnowflakeConfig) => {
    await configService.saveConfig(config);
    await domoService.loadConfiguration();
    return config;
  },
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (message: string, { rejectWithValue }) => {
    try {
      const response = await domoService.sendMessage(message);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loadRecentQueries = createAsyncThunk(
  'chat/loadRecentQueries',
  async () => {
    const queries = await RecentQueriesService.fetchRecentQueries();
    return queries;
  },
);

export const saveRecentQuery = createAsyncThunk(
  'chat/saveRecentQuery',
  async (query: Omit<RecentQuery, 'id' | 'createdOn' | 'owner'>) => {
    const savedQuery = await RecentQueriesService.saveQuery(query);
    return savedQuery;
  },
);

export const deleteRecentQuery = createAsyncThunk(
  'chat/deleteRecentQuery',
  async (queryId: string) => {
    await RecentQueriesService.deleteQuery(queryId);
    return queryId;
  },
);

export const clearRecentQueries = createAsyncThunk(
  'chat/clearRecentQueries',
  async () => {
    await RecentQueriesService.clearAllQueries();
  },
);

const chatSlice = createAppSlice({
  name: 'chat',
  initialState,
  reducers: (create) => ({
    addMessage: create.reducer(
      (state, action: { payload: Omit<ChatMessage, 'id' | 'timestamp'> }) => {
        messageIdCounter += 1;
        const newMessage: ChatMessage = {
          ...action.payload,
          id: `${Date.now()}-${messageIdCounter}`,
          timestamp: new Date().toISOString(),
        };
        state.messages.push(newMessage);
      },
    ),
    openConfigPanel: create.reducer((state) => {
      state.isConfigPanelOpen = true;
    }),
    closeConfigPanel: create.reducer((state) => {
      state.isConfigPanelOpen = false;
    }),
    openTableModal: create.reducer((state, action: { payload: TableData }) => {
      state.currentTableData = action.payload;
      state.isTableModalOpen = true;
      state.showQueryResults = true;
    }),
    closeTableModal: create.reducer((state) => {
      state.isTableModalOpen = false;
    }),
    showQueryHistory: create.reducer((state) => {
      state.showQueryResults = false;
    }),
    showResults: create.reducer((state) => {
      state.showQueryResults = true;
    }),
    clearConversation: create.reducer((state) => {
      state.messages = [];
      domoService.clearConversationHistory();
    }),
  }),
  extraReducers: (builder) => {
    builder
      // Load configuration
      .addCase(loadConfiguration.fulfilled, (state, action) => {
        state.config = action.payload;
        state.isConfigLoaded = true;
      })
      // Save configuration
      .addCase(saveConfiguration.fulfilled, (state, action) => {
        state.config = action.payload;
        state.isConfigPanelOpen = false;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isTyping = true;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.isTyping = false;
        // Messages will be added by components based on response structure
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isTyping = false;
        messageIdCounter += 1;
        const errorMessage: ChatMessage = {
          id: `${Date.now()}-${messageIdCounter}`,
          sender: 'bot',
          content:
            (action.payload as string) ||
            'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true,
        };
        state.messages.push(errorMessage);
      })
      // Load recent queries
      .addCase(loadRecentQueries.pending, (state) => {
        state.isLoadingQueries = true;
      })
      .addCase(loadRecentQueries.fulfilled, (state, action) => {
        state.isLoadingQueries = false;
        state.recentQueries = action.payload;
      })
      .addCase(loadRecentQueries.rejected, (state) => {
        state.isLoadingQueries = false;
      })
      // Save recent query
      .addCase(saveRecentQuery.pending, () => {
        console.log('Saving query...');
      })
      .addCase(saveRecentQuery.fulfilled, (state, action) => {
        console.log('Query saved to state:', action.payload);
        state.recentQueries.unshift(action.payload);
        // Keep only the 50 most recent
        if (state.recentQueries.length > 50) {
          state.recentQueries = state.recentQueries.slice(0, 50);
        }
      })
      .addCase(saveRecentQuery.rejected, (_state, action) => {
        console.error('Failed to save query to state:', action.error);
      })
      // Delete recent query
      .addCase(deleteRecentQuery.fulfilled, (state, action) => {
        state.recentQueries = state.recentQueries.filter(
          (query) => query.id !== action.payload,
        );
      })
      // Clear recent queries
      .addCase(clearRecentQueries.fulfilled, (state) => {
        state.recentQueries = [];
      });
  },
});

export const {
  addMessage,
  openConfigPanel,
  closeConfigPanel,
  openTableModal,
  closeTableModal,
  showQueryHistory,
  showResults,
  clearConversation,
} = chatSlice.actions;

export default chatSlice.reducer;
