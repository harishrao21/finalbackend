const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const env = require("./env");

let memoryReplicaSet;

const connectDB = async () => {
  try {
    if (env.useMemoryDb) {
      // Booking/cancel flows use Mongo transactions, so local memory DB must run as replica set.
      memoryReplicaSet = await MongoMemoryReplSet.create({
        replSet: { count: 1 }
      });
      const uri = memoryReplicaSet.getUri("eventhive");
      await mongoose.connect(uri);
      console.log("MongoDB connected (in-memory replica set)");
      return;
    }

    // Production path: use the Atlas (or external) URI from environment variables.
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
