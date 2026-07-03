export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// utils/apiPaths.js
export const API_PATHS = {
    AUTH: {
        LOGIN: "/api/v1/auth/login",
        REGISTER: "/api/v1/auth/register",
        VERIFY_EMAIL: "/api/v1/auth/verify-email",
        RESEND_OTP: "/api/v1/auth/resend-otp",
        FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
        RESET_PASSWORD: "/api/v1/auth/reset-password",
        EXPORT_DATA: "/api/v1/auth/export-data",
        DELETE_ACCOUNT: "/api/v1/auth/delete-account",
        GET_USER_INFO: "/api/v1/auth/getUser",
        UPDATE_PROFILE: "/api/v1/auth/profile",
        CHANGE_PASSWORD: "/api/v1/auth/change-password",
    },

    FEEDBACK: {
        CREATE: "/api/v1/feedback/create",
    },

    DASHBOARD: {
        GET_DATA: "/api/v1/dashboard",
    },

    INCOME: {
        ADD_INCOME: "/api/v1/income/add",
        GET_ALL_INCOME: "/api/v1/income/get",
        DELETE_INCOME: (incomeId) => `/api/v1/income/${incomeId}`,
        UPDATE_INCOME: (incomeId) => `/api/v1/income/${incomeId}`,
        DOWNLOAD_INCOME: "/api/v1/income/download",
        GET_DELETED_INCOME: "/api/v1/income/deleted",
        RESTORE_INCOME: (incomeId) => `/api/v1/income/restore/${incomeId}`,
        PERMANENT_DELETE_INCOME: (incomeId) => `/api/v1/income/permanent/${incomeId}`,
    },

    EXPENSE: {
        ADD_EXPENSE: "/api/v1/expense/add",
        GET_ALL_EXPENSE: "/api/v1/expense/get",
        DELETE_EXPENSE: (expenseId) => `/api/v1/expense/${expenseId}`,
        UPDATE_EXPENSE: (expenseId) => `/api/v1/expense/${expenseId}`,
        DOWNLOAD_EXPENSE: "/api/v1/expense/download",
        GET_DELETED_EXPENSE: "/api/v1/expense/deleted",
        RESTORE_EXPENSE: (expenseId) => `/api/v1/expense/restore/${expenseId}`,
        PERMANENT_DELETE_EXPENSE: (expenseId) => `/api/v1/expense/permanent/${expenseId}`,
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/v1/auth/upload-image",
    },
};
