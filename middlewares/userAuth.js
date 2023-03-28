const jwt = require('jsonwebtoken')
const secret = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbmNyeXB0VGV4dCI6IjVhODgzNmRjLTUwMzgtNGVlNi05NjdkLTVmMjcxNzgzNGY4OSJ9.pXPtH0xCu5b3EDFAAYU_HIfOW9mgVvwE_QGmP4D7IkI"
const { default: axios } = require('axios');


const userAuth = async(req, res, next) => {
    try {
        const data = {}
        data['encryptText'] = JSON.stringify({ "userId": "Nike119", "password": "Test@123" })
        var encrypted = jwt.sign(data, secret, { algorithm: "HS256", noTimestamp: true })
        const loginRequest = await axios.post(`https://pguat.safexpay.com/agadmin/api/signUpLogin/agId/paygate`, { loginRequest: encrypted })
        const payload = loginRequest.data.payLoad
        var decoded = jwt.verify(payload, secret, { algorithm: 'HS256' })
        const decodeData = (JSON.parse(decoded.encryptText))
        const userSessionKey = decodeData.sessionKey
        req.sessionKey=userSessionKey
        next();
    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
}

module.exports = userAuth