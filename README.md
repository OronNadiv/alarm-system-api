# Home Automation - Alarm System Backend API
This backend server allows you to manage the alarm system from remote.
The server receives motions from the raspberry client's motion sensors.
In case the alarm is armed and a motion is deleted, the server can activates/deactivates the siren, start capturing photos, trigger notifications such as emails, phone calls or text messages, and more.

[![JavaScript Style Guide][standard-image]][standard-url]
[![Dependencies][dependencies-image]][dependencies-url]
[![DevDependencies][dependencies-dev-image]][dependencies-dev-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

I suggest you first [read][overview-url] about the different components of the home automation application.  
This will help you understand better the general architecture and different functions of the system.

## Installation instructions
Click [here][server-installation-instruction-url] and follow the installation instructions for the server micro-service, before moving to the next step.

## Environment variables (configuration)
__AUTH\_PUBLIC\_KEY__ (required): content of auth server's publickey.  
__DATABASE\_URL__ (required):  url to postgres database.  Default: `postgres://postgres:@localhost/home_automation`  
__KEEP\_HISTORY\_IN\_DAYS__ (required): days to keep history in database.  Default: `30`  
__LOGIN\_URL__ (required): url to the [authentication][auth-url] server. Default: if NODE_ENV = `production` => `none`, otherwise: `http://localhost:3001`  
__MOTION\_DETECTED\_SUBJECT__ (required): the subject of the email that will be sent in case a motion has been detected while the alarm is armed.  Default: `ALERT - Motion has been detected!`  
__MOTION\_DETECTED\_TEXT__ (required): the subject of the email that will be sent in case a motion has been detected while the alarm is armed.  Default:
```
Motion has been detected while the alarm system is armed.

Sensor name: <sensor_name>
```
__NODE\_ENV__ (required): set up the running environment.  Default: `production`.  `production` will enforce encryption using SSL and other security mechanisms.  
__NOTIFICATIONS\_URL__ (required): url to [notifications][notifications-url] server. Default: if NODE_ENV = `production` => `none`, otherwise: `http://localhost:3004`  
__PORT__ (required): server's port.  default: `3002`  
__POSTGRESPOOLMIN__ (required): postgres pool minimum size.  Default: `2`  
__POSTGRESPOOLMAX__ (required): postgres pool maximum size.  Default: `10`  
__POSTGRESPOOLLOG__ (required): postgres pool log. Values: `true`/`false`. Default: `true`  
__PRIVATE\_KEY__ (required): Generated private key.  Public key should be shared with the [authentication][auth-url] server. See [here][private-public-keys-url].  
__REDIS\_URL__ / __REDISCLOUD\_URL__ (required): redis url.  Default: if NODE_ENV = `production` => `none`, otherwise: `redis://localhost:6379`  
__SENSOR\_MAY\_BE\_FAULTY\_IN_DAYS__ (required): after the specified number of days, if a motion sensor has not reported of a movement, the sensor will be considered as "faulty". Default: `7`  
__UI\_URL__ (required): url to the [UI][ui-url] server. Default: if NODE_ENV = `production` => `none`, otherwise: `http://localhost:3000`

### License
[AGPL-3.0](https://spdx.org/licenses/AGPL-3.0.html)

### Author
[Oron Nadiv](https://github.com/OronNadiv) ([oron@nadiv.us](mailto:oron@nadiv.us))

[dependencies-image]: https://david-dm.org/OronNadiv/alarm-system-api/status.svg
[dependencies-url]: https://david-dm.org/OronNadiv/alarm-system-api
[dependencies-dev-image]: https://david-dm.org/OronNadiv/alarm-system-api/dev-status.svg
[dependencies-dev-url]: https://david-dm.org/OronNadiv/alarm-system-api?type=dev
[travis-image]: http://img.shields.io/travis/OronNadiv/alarm-system-api.svg?style=flat-square
[travis-url]: https://travis-ci.org/OronNadiv/alarm-system-api
[coveralls-image]: http://img.shields.io/coveralls/OronNadiv/alarm-system-api.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/OronNadiv/alarm-system-api
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com

[overview-url]: https://oronnadiv.github.io/home-automation
[client-installation-instruction-url]: https://oronnadiv.github.io/home-automation/#installation-instructions-for-the-raspberry-pi-clients
[server-installation-instruction-url]: https://oronnadiv.github.io/home-automation/#installation-instructions-for-the-server-micro-services
[private-public-keys-url]: https://oronnadiv.github.io/home-automation/#generating-private-and-public-keys

[alarm-url]: https://github.com/OronNadiv/alarm-api
[auth-url]: https://github.com/OronNadiv/authentication-api
[camera-url]: https://github.com/OronNadiv/camera-api
[garage-url]: https://github.com/OronNadiv/garage-api
[notifications-url]: https://github.com/OronNadiv/notifications-api
[push-url]: https://github.com/OronNadiv/push-api
[storage-url]: https://github.com/OronNadiv/storage-api
[ui-url]: https://github.com/OronNadiv/home-automation-ui
