import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private _darkMode = new BehaviorSubject<boolean>(localStorage.getItem('darkMode') === 'true');
  private _sidebarCollapsed = new BehaviorSubject<boolean>(localStorage.getItem('sidebarCollapsed') === 'true');
  private _lang = new BehaviorSubject<string>(localStorage.getItem('lang') || 'FR');

  darkMode$ = this._darkMode.asObservable();
  sidebarCollapsed$ = this._sidebarCollapsed.asObservable();

  get isDark(): boolean { return this._darkMode.value; }
  get isCollapsed(): boolean { return this._sidebarCollapsed.value; }
  get lang(): string { return this._lang.value; }

  private translations: Record<string, Record<string, string>> = {
    FR: {
      // Navigation
      public: 'Public', club: 'Club',
      news: 'Actualités', chat: 'Messagerie', map: 'Plan de la piscine',
      prototype: 'Prototype 3D', dashboard: 'Tableau de bord', sessions: 'Séances',
      competitions: 'Compétitions', swimmers: 'Nageurs', coaches: 'Coachs',
      login: 'Se connecter', logout: 'Se déconnecter', visitor: 'Mode Visiteur',
      reduce: 'Réduire', expand: 'Agrandir', dark: '🌙 Sombre', light: '☀️ Clair',
      search: 'Rechercher...',
      // Dashboard
      overview: 'Vue d\'ensemble', welcome_today: 'Voici ce qui se passe aujourd\'hui.',
      new_session: 'Nouvelle séance', active_swimmers: 'Nageurs actifs',
      upcoming_competitions: 'Compétitions à venir', coaches_available: 'Coachs disponibles',
      avg_pool_temp: 'Temp. piscine', optimal_range: 'Plage optimale',
      weekly_chart: 'Assiduité & Performance hebdo.',
      this_week: 'Cette semaine', last_week: 'Semaine dernière', this_month: 'Ce mois',
      pct_last_month: '12% vs mois dernier', next_4_days: 'Dans 4 jours', all_active: 'Tous actifs aujourd\'hui',
      // Swimmers
      swimmers_title: 'Répertoire des nageurs', swimmers_sub: 'Gérez les membres, niveaux et statuts.',
      add_swimmer: 'Ajouter un nageur', search_swimmer: 'Rechercher un nageur...',
      all_levels: 'Tous les niveaux', all_statuses: 'Tous les statuts',
      col_swimmer: 'Nageur', col_squad: 'Catégorie', col_stroke: 'Nage principale',
      col_status: 'Statut', col_actions: 'Actions', col_start: 'Début', col_end: 'Fin',
      col_location: 'Lieu', col_level: 'Niveau', col_capacity: 'Cap.', col_coach: 'Coach',
      col_name: 'Nom', col_participants: 'Participants',
      col_specialization: 'Spécialisation', col_certification: 'Certification', col_experience: 'Expérience',
      active: 'Actif', inactive: 'Inactif', no_results: 'Aucun résultat trouvé.',
      loading: 'Chargement...', add: 'Ajouter', edit: 'Modifier', delete: 'Supprimer', save: 'Enregistrer', cancel: 'Annuler', close: 'Fermer',
      modal_add_swimmer: 'Ajouter un nageur', modal_edit_swimmer: 'Modifier un nageur',
      // Sessions
      sessions_title: 'Séances d\'entraînement', sessions_sub: 'Planifiez et gérez les séances du club.',
      search_session: 'Titre, lieu, coach...', add_session: 'Ajouter', status_active: 'Active', status_cancelled: 'Annulée',
      // Coaches
      coaches_title: 'Équipe d\'encadrement', coaches_sub: 'Gérez les coachs du club.',
      search_coach: 'Rechercher un coach...', add_coach: 'Ajouter un coach',
      status_all: 'Tous les statuts', level_all: 'Tous les niveaux',
      // Pools
      pools_title: 'Pools & Facilities', pools_sub: 'Gérez les bassins et infrastructures du club.',
      add_pool: 'Ajouter un bassin', search_pool: 'Rechercher un bassin...',
      col_pool: 'Bassin', col_specs: 'Spécifications', col_tags: 'Tags',
      pool_name: 'Nom du bassin', pool_location: 'Localisation / Adresse',
      pool_dimensions: 'Dimensions', pool_lanes: 'Couloirs',
      pool_color: 'Couleur', pool_status: 'Statut',
      pool_tags_input: 'Tags (séparés par des virgules)',
      add_pool_modal: 'Ajouter un bassin', edit_pool_modal: 'Modifier le bassin',
      create_pool_btn: 'Créer le bassin', update_pool_btn: 'Mettre à jour',
      read_only: 'Lecture seule', no_pool_found: 'Aucun bassin trouvé.',
      pool_couloirs: 'couloirs',
      // Competitions
      competitions_title: 'Compétitions', competitions_sub: 'Gérez les compétitions et les inscriptions.',
      search_competition: 'Nom, lieu...', add_competition: 'Ajouter',
      // News
      news_title: 'Actualités & Records F.T.N', news_sub: 'Données officielles de la Fédération Tunisienne de Natation.',
      sync_now: 'Synchroniser',
      // Chat
      chat_title: 'Assistant & Messagerie', chat_search: 'Rechercher...',
      // Forms
      first_name: 'Prénom', last_name: 'Nom', email: 'Email', phone: 'Téléphone',
      address: 'Adresse', birth_date: 'Date de naissance', gender: 'Genre',
      password: 'Mot de passe', confirm_password: 'Confirmer le mot de passe',
      role: 'Rôle', specialization: 'Spécialisation', experience: 'Expérience',
      description: 'Description', location: 'Lieu', capacity: 'Capacité',
      // Register / Login
      register_title: 'Créer un compte', already_account: 'Déjà un compte ?', sign_in: 'Se connecter',
      no_account: 'Pas de compte ?', create_account: 'Créer un compte',
      connect_btn: 'Se connecter', connecting: 'Connexion...',
      // IP Camera
      ipcam_title: 'Caméra IP — Streaming', ipcam_sub: 'Diffusez en direct la caméra de votre téléphone dans l\'application.',
      ipcam_connect_panel: 'Connexion au flux',
      ipcam_url_placeholder: 'ex : 192.168.1.100:8080/video',
      ipcam_connect: 'Connecter', ipcam_disconnect: 'Déconnecter',
      ipcam_quick_presets: 'Raccourcis (remplacez l\'IP) :',
      ipcam_idle: 'Entrez l\'URL du flux et cliquez sur Connecter',
      ipcam_loading: 'Connexion au flux…',
      ipcam_error: 'Impossible de charger le flux',
      ipcam_error_sub: 'Vérifiez l\'URL et que le téléphone est sur le même réseau Wi-Fi.',
      ipcam_retry: 'Réessayer',
      ipcam_fullscreen: 'Plein écran',
      ipcam_guide_title: 'Guide de configuration',
      ipcam_android_1: 'Installez « IP Webcam » sur Android',
      ipcam_android_2: 'Ouvrez l\'app et appuyez sur « Démarrer le serveur »',
      ipcam_android_3: 'Notez l\'adresse IP affichée (ex : 192.168.1.100:8080)',
      ipcam_android_4: 'Collez l\'URL ici avec /video à la fin',
      ipcam_ios_1: 'Installez « EpocCam » ou « iVCam » sur iOS',
      ipcam_ios_2: 'Lancez l\'application et autorisez l\'accès à la caméra',
      ipcam_ios_3: 'Repérez l\'adresse IP et le port dans les paramètres de l\'app',
      ipcam_ios_4: 'Saisissez l\'URL du flux MJPEG ci-dessus',
      ipcam_tip: 'Le téléphone et cet appareil doivent être connectés au même réseau Wi-Fi local. Les flux HTTP ne fonctionnent pas sur des sites HTTPS sécurisés.',
      ipcam_nav: 'Caméra IP',
      // IoT
      iot_title: 'Chronométrage & Accès', iot_sub: 'Console de supervision en temps réel des lignes d\'eau et des barrières de départ.',
      iot_nav: 'IoT Contrôle',
      iot_connect: 'Connecter le Système', iot_disconnect: 'Déconnecter',
      iot_idle: 'Système de Chronométrage Hors Ligne', iot_idle_sub: 'Veuillez connecter le terminal de chronométrage USB pour commencer.',
      iot_sensor: 'Capteur', iot_lane: 'Couloir',
      iot_first_title: 'Premier Détecté', iot_waiting: 'En attente de détection…',
      iot_reset: 'Réinitialiser',
      iot_door: 'Porte', iot_open: 'Ouvrir', iot_close: 'Fermer',
      iot_closed: 'Fermée',
      iot_wiring: 'Schéma de câblage',
      iot_serial_tip: '',
    },
    EN: {
      // Navigation
      public: 'Public', club: 'Club',
      news: 'News & Records', chat: 'Chat Assistant', map: 'Pool Map',
      prototype: '3D Prototype', dashboard: 'Dashboard', sessions: 'Sessions',
      competitions: 'Competitions', swimmers: 'Swimmers', coaches: 'Coaches',
      login: 'Log in', logout: 'Log out', visitor: 'Visitor Mode',
      reduce: 'Collapse', expand: 'Expand', dark: '🌙 Dark', light: '☀️ Light',
      search: 'Search...',
      // Dashboard
      overview: 'Overview', welcome_today: 'Here\'s what\'s happening today.',
      new_session: 'New Session', active_swimmers: 'Active Swimmers',
      upcoming_competitions: 'Upcoming Competitions', coaches_available: 'Coaches Available',
      avg_pool_temp: 'Avg Pool Temp', optimal_range: 'Optimal Range',
      weekly_chart: 'Weekly Attendance & Performance',
      this_week: 'This Week', last_week: 'Last Week', this_month: 'This Month',
      pct_last_month: '12% from last month', next_4_days: 'Next in 4 days', all_active: 'All active today',
      // Swimmers
      swimmers_title: 'Swimmers Directory', swimmers_sub: 'Manage club members, levels, and statuses.',
      add_swimmer: 'Add Swimmer', search_swimmer: 'Search a swimmer...',
      all_levels: 'All levels', all_statuses: 'All statuses',
      col_swimmer: 'Swimmer', col_squad: 'Squad', col_stroke: 'Main Stroke',
      col_status: 'Status', col_actions: 'Actions', col_start: 'Start', col_end: 'End',
      col_location: 'Location', col_level: 'Level', col_capacity: 'Cap.', col_coach: 'Coach',
      col_name: 'Name', col_participants: 'Participants',
      col_specialization: 'Specialization', col_certification: 'Certification', col_experience: 'Experience',
      active: 'Active', inactive: 'Inactive', no_results: 'No results found.',
      loading: 'Loading...', add: 'Add', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel', close: 'Close',
      modal_add_swimmer: 'Add Swimmer', modal_edit_swimmer: 'Edit Swimmer',
      // Sessions
      sessions_title: 'Training Sessions', sessions_sub: 'Plan and manage club sessions.',
      search_session: 'Title, location, coach...', add_session: 'Add', status_active: 'Active', status_cancelled: 'Cancelled',
      // Coaches
      coaches_title: 'Coaching Staff', coaches_sub: 'Manage club coaches.',
      search_coach: 'Search a coach...', add_coach: 'Add Coach',
      status_all: 'All statuses', level_all: 'All levels',
      // Pools
      pools_title: 'Pools & Facilities', pools_sub: 'Manage club pools and infrastructure.',
      add_pool: 'Add Pool', search_pool: 'Search a pool...',
      col_pool: 'Pool', col_specs: 'Specifications', col_tags: 'Tags',
      pool_name: 'Pool name', pool_location: 'Location / Address',
      pool_dimensions: 'Dimensions', pool_lanes: 'Lanes',
      pool_color: 'Color', pool_status: 'Status',
      pool_tags_input: 'Tags (comma separated)',
      add_pool_modal: 'Add New Pool', edit_pool_modal: 'Edit Pool',
      create_pool_btn: 'Create Pool', update_pool_btn: 'Update',
      read_only: 'Read only', no_pool_found: 'No pool found.',
      pool_couloirs: 'lanes',
      // Competitions
      competitions_title: 'Competitions', competitions_sub: 'Manage competitions and registrations.',
      search_competition: 'Name, location...', add_competition: 'Add',
      // News
      news_title: 'F.T.N Records & News', news_sub: 'Official data feed from Fédération Tunisienne de Natation.',
      sync_now: 'Sync Now',
      // Chat
      chat_title: 'Assistant & Chats', chat_search: 'Search...',
      // Forms
      first_name: 'First Name', last_name: 'Last Name', email: 'Email', phone: 'Phone',
      address: 'Address', birth_date: 'Date of Birth', gender: 'Gender',
      password: 'Password', confirm_password: 'Confirm Password',
      role: 'Role', specialization: 'Specialization', experience: 'Experience',
      description: 'Description', location: 'Location', capacity: 'Capacity',
      // Register / Login
      register_title: 'Create an account', already_account: 'Already have an account?', sign_in: 'Sign in',
      no_account: 'No account?', create_account: 'Create account',
      connect_btn: 'Sign in', connecting: 'Signing in...',
      // IP Camera
      ipcam_title: 'IP Camera — Live Stream', ipcam_sub: 'Stream your phone camera live directly inside the app.',
      ipcam_connect_panel: 'Stream Connection',
      ipcam_url_placeholder: 'e.g. 192.168.1.100:8080/video',
      ipcam_connect: 'Connect', ipcam_disconnect: 'Disconnect',
      ipcam_quick_presets: 'Quick presets (replace IP):',
      ipcam_idle: 'Enter the stream URL and click Connect',
      ipcam_loading: 'Connecting to stream…',
      ipcam_error: 'Unable to load stream',
      ipcam_error_sub: 'Check the URL and make sure the phone is on the same Wi-Fi network.',
      ipcam_retry: 'Retry',
      ipcam_fullscreen: 'Fullscreen',
      ipcam_guide_title: 'Setup Guide',
      ipcam_android_1: 'Install "IP Webcam" from the Play Store',
      ipcam_android_2: 'Open the app and tap "Start server"',
      ipcam_android_3: 'Note the IP address shown (e.g. 192.168.1.100:8080)',
      ipcam_android_4: 'Paste the URL here with /video appended',
      ipcam_ios_1: 'Install "EpocCam" or "iVCam" from the App Store',
      ipcam_ios_2: 'Launch the app and allow camera access',
      ipcam_ios_3: 'Find the IP address and port in the app settings',
      ipcam_ios_4: 'Enter the MJPEG stream URL above',
      ipcam_tip: 'Both the phone and this device must be on the same local Wi-Fi network. HTTP streams may not work on HTTPS-secured pages.',
      ipcam_nav: 'IP Camera',
      // IoT
      iot_title: 'Timing & Access Control', iot_sub: 'Real-time pool lanes and start gates management console.',
      iot_nav: 'IoT Control',
      iot_connect: 'Connect System', iot_disconnect: 'Disconnect',
      iot_idle: 'Timing System Offline', iot_idle_sub: 'Please connect the USB timing terminal to start monitoring.',
      iot_sensor: 'Sensor', iot_lane: 'Lane',
      iot_first_title: 'First Detected', iot_waiting: 'Waiting for detection…',
      iot_reset: 'Reset',
      iot_door: 'Door', iot_open: 'Open', iot_close: 'Close',
      iot_closed: 'Closed',
      iot_wiring: 'Wiring Diagram',
      iot_serial_tip: '',
    }
  };

  t(key: string): string {
    return this.translations[this._lang.value]?.[key] ?? key;
  }

  toggleLang(): void {
    const next = this._lang.value === 'FR' ? 'EN' : 'FR';
    this._lang.next(next);
    localStorage.setItem('lang', next);
  }

  initDarkMode(): void {
    if (this._darkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleDarkMode(): void {
    const next = !this._darkMode.value;
    this._darkMode.next(next);
    localStorage.setItem('darkMode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleSidebar(): void {
    const next = !this._sidebarCollapsed.value;
    this._sidebarCollapsed.next(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  }
}
