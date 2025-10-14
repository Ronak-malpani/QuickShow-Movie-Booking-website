import mongoose from "mongoose";

const showSchema = new mongoose.Schema({
    movie:{type:String,required:true,ref:'Movie'},
    showDateTime:{type:Date,reuired:true},
    showPrice:{type:Number,required: true},
    occcupiedSeats:{type:Object,deafult:{}}
},{minimize:false}
)

const Show = mongoose/model("Show", showSchema);

export default Show;