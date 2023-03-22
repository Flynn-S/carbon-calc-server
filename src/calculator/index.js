import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import uniqid from "uniqid";

import {
  differenceInMonths,
  parseISO,
  addYears,
  eachMonthOfInterval,
} from "date-fns";

import { body, validationResult } from "express-validator";

const router = express.Router();

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
    res.send({ data: tableData });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
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

        const trees = req.body.num_trees;

        const upfrontCost = trees * 120;
        const annualCost = trees * 12;

        const newRow = await {
          ...req.body,
          id: uniqid(),
        };

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
    next(error);
  }
});

export default router;
