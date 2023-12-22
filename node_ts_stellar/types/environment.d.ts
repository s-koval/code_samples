declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_AUTH_TOKEN: string;
      NODE_ENV: 'development' | 'production';
      PORT?: string;
      PWD: string;
      JWT_SECRET: string
      AWS_S3_BUCKET_EMAILS: string
      AWS_S3_REGION: string
      AWS_SES_REGION: string
      AWS_S3_BUCKET_ATTACHMENTS: string
      TEST_DB_NAME: string
      DB_NAME: string
      TEST_DB_USERNAME: string
      DB_USERNAME: string
      TEST_DB_PASSWORD: string
      DB_PASSWORD: string
      TEST_DB_HOST: string
      DB_HOST: string
      TEST_DB_PORT: number
      DB_PORT: number
      TEST_DB_DIALECT: Dialect
      DB_DIALECT: Dialect
      TEST_DB_TIMEZONE: string
      DB_TIMEZONE: string,
      USERNAME_SENDER_WELCOME_MESSAGE?: string
      RESTORE_PASSWORD_LINK: string
      HORIZONT_SERVER_LINK: string
      COIN_MARKET_CAP_API_KEY: string
      COIN_MARKET_CAP_API_URL: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}