/**
 * Environment Variable Validator
 * Validates all required environment variables at startup
 */

interface EnvValidation {
  name: string;
  required: boolean;
  /** If true, don't show warning when not set */
  silent?: boolean;
  validator?: (value: string) => { valid: boolean; message?: string };
}

const ENV_VALIDATIONS: EnvValidation[] = [
  // Core
  {
    name: "PORT",
    required: false,
  },
  {
    name: "NODE_ENV",
    required: false,
  },
  {
    name: "FRONTEND_URL",
    required: false,
  },

  // Database (Cloud Postgres)
  {
    name: "DATABASE_URL",
    required: true,
    validator: (value) => {
      if (
        !value.startsWith("postgresql://") &&
        !value.startsWith("postgres://")
      ) {
        return {
          valid: false,
          message: "Must be a PostgreSQL connection string",
        };
      }
      return { valid: true };
    },
  },

  // Redis (Cloud Redis)
  {
    name: "REDIS_HOST",
    required: true,
  },
  {
    name: "REDIS_PORT",
    required: false,
  },
  {
    name: "REDIS_PASSWORD",
    required: false,
    silent: true, // Password is optional - Redis can be accessed without auth
  },

  // Encryption
  {
    name: "ENCRYPTION_KEY",
    required: true,
    validator: (value) => {
      if (value.length !== 64) {
        return {
          valid: false,
          message: `Must be exactly 64 characters (32 bytes in hex), got ${value.length}. Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
        };
      }
      // Validate it's valid hex
      if (!/^[0-9a-fA-F]{64}$/.test(value)) {
        return {
          valid: false,
          message: "Must be a valid hexadecimal string",
        };
      }
      return { valid: true };
    },
  },

  // OAuth - Instagram/Facebook
  {
    name: "FACEBOOK_APP_ID",
    required: false,
  },
  {
    name: "FACEBOOK_APP_SECRET",
    required: false,
  },

  // OAuth - YouTube
  {
    name: "YOUTUBE_CLIENT_ID",
    required: false,
  },
  {
    name: "YOUTUBE_CLIENT_SECRET",
    required: false,
  },

  // OAuth - TikTok
  {
    name: "TIKTOK_CLIENT_KEY",
    required: false,
  },
  {
    name: "TIKTOK_CLIENT_SECRET",
    required: false,
  },

  // OAuth - LinkedIn
  {
    name: "LINKEDIN_CLIENT_ID",
    required: false,
  },
  {
    name: "LINKEDIN_CLIENT_SECRET",
    required: false,
  },

  // OAuth - Twitter
  {
    name: "TWITTER_CLIENT_ID",
    required: false,
  },
  {
    name: "TWITTER_CLIENT_SECRET",
    required: false,
  },

  // Google Drive OAuth
  {
    name: "GOOGLE_DRIVE_CLIENT_ID",
    required: false,
  },
  {
    name: "GOOGLE_DRIVE_CLIENT_SECRET",
    required: false,
  },
  {
    name: "GOOGLE_DRIVE_REDIRECT_URI",
    required: false,
  },

  // Dropbox OAuth
  {
    name: "DROPBOX_CLIENT_ID",
    required: false,
  },
  {
    name: "DROPBOX_CLIENT_SECRET",
    required: false,
  },
  {
    name: "DROPBOX_REDIRECT_URI",
    required: false,
  },
];

export function validateEnvironment(): void {
  console.log("🔍 Validating environment variables...\n");

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const validation of ENV_VALIDATIONS) {
    const value = process.env[validation.name];

    // Check if required variable is missing
    if (validation.required && !value) {
      errors.push(`❌ ${validation.name} is required but not set`);
      continue;
    }

    // Skip validation if optional and not set
    if (!validation.required && !value) {
      // Only show warning if not marked as silent
      if (!validation.silent) {
        warnings.push(`⚠️  ${validation.name} is not set (optional)`);
      }
      continue;
    }

    // Run custom validator if provided
    if (value && validation.validator) {
      const result = validation.validator(value);
      if (!result.valid) {
        errors.push(`❌ ${validation.name}: ${result.message}`);
      }
    }
  }

  // Print results
  if (errors.length > 0) {
    console.error("Environment validation failed:\n");
    errors.forEach((error) => console.error(error));
    console.error("\nPlease check your .env file and fix the errors above.");
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("Environment warnings:\n");
    warnings.forEach((warning) => console.warn(warning));
    console.warn("");
  }

  console.log("✅ Environment validation passed\n");
}
