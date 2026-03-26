import type { Lang } from '../context/LanguageContext'

export type TranslationKey =
  // Search / map UI
  | 'search_placeholder'
  | 'quick_hub_bazaar'
  | 'quick_hub_station'
  | 'quick_hub_hospital'
  | 'quick_hub_school'
  | 'where_am_i'
  | 'search_no_results'
  | 'search_searching'
  | 'locating'
  | 'gps_error'
  | 'distance_away'
  | 'recommended_route'
  // Bottom sheet
  | 'arriving_time'
  | 'nearby'
  | 'no_routes'
  | 'route'
  | 'min_abbr'
  | 'less_than_1_min'
  // Driver mode
  | 'driver_section'
  | 'driver_login_label'
  | 'driver_pin_required'
  | 'enter_pin_title'
  | 'verify'
  | 'wrong_pin'
  | 'start_route'
  | 'stop_route'
  | 'broadcasting_active'
  | 'driver_mode_active'
  | 'select_route_placeholder'
  | 'driver_exit'
  | 'driver_gps_on'
  | 'driver_gps_off'
  | 'driver_screen_hint'
  | 'uploaded'
  | 'sec_abbr'
  // Menu / navigation
  | 'language_section'
  | 'navigation_section'
  | 'all_routes'
  | 'bus_stops'
  | 'help'
  | 'close'
  // Status
  | 'offline_mode'
  | 'live_badge'
  // Onboarding
  | 'onboarding_instruction_ru'
  | 'onboarding_instruction_kz'
  | 'onboarding_ios_hint'
  | 'understood'
  // Bottom sheet extras
  | 'loading_buses'
  | 'nearest_bus'
  | 'swipe_for_more'
  // Bus info card
  | 'just_now'
  | 'min_ago'
  | 'bus_info_title'
  | 'show_route'
  | 'updated_label'
  // Routes panel
  | 'routes_panel_title'
  | 'buses_active'
  // Distance context labels
  | 'walk_to_route'
  | 'distance_to_dest'
  // Clear map button
  | 'clear_map'
  // Location errors (passenger "Where am I?" + driver GPS)
  | 'location_permission_denied'
  | 'location_unavailable'
  | 'gps_permission_denied'
  // Driver auth
  | 'pin_already_active'
  // PWA update banner
  | 'update_available'
  | 'update_refresh'

type Dictionary = Record<TranslationKey, string>

const kz: Dictionary = {
  // Search / map UI
  search_placeholder: 'Іздеу',
  quick_hub_bazaar: 'Базар',
  quick_hub_station: 'Автовокзал',
  quick_hub_hospital: 'Аурухана',
  quick_hub_school: 'Мектеп',
  where_am_i: 'Мен қайдамын?',
  search_no_results: 'Нәтиже табылмады',
  search_searching: 'Іздеу...',
  locating: 'Анықталуда...',
  gps_error: 'GPS қолжетімсіз',
  distance_away: 'сізден',
  recommended_route: 'Ұсынылған маршрут',
  // Bottom sheet
  arriving_time: 'Келу уақыты',
  nearby: 'Жақын маңда',
  no_routes: 'Жақын маршруттар жоқ',
  route: 'Маршрут',
  min_abbr: 'мин',
  less_than_1_min: '< 1 мин',
  // Driver mode
  driver_section: 'Жүргізуші режимі',
  driver_login_label: 'Жүргізуші ретінде кіру',
  driver_pin_required: 'ПИН-код қажет',
  enter_pin_title: 'ПИН-код енгізіңіз',
  verify: 'Тексеру',
  wrong_pin: 'Қате ПИН. Қайта енгізіңіз.',
  start_route: 'Маршрутты бастау',
  stop_route: 'Тоқтату',
  broadcasting_active: 'ТРАНСЛЯЦИЯ БЕЛСЕНДІ',
  driver_mode_active: 'ЖҮРГІЗУШІ РЕЖИМІ',
  select_route_placeholder: 'Маршрутты таңдаңыз',
  driver_exit: 'Режимнен шығу',
  driver_gps_on: 'GPS белсенді',
  driver_gps_off: 'GPS күтілуде...',
  driver_screen_hint: 'Жолды бастағанда батырманы басыңыз',
  uploaded: 'жүктелді',
  sec_abbr: 'с бұрын',
  // Menu / navigation
  language_section: 'Тіл',
  navigation_section: 'Навигация',
  all_routes: 'Барлық маршруттар',
  bus_stops: 'Тоқтамдар',
  help: 'Анықтама',
  close: 'Жабу',
  // Status
  offline_mode: 'Офлайн режим',
  live_badge: 'ТІКЕЛЕЙ ЭФИР',
  // Onboarding
  onboarding_instruction_ru: "Нажмите «Добавить» на экран",
  onboarding_instruction_kz: "«Қосу» батырмасын басыңыз",
  onboarding_ios_hint: 'iOS: Safari → Бөлісу → «Негізгі экранға қосу»',
  understood: 'Түсінікті',
  loading_buses: 'Автобустар жүктелуде...',
  nearest_bus: 'Ең жақын автобус',
  swipe_for_more: 'Барлығын көру ↑',
  just_now: 'Жаңа ғана',
  min_ago: 'мин бұрын',
  bus_info_title: 'Автобус туралы',
  show_route: 'Маршрутты көрсету',
  updated_label: 'Жаңартылды',
  routes_panel_title: 'Маршруттар',
  buses_active: 'автобус жолда',
  walk_to_route: 'маршрутқа дейін',
  distance_to_dest: 'дейін',
  clear_map: 'Тазалау',
  location_permission_denied: 'Орынды анықтауға рұқсат жоқ. Браузер параметрлерінде қосыңыз.',
  location_unavailable: 'GPS сигналы жоқ. Сыртқа шығып көріңіз.',
  gps_permission_denied: 'GPS рұқсаты берілмеген. Браузер параметрлерінде рұқсат беріңіз.',
  pin_already_active: 'Бұл автобус басқа телефонда белсенді. Алдымен оны тоқтатыңыз.',
  update_available: 'Жаңа нұсқа бар — жаңарту үшін басыңыз',
  update_refresh: 'Жаңарту',
}

const ru: Dictionary = {
  // Search / map UI
  search_placeholder: 'Поиск',
  quick_hub_bazaar: 'Базар',
  quick_hub_station: 'Автовокзал',
  quick_hub_hospital: 'Больница',
  quick_hub_school: 'Школа',
  where_am_i: 'Где я?',
  search_no_results: 'Ничего не найдено',
  search_searching: 'Поиск...',
  locating: 'Определение...',
  gps_error: 'GPS недоступен',
  distance_away: 'от вас',
  recommended_route: 'Рекомендованный маршрут',
  // Bottom sheet
  arriving_time: 'Время прибытия',
  nearby: 'Рядом с вами',
  no_routes: 'Нет маршрутов поблизости',
  route: 'Маршрут',
  min_abbr: 'мин',
  less_than_1_min: '< 1 мин',
  // Driver mode
  driver_section: 'Режим водителя',
  driver_login_label: 'Войти как водитель',
  driver_pin_required: 'Требуется PIN-код',
  enter_pin_title: 'Введите PIN-код',
  verify: 'Проверить',
  wrong_pin: 'Неверный PIN. Попробуйте снова.',
  start_route: 'Начать маршрут',
  stop_route: 'Остановить',
  broadcasting_active: 'ТРАНСЛЯЦИЯ АКТИВНА',
  driver_mode_active: 'РЕЖИМ ВОДИТЕЛЯ',
  select_route_placeholder: 'Выберите маршрут',
  driver_exit: 'Выйти из режима',
  driver_gps_on: 'GPS активен',
  driver_gps_off: 'Ожидание GPS...',
  driver_screen_hint: 'Нажмите кнопку чтобы начать маршрут',
  uploaded: 'отправлено',
  sec_abbr: 'с назад',
  // Menu / navigation
  language_section: 'Язык',
  navigation_section: 'Навигация',
  all_routes: 'Все маршруты',
  bus_stops: 'Остановки',
  help: 'Помощь',
  close: 'Закрыть',
  // Status
  offline_mode: 'Офлайн режим',
  live_badge: 'В ЭФИРЕ',
  // Onboarding
  onboarding_instruction_ru: "Нажмите «Добавить» на экран",
  onboarding_instruction_kz: "Экранға қосу үшін «Қосу» басыңыз",
  onboarding_ios_hint: 'iOS: Safari → Поделиться → «На экран Домой»',
  understood: 'Понятно',
  loading_buses: 'Загрузка автобусов...',
  nearest_bus: 'Ближайший автобус',
  swipe_for_more: 'Посмотреть все ↑',
  just_now: 'Только что',
  min_ago: 'мин назад',
  bus_info_title: 'Об автобусе',
  show_route: 'Показать маршрут',
  updated_label: 'Обновлено',
  routes_panel_title: 'Маршруты',
  buses_active: 'автобус на линии',
  walk_to_route: 'пешком до маршрута',
  distance_to_dest: 'до места',
  clear_map: 'Сбросить',
  location_permission_denied: 'Нет доступа к геолокации. Разрешите в настройках браузера.',
  location_unavailable: 'GPS недоступен. Попробуйте выйти на улицу.',
  gps_permission_denied: 'Доступ к GPS запрещён. Разрешите геолокацию в настройках браузера.',
  pin_already_active: 'Этот автобус уже активен на другом устройстве. Сначала остановите его.',
  update_available: 'Доступно обновление — нажмите для обновления',
  update_refresh: 'Обновить',
}

const en: Dictionary = {
  // Search / map UI
  search_placeholder: 'Search',
  quick_hub_bazaar: 'Bazaar',
  quick_hub_station: 'Bus Terminal',
  quick_hub_hospital: 'Hospital',
  quick_hub_school: 'School',
  where_am_i: 'Where am I?',
  search_no_results: 'No results found',
  search_searching: 'Searching...',
  locating: 'Locating...',
  gps_error: 'GPS unavailable',
  distance_away: 'from you',
  recommended_route: 'Recommended route',
  // Bottom sheet
  arriving_time: 'Arriving time',
  nearby: 'Near you',
  no_routes: 'No routes nearby',
  route: 'Route',
  min_abbr: 'min',
  less_than_1_min: '< 1 min',
  // Driver mode
  driver_section: 'Driver mode',
  driver_login_label: 'Sign in as driver',
  driver_pin_required: 'PIN required',
  enter_pin_title: 'Enter PIN Code',
  verify: 'Verify',
  wrong_pin: 'Wrong PIN. Try again.',
  start_route: 'Start route',
  stop_route: 'Stop',
  broadcasting_active: 'LIVE BROADCAST',
  driver_mode_active: 'DRIVER MODE',
  select_route_placeholder: 'Select a route',
  driver_exit: 'Exit driver mode',
  driver_gps_on: 'GPS active',
  driver_gps_off: 'Waiting for GPS...',
  driver_screen_hint: 'Press the button when ready to start your route',
  uploaded: 'sent',
  sec_abbr: 's ago',
  // Menu / navigation
  language_section: 'Language',
  navigation_section: 'Navigation',
  all_routes: 'All routes',
  bus_stops: 'Bus stops',
  help: 'Help',
  close: 'Close',
  // Status
  offline_mode: 'Offline',
  live_badge: 'LIVE',
  // Onboarding
  onboarding_instruction_ru: "Tap 'Add to Home Screen'",
  onboarding_instruction_kz: "Экранға қосу үшін «Қосу» басыңыз",
  onboarding_ios_hint: 'iOS: Safari → Share → Add to Home Screen',
  understood: 'Got it',
  loading_buses: 'Loading buses...',
  nearest_bus: 'Nearest bus',
  swipe_for_more: 'See all ↑',
  just_now: 'Just now',
  min_ago: 'min ago',
  bus_info_title: 'Bus info',
  show_route: 'Show route',
  updated_label: 'Updated',
  routes_panel_title: 'Routes',
  buses_active: 'buses on route',
  walk_to_route: 'walk to route',
  distance_to_dest: 'to destination',
  clear_map: 'Reset',
  location_permission_denied: 'Location access denied. Enable it in your browser settings.',
  location_unavailable: 'GPS unavailable. Try going outside.',
  gps_permission_denied: 'GPS access denied. Allow location in your browser settings.',
  pin_already_active: 'This bus is already active on another device. Stop it there first.',
  update_available: 'New update available — tap to refresh',
  update_refresh: 'Refresh',
}

export const translations: Record<Lang, Dictionary> = { kz, ru, en }

export function translate(lang: Lang, key: TranslationKey): string {
  return translations[lang][key] ?? translations['en'][key] ?? key
}
