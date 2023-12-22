import express from 'express'
import './config/db'
// Routes
const emails = require('./routes/emails')
// Create express instance
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(emails)

// Export express app
module.exports = app

// Start standalone server if directly running
if (require.main === module) {
  const port = process.env.PORT || 3001
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`)
  })
}
