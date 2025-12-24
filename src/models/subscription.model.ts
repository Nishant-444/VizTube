/* 
  id string pk
  subscriber ObjectId users
  channel ObjectId users
  createdAt Date 
  updatedAt Date
*/
import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // one who is subscribing, the user
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom the subscriber is subscribing to, the channel
      ref: "User",
    },
  },
  { timestamps: true }
);

// subscriptionSchema.plugin(mongooseAggregatePaginate);
export const Subscription = mongoose.model("Subscription", subscriptionSchema);
