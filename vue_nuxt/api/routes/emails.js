import Router from 'express-promise-router';
import { Email } from '../models'

const router = Router()

/* GET users listing. */
router.post('/emails', async (req, res) => {
  try {
    const email = new Email(req.body)
    const instance = await email.save()
    return res.json({
      success: true,
      email: instance
    })
  } catch (e) {
    return res.status(422).json({
      success: false,
      message: e.message
    })
  }
})

/* GET user by ID. */
router.get('/emails/:id', async (req, res) => {

  try {
    const email = await Email.findOne({
      id: req.params.id
    })
    return res.json({
      success: true,
      email
    })
  } catch (e) {
    return res.status(404).json({
      success: true,
      message: 'Not found'
    })
  }
})

module.exports = router
