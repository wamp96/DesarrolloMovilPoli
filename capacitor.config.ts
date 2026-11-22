import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.edu.poligran.gestu',
  appName: 'GestU',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      iconColor: '#2563eb',
    },
  },
};

export default config;
