var mongoose=require('mongoose')
var cg_schema=new mongoose.Schema({
    name:String,
    image:{type:String,default:"https://i1.wp.com/www.itdigitalworld.com/wp-content/uploads/2014/06/404-error.jpg"},
    description:{type:String,default:"No description given"},
    caption:{type:String,default:"The default caption"},
    created:{type:Date,default:Date.now},
    comments:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Comment'
    }],
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        username:String
    }
});

module.exports=mongoose.model('Campground',cg_schema);