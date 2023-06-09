const User = require('../models/userModel')

const authAdmin = async (req, res, next) => {
    try {
        const user = await User.findOne({_id: req.user.id})

        if(user.role !== "admin") 
            return res.status(500).json({msg: "Admin resources access denied."})

        next()
    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
}

module.exports = authAdmin