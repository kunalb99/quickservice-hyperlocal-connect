
import { Provider, ProviderType, Request, RequestStatus, SearchHistory, User } from "@/types";

export interface AppContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchHistory: SearchHistory[];
  activeRequest: Request | null;
  searchResults: Provider[];
  isSearching: boolean;
  isRequesting: boolean;
  search: (query: string) => void;
  sendRequest: () => void;
  cancelRequest: () => void;
  selectedProvider: Provider | null;
  setSelectedProvider: (provider: Provider | null) => void;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}
