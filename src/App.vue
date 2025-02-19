<template>
  <div
    id="app"
    class="h-screen flex flex-col font-sans overflow-hidden antialiased"
  >
    <WindowsTitleBar v-if="platform === 'Windows'" />
    <Desk
      class="flex-1"
      v-if="activeScreen === 'Desk'"
      @change-db-file="changeDbFile"
    />
    <DatabaseSelector
      v-if="activeScreen === 'DatabaseSelector'"
      @database-connect="showSetupWizardOrDesk(true)"
    />
    <SetupWizard
      v-if="activeScreen === 'SetupWizard'"
      @setup-complete="showSetupWizardOrDesk(true)"
    />
    <portal-target name="popovers" multiple></portal-target>
  </div>
</template>

<script>
import './styles/index.css';
import frappe from 'frappejs';
import Desk from './pages/Desk';
import SetupWizard from './pages/SetupWizard/SetupWizard';
import DatabaseSelector from './pages/DatabaseSelector';
import WindowsTitleBar from '@/components/WindowsTitleBar';
import { ipcRenderer } from 'electron';
import config from '@/config';
import { routeTo } from '@/utils';
import { IPC_MESSAGES, IPC_ACTIONS } from '@/messages';
import { connectToLocalDatabase, purgeCache } from '@/initialization';

export default {
  name: 'App',
  data() {
    return {
      activeScreen: null,
    };
  },
  watch: {
    async activeScreen(value) {
      if (!value) return;
      const { width, height } = await ipcRenderer.invoke(
        IPC_ACTIONS.GET_PRIMARY_DISPLAY_SIZE
      );

      let size = {
        Desk: [width, height],
        DatabaseSelector: [600, 600],
        SetupWizard: [600, 600],
      }[value];
      let resizable = value === 'Desk';

      if (size.length) {
        ipcRenderer.send(IPC_MESSAGES.RESIZE_MAIN_WINDOW, size, resizable);
      }
    },
  },
  components: {
    Desk,
    SetupWizard,
    DatabaseSelector,
    WindowsTitleBar,
  },
  async mounted() {
    const lastSelectedFilePath = config.get('lastSelectedFilePath', null);
    const connectionSuccess = await connectToLocalDatabase(
      lastSelectedFilePath
    );

    if (connectionSuccess) {
      this.showSetupWizardOrDesk();
    } else {
      this.activeScreen = 'DatabaseSelector';
    }
  },
  methods: {
    async showSetupWizardOrDesk(resetRoute = false) {
      const { setupComplete } = frappe.AccountingSettings;
      if (!setupComplete) {
        this.activeScreen = 'SetupWizard';
      } else {
        this.activeScreen = 'Desk';
        this.checkForUpdates();
      }

      if (!resetRoute) {
        return;
      }

      const { onboardingComplete } = await frappe.getSingle('GetStarted');
      const { hideGetStarted } = await frappe.getSingle('SystemSettings');

      if (hideGetStarted || onboardingComplete) {
        routeTo('/');
      } else {
        routeTo('/get-started');
      }
    },
    checkForUpdates() {
      frappe.events.trigger('check-for-updates');
    },
    changeDbFile() {
      config.set('lastSelectedFilePath', null);
      purgeCache(true);
      this.activeScreen = 'DatabaseSelector';
    },
  },
};
</script>
