/* 
  id string pk
  video ObjectId videos
  comment ObjectId comment
  tweet ObjectId tweets
  likedBy ObjectId users
  createdAt Date
  updatedAt Date
*/

import mongoose, { Schema } from 'mongoose';
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: 'Tweet',
    },
  },
  { timestamps: true }
);

// likeSchema.plugin(mongooseAggregatePaginate);
export const Like = mongoose.model('Like', likeSchema);
