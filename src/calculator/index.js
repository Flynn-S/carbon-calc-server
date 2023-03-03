import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import {
  differenceInMonths,
  parseISO,
  addYears,
  eachMonthOfInterval,
} from "date-fns";

import { body, validationResult } from "express-validator";

const router = express.Router();

const getOffsetPerMonth = (num_trees, purchaseDate, endDate) => {
  const months = eachMonthOfInterval({
    start: purchaseDate,
    end: endDate,
  });

  const result = months.map((month, index) => {
    const year = index / 12;

    const offsetPerTree = year < 6 ? (28.5 / 72) * index : 28.5;
    console.log(offsetPerTree);
    const totalOffset = offsetPerTree * num_trees;
    return { month: month, totalOffset: totalOffset.toFixed(2) };
  });

  return result;
};

// relative path to present working directory
const filename = fileURLToPath(import.meta.url);

// what is the directory/folder name of this file ?
const __dirname = dirname(filename);

const getInitialData = () => {
  const relativePathOfDataJSON = join(__dirname, "./tableData.json");
  const buf = fs.readFileSync(relativePathOfDataJSON);
  return JSON.parse(buf.toString());
};

router.get("/", (req, res, next) => {
  try {
    const tableData = getInitialData();

    // TODO CONSIDER SUMMING ALL PURCHASES OFFSET ARRAYS TOGETHER WHERE DATES ARE EQUAL AND WHERE THEY ARE NOT EXTEND THE LENGTH OF THE ARRAY
    // console.log(tableData);
    // let offSet
    // tableData.map((purchase) => {
    //     purchase.offsetPerMonth
    // })

    res.send({ data: tableData });
  } catch (error) {
    next(error);
  }
});

router.get("/totalTime", async (req, res, next) => {
  const currentTable = getInitialData();
  const dates = currentTable.map((row) => row.date);
  await dates.sort((a, b) => new Date(a) - new Date(b));

  const monthsDiff = differenceInMonths(
    parseISO(dates[0]),
    parseISO(dates[dates.length - 1])
  );

  console.log(monthsDiff);

  return monthsDiff;
});

router.post(
  "/",
  body("id").exists().isInt(),
  body("date").exists().isString(),
  body("num_trees").exists().isInt(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const err = new Error();
        err.errorList = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const currentTable = getInitialData();
        console.log(req.body);
        const purchaseDate = parseISO(req.body.date);

        const trees = req.body.num_trees;

        const upfrontCost = trees * 120;
        const annualCost = trees * 12;

        const dates = currentTable.map((row) => {
          return row.date;
        });

        dates.sort((a, b) => new Date(a) - new Date(b));
        // TODO CONSIDER SETTING EVERY START OF THE ARRAY AT THE EARLIEST START DATE OF EVERY ENTRY (dates[0])
        const endDate = addYears(parseISO(dates[dates.length - 1]), 2);
        console.log(trees, purchaseDate, endDate);

        const totalOffset = getOffsetPerMonth(trees, purchaseDate, endDate);
        const newRow = await { ...req.body, offsetPerMonth: totalOffset };

        await currentTable.push(newRow);

        fs.writeFileSync(
          join(__dirname, "./tableData.json"),
          JSON.stringify(currentTable)
        );

        res.status(201).send({ newRow });
      }
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  body("date").isString(),
  body("num_trees").isInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const err = new Error();
        err.errorList = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const currentTable = getInitialData();
        const filteredTable = currentTable.filter((row) => {
          row.id != req.params.id;
        });

        const modifiedRow = {
          ...req.body,
          id: req.params.id,
        };

        await filteredTable.push(modifiedRow);

        fs.writeFileSync(
          join(__dirname, "projects.json"),
          JSON.stringify(oldProjects)
        );
      }
      res.status(200).send({ message: "row successfully edited." });
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const currentTable = getInitialData();
    const newTable = await currentTable.filter(
      (row) => row.id != req.params.id
    );

    fs.writeFileSync(
      join(__dirname, "./tableData.json"),
      JSON.stringify(newTable)
    );
    res.status(204).send("deletion successful");
  } catch (error) {
    console.log(error);
  }
});

export default router;
