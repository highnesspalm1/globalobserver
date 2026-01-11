// API Endpoints
export const GDELT_DOC_API = 'https://api.gdeltproject.org/api/v2/doc/doc';
export const GDELT_GEO_API = 'https://api.gdeltproject.org/api/v2/geo/geo';
export const RELIEFWEB_API = 'https://api.reliefweb.int/v1/reports';
export const NASA_EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events';
export const USGS_EARTHQUAKE_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
export const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/html/Portal%3ACurrent_events';

// RSS Feeds for global news - expanded coverage
export const RSS_FEEDS: Record<string, string> = {
    // Major International
    aljazeera: 'https://www.aljazeera.com/xml/rss/all.xml',
    bbc_world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    bbc_europe: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml',
    bbc_middleeast: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
    bbc_asia: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',
    bbc_africa: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
    bbc_latinamerica: 'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml',
    dw_english: 'https://rss.dw.com/rdf/rss-en-all',
    france24_english: 'https://www.france24.com/en/rss',
    guardian_world: 'https://www.theguardian.com/world/rss',
    npr_world: 'https://feeds.npr.org/1004/rss.xml',
    reuters_world: 'https://www.reutersagency.com/feed/?best-topics=world-news&post_type=best',

    // Turkey / Kurdistan
    dailysabah: 'https://www.dailysabah.com/rss',
    ahvalnews: 'https://ahvalnews.com/rss.xml',
    bianet: 'https://bianet.org/english.rss',
    kurdistan24: 'https://www.kurdistan24.net/en/rss',
    rudaw: 'https://www.rudaw.net/english/rss',

    // Middle East Expanded
    timesofisrael: 'https://www.timesofisrael.com/feed/',
    middleeasteye: 'https://www.middleeasteye.net/rss',
    almonitor: 'https://www.al-monitor.com/rss',
    memo: 'https://www.middleeastmonitor.com/feed/',
    arabnews: 'https://www.arabnews.com/rss.xml',
    jpost: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',
    mag972: 'https://www.972mag.com/feed/',
    syriadirect: 'https://syriadirect.org/feed/',
    iranintl: 'https://www.iranintl.com/en/rss',

    // Russia / Ukraine Expanded
    kyivindependent: 'https://kyivindependent.com/feed/',
    tass_world: 'https://tass.com/rss/v2.xml',
    ukrinform: 'https://www.ukrinform.net/rss/block-lastnews',
    meduza: 'https://meduza.io/rss/en/all',
    moscowtimes: 'https://www.themoscowtimes.com/rss/news',

    // Asia
    japantimes: 'https://www.japantimes.co.jp/feed/',
    scmp: 'https://www.scmp.com/rss/91/feed',
    xinhua_world: 'http://www.xinhuanet.com/english/rss/worldrss.xml',

    // Other
    mercopress: 'https://en.mercopress.com/rss',
    africanews: 'https://www.africanews.com/feed/',
    hindustan_times: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml',
};

// Keywords for filtering relevant events
export const CONFLICT_KEYWORDS = [
    // English - General
    'war', 'conflict', 'attack', 'explosion', 'bomb', 'missile', 'rocket',
    'terrorism', 'terror', 'protest', 'demonstration', 'riot', 'unrest',
    'military', 'soldier', 'weapons', 'armed', 'combat', 'strike',
    'killed', 'casualties', 'injured', 'violence', 'clash', 'fighting',
    'airstrike', 'drone', 'shelling', 'artillery', 'siege', 'invasion',
    'coup', 'rebel', 'insurgent', 'militia', 'ceasefire', 'offensive',
    'hostage', 'kidnap', 'assassination', 'shooting', 'gunfire',
    'sanctions', 'nuclear', 'chemical', 'biological', 'troops',
    'navy', 'army', 'air force', 'border', 'frontline', 'occupation',

    // Major Groups & Leaders
    'hamas', 'hezbollah', 'isis', 'taliban', 'al-qaeda', 'wagner',
    'putin', 'zelenskyy', 'netanyahu', 'khamenei', 'erdogan', 'assad',
    'idf', 'irgc', 'quds', 'houthi', 'pyd', 'ypg', 'sdf',

    // Turkey / Kurdistan specific
    'pkk', 'kurdish', 'kurdistan', 'ankara', 'istanbul', 'diyarbakir',
    'afrin', 'kobani', 'rojava', 'hdp', 'akp', 'mhp', 'chp',
    'türkiye', 'turkish', 'lira crisis', 'earthquake turkey',
    'gaziantep', 'hatay', 'mardin', 'sirnak', 'hakkari', 'van',

    // Iran / Persian specific
    'tehran', 'isfahan', 'natanz', 'khamenei', 'raisi', 'basij',
    'mahsa', 'hijab protest', 'revolutionary guard', 'pasdaran',
    'shiraz', 'tabriz', 'mashhad', 'qom', 'persian gulf',

    // Israel / Gaza / Palestine specific
    'gaza', 'rafah', 'khan younis', 'tel aviv', 'west bank', 'jenin',
    'nablus', 'ramallah', 'settler', 'intifada', 'iron dome',
    'mossad', 'shin bet', 'fatah', 'islamic jihad',

    // Ukraine / Russia specific
    'kyiv', 'kharkiv', 'odesa', 'donetsk', 'luhansk', 'crimea',
    'mariupol', 'bakhmut', 'avdiivka', 'zaporizhzhia', 'kursk',
    'belgorod', 'moscow', 'azov', 'dnipro', 'kherson', 'mykolaiv',
    'sumy', 'chernihiv', 'counter-offensive', 'wagner', 'drones',

    // Syria specific
    'damascus', 'aleppo', 'idlib', 'homs', 'raqqa', 'deir ez-zor',
    'al-nusra', 'hayat tahrir', 'white helmets', 'barrel bomb',

    // Yemen specific
    'sanaa', 'aden', 'houthi', 'marib', 'hodeidah', 'saudi coalition',

    // German
    'krieg', 'angriff', 'explosion', 'bombe', 'rakete',
    'terrorismus', 'demonstration', 'protest', 'gewalt', 'konflikt',
    'militär', 'soldat', 'waffen', 'gefecht', 'opfer',

    // Spanish
    'guerra', 'ataque', 'explosión', 'bomba', 'misil',
    'terrorismo', 'protesta', 'violencia', 'conflicto', 'militar',

    // French
    'guerre', 'attaque', 'explosion', 'bombe', 'missile',
    'terrorisme', 'manifestation', 'violence', 'conflit', 'militaire',

    // Turkish
    'savaş', 'çatışma', 'patlama', 'bomba', 'şehit', 'terör',

    // Arabic transliterated
    'harb', 'qital', 'intifada', 'jihad', 'shahid', 'mujahid'
];

// CORS proxies for RSS feeds
export const CORS_PROXIES = [
    'https://corsproxy.io/?url=',
    'https://api.codetabs.com/v1/proxy?quest='
];
