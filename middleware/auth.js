import jwt from "jsonwebtoken";

import { ResponseError } from "../class/ResponseError.js";
import { config } from "../config.js";

export function auth(req, res, next) {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return next(new ResponseError(400, "Invalid token"));
    }

    jwt.verify(token, config.accessSecret, (err, decoded) => {
      if (err) {
        return next(new ResponseError(400, "Invalid token"));
      }
      return next();
    });
  } catch (error) {
    console.log(error);
    return next(
      new ResponseError(500, "Something went wrong in authentication")
    );
  }
}
