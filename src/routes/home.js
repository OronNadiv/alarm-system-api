import {Router} from 'express'
import config from '../config'

const router = new Router()

router.get('/', (req, res) => res.redirect(config.uiUrl))

export default router
