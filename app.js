require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  `mongodb+srv://${process.env.MONGOIDPASSWORD}@cluster0.z4gph14.mongodb.net/todolistDB`,
  { useNewUrlParser: true }
);

const itemSchema = {
  Name: String,
};

const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
  Name: "Welcome to your todolist!",
});
const item2 = new Item({
  Name: "Hit the + button to add the item to the list",
});
const item3 = new Item({
  Name: "Hit the checkbox to delete the item from the list",
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  Name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, (err, result) => {
    if (result.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully saged the items to DB.");
        }
      });
    } else {
      res.render("list", { listTitle: "Today", newListItems: result });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listname = req.body.list;

  const item = new Item({
    Name: itemName,
  });
  if (listname === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ Name: listname }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listname);
    });
  }
});

app.post("/delete", function (req, res) {
  const selectedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(selectedItem, (err) => {
      if (!err) {
        console.log("successfully deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { Name: listName },
      { $pull: { items: { _id: selectedItem } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ Name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          Name: customListName,
          items: defaultItems,
        });
        list.save();

        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.Name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log("listing on port");
});
