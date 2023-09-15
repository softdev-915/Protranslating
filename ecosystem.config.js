module.exports = {
  apps: [{
    name: 'app',
    script: '/home/ubuntu/lms-spa/app/lms.js',
    env: {
      NODE_ENV: 'DEV',
    },
    env_production: {
      NODE_ENV: 'PROD',
    },
  }],
};
