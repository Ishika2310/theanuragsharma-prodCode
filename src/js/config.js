const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbza3T2azrzWbaKniPtKIUujCqxIwppb9QFk54dgXG8wvVBbuTYzKXc2O1DIJ00IKNT0/exec',
    SPREADSHEET_ID: '1M0AdgnK2B71XOMw_I6L7eCV6mY9hv9trfno5PheTFOg',

    SHOW_SUCCESS_MESSAGE: true,
    REDIRECT_AFTER_SUBMIT: false,
    REDIRECT_URL: 'index.html',

    ADMIN_EMAIL: 'theanuragsharma.web@gmail.com',

    SESSION_CONFIG: {
        DEFAULT_DURATION: 1 * 60 * 60 * 1000,
        REMEMBER_ME_DURATION: 24 * 60 * 60 * 1000,
        SESSION_CHECK_INTERVAL: 5 * 60 * 1000,
        WARNING_TIME: 10 * 60 * 1000
    },

    EMAIL_CONFIG: {
        FROM_NAME: 'Anurag Sharma - Consultation Services',
        SUPPORT_EMAIL: 'theanuragsharma.web@gmail.com'
    },

    REFUND_CONFIG: {
        REFUND_PROOF_FOLDER_ID: '15z2zWAIeYOmdR2mF8LTQnhaqSyfYvCbb',
        REFUND_COOLDOWN_MINUTES: 30,
        MAX_REFUND_NOTE_LENGTH: 500
    }
};

window.CONFIG = CONFIG;
