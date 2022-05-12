import dotenv from "dotenv";
dotenv.config()
if (process.env.REACT_APP_VAULT_ENV === 'local') {
  module.exports = require('./config-local')
} else if (process.env.REACT_APP_VAULT_ENV === 'dev') {
  module.exports = require('./config-dev')
} else {
  throw new Error('Unknown environment')
}
