const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const connectToDatabase = require("../models/db");
const logger = require("../logger");

// Define the upload directory path
const directoryPath = "public/images";

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get("/", async (req, res, next) => {
  logger.info("/ called");
  try {
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    const secondChanceItems = await collection.find({}).toArray();

    res.json(secondChanceItems);
  } catch (e) {
    logger.console.error("oops something went wrong", e);
    next(e);
  }
});

// Add a new item
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    // Connect to MongoDB
    const db = await connectToDatabase();

    // retrieving the secondChanceItems collection
    const collection = db.collection("secondChanceItems");

    //Creating a new secondChanceItem from the request body
    let secondChanceItem = req.body;
    //increment ID by 1, and set it to the new secondChanceItem
    const lastItemQuery = await collection.find().sort({ id: -1 }).limit(1);
    await lastItemQuery.forEach((item) => {
      secondChanceItem.id = (parseInt(item.id) + 1).toString();
    });
    //Setting the current date
    const date_added = Math.floor(new Date().getTime() / 1000);
    secondChanceItem.date_added = date_added;
    //Adding the secondChanceItem to the database
    secondChanceItem = await collection.insertOne(secondChanceItem);
    res.status(201).json(secondChanceItem.ops[0]);
  } catch (e) {
    next(e);
  }
});

// Get a single secondChanceItem by ID
router.get("/:id", async (req, res, next) => {
  try {
    //Connecting to mongo DB
    const db = await connectToDatabase();
    //Retrieve the items from collection
    const collection = db.collection("secondChanceItems");
    //find specific item by ID
    const secondChanceItem = await collection.findOne({ id: id });
    //Returning the secondChanceItem as a JSON object and Return an error message if the item is not found.
    if (!secondChanceItem) {
      return res.status(404).send("secondChanceItem not found");
    }
    res.json(secondChanceItem);
  } catch (e) {
    next(e);
  }
});

// Update and existing item
router.put("/:id", async (req, res, next) => {
  try {
    //Connecting to mongo DB
    const db = await connectToDatabase();
    //Retrieve the items from collection
    const collection = db.collection("secondChanceItems");
    //check whether the item exists
    const secondChanceItem = await collection.findOne({ id });

    if (!secondChanceItem) {
      logger.error("secondChanceItem not found");
      return res.status(404).json({ error: "secondChanceItem not found" });
    }
    //Update the item's specific attributes.
    secondChanceItem.category = req.body.category;
    secondChanceItem.condition = req.body.condition;
    secondChanceItem.age_days = req.body.age_days;
    secondChanceItem.description = req.body.description;
    secondChanceItem.age_years = Number(
      (secondChanceItem.age_days / 365).toFixed(1)
    );
    secondChanceItem.updatedAt = new Date();

    const updatepreloveItem = await collection.findOneAndUpdate(
      { id },
      { $set: secondChanceItem },
      { returnDocument: "after" }
    );
    //sending confirmation
    if (updatepreloveItem) {
      res.json({ uploaded: "success" });
    } else {
      res.json({ uploaded: "failed" });
    }
  } catch (e) {
    next(e);
  }
});

// Delete an existing item
router.delete("/:id", async (req, res, next) => {
  try {
    //Connecting to mongo DB
    const db = await connectToDatabase();
    //Retrieve the items from collection
    const collection = db.collection("secondChanceItems");
    //Find a specific secondChanceItem by ID
    const secondChanceItem = await collection.findOne({ id });

    if (!secondChanceItem) {
      logger.error("secondChanceItem not found");
      return res.status(404).json({ error: "secondChanceItem not found" });
    }
    // Delete the object
    await collection.deleteOne({ id });
    res.json({ deleted: "success" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
