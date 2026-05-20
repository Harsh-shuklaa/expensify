const mongoose = require('mongoose');

const bcryptjs = require('bcryptjs');


const UserSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profileImageUrl:{
        type:String,
        default :null,
    }
}, {
    timestamps: true,
});

//hash password before saving 
UserSchema.pre('save', async function (next){
    if(!this.isModified('password'))return next();
    this.password = await bcryptjs.hash(this.password, 10);
    next();
});

//compare password 

UserSchema.methods.comparePassword = async function (candidatePassword){
    return await bcryptjs.compare (candidatePassword,this.password);
}

module.exports = mongoose.model('User',UserSchema);


