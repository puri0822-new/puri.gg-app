const path = require('path');

const APP_ENV = process.env.APP_ENV ?? 'dev';

// APP_ENV에 맞는 .env 파일 로드
require('dotenv').config({ path: path.resolve(__dirname, `.env.${APP_ENV}`) });

const ENV_CONFIG = {
  dev: {
    name: 'puri.gg (Dev)',
    bundleId: 'com.purigg.app.dev',
  },
  staging: {
    name: 'puri.gg (Staging)',
    bundleId: 'com.purigg.app.staging',
  },
  prod: {
    name: 'puri.gg',
    bundleId: 'com.purigg.app',
  },
};

const env = ENV_CONFIG[APP_ENV] ?? ENV_CONFIG.dev;

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: env.name,
  android: {
    ...config.android,
    package: env.bundleId,
  },
  extra: {
    appEnv: APP_ENV,
    eas: {
      projectId: '6a367598-5ca5-4d4a-a0d5-bf5b791ab324',
    },
  },
  owner: 'puri0822',
});
