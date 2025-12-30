import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, serverUrl, token, functionsVersion } = appParams;

// Create base client
const baseClient = createClient({
  appId,
  serverUrl,
  token,
  functionsVersion,
  requiresAuth: false
});

// Development mode: wrap client to return mock data and prevent API calls
const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

if (isDevMode) {
  console.log('🔧 Base44 client running in development mode - API calls will return empty data');
}

// Wrap the client to handle dev mode
export const base44 = isDevMode ? {
  auth: {
    me: async () => ({
      id: 'dev-user',
      email: 'dev@example.com',
      full_name: 'Development User',
      name: 'Development User',
      role: 'admin'
    }),
    logout: () => {
      console.log('🔧 Dev mode: logout called');
      window.location.reload();
    },
    redirectToLogin: () => console.log('🔧 Dev mode: redirectToLogin called')
  },
  entities: new Proxy({}, {
    get: (target, entityName) => {
      return {
        list: async () => {
          console.log(`🔧 Dev mode: ${entityName}.list() returning empty array`);
          return [];
        },
        filter: async () => {
          console.log(`🔧 Dev mode: ${entityName}.filter() returning empty array`);
          return [];
        },
        get: async (id) => {
          console.log(`🔧 Dev mode: ${entityName}.get(${id}) returning null`);
          return null;
        },
        create: async (data) => {
          console.log(`🔧 Dev mode: ${entityName}.create()`, data);
          return { id: 'dev-id-' + Date.now(), ...data };
        },
        update: async (id, data) => {
          console.log(`🔧 Dev mode: ${entityName}.update(${id})`, data);
          return { id, ...data };
        },
        delete: async (id) => {
          console.log(`🔧 Dev mode: ${entityName}.delete(${id})`);
          return { success: true };
        }
      };
    }
  }),
  functions: {
    call: async (name, data) => {
      console.log(`🔧 Dev mode: functions.call(${name})`, data);
      return { success: true };
    }
  },
  appLogs: {
    logUserInApp: async (pageName) => {
      console.log(`🔧 Dev mode: logging user activity on page: ${pageName}`);
      return { success: true };
    }
  },
  integrations: {
    Core: {
      InvokeLLM: async (params) => {
        console.log('🔧 Dev mode: InvokeLLM called', params);
        // Return mock exchange rate
        return {
          sell_rate: 18.50,
          date: new Date().toISOString().split('T')[0]
        };
      }
    }
  }
} : baseClient;
