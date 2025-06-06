export interface AgentDetails {
  name: string;
  description: string;
  systemPrompt: string;
  persona: string;
  model: string;
}

export interface Agent {
  id?: string;
  version: number;
  details: AgentDetails;
  status: 'enabled' | 'disabled' | 'pending' | 'error';
}

export type Theme = 'dark' | 'light' | 'system';

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};
