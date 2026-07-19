// Settings shape mirrors backend/src/lib/settings.ts. Secret fields come back
// empty from the API with a sibling `<field>Set` boolean.

export interface Settings {
  general: {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    companyLogoUrl: string;
    companyAddress: string;
    timezone: string;
    currency: string;
  };
  pricing: {
    bwPricePaise: number;
    colorPricePaise: number;
    minOrderPaise: number;
    gstPercent: number;
    extraChargesPaise: number;
  };
  payments: {
    razorpayKeyId: string;
    razorpayKeySecret: string;
    razorpayKeySecretSet?: boolean;
    paymentsEnabled: boolean;
    refundsEnabled: boolean;
    refundWindowDays: number;
  };
  print: {
    allowedFileTypes: string[];
    maxFileSizeMb: number;
    maxPageLimit: number;
    duplexEnabled: boolean;
    colorEnabled: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    orderCompletion: boolean;
    failedPaymentAlerts: boolean;
    adminNotifications: boolean;
  };
  branding: {
    appName: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    footerText: string;
  };
  legal: {
    privacyPolicy: string;
    termsConditions: string;
    refundPolicy: string;
  };
}

export type Section = keyof Settings;
