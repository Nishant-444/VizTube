/*
  id string pk
  owner ObjectId users
  videos ObjectId[] videos
  name string
  description string
  createdAt Date
  updatedAt Date 
*/

import mongoose, { Schema } from 'mongoose';
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    videos: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
  },
  { timestamps: true }
);

// playlistSchema.plugin(mongooseAggregatePaginate);
export const Playlist = mongoose.model('Playlist', playlistSchema);
