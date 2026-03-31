import type { Lang } from '../context/LanguageContext'

export const APP_NAME = 'Zholda'

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
  | 'menu'
  | 'back'
  | 'soon'
  // Status
  | 'offline_mode'
  | 'live_badge'
  | 'gps_status_waiting'
  | 'gps_status_no_signal'
  // Onboarding
  | 'onboarding_instruction'
  | 'onboarding_instruction_ru'
  | 'onboarding_instruction_kz'
  | 'onboarding_ios_hint'
  | 'onboarding_safari_gps_hint'
  | 'install_app'
  | 'understood'
  // Bottom sheet extras
  | 'loading_buses'
  | 'nearest_bus'
  | 'swipe_for_more'
  | 'waypoints'
  | 'meter_abbr'
  | 'km_abbr'
  | 'next_departure_bazaar'
  | 'next_departure_route1'
  | 'video_loading'
  | 'recommended_nearest'
  | 'walk_on_foot'
  | 'city_name'
  | 'verifying'
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
  // GPS install banner
  | 'gps_banner_text'
  | 'gps_banner_cta'
  // Theme toggle
  | 'theme_section'
  | 'theme_light'
  | 'theme_dark'

type Dictionary = Record<TranslationKey, string>

const kz: Dictionary = {
  // Search / map UI
  search_placeholder: 'Іздеу',
  quick_hub_bazaar: 'Базар',
  quick_hub_station: 'Автовокзал',
  quick_hub_hospital: 'Аурухана',
  quick_hub_school: 'Мектеп',
  where_am_i: 'Мен қайдамын?',
  search_no_results: 'Ештеңе табылмады',
  search_searching: 'Іздеу...',
  locating: 'Орныңыз анықталуда...',
  gps_error: 'GPS істемей тұр',
  distance_away: 'сізден',
  recommended_route: 'Ыңғайлы маршрут',
  // Bottom sheet
  arriving_time: 'Келу уақыты',
  nearby: 'Сізге жақын',
  no_routes: 'Маңайда маршруттар жоқ',
  route: 'Маршрут',
  min_abbr: 'мин',
  less_than_1_min: '< 1 мин',
  // Driver mode
  driver_section: 'Жүргізушілерге',
  driver_login_label: 'Жүргізуші болып кіру',
  driver_pin_required: 'ПИН-код керек',
  enter_pin_title: 'ПИН-код жазыңыз',
  verify: 'Кіру',
  wrong_pin: 'Қате ПИН. Қайта жазыңыз.',
  start_route: 'Жолға шығу',
  stop_route: 'Аяқтау',
  broadcasting_active: 'GPS ҚОСУЛЫ',
  driver_mode_active: 'ЖҮРГІЗУШІ РЕЖИМІ',
  select_route_placeholder: 'Маршрутты таңдаңыз',
  driver_exit: 'Шығу',
  driver_gps_on: 'GPS істеп тұр',
  driver_gps_off: 'GPS күтілуде...',
  driver_screen_hint: 'Жолға шыққанда батырманы басыңыз',
  uploaded: 'жіберілді',
  sec_abbr: 'сек бұрын',
  // Menu / navigation
  language_section: 'Тіл',
  navigation_section: 'Навигация',
  all_routes: 'Барлық маршруттар',
  bus_stops: 'Аялдамалар',
  help: 'Анықтама',
  close: 'Жабу',
  menu: 'Мәзір',
  back: 'Артқа',
  soon: 'Жақында',
  // Status
  offline_mode: 'Интернет жоқ',
  live_badge: 'ЖОЛДА',
  gps_status_waiting: 'Күтілуде',
  gps_status_no_signal: 'Сигнал жоқ',
  // Onboarding
  onboarding_instruction: 'Қолдануға ыңғайлы болуы үшін телефон экранына қосып алыңыз',
  onboarding_instruction_ru: 'Нажмите «Добавить» на экран',
  onboarding_instruction_kz: '«Қосу» батырмасын басыңыз',
  onboarding_ios_hint: 'iOS: Safari → Бөлісу (Төмендесу ортадағы батырма) → «Экранға қосу» ("На экран Домой")',
  onboarding_safari_gps_hint: 'Браузерде GPS дұрыс істемеуі мүмкін. Қолданбаны орнатып алсаңыз, қатып қалмайды.',
  install_app: 'Қолданбаны орнату',
  understood: 'Түсінікті',
  loading_buses: 'Автобустар ізделуде...',
  nearest_bus: 'Ең жақын автобус',
  swipe_for_more: 'Барлығын көру ↑',
  waypoints: 'Аялдамалар',
  meter_abbr: 'м',
  km_abbr: 'км',
  next_departure_bazaar: 'Базардан келесі автобус',
  next_departure_route1: '1-ші маршруттың келесі автобусы',
  video_loading: 'Видео жүктелуде...',
  recommended_nearest: 'ең жақын',
  walk_on_foot: 'жаяу',
  city_name: 'Жетісай қаласы',
  verifying: 'Тексерілуде...',
  just_now: 'Жаңа ғана',
  min_ago: 'мин бұрын',
  bus_info_title: 'Автобус туралы',
  show_route: 'Бағытты көру',
  updated_label: 'Жаңартылды',
  routes_panel_title: 'Маршруттар',
  buses_active: 'автобус жолда',
  walk_to_route: 'маршрутқа дейін',
  distance_to_dest: 'дейін',
  clear_map: 'Тазарту',
  location_permission_denied: 'Геолокацияға рұқсат жоқ. Браузер баптауларынан қосыңыз.',
  location_unavailable: 'GPS сигналы нашар. Далаға шығып көріңіз.',
  gps_permission_denied: 'GPS-ке рұқсат берілмеген. Баптаулардан қосыңыз.',
  pin_already_active: 'Бұл автобус басқа телефонда қосулы тұр. Алдымен соны өшіру керек.',
  update_available: 'Жаңа нұсқасы шықты — жаңарту үшін басыңыз',
  update_refresh: 'Жаңарту',
  gps_banner_text: '📍 Браузерде GPS қатып қалады',
  gps_banner_cta: 'Орнатып алу →',
  theme_section: 'Тақырып',
  theme_light: 'Жарық',
  theme_dark: 'Күңгірт',
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
  search_searching: 'Ищем...',
  locating: 'Определяем геопозицию...',
  gps_error: 'GPS не работает',
  distance_away: 'от вас',
  recommended_route: 'Удобный маршрут',
  // Bottom sheet
  arriving_time: 'Время прибытия',
  nearby: 'Рядом с вами',
  no_routes: 'Рядом автобусов нет',
  route: 'Маршрут',
  min_abbr: 'мин',
  less_than_1_min: '< 1 мин',
  // Driver mode
  driver_section: 'Для водителей',
  driver_login_label: 'Войти как водитель',
  driver_pin_required: 'Нужен ПИН-код',
  enter_pin_title: 'Введите ПИН-код',
  verify: 'Войти',
  wrong_pin: 'Неверный ПИН. Попробуйте снова.',
  start_route: 'Выехать на маршрут',
  stop_route: 'Завершить',
  broadcasting_active: 'GPS РАБОТАЕТ',
  driver_mode_active: 'РЕЖИМ ВОДИТЕЛЯ',
  select_route_placeholder: 'Выберите маршрут',
  driver_exit: 'Выйти',
  driver_gps_on: 'GPS работает',
  driver_gps_off: 'Ждем сигнал GPS...',
  driver_screen_hint: 'Нажмите кнопку, когда начнете движение по маршруту',
  uploaded: 'отправлено',
  sec_abbr: 'сек назад',
  // Menu / navigation
  language_section: 'Язык',
  navigation_section: 'Навигация',
  all_routes: 'Все маршруты',
  bus_stops: 'Остановки',
  help: 'Помощь',
  close: 'Закрыть',
  menu: 'Меню',
  back: 'Назад',
  soon: 'Скоро',
  // Status
  offline_mode: 'Нет интернета',
  live_badge: 'В ПУТИ',
  gps_status_waiting: 'Ожидание',
  gps_status_no_signal: 'Нет сигнала',
  // Onboarding
  onboarding_instruction: 'Для удобства добавьте приложение на главный экран телефона',
  onboarding_instruction_ru: 'Нажмите «На экран Домой»',
  onboarding_instruction_kz: 'Экранға қосу үшін «Қосу» басыңыз',
  onboarding_ios_hint: 'iOS: Safari → Поделиться (кнопка по центру внизу) → «На экран Домой»',
  onboarding_safari_gps_hint: 'В браузере Safari GPS работает с перебоями. Установите приложение, чтобы автобус точно не завис.',
  install_app: 'Установить приложение',
  understood: 'Понятно',
  // Bottom sheet extras
  loading_buses: 'Ищем автобусы...',
  nearest_bus: 'Ближайший автобус',
  swipe_for_more: 'Посмотреть все ↑',
  waypoints: 'Остановки',
  meter_abbr: 'м',
  km_abbr: 'км',
  next_departure_bazaar: 'Следующий автобус от базара',
  next_departure_route1: 'Следующий автобус 1-го маршрута',
  video_loading: 'Загружаем видео...',
  recommended_nearest: 'ближайший',
  walk_on_foot: 'пешком',
  city_name: 'город Жетысай',
  verifying: 'Проверяем...',
  // Bus info card
  just_now: 'Только что',
  min_ago: 'мин назад',
  bus_info_title: 'Об автобусе',
  show_route: 'Показать маршрут',
  updated_label: 'Обновлено',
  // Routes panel
  routes_panel_title: 'Маршруты',
  buses_active: 'автобус в пути',
  walk_to_route: 'пешком до маршрута',
  distance_to_dest: 'до места',
  clear_map: 'Сбросить',
  // Location errors
  location_permission_denied: 'Нет доступа к геолокации. Разрешите в настройках браузера.',
  location_unavailable: 'GPS сигнал слабый. Попробуйте выйти на улицу.',
  gps_permission_denied: 'Доступ к GPS запрещён. Разрешите геолокацию в настройках браузера.',
  // Driver auth
  pin_already_active: 'Этот автобус уже включен на другом телефоне. Сначала выключите его там.',
  // PWA update banner
  update_available: 'Вышла новая версия — нажмите чтобы обновить',
  update_refresh: 'Обновить',
  // GPS install banner
  gps_banner_text: '📍 В браузере GPS может тормозить',
  gps_banner_cta: 'Установить приложение →',
  // Theme toggle
  theme_section: 'Тема',
  theme_light: 'Светлая',
  theme_dark: 'Тёмная',
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
  menu: 'Menu',
  back: 'Back',
  soon: 'Soon',
  // Status
  offline_mode: 'Offline',
  live_badge: 'LIVE',
  gps_status_waiting: 'Waiting',
  gps_status_no_signal: 'No signal',
  // Onboarding
  onboarding_instruction: "Install to use 'Add to Home Screen'",
  onboarding_instruction_ru: "Tap 'Add to Home Screen'",
  onboarding_instruction_kz: "Экранға қосу үшін «Қосу» басыңыз",
  onboarding_ios_hint: 'iOS: Safari → Share → Add to Home Screen',
  onboarding_safari_gps_hint: 'Safari limits background GPS. Install for best experience.',
  install_app: 'Install app',
  understood: 'Got it',
  loading_buses: 'Loading buses...',
  nearest_bus: 'Nearest bus',
  swipe_for_more: 'See all ↑',
  waypoints: 'Waypoints',
  meter_abbr: 'm',
  km_abbr: 'km',
  next_departure_bazaar: 'Next departure from bazaar',
  next_departure_route1: 'Next Route 1 departure',
  video_loading: 'Loading tutorial...',
  recommended_nearest: 'nearest',
  walk_on_foot: 'walking',
  city_name: 'Zhetisay',
  verifying: 'Verifying...',
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
  gps_banner_text: '📍 GPS is restricted in browser',
  gps_banner_cta: 'Install the app →',
  // Theme toggle
  theme_section: 'Theme',
  theme_light: 'Light',
  theme_dark: 'Dark',
}

export const translations: Record<Lang, Dictionary> = { kz, ru, en }

export function translate(lang: Lang, key: TranslationKey): string {
  return translations[lang][key] ?? translations['en'][key] ?? key
}
